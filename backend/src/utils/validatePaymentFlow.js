const mongoose = require("mongoose");
const { Project } = require("../models/Project");
const Escrow = require("../models/Escrow");
const { Wallet, Transaction } = require("../models/Payment");
const User = require("../models/User");

/**
 * Validate that milestone payments are being processed correctly
 */
async function validatePaymentFlow() {
  console.log("🔍 PAYMENT FLOW VALIDATION SCRIPT");
  console.log("=".repeat(60));

  try {
    // Step 1: Find completed milestones that should have payments
    console.log("\n📋 STEP 1: Finding Completed Milestones");

    const projectsWithCompletedMilestones = await Project.find({
      "milestones.status": "completed",
      "milestones.approvalStatus": "approved",
    })
      .populate("client", "name email")
      .populate("freelancer", "name email");

    console.log(`Found ${projectsWithCompletedMilestones.length} projects with completed milestones`);

    let totalIssues = 0;
    let totalFixed = 0;

    for (const project of projectsWithCompletedMilestones) {
      console.log(`\n🎯 PROJECT: ${project.title}`);
      console.log(`  ├─ Client: ${project.client?.name}`);
      console.log(`  └─ Freelancer: ${project.freelancer?.name}`);

      const completedMilestones = project.milestones.filter(
        (m) => m.status === "completed" && m.approvalStatus === "approved"
      );

      console.log(`  📊 Completed Milestones: ${completedMilestones.length}`);

      // Check escrow for this project
      const escrow = await Escrow.findOne({ project: project._id });

      if (!escrow) {
        console.log(`  ❌ No escrow found for project!`);
        totalIssues++;
        continue;
      }

      console.log(`  ✅ Escrow: ${escrow.escrowId} (Status: ${escrow.status})`);

      // Validate each completed milestone
      for (const milestone of completedMilestones) {
        console.log(`\n    🎯 Milestone: ${milestone.title}`);
        console.log(`      ├─ Status: ${milestone.status}`);
        console.log(`      ├─ Approval: ${milestone.approvalStatus}`);
        console.log(`      └─ Approved Date: ${milestone.approvalDate}`);

        // Find corresponding escrow milestone
        const escrowMilestone = escrow.milestones?.find((em) => em.milestoneId.toString() === milestone._id.toString());

        if (!escrowMilestone) {
          console.log(`      ❌ No matching escrow milestone found!`);
          totalIssues++;
          continue;
        }

        console.log(`      ✅ Escrow Milestone Found`);
        console.log(`        ├─ Status: ${escrowMilestone.status}`);
        console.log(`        ├─ Amount: $${escrowMilestone.amount}`);
        console.log(`        └─ Freelancer Receives: $${escrowMilestone.freelancerReceives}`);

        // Check if payment was released
        if (escrowMilestone.status === "released") {
          console.log(`      ✅ Payment Status: RELEASED`);

          // Verify transaction exists
          const milestoneTransaction = await Transaction.findOne({
            user: project.freelancer._id,
            milestone: milestone._id,
            type: "milestone",
            status: "completed",
          });

          if (milestoneTransaction) {
            console.log(`      ✅ Transaction Found: ${milestoneTransaction.transactionId}`);
            console.log(`        ├─ Amount: $${milestoneTransaction.amount}`);
            console.log(`        ├─ Net Amount: $${milestoneTransaction.netAmount}`);
            console.log(`        └─ Fee: $${milestoneTransaction.fee}`);
          } else {
            console.log(`      ❌ No transaction record found for released milestone!`);
            totalIssues++;
          }

          // Verify wallet was updated
          const freelancerWallet = await Wallet.findOne({ user: project.freelancer._id });
          if (freelancerWallet) {
            console.log(
              `      ✅ Freelancer Wallet: $${freelancerWallet.balance} (Total Earned: $${freelancerWallet.totalEarned})`
            );
          } else {
            console.log(`      ❌ No freelancer wallet found!`);
            totalIssues++;
          }
        } else if (escrowMilestone.status === "pending") {
          console.log(`      ⚠️  Payment Status: PENDING (Should be released!)`);
          totalIssues++;

          // This is a completed and approved milestone but payment not released
          console.log(`      🔧 Attempting to fix payment release...`);

          try {
            // Attempt to release payment
            const escrowController = require("../controllers/escrowController");

            const mockReq = {
              user: { id: project.client._id },
              params: {
                projectId: project._id.toString(),
                milestoneId: milestone._id.toString(),
              },
            };

            let releaseResult = null;
            const mockRes = {
              json: (data) => {
                releaseResult = data;
              },
              status: (code) => ({
                json: (data) => {
                  releaseResult = { success: false, statusCode: code, ...data };
                },
              }),
            };

            await escrowController.releaseMilestonePayment(mockReq, mockRes);

            if (releaseResult && releaseResult.success) {
              console.log(`      ✅ Payment successfully released!`);
              console.log(`        └─ Amount: $${releaseResult.data?.transaction?.netAmount}`);
              totalFixed++;
            } else {
              console.log(`      ❌ Failed to release payment:`, releaseResult?.message);
            }
          } catch (error) {
            console.log(`      ❌ Error releasing payment:`, error.message);
          }
        }
      }
    }

    // Step 2: Check wallet consistency
    console.log(`\n📋 STEP 2: Checking Wallet Consistency`);

    const allWallets = await Wallet.find({}).populate("user", "name email role");

    console.log(`Found ${allWallets.length} wallets`);

    for (const wallet of allWallets.slice(0, 5)) {
      // Check first 5 wallets
      console.log(`\n💰 Wallet: ${wallet.user?.name} (${wallet.user?.role})`);
      console.log(`  ├─ Balance: $${wallet.balance}`);
      console.log(`  ├─ Total Earned: $${wallet.totalEarned}`);
      console.log(`  └─ Total Spent: $${wallet.totalSpent}`);

      // Get transactions for this wallet
      const transactions = await Transaction.find({
        user: wallet.user._id,
        status: "completed",
      })
        .sort({ createdAt: -1 })
        .limit(5);

      console.log(`  📋 Recent Transactions: ${transactions.length}`);
      transactions.forEach((tx, i) => {
        console.log(`    ${i + 1}. ${tx.transactionId} - ${tx.type} - $${tx.amount} (Net: $${tx.netAmount})`);
      });

      // Validate wallet balance against transactions
      if (wallet.user?.role === "freelancer") {
        const milestoneTransactions = await Transaction.find({
          user: wallet.user._id,
          type: "milestone",
          status: "completed",
        });

        const expectedEarned = milestoneTransactions.reduce((sum, tx) => sum + (tx.netAmount || 0), 0);

        if (Math.abs(wallet.totalEarned - expectedEarned) > 0.01) {
          console.log(`  ⚠️  Wallet inconsistency detected!`);
          console.log(`    ├─ Wallet Total Earned: $${wallet.totalEarned}`);
          console.log(`    └─ Expected from Transactions: $${expectedEarned}`);
          totalIssues++;
        }
      }
    }

    // Step 3: Summary
    console.log(`\n📊 VALIDATION SUMMARY:`);
    console.log(`  ├─ Projects Checked: ${projectsWithCompletedMilestones.length}`);
    console.log(`  ├─ Issues Found: ${totalIssues}`);
    console.log(`  ├─ Issues Fixed: ${totalFixed}`);
    console.log(`  └─ Success Rate: ${totalIssues > 0 ? ((totalFixed / totalIssues) * 100).toFixed(1) : 100}%`);

    if (totalIssues === 0) {
      console.log(`\n✅ All payment flows are working correctly!`);
    } else if (totalFixed === totalIssues) {
      console.log(`\n✅ All issues have been fixed!`);
    } else {
      console.log(`\n⚠️  ${totalIssues - totalFixed} issues remain unresolved`);
    }

    console.log(`\n${"=".repeat(60)}`);
    console.log(`🎯 VALIDATION COMPLETE`);

    return {
      totalProjects: projectsWithCompletedMilestones.length,
      totalIssues,
      totalFixed,
      success: totalIssues === 0 || totalFixed === totalIssues,
    };
  } catch (error) {
    console.error("❌ Error during payment flow validation:", error);
    throw error;
  }
}

/**
 * Fix inconsistent wallet balances
 */
async function fixWalletInconsistencies() {
  console.log("🔧 FIXING WALLET INCONSISTENCIES");

  try {
    const freelancerWallets = await Wallet.find({})
      .populate("user", "name email role")
      .where("user.role")
      .equals("freelancer");

    console.log(`Checking ${freelancerWallets.length} freelancer wallets...`);

    let fixed = 0;

    for (const wallet of freelancerWallets) {
      const milestoneTransactions = await Transaction.find({
        user: wallet.user._id,
        type: "milestone",
        status: "completed",
      });

      const expectedEarned = milestoneTransactions.reduce((sum, tx) => sum + (tx.netAmount || 0), 0);
      const expectedBalance = expectedEarned; // Assuming no withdrawals for simplicity

      if (Math.abs(wallet.totalEarned - expectedEarned) > 0.01 || Math.abs(wallet.balance - expectedBalance) > 0.01) {
        console.log(`🔧 Fixing wallet for ${wallet.user.name}:`);
        console.log(`  ├─ Old Total Earned: $${wallet.totalEarned} → $${expectedEarned}`);
        console.log(`  └─ Old Balance: $${wallet.balance} → $${expectedBalance}`);

        wallet.totalEarned = expectedEarned;
        wallet.balance = expectedBalance;
        await wallet.save();

        fixed++;
      }
    }

    console.log(`✅ Fixed ${fixed} wallet inconsistencies`);
    return fixed;
  } catch (error) {
    console.error("❌ Error fixing wallet inconsistencies:", error);
    throw error;
  }
}

module.exports = {
  validatePaymentFlow,
  fixWalletInconsistencies,
};
