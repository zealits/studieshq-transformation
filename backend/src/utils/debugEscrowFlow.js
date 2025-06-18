const mongoose = require("mongoose");
const { Project } = require("../models/Project");
const Escrow = require("../models/Escrow");
const { Wallet, Transaction } = require("../models/Payment");
const User = require("../models/User");

/**
 * Debug script to test milestone payment release workflow
 */
async function debugEscrowFlow() {
  console.log("🔍 ESCROW FLOW DEBUGGING SCRIPT");
  console.log("=".repeat(50));

  try {
    // Step 1: Find active projects with escrows
    console.log("\n📋 STEP 1: Finding Active Projects with Escrows");

    const projectsWithEscrows = await Project.find({
      status: { $in: ["in_progress", "pending"] },
    })
      .populate("client", "name email role")
      .populate("freelancer", "name email role")
      .limit(5);

    console.log(`Found ${projectsWithEscrows.length} active projects`);

    for (const project of projectsWithEscrows) {
      console.log(`\n🎯 PROJECT: ${project.title}`);
      console.log(`  ├─ ID: ${project._id}`);
      console.log(`  ├─ Status: ${project.status}`);
      console.log(`  ├─ Client: ${project.client?.name} (${project.client?.email})`);
      console.log(`  ├─ Freelancer: ${project.freelancer?.name} (${project.freelancer?.email})`);
      console.log(`  └─ Milestones: ${project.milestones?.length || 0}`);

      // Check if escrow exists for this project
      const escrow = await Escrow.findOne({ project: project._id });

      if (escrow) {
        console.log(`  ✅ Escrow Found: ${escrow.escrowId}`);
        console.log(`    ├─ Status: ${escrow.status}`);
        console.log(`    ├─ Total Amount: $${escrow.totalAmount}`);
        console.log(`    ├─ Released: $${escrow.releasedAmount}`);
        console.log(`    └─ Milestones in Escrow: ${escrow.milestones?.length || 0}`);

        // Check milestone matching
        if (project.milestones && project.milestones.length > 0) {
          console.log(`\n  🎯 MILESTONE MATCHING:`);

          project.milestones.forEach((projectMilestone, index) => {
            const escrowMilestone = escrow.milestones?.find(
              (em) => em.milestoneId.toString() === projectMilestone._id.toString()
            );

            console.log(`    Milestone ${index + 1}:`);
            console.log(`      ├─ Project ID: ${projectMilestone._id}`);
            console.log(`      ├─ Project Status: ${projectMilestone.status}`);
            console.log(`      ├─ Project Approval: ${projectMilestone.approvalStatus || "pending"}`);
            console.log(`      ├─ Escrow Match: ${escrowMilestone ? "YES" : "NO"}`);

            if (escrowMilestone) {
              console.log(`      ├─ Escrow Status: ${escrowMilestone.status}`);
              console.log(`      ├─ Amount: $${escrowMilestone.amount}`);
              console.log(`      └─ Freelancer Receives: $${escrowMilestone.freelancerReceives}`);
            } else {
              console.log(`      └─ ❌ NO MATCHING ESCROW MILESTONE FOUND!`);
            }
          });
        }

        // Check wallet states
        console.log(`\n  💰 WALLET STATUS:`);

        const clientWallet = await Wallet.findOne({ user: project.client._id });
        const freelancerWallet = await Wallet.findOne({ user: project.freelancer._id });

        console.log(`    Client Wallet:`);
        console.log(`      ├─ Balance: $${clientWallet?.balance || 0}`);
        console.log(`      └─ Total Spent: $${clientWallet?.totalSpent || 0}`);

        console.log(`    Freelancer Wallet:`);
        console.log(`      ├─ Balance: $${freelancerWallet?.balance || 0}`);
        console.log(`      ├─ Total Earned: $${freelancerWallet?.totalEarned || 0}`);
        console.log(`      └─ Total Withdrawn: $${freelancerWallet?.totalWithdrawn || 0}`);

        // Check recent transactions
        const clientTransactions = await Transaction.find({
          user: project.client._id,
          project: project._id,
        })
          .sort({ createdAt: -1 })
          .limit(3);

        const freelancerTransactions = await Transaction.find({
          user: project.freelancer._id,
          project: project._id,
        })
          .sort({ createdAt: -1 })
          .limit(3);

        console.log(`\n  📋 RECENT TRANSACTIONS:`);
        console.log(`    Client Transactions: ${clientTransactions.length}`);
        clientTransactions.forEach((tx, i) => {
          console.log(`      ${i + 1}. ${tx.transactionId} - ${tx.type} - $${tx.amount} - ${tx.status}`);
        });

        console.log(`    Freelancer Transactions: ${freelancerTransactions.length}`);
        freelancerTransactions.forEach((tx, i) => {
          console.log(`      ${i + 1}. ${tx.transactionId} - ${tx.type} - $${tx.amount} - ${tx.status}`);
        });
      } else {
        console.log(`  ❌ No Escrow Found for this project`);
      }

      console.log(`  ${"-".repeat(40)}`);
    }

    // Step 2: Check for orphaned escrows
    console.log(`\n📋 STEP 2: Checking for Orphaned Escrows`);

    const allEscrows = await Escrow.find({})
      .populate("project", "title status")
      .populate("client", "name email")
      .populate("freelancer", "name email");

    console.log(`Total escrows in system: ${allEscrows.length}`);

    const orphanedEscrows = allEscrows.filter((escrow) => !escrow.project);
    console.log(`Orphaned escrows (no project): ${orphanedEscrows.length}`);

    const missingMilestones = allEscrows.filter((escrow) => !escrow.milestones || escrow.milestones.length === 0);
    console.log(`Escrows with no milestones: ${missingMilestones.length}`);

    // Step 3: Summary and recommendations
    console.log(`\n📊 SUMMARY AND RECOMMENDATIONS:`);
    console.log(`  Total Projects Checked: ${projectsWithEscrows.length}`);
    console.log(`  Projects with Escrows: ${projectsWithEscrows.filter((p) => p.escrow).length}`);
    console.log(`  Total System Escrows: ${allEscrows.length}`);
    console.log(`  Orphaned Escrows: ${orphanedEscrows.length}`);
    console.log(`  Escrows without Milestones: ${missingMilestones.length}`);

    // Check for potential issues
    const potentialIssues = [];

    for (const project of projectsWithEscrows) {
      const escrow = await Escrow.findOne({ project: project._id });

      if (escrow && project.milestones) {
        // Check for milestone ID mismatches
        for (const projectMilestone of project.milestones) {
          const escrowMilestone = escrow.milestones?.find(
            (em) => em.milestoneId.toString() === projectMilestone._id.toString()
          );

          if (!escrowMilestone) {
            potentialIssues.push({
              type: "milestone_mismatch",
              project: project.title,
              projectId: project._id,
              milestoneId: projectMilestone._id,
              description: "Project milestone not found in escrow",
            });
          }
        }
      }
    }

    if (potentialIssues.length > 0) {
      console.log(`\n⚠️  POTENTIAL ISSUES FOUND:`);
      potentialIssues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.type.toUpperCase()}: ${issue.description}`);
        console.log(`     Project: ${issue.project} (${issue.projectId})`);
        if (issue.milestoneId) {
          console.log(`     Milestone ID: ${issue.milestoneId}`);
        }
      });
    } else {
      console.log(`  ✅ No obvious issues detected`);
    }

    console.log(`\n${"=".repeat(50)}`);
    console.log(`🎯 DEBUGGING COMPLETE`);
  } catch (error) {
    console.error("❌ Error during debugging:", error);
  }
}

/**
 * Fix milestone ID mismatches
 */
async function fixMilestoneMatching() {
  console.log("🔧 FIXING MILESTONE MATCHING ISSUES");

  try {
    const projects = await Project.find({
      status: { $in: ["in_progress", "pending"] },
      milestones: { $exists: true, $ne: [] },
    });

    for (const project of projects) {
      const escrow = await Escrow.findOne({ project: project._id });

      if (escrow && project.milestones) {
        let needsUpdate = false;

        // Check if escrow milestones need to be rebuilt
        for (const projectMilestone of project.milestones) {
          const escrowMilestone = escrow.milestones?.find(
            (em) => em.milestoneId.toString() === projectMilestone._id.toString()
          );

          if (!escrowMilestone) {
            console.log(`❌ Missing escrow milestone for project: ${project.title}`);
            needsUpdate = true;
            break;
          }
        }

        if (needsUpdate) {
          console.log(`🔧 Rebuilding milestones for escrow: ${escrow.escrowId}`);

          // Rebuild escrow milestones from project milestones
          const newMilestones = project.milestones.map((milestone) => ({
            milestoneId: milestone._id,
            title: milestone.title,
            amount: (milestone.percentage / 100) * escrow.projectAmount,
            freelancerReceives: (milestone.percentage / 100) * escrow.amountToFreelancer,
            platformFee: (milestone.percentage / 100) * (escrow.clientPlatformFee + escrow.freelancerPlatformFee),
            status: "pending",
          }));

          escrow.milestones = newMilestones;
          await escrow.save();

          console.log(`✅ Fixed milestones for escrow: ${escrow.escrowId}`);
        }
      }
    }

    console.log("🎯 MILESTONE FIXING COMPLETE");
  } catch (error) {
    console.error("❌ Error fixing milestones:", error);
  }
}

module.exports = {
  debugEscrowFlow,
  fixMilestoneMatching,
};
