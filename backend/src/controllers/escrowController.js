/**
 * ESCROW CONTROLLER
 *
 * Handles escrow funding when a client posts a project,
 * and automatically refunds the excess amount after hiring a freelancer for a lower bid.
 *
 * EXAMPLE SCENARIO:
 * - Client wallet: $2,000
 * - Project max budget: $1,200
 * - Platform fee (10%) applies to both client and freelancer
 *
 * FLOW:
 *  Step 1: Client posts project (blockJobBudget)
 *    - Escrow holds: project budget ($1,200) + client fee ($120) = $1,320
 *    - Client wallet after escrow hold = $2,000 - $1,320 = $680
 *
 *  Step 2: Freelancer gets hired at a lower bid (createEscrow)
 *    - Bid amount: $1,000
 *    - Client fee (10% of $1,000) = $100
 *    - Actual total used from escrow = $1,100
 *    - Refund = $1,320 - $1,100 = $220
 *    - Client wallet = $680 + $220 = $900
 *
 *  Step 3: Milestone completion (releaseMilestonePayment)
 *    - Freelancer fee (10%) = $100
 *    - Freelancer payout = $900 ($1,000 - $100)
 *    - When all milestones complete, project is marked as completed
 *    - Escrow status changes to "completed"
 *    - All amounts are properly tracked and released
 */

const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const Escrow = require("../models/Escrow");
const { Project } = require("../models/Project");
const Job = require("../models/Job");
const { Wallet, Transaction } = require("../models/Payment");
const Settings = require("../models/Settings");
const User = require("../models/User");
const { syncEscrowMilestones, checkProjectCompletion } = require("../utils/escrowSync");

/**
 * Block funds when client posts a job
 */
exports.blockJobBudget = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { jobId } = req.body;

    // Get job details
    const job = await Job.findOne({ _id: jobId, client: req.user.id }).session(session);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    // Calculate total amount to block: max budget * freelancers needed
    const amountToBlock = job.budget.max * job.freelancersNeeded;

    // Get platform fee percentage from settings
    const platformFeePercentage = await Settings.getSetting("platformFee", 10);
    const clientPlatformFee = (amountToBlock * platformFeePercentage) / 100;
    const totalChargedToClient = amountToBlock + clientPlatformFee;

    // Check if client has enough balance
    let clientWallet = await Wallet.findOne({ user: req.user.id }).session(session);
    if (!clientWallet) {
      clientWallet = new Wallet({ user: req.user.id });
      await clientWallet.save({ session });
    }

    if (clientWallet.balance < totalChargedToClient) {
      return res.status(400).json({
        success: false,
        message: `Insufficient funds. Required: $${totalChargedToClient.toFixed(
          2
        )}, Available: $${clientWallet.balance.toFixed(2)}`,
      });
    }

    // Block the funds
    clientWallet.balance -= totalChargedToClient;
    await clientWallet.save({ session });

    // Create transaction record for blocked funds
    const transaction = new Transaction({
      transactionId: `BLOCK-${uuidv4().substring(0, 8)}`,
      user: req.user.id,
      amount: totalChargedToClient,
      fee: clientPlatformFee,
      netAmount: amountToBlock,
      type: "deposit",
      status: "completed",
      description: `Budget blocked for job: ${job.title}`,
      metadata: {
        jobId: job._id,
        jobTitle: job.title,
        freelancersNeeded: job.freelancersNeeded,
        budgetPerFreelancer: job.budget.max,
        maxBudgetBlocked: job.budget.max,
        platformFeePercentage: platformFeePercentage,
        totalBlocked: totalChargedToClient,
        isJobBudgetBlock: true, // Flag to identify this as a job budget block
      },
    });

    await transaction.save({ session });

    // Store the blocked amount info in the job for later reference
    job.blockedBudget = {
      amount: amountToBlock,
      platformFee: clientPlatformFee,
      total: totalChargedToClient,
      transactionId: transaction.transactionId,
    };

    // Update job status
    job.status = "open";
    await job.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: "Budget blocked successfully",
      data: {
        amountBlocked: amountToBlock,
        platformFee: clientPlatformFee,
        totalCharged: totalChargedToClient,
        transaction,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error blocking job budget:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Create escrow when freelancer is hired
 */
exports.createEscrow = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { projectId, freelancerId, agreedAmount } = req.body;

    console.log(`🚀 CREATE ESCROW REQUEST:`);
    console.log(`  ├─ Project ID: ${projectId}`);
    console.log(`  ├─ Freelancer ID: ${freelancerId}`);
    console.log(`  ├─ Agreed Amount: $${agreedAmount}`);
    console.log(`  └─ Client ID: ${req.user.id}`);

    // Verify project exists and user is the client
    const project = await Project.findOne({
      _id: projectId,
      client: req.user.id,
    }).session(session);

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    // Verify freelancer exists
    const freelancer = await User.findById(freelancerId);
    if (!freelancer || freelancer.role !== "freelancer") {
      return res.status(404).json({ success: false, message: "Freelancer not found" });
    }

    // Get platform fee percentage from settings
    const platformFeePercentage = await Settings.getSetting("platformFee", 10);

    // Calculate fees according to user requirements:
    // Client pays: Original amount + platform fee
    // Freelancer receives: Original amount - platform fee
    const clientPlatformFee = (agreedAmount * platformFeePercentage) / 100;
    const freelancerPlatformFee = (agreedAmount * platformFeePercentage) / 100;
    const totalChargedToClient = agreedAmount + clientPlatformFee;
    const amountToFreelancer = agreedAmount - freelancerPlatformFee;
    const platformRevenue = clientPlatformFee + freelancerPlatformFee;

    // Check if there's a blocked budget from job posting that needs refunding
    let refundAmount = 0;
    let originalTotalBlocked = 0;

    if (project.job) {
      const job = await Job.findById(project.job).session(session);
      console.log(`🔍 REFUND CALCULATION:`);
      console.log(`  ├─ Job found: ${!!job}`);

      if (job && job.blockedBudget) {
        // Use the exact amount that was blocked when job was posted
        originalTotalBlocked = job.blockedBudget.total;
        console.log(`  ├─ Using blockedBudget: $${originalTotalBlocked}`);
        console.log(`  ├─ Current needed: $${totalChargedToClient}`);

        // Calculate difference between what was blocked and what's actually needed
        if (originalTotalBlocked > totalChargedToClient) {
          refundAmount = originalTotalBlocked - totalChargedToClient;
          console.log(`  ├─ Refund calculated: $${refundAmount}`);
        } else {
          console.log(`  ├─ No refund: blocked amount <= needed amount`);
        }
      } else if (job && job.budget && job.budget.max) {
        // Fallback to calculating from max budget if blockedBudget is not available
        const originalMaxBudget = job.budget.max;
        const originalClientFee = (originalMaxBudget * platformFeePercentage) / 100;
        originalTotalBlocked = originalMaxBudget + originalClientFee;
        console.log(`  ├─ Using fallback calculation:`);
        console.log(`  ├─ Max budget: $${originalMaxBudget}`);
        console.log(`  ├─ Platform fee: $${originalClientFee}`);
        console.log(`  ├─ Total blocked: $${originalTotalBlocked}`);
        console.log(`  ├─ Current needed: $${totalChargedToClient}`);

        if (originalTotalBlocked > totalChargedToClient) {
          refundAmount = originalTotalBlocked - totalChargedToClient;
          console.log(`  ├─ Refund calculated: $${refundAmount}`);
        } else {
          console.log(`  ├─ No refund: blocked amount <= needed amount`);
        }
      } else {
        console.log(`  ├─ No blocked budget or max budget found`);
        console.log(`  ├─ Job blockedBudget:`, job?.blockedBudget);
        console.log(`  └─ Job budget:`, job?.budget);
      }
    } else {
      console.log(`🔍 REFUND CALCULATION: No job associated with project`);
    }

    // Debug project milestones
    console.log(`🎯 MILESTONE PROCESSING:`);
    console.log(`  ├─ Project has ${project.milestones ? project.milestones.length : 0} milestones`);

    if (project.milestones && project.milestones.length > 0) {
      console.log(
        `  ├─ Existing milestones:`,
        project.milestones.map((m) => ({
          id: m._id,
          title: m.title,
          percentage: m.percentage,
        }))
      );
    } else {
      console.log(`  ├─ No milestones found - creating default milestone`);

      // Create a default milestone for the project if none exist
      const defaultMilestone = {
        _id: new mongoose.Types.ObjectId(),
        title: "Project Completion",
        description: "Complete the project deliverables",
        percentage: 100,
        status: "pending",
        amount: agreedAmount,
        createdBy: req.user.id,
        dueDate: project.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      project.milestones = [defaultMilestone];
      console.log(`  ├─ Created default milestone: ${defaultMilestone.title}`);
    }

    // Calculate milestone amounts based on percentages
    const milestones = (project.milestones || []).map((milestone) => ({
      milestoneId: milestone._id,
      title: milestone.title,
      amount: (milestone.percentage / 100) * agreedAmount,
      freelancerReceives: (milestone.percentage / 100) * amountToFreelancer,
      platformFee: (milestone.percentage / 100) * (clientPlatformFee + freelancerPlatformFee),
      status: "pending",
    }));

    console.log(`  └─ Created ${milestones.length} escrow milestones from project milestones`);

    // Create escrow record
    const escrow = new Escrow({
      escrowId: `ESC-${uuidv4().substring(0, 8)}`,
      client: req.user.id,
      freelancer: freelancerId,
      project: projectId,
      job: project.job,
      totalAmount: totalChargedToClient,
      clientPlatformFee,
      freelancerPlatformFee,
      projectAmount: agreedAmount,
      totalChargedToClient,
      amountToFreelancer,
      platformRevenue,
      platformFeePercentage,
      status: "active",
      milestones: milestones,
    });

    await escrow.save({ session });

    // Handle refund if there's excess amount from original job budget blocking
    if (refundAmount > 0) {
      console.log(`🔄 PROCESSING REFUND: Amount = $${refundAmount}`);

      // Get client wallet and refund the excess
      let clientWallet = await Wallet.findOne({ user: req.user.id }).session(session);
      const oldBalance = clientWallet ? clientWallet.balance : 0;

      if (!clientWallet) {
        clientWallet = new Wallet({ user: req.user.id });
        console.log(`💳 Created new wallet for client ${req.user.id}`);
      }

      clientWallet.balance += refundAmount;
      await clientWallet.save({ session });
      console.log(`💰 Wallet updated: ${oldBalance} + ${refundAmount} = ${clientWallet.balance}`);

      // Create refund transaction record
      const refundTransaction = new Transaction({
        transactionId: `REF-${uuidv4().substring(0, 8)}`,
        user: req.user.id,
        amount: refundAmount,
        fee: 0,
        netAmount: refundAmount,
        type: "refund",
        status: "completed",
        project: projectId,
        description: `Refund of excess escrow amount - hired freelancer for less than max budget`,
        metadata: {
          escrowId: escrow.escrowId,
          originalAmount: refundAmount + totalChargedToClient,
          finalAmount: totalChargedToClient,
          refundReason: "hired_for_less_than_max_budget",
        },
      });

      await refundTransaction.save({ session });
      console.log(`📋 Created refund transaction: ${refundTransaction.transactionId}`);
    } else {
      console.log(`⏭️ No refund needed: originalBlocked=${originalTotalBlocked}, needed=${totalChargedToClient}`);
    }

    // Update project with escrow reference
    project.escrow = escrow._id;
    project.escrowStatus = "escrowed";
    project.budget = agreedAmount;
    await project.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message:
        refundAmount > 0
          ? `Escrow created successfully. Refunded excess amount: $${refundAmount.toFixed(2)}`
          : "Escrow created successfully",
      data: {
        escrow,
        refundAmount,
        breakdown: {
          originalAmount: agreedAmount,
          originalBlocked: originalTotalBlocked,
          clientPays: totalChargedToClient,
          freelancerReceives: amountToFreelancer,
          platformRevenue,
          refunded: refundAmount,
          clientSavings: refundAmount,
        },
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error creating escrow:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Release milestone payment from escrow
 */
exports.releaseMilestonePayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { projectId, milestoneId } = req.params;

    console.log(`🚀 MILESTONE RELEASE REQUEST:`);
    console.log(`  ├─ Project ID: ${projectId}`);
    console.log(`  ├─ Milestone ID: ${milestoneId}`);
    console.log(`  └─ User ID: ${req.user?.id}`);

    // Find the project and escrow
    const project = await Project.findById(projectId).session(session);
    if (!project) {
      console.log(`❌ Project not found: ${projectId}`);
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    console.log(`✅ Found project: ${project.title}, Status: ${project.status}`);

    const escrow = await Escrow.findOne({ project: projectId }).session(session);
    if (!escrow) {
      console.log(`❌ Escrow not found for project: ${projectId}`);
      return res.status(404).json({ success: false, message: "Escrow not found" });
    }

    console.log(`✅ Found escrow: ${escrow.escrowId}, Status: ${escrow.status}, Total Amount: $${escrow.totalAmount}`);

    // CRITICAL FIX: Sync escrow milestones with project milestones BEFORE payment release
    console.log(`🔄 CRITICAL: Syncing escrow milestones with project milestones BEFORE payment release...`);
    const syncResult = await syncEscrowMilestones(projectId, session);
    if (syncResult) {
      console.log(`✅ Escrow milestones synchronized - refreshing escrow data`);
      // Refresh escrow data after sync
      const refreshedEscrow = await Escrow.findOne({ project: projectId }).session(session);
      if (refreshedEscrow) {
        // Update the escrow object with fresh data
        escrow.milestones = refreshedEscrow.milestones;
        escrow.amountToFreelancer = refreshedEscrow.amountToFreelancer;
        escrow.platformRevenue = refreshedEscrow.platformRevenue;
        console.log(`📊 Escrow data refreshed - now has ${escrow.milestones.length} milestones`);
      }
    } else {
      console.log(`✅ No sync needed - escrow already has correct milestone structure`);
    }

    // Find the milestone in escrow
    console.log(`🔍 SEARCHING FOR MILESTONE IN ESCROW:`);
    console.log(`  ├─ Looking for milestone ID: ${milestoneId}`);
    console.log(`  ├─ Escrow has ${escrow.milestones.length} milestones`);

    escrow.milestones.forEach((m, index) => {
      console.log(
        `  ├─ Milestone ${index}: ${m.milestoneId.toString()} (${m.title || "No title"}) - Status: ${m.status}`
      );
      console.log(`  │   └─ Match: ${m.milestoneId.toString() === milestoneId ? "YES" : "NO"}`);
    });

    const escrowMilestone = escrow.milestones.find((m) => m.milestoneId.toString() === milestoneId);
    if (!escrowMilestone) {
      console.log(`❌ Milestone not found in escrow: ${milestoneId}`);
      console.log(
        `Available milestones:`,
        escrow.milestones.map((m) => ({
          id: m.milestoneId.toString(),
          title: m.title || "No title",
          status: m.status,
          match: m.milestoneId.toString() === milestoneId,
        }))
      );
      return res.status(404).json({ success: false, message: "Milestone not found in escrow" });
    }

    console.log(
      `✅ Found escrow milestone: ${escrowMilestone.title}, Status: ${escrowMilestone.status}, Amount: $${escrowMilestone.amount}`
    );

    // Check if milestone is already released
    if (escrowMilestone.status === "released") {
      console.log(`⚠️ Milestone already released`);
      return res.status(400).json({ success: false, message: "Milestone payment already released" });
    }

    // Find the project milestone
    const projectMilestone = project.milestones.find((m) => m._id.toString() === milestoneId);
    if (!projectMilestone) {
      return res.status(404).json({ success: false, message: "Project milestone not found" });
    }

    // Check if milestone is completed and approved
    if (projectMilestone.status !== "completed" || projectMilestone.approvalStatus !== "approved") {
      return res
        .status(400)
        .json({ success: false, message: "Milestone must be completed and approved before payment release" });
    }

    // Update freelancer wallet
    let freelancerWallet = await Wallet.findOne({ user: escrow.freelancer }).session(session);
    const oldBalance = freelancerWallet ? freelancerWallet.balance : 0;
    const oldEarned = freelancerWallet ? freelancerWallet.totalEarned : 0;

    if (!freelancerWallet) {
      freelancerWallet = new Wallet({ user: escrow.freelancer });
      console.log(`💳 Created new wallet for freelancer ${escrow.freelancer}`);
    }

    freelancerWallet.balance += escrowMilestone.freelancerReceives;
    freelancerWallet.totalEarned += escrowMilestone.freelancerReceives;
    freelancerWallet.totalWithdrawn = freelancerWallet.totalWithdrawn || 0; // Ensure field exists
    await freelancerWallet.save({ session });

    console.log(`💰 FREELANCER WALLET UPDATED:`);
    console.log(`  ├─ Balance: $${oldBalance} + $${escrowMilestone.freelancerReceives} = $${freelancerWallet.balance}`);
    console.log(
      `  ├─ Total Earned: $${oldEarned} + $${escrowMilestone.freelancerReceives} = $${freelancerWallet.totalEarned}`
    );
    console.log(`  └─ Platform Fee Deducted: $${escrowMilestone.platformFee}`);

    // Create transaction record for freelancer payment
    const freelancerTransaction = new Transaction({
      transactionId: `MIL-${uuidv4().substring(0, 8)}`,
      user: escrow.freelancer,
      amount: escrowMilestone.amount,
      fee: escrowMilestone.platformFee,
      netAmount: escrowMilestone.freelancerReceives,
      type: "milestone",
      status: "completed",
      project: projectId,
      milestone: milestoneId,
      recipient: escrow.freelancer,
      relatedUser: escrow.client,
      description: `Milestone payment: ${projectMilestone.title}`,
      metadata: {
        escrowId: escrow.escrowId,
        milestoneTitle: projectMilestone.title,
        percentage: projectMilestone.percentage,
      },
    });

    await freelancerTransaction.save({ session });
    console.log(`📋 Created freelancer transaction: ${freelancerTransaction.transactionId}`);

    // Create transaction record for client (milestone payment deduction from escrow)
    const clientTransaction = new Transaction({
      transactionId: `MIL-CLT-${uuidv4().substring(0, 8)}`,
      user: escrow.client,
      amount: escrowMilestone.amount,
      fee: 0, // Client doesn't pay additional fee at milestone release
      netAmount: escrowMilestone.amount,
      type: "milestone",
      status: "completed",
      project: projectId,
      milestone: milestoneId,
      recipient: escrow.freelancer,
      relatedUser: escrow.freelancer,
      description: `Milestone payment released: ${projectMilestone.title}`,
      metadata: {
        escrowId: escrow.escrowId,
        milestoneTitle: projectMilestone.title,
        percentage: projectMilestone.percentage,
        freelancerReceived: escrowMilestone.freelancerReceives,
        platformFee: escrowMilestone.platformFee,
        isClientRecord: true,
      },
    });

    await clientTransaction.save({ session });
    console.log(`📋 Created client transaction: ${clientTransaction.transactionId}`);

    // Update escrow milestone status
    escrowMilestone.status = "released";
    escrowMilestone.releasedAt = new Date();
    escrowMilestone.releasedBy = req.user.id;
    console.log(`✅ Updated milestone status to 'released'`);

    // Update escrow totals
    const oldReleasedAmount = escrow.releasedAmount;
    escrow.releasedAmount += escrowMilestone.amount;
    console.log(
      `📊 Escrow released amount: $${oldReleasedAmount} + $${escrowMilestone.amount} = $${escrow.releasedAmount}`
    );

    // Check if all PROJECT milestones are completed using the new completion check
    const completionStatus = await checkProjectCompletion(projectId);
    const allMilestonesReleased = completionStatus.allComplete;

    console.log(`🔍 COMPLETION STATUS:`, completionStatus);

    if (allMilestonesReleased) {
      console.log(`🎯 ALL MILESTONES RELEASED - Completing escrow and project`);

      // Mark escrow as completed
      escrow.status = "completed";
      console.log(`✅ Escrow status updated to 'completed'`);

      // Mark project as completed
      project.status = "completed";
      project.completedDate = new Date();
      project.escrowStatus = "completed";
      console.log(`✅ Project status updated to 'completed'`);

      // Create final transaction record showing escrow completion
      const escrowCompletionTransaction = new Transaction({
        transactionId: `ESC-COMP-${uuidv4().substring(0, 8)}`,
        user: escrow.client,
        amount: escrow.totalAmount,
        fee: escrow.platformRevenue,
        netAmount: escrow.amountToFreelancer,
        type: "escrow_completion",
        status: "completed",
        project: projectId,
        recipient: escrow.freelancer,
        relatedUser: escrow.freelancer,
        description: `Escrow completed - Project: ${project.title}`,
        metadata: {
          escrowId: escrow.escrowId,
          projectTitle: project.title,
          totalMilestones: escrow.milestones.length,
          platformRevenue: escrow.platformRevenue,
          freelancerTotalReceived: escrow.amountToFreelancer,
        },
      });

      await escrowCompletionTransaction.save({ session });
      console.log(`📋 Created escrow completion transaction: ${escrowCompletionTransaction.transactionId}`);
    } else {
      escrow.status = "partially_released";
      console.log(`🔄 Escrow status updated to 'partially_released'`);
    }

    await escrow.save({ session });
    await project.save({ session });
    console.log(`💾 Saved escrow and project changes`);

    await session.commitTransaction();
    session.endSession();
    console.log(`✅ Transaction committed successfully`);

    const finalStatus = {
      escrowStatus: escrow.status,
      projectCompleted: allMilestonesReleased,
      totalReleasedToFreelancer: escrow.milestones
        .filter((m) => m.status === "released")
        .reduce((sum, m) => sum + m.freelancerReceives, 0),
      remainingInEscrow: escrow.milestones
        .filter((m) => m.status === "pending")
        .reduce((sum, m) => sum + m.freelancerReceives, 0),
    };

    console.log(`📊 FINAL STATUS:`, finalStatus);

    res.json({
      success: true,
      message: allMilestonesReleased
        ? "Final milestone payment released - Project completed!"
        : "Milestone payment released successfully",
      data: {
        transaction: freelancerTransaction,
        escrowStatus: escrow.status,
        projectCompleted: allMilestonesReleased,
        totalReleasedToFreelancer: escrow.milestones
          .filter((m) => m.status === "released")
          .reduce((sum, m) => sum + m.freelancerReceives, 0),
        remainingInEscrow: escrow.milestones
          .filter((m) => m.status === "pending")
          .reduce((sum, m) => sum + m.freelancerReceives, 0),
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error releasing milestone payment:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get escrow details
 */
exports.getEscrowDetails = async (req, res) => {
  try {
    const { projectId } = req.params;

    const escrow = await Escrow.findOne({ project: projectId })
      .populate("client", "name email")
      .populate("freelancer", "name email")
      .populate("project", "title description status");

    if (!escrow) {
      return res.status(404).json({ success: false, message: "Escrow not found" });
    }

    res.json({
      success: true,
      data: { escrow },
    });
  } catch (error) {
    console.error("Error getting escrow details:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get platform revenue statistics
 */
exports.getPlatformRevenue = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
    }

    // Get total platform revenue from escrows
    const escrowRevenue = await Escrow.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$platformRevenue" },
          totalEscrows: { $sum: 1 },
          avgRevenue: { $avg: "$platformRevenue" },
        },
      },
    ]);

    // Get platform fee transactions
    const feeTransactions = await Transaction.aggregate([
      {
        $match: {
          type: "platform_fee",
          status: "completed",
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: null,
          totalFees: { $sum: "$amount" },
          totalTransactions: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        escrowRevenue: escrowRevenue[0] || { totalRevenue: 0, totalEscrows: 0, avgRevenue: 0 },
        feeTransactions: feeTransactions[0] || { totalFees: 0, totalTransactions: 0 },
      },
    });
  } catch (error) {
    console.error("Error getting platform revenue:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get freelancer escrow data for dashboard
 */
exports.getFreelancerEscrowData = async (req, res) => {
  try {
    const freelancerId = req.user.id;

    // Get freelancer wallet
    const wallet = await Wallet.findOne({ user: freelancerId });
    const availableBalance = wallet ? wallet.balance : 0;
    const totalEarned = wallet ? wallet.totalEarned : 0;

    // Get all escrows for freelancer (including completed ones for total earned calculation)
    const allEscrows = await Escrow.find({
      freelancer: freelancerId,
    }).populate("project", "title status");

    // Get active escrows for freelancer
    const activeEscrows = allEscrows.filter(
      (escrow) => escrow.status === "active" || escrow.status === "partially_released"
    );

    // Calculate total in escrow (what freelancer will receive for pending milestones)
    const inEscrow = activeEscrows.reduce((total, escrow) => {
      const unreleased = escrow.milestones
        .filter((m) => m.status === "pending")
        .reduce((sum, m) => sum + (m.freelancerReceives || 0), 0);
      return total + unreleased;
    }, 0);

    // Get completed transactions for platform fees calculation
    const completedTransactions = await Transaction.find({
      user: freelancerId,
      type: { $in: ["milestone", "platform_fee"] },
      status: "completed",
    });

    const platformFeesPaid = completedTransactions.reduce((total, tx) => total + (tx.fee || 0), 0);

    console.log(`💼 FREELANCER ESCROW SUMMARY:`);
    console.log(`  ├─ Available Balance: $${availableBalance}`);
    console.log(`  ├─ Total Earned: $${totalEarned}`);
    console.log(`  ├─ In Escrow: $${inEscrow}`);
    console.log(`  ├─ Platform Fees Paid: $${platformFeesPaid}`);
    console.log(`  └─ Active Escrows: ${activeEscrows.length}`);

    // Add detailed debugging for freelancer escrow calculations
    activeEscrows.forEach((escrow) => {
      const pending = escrow.milestones.filter((m) => m.status === "pending");
      const released = escrow.milestones.filter((m) => m.status === "released");
      const pendingAmount = pending.reduce((sum, m) => sum + (m.freelancerReceives || 0), 0);
      const releasedAmount = released.reduce((sum, m) => sum + (m.freelancerReceives || 0), 0);

      console.log(`Freelancer Escrow ${escrow.escrowId}:`);
      console.log(`  ├─ ${pending.length} pending milestones = $${pendingAmount}`);
      console.log(`  ├─ ${released.length} released milestones = $${releasedAmount}`);
      console.log(`  └─ Status: ${escrow.status}`);
    });

    // Count pending milestones
    const pendingMilestones = activeEscrows.reduce((count, escrow) => {
      return count + escrow.milestones.filter((m) => m.status === "pending").length;
    }, 0);

    // Get recent transactions
    const recentTransactions = await Transaction.find({
      user: freelancerId,
      status: "completed",
    })
      .populate("project", "title")
      .populate("relatedUser", "name")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        availableBalance,
        totalEarned,
        inEscrow,
        platformFeesPaid,
        pendingMilestones,
        activeEscrows: activeEscrows.map((escrow) => ({
          escrowId: escrow.escrowId,
          projectTitle: escrow.project.title,
          totalAmount: escrow.amountToFreelancer || escrow.totalAmount,
          releasedAmount: escrow.milestones
            .filter((m) => m.status === "released")
            .reduce((sum, m) => sum + (m.freelancerReceives || 0), 0),
          pendingAmount: escrow.milestones
            .filter((m) => m.status === "pending")
            .reduce((sum, m) => sum + (m.freelancerReceives || 0), 0),
          status: escrow.status,
        })),
        recentTransactions: recentTransactions.map((tx) => ({
          id: tx._id,
          transactionId: tx.transactionId,
          amount: tx.amount,
          netAmount: tx.netAmount,
          fee: tx.fee,
          type: tx.type,
          status: tx.status,
          description: tx.description,
          date: tx.createdAt,
          projectTitle: tx.project?.title,
          relatedUser: tx.relatedUser?.name,
        })),
      },
    });
  } catch (error) {
    console.error("Error getting freelancer escrow data:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get client escrow data for dashboard
 */
exports.getClientEscrowData = async (req, res) => {
  try {
    const clientId = req.user.id;

    // Get client wallet
    const wallet = await Wallet.findOne({ user: clientId });
    const availableBalance = wallet ? wallet.balance : 0;

    console.log(`📊 CLIENT ESCROW DATA REQUEST for user: ${clientId}`);

    // Get all escrows for client with freelancer data populated
    const allEscrows = await Escrow.find({
      client: clientId,
    })
      .populate("project", "title status")
      .populate("freelancer", "name email");

    console.log(`📋 Found ${allEscrows.length} total escrows for client`);

    // Get active escrows for client
    const activeEscrows = allEscrows.filter(
      (escrow) => escrow.status === "active" || escrow.status === "partially_released"
    );

    console.log(
      `🔄 Active escrows: ${activeEscrows.length}, Completed escrows: ${
        allEscrows.filter((e) => e.status === "completed").length
      }`
    );

    // Calculate total spent (completed escrows)
    const totalSpent = allEscrows
      .filter((escrow) => escrow.status === "completed")
      .reduce((total, escrow) => total + (escrow.totalAmount || 0), 0);

    console.log(`💸 Total spent calculation: $${totalSpent}`);

    // Calculate total in escrow (pending payments that client has committed)
    // This represents money the client has committed but not yet released to freelancers
    const inEscrow = activeEscrows.reduce((total, escrow) => {
      const pendingMilestones = escrow.milestones.filter((m) => m.status === "pending");
      const releasedMilestones = escrow.milestones.filter((m) => m.status === "released");
      const unreleased = pendingMilestones.reduce((sum, m) => sum + (m.amount || 0), 0);
      const released = releasedMilestones.reduce((sum, m) => sum + (m.amount || 0), 0);

      console.log(`Escrow ${escrow.escrowId}: ${escrow.milestones.length} total milestones`);
      console.log(`  ├─ ${pendingMilestones.length} pending milestones = $${unreleased}`);
      console.log(`  ├─ ${releasedMilestones.length} released milestones = $${released}`);
      console.log(`  └─ Status: ${escrow.status}`);

      return total + unreleased;
    }, 0);

    console.log(`💰 CLIENT ESCROW SUMMARY:`);
    console.log(`  ├─ Available Balance: $${availableBalance}`);
    console.log(`  ├─ Total Spent: $${totalSpent}`);
    console.log(`  ├─ In Escrow: $${inEscrow}`);
    console.log(`  └─ Active Escrows: ${activeEscrows.length}`);

    // Calculate platform fees paid (both client and total platform revenue)
    const platformFeesPaid = allEscrows
      .filter((escrow) => escrow.status === "completed")
      .reduce((total, escrow) => total + (escrow.platformRevenue || 0), 0);

    // Count pending projects
    const pendingProjects = await Project.countDocuments({
      client: clientId,
      status: "in_progress",
    });

    // Get recent transactions
    const recentTransactions = await Transaction.find({
      user: clientId,
      status: "completed",
    })
      .populate("project", "title")
      .populate("relatedUser", "name")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        availableBalance,
        totalSpent,
        inEscrow,
        platformFeesPaid,
        pendingProjects,
        activeEscrows: activeEscrows.map((escrow) => ({
          escrowId: escrow.escrowId,
          projectTitle: escrow.project?.title || "Unknown Project",
          freelancerName: escrow.freelancer?.name || "Unknown Freelancer",
          totalAmount: escrow.totalAmount || 0,
          releasedAmount: escrow.milestones
            .filter((m) => m.status === "released")
            .reduce((sum, m) => sum + (m.amount || 0), 0),
          pendingAmount: escrow.milestones
            .filter((m) => m.status === "pending")
            .reduce((sum, m) => sum + (m.amount || 0), 0),
          status: escrow.status,
        })),
        recentTransactions: recentTransactions.map((tx) => ({
          id: tx._id,
          transactionId: tx.transactionId,
          amount: tx.amount,
          netAmount: tx.netAmount,
          fee: tx.fee,
          type: tx.type,
          status: tx.status,
          description: tx.description,
          date: tx.createdAt,
          projectTitle: tx.project?.title,
          relatedUser: tx.relatedUser?.name,
        })),
      },
    });
  } catch (error) {
    console.error("Error getting client escrow data:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get all escrow data for admin dashboard
 */
exports.getAllEscrowData = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;

    // Build filter
    let filter = {};
    if (status && status !== "all") {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get escrows with pagination
    const escrows = await Escrow.find(filter)
      .populate("client", "name email")
      .populate("freelancer", "name email")
      .populate("project", "title status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const totalCount = await Escrow.countDocuments(filter);

    // Get summary statistics
    const stats = await Escrow.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
          totalRevenue: { $sum: "$platformRevenue" },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        escrows: escrows.map((escrow) => ({
          escrowId: escrow.escrowId,
          client: escrow.client,
          freelancer: escrow.freelancer,
          project: escrow.project,
          totalAmount: escrow.totalAmount,
          releasedAmount: escrow.releasedAmount,
          remainingAmount: escrow.remainingAmount,
          platformRevenue: escrow.platformRevenue,
          status: escrow.status,
          createdAt: escrow.createdAt,
          milestonesCount: escrow.milestones.length,
          completedMilestones: escrow.milestones.filter((m) => m.status === "released").length,
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNext: skip + parseInt(limit) < totalCount,
          hasPrev: parseInt(page) > 1,
        },
        statistics: stats.reduce((acc, stat) => {
          acc[stat._id] = {
            count: stat.count,
            totalAmount: stat.totalAmount,
            totalRevenue: stat.totalRevenue,
          };
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error("Error getting all escrow data:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * DEBUG: Test escrow data endpoint
 */
exports.debugEscrowData = async (req, res) => {
  try {
    const userId = req.user.id;
    const { role } = req.user;

    console.log(`Debug escrow data for user ${userId} with role ${role}`);

    // Get all escrows for this user
    const escrows = await Escrow.find({
      $or: [{ client: userId }, { freelancer: userId }],
    })
      .populate("project", "title status")
      .populate("client", "name email")
      .populate("freelancer", "name email");

    console.log(`Found ${escrows.length} escrows`);

    const debugData = escrows.map((escrow) => ({
      escrowId: escrow.escrowId,
      status: escrow.status,
      totalAmount: escrow.totalAmount,
      clientPlatformFee: escrow.clientPlatformFee,
      freelancerPlatformFee: escrow.freelancerPlatformFee,
      amountToFreelancer: escrow.amountToFreelancer,
      platformRevenue: escrow.platformRevenue,
      releasedAmount: escrow.releasedAmount,
      projectTitle: escrow.project?.title,
      clientName: escrow.client?.name,
      freelancerName: escrow.freelancer?.name,
      milestonesCount: escrow.milestones.length,
      milestones: escrow.milestones.map((m) => ({
        amount: m.amount,
        freelancerReceives: m.freelancerReceives,
        platformFee: m.platformFee,
        status: m.status,
        releasedAt: m.releasedAt,
      })),
    }));

    // Get wallet info
    const wallet = await Wallet.findOne({ user: userId });

    res.json({
      success: true,
      debug: true,
      user: {
        id: userId,
        role: role,
      },
      wallet: wallet
        ? {
            balance: wallet.balance,
            totalEarned: wallet.totalEarned,
            totalSpent: wallet.totalSpent,
          }
        : null,
      escrows: debugData,
    });
  } catch (error) {
    console.error("Debug escrow data error:", error);
    res.status(500).json({ success: false, message: "Debug error", error: error.message });
  }
};

/**
 * TEST: Simulate hiring freelancer for less than max budget
 */
exports.testExcessRefund = async (req, res) => {
  try {
    const { maxBudget, agreedAmount, platformFeePercentage = 10 } = req.body;

    // Simulate the scenario:
    // Step 1: Client posts job with max budget
    const clientFeeOnMax = (maxBudget * platformFeePercentage) / 100;
    const totalBlockedForMax = maxBudget + clientFeeOnMax;

    // Step 2: Freelancer hired for agreed amount
    const clientFeeOnAgreed = (agreedAmount * platformFeePercentage) / 100;
    const totalNeededForAgreed = agreedAmount + clientFeeOnAgreed;

    // Step 3: Calculate refund
    const refundAmount = totalBlockedForMax - totalNeededForAgreed;

    // Freelancer calculations
    const freelancerFee = (agreedAmount * platformFeePercentage) / 100;
    const freelancerReceives = agreedAmount - freelancerFee;

    res.json({
      success: true,
      scenario: "Excess Budget Refund Test",
      data: {
        step1_job_posting: {
          maxBudget: maxBudget,
          clientFee: clientFeeOnMax,
          totalBlocked: totalBlockedForMax,
          description: "Amount blocked when client posts job",
        },
        step2_freelancer_hired: {
          agreedAmount: agreedAmount,
          clientFee: clientFeeOnAgreed,
          totalNeeded: totalNeededForAgreed,
          description: "Amount actually needed for agreed price",
        },
        step3_refund: {
          excessAmount: refundAmount,
          shouldRefund: refundAmount > 0,
          description: refundAmount > 0 ? "Client should receive refund" : "No refund needed",
        },
        freelancer_breakdown: {
          grossAmount: agreedAmount,
          platformFee: freelancerFee,
          netReceives: freelancerReceives,
          description: "What freelancer will receive after platform fee",
        },
        client_final_cost: {
          grossAmount: agreedAmount,
          platformFee: clientFeeOnAgreed,
          totalPaid: totalNeededForAgreed,
          refundReceived: refundAmount,
          finalCost: totalNeededForAgreed,
          description: "Client's final cost after refund",
        },
      },
    });
  } catch (error) {
    console.error("Test excess refund error:", error);
    res.status(500).json({ success: false, message: "Test error", error: error.message });
  }
};

/**
 * Fix existing escrows that have no milestones
 */
exports.fixExistingEscrows = async (req, res) => {
  try {
    console.log("Starting to fix existing escrows with no milestones...");

    // Find all escrows with no milestones
    const brokenEscrows = await Escrow.find({
      $or: [{ milestones: { $exists: false } }, { milestones: { $size: 0 } }],
    }).populate("project");

    console.log(`Found ${brokenEscrows.length} escrows with no milestones`);

    const fixResults = [];

    for (const escrow of brokenEscrows) {
      try {
        if (!escrow.project) {
          console.log(`Escrow ${escrow.escrowId}: No project found`);
          fixResults.push({
            escrowId: escrow.escrowId,
            status: "error",
            message: "No project found",
          });
          continue;
        }

        const project = escrow.project;
        console.log(
          `Escrow ${escrow.escrowId}: Project has ${project.milestones ? project.milestones.length : 0} milestones`
        );

        if (!project.milestones || project.milestones.length === 0) {
          // Create default milestones if project has none
          const defaultMilestones = [
            {
              title: "Project Completion",
              description: "Complete the entire project",
              percentage: 100,
              dueDate: project.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
              amount: escrow.projectAmount || escrow.totalAmount,
              createdBy: project.freelancer,
            },
          ];

          project.milestones = defaultMilestones;
          await project.save();

          console.log(`Created default milestone for project ${project._id}`);
        }

        // Now recreate the escrow milestones
        const milestones = project.milestones.map((milestone) => ({
          milestoneId: milestone._id,
          amount: (milestone.percentage / 100) * (escrow.projectAmount || escrow.totalAmount),
          freelancerReceives: (milestone.percentage / 100) * (escrow.amountToFreelancer || escrow.totalAmount * 0.9),
          platformFee: (milestone.percentage / 100) * (escrow.platformRevenue || escrow.totalAmount * 0.1),
          status: "pending",
        }));

        escrow.milestones = milestones;
        await escrow.save();

        console.log(`Fixed escrow ${escrow.escrowId}: Added ${milestones.length} milestones`);
        fixResults.push({
          escrowId: escrow.escrowId,
          status: "fixed",
          milestonesAdded: milestones.length,
          projectId: project._id,
        });
      } catch (error) {
        console.error(`Error fixing escrow ${escrow.escrowId}:`, error);
        fixResults.push({
          escrowId: escrow.escrowId,
          status: "error",
          message: error.message,
        });
      }
    }

    res.json({
      success: true,
      message: `Fixed ${fixResults.filter((r) => r.status === "fixed").length} escrows`,
      results: fixResults,
    });
  } catch (error) {
    console.error("Error fixing existing escrows:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

module.exports = {
  blockJobBudget: exports.blockJobBudget,
  createEscrow: exports.createEscrow,
  releaseMilestonePayment: exports.releaseMilestonePayment,
  getEscrowDetails: exports.getEscrowDetails,
  getPlatformRevenue: exports.getPlatformRevenue,
  getFreelancerEscrowData: exports.getFreelancerEscrowData,
  getClientEscrowData: exports.getClientEscrowData,
  getAllEscrowData: exports.getAllEscrowData,
  debugEscrowData: exports.debugEscrowData,
  testExcessRefund: exports.testExcessRefund,
  fixExistingEscrows: exports.fixExistingEscrows,
};
