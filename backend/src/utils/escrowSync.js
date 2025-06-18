const Escrow = require("../models/Escrow");
const Project = require("../models/Project");

/**
 * Synchronize escrow milestones with project milestones
 * This ensures escrow has proper milestone structure when milestones are added/edited after escrow creation
 */
async function syncEscrowMilestones(projectId, session = null) {
  try {
    console.log(`🔄 Starting escrow milestone sync for project: ${projectId}`);

    const project = session ? await Project.findById(projectId).session(session) : await Project.findById(projectId);
    const escrow = session
      ? await Escrow.findOne({ project: projectId }).session(session)
      : await Escrow.findOne({ project: projectId });

    if (!project || !escrow) {
      console.log(`❌ Project or escrow not found for sync`);
      return false;
    }

    console.log(`📊 Current state:`);
    console.log(`  ├─ Project milestones: ${project.milestones.length}`);
    console.log(`  └─ Escrow milestones: ${escrow.milestones.length}`);

    // If escrow has only 1 milestone (original 100%) but project has multiple milestones
    if (escrow.milestones.length === 1 && project.milestones.length > 1) {
      console.log(
        `🔧 SYNC NEEDED: Escrow has ${escrow.milestones.length} milestone, project has ${project.milestones.length}`
      );

      const originalMilestone = escrow.milestones[0];
      const totalAmount = originalMilestone.amount;
      const platformFeeRate = escrow.platformFee / escrow.totalAmount; // Calculate fee rate

      console.log(`💰 Original milestone amount: $${totalAmount}`);
      console.log(`📊 Platform fee rate: ${(platformFeeRate * 100).toFixed(2)}%`);

      // Clear existing milestones
      escrow.milestones = [];

      // Create new milestones based on project milestones
      let runningTotal = 0;
      project.milestones.forEach((projectMilestone, index) => {
        const milestoneAmount = Math.round((totalAmount * projectMilestone.percentage) / 100);
        const platformFee = Math.round(milestoneAmount * platformFeeRate);
        const freelancerReceives = milestoneAmount - platformFee;

        runningTotal += milestoneAmount;

        const escrowMilestone = {
          milestoneId: projectMilestone._id.toString(),
          title: projectMilestone.title,
          description: projectMilestone.description,
          amount: milestoneAmount,
          platformFee: platformFee,
          freelancerReceives: freelancerReceives,
          status: "pending",
          percentage: projectMilestone.percentage,
          dueDate: projectMilestone.dueDate,
        };

        escrow.milestones.push(escrowMilestone);
        console.log(
          `  ✅ Created escrow milestone ${index + 1}: ${projectMilestone.title} - $${milestoneAmount} (${
            projectMilestone.percentage
          }%)`
        );
      });

      // Adjust last milestone for any rounding differences
      const difference = totalAmount - runningTotal;
      if (difference !== 0) {
        const lastMilestone = escrow.milestones[escrow.milestones.length - 1];
        lastMilestone.amount += difference;
        lastMilestone.freelancerReceives += difference;
        console.log(`🔧 Adjusted last milestone by $${difference} for rounding`);
      }

      // Update escrow totals
      escrow.amountToFreelancer = escrow.milestones.reduce((sum, m) => sum + m.freelancerReceives, 0);
      escrow.platformRevenue = escrow.milestones.reduce((sum, m) => sum + m.platformFee, 0);

      await escrow.save(session ? { session } : {});
      console.log(`✅ Escrow milestones synchronized successfully`);
      console.log(`📊 New totals:`);
      console.log(`  ├─ Amount to freelancer: $${escrow.amountToFreelancer}`);
      console.log(`  └─ Platform revenue: $${escrow.platformRevenue}`);

      return true;
    }

    console.log(`✅ No sync needed - escrow already has correct milestone structure`);
    return false;
  } catch (error) {
    console.error("Error syncing escrow milestones:", error);
    return false;
  }
}

/**
 * Check if project completion status should be updated based on milestone releases
 */
async function checkProjectCompletion(projectId) {
  try {
    const project = await Project.findById(projectId);
    const escrow = await Escrow.findOne({ project: projectId });

    if (!project || !escrow) {
      return { allComplete: false, reason: "Project or escrow not found" };
    }

    // Count approved milestones in project
    const approvedProjectMilestones = project.milestones.filter((m) => m.status === "approved").length;
    const totalProjectMilestones = project.milestones.length;

    // Count released milestones in escrow
    const releasedEscrowMilestones = escrow.milestones.filter((m) => m.status === "released").length;

    console.log(`🔍 COMPLETION CHECK:`);
    console.log(`  ├─ Total project milestones: ${totalProjectMilestones}`);
    console.log(`  ├─ Approved project milestones: ${approvedProjectMilestones}`);
    console.log(`  └─ Released escrow milestones: ${releasedEscrowMilestones}`);

    // Project is complete when all milestones are approved AND released
    const allComplete =
      approvedProjectMilestones === totalProjectMilestones && releasedEscrowMilestones === totalProjectMilestones;

    return {
      allComplete,
      totalMilestones: totalProjectMilestones,
      approvedMilestones: approvedProjectMilestones,
      releasedMilestones: releasedEscrowMilestones,
      reason: allComplete ? "All milestones approved and released" : "Not all milestones complete",
    };
  } catch (error) {
    console.error("Error checking project completion:", error);
    return { allComplete: false, reason: "Error checking completion" };
  }
}

module.exports = {
  syncEscrowMilestones,
  checkProjectCompletion,
};
