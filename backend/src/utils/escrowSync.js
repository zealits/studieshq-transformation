const Escrow = require("../models/Escrow");
const { Project } = require("../models/Project");

/**
 * Synchronize escrow milestones with project milestones
 * This ensures escrow has proper milestone structure when milestones are added/edited after escrow creation
 */
async function syncEscrowMilestones(projectId, session = null) {
  try {
    console.log(`🔄 ====== ESCROW SYNC START ======`);
    console.log(`🔄 Starting escrow milestone sync for project: ${projectId}`);
    console.log(`🔄 Session provided: ${session ? "YES" : "NO"}`);

    // CRITICAL FIX: Get the most up-to-date escrow document
    const project = session ? await Project.findById(projectId).session(session) : await Project.findById(projectId);
    let escrow = session
      ? await Escrow.findOne({ project: projectId }).session(session)
      : await Escrow.findOne({ project: projectId });

    // CRITICAL FIX: Only refresh escrow document if NOT in a session
    // Session should already have the most current data
    if (escrow && !session) {
      // Re-fetch only when not in session to ensure we get latest data
      const refreshedEscrow = await Escrow.findById(escrow._id);
      if (refreshedEscrow) {
        escrow = refreshedEscrow;
        console.log(`🔄 Refreshed escrow document from database - Latest version: ${escrow.__v || "unknown"}`);
      }
    }

    console.log(
      `🔄 Using escrow document - Version: ${escrow.__v || "unknown"}, Milestones: ${escrow.milestones.length}`
    );

    // CRITICAL DEBUG: Show milestone statuses
    console.log(`🔍 CURRENT ESCROW MILESTONE STATUS:`);
    escrow.milestones.forEach((m, idx) => {
      console.log(
        `    ${idx + 1}. ${m.milestoneId} | ${m.title || "No title"} | Status: ${m.status} | Released: ${
          m.releasedAt || "N/A"
        }`
      );
    });

    if (!project) {
      console.log(`❌ Project not found during sync: ${projectId}`);
      return false;
    }

    if (!escrow) {
      console.log(`❌ Escrow not found during sync for project: ${projectId}`);
      return false;
    }

    console.log(`✅ Found project and escrow for sync:`);
    console.log(`  ├─ Project: ${project.title} (Status: ${project.status})`);
    console.log(`  ├─ Project Budget: $${project.budget}`);
    console.log(`  ├─ Escrow ID: ${escrow.escrowId}`);
    console.log(`  ├─ Escrow Status: ${escrow.status}`);
    console.log(`  └─ Escrow Total: $${escrow.totalAmount}`);

    console.log(`📊 Current state comparison:`);
    console.log(`  ├─ Project milestones: ${project.milestones.length}`);
    console.log(`  └─ Escrow milestones: ${escrow.milestones.length}`);

    // Log project milestones in detail
    console.log(`📋 PROJECT MILESTONES:`);
    if (project.milestones.length === 0) {
      console.log(`  └─ No project milestones found`);
    } else {
      project.milestones.forEach((m, idx) => {
        console.log(`  ${idx + 1}. ID: ${m._id.toString()}`);
        console.log(`     ├─ Title: ${m.title || "No title"}`);
        console.log(`     ├─ Description: ${m.description || "No description"}`);
        console.log(`     ├─ Percentage: ${m.percentage}%`);
        console.log(`     ├─ Amount: $${m.amount}`);
        console.log(`     ├─ Status: ${m.status}`);
        console.log(`     └─ Approval Status: ${m.approvalStatus || "N/A"}`);
      });
    }

    // Log escrow milestones in detail
    console.log(`📋 ESCROW MILESTONES:`);
    if (escrow.milestones.length === 0) {
      console.log(`  └─ No escrow milestones found`);
    } else {
      escrow.milestones.forEach((m, idx) => {
        console.log(`  ${idx + 1}. Milestone ID: ${m.milestoneId.toString()}`);
        console.log(`     ├─ Title: ${m.title || "No title"}`);
        console.log(`     ├─ Description: ${m.description || "No description"}`);
        console.log(`     ├─ Percentage: ${m.percentage}%`);
        console.log(`     ├─ Amount: $${m.amount}`);
        console.log(`     ├─ Platform Fee: $${m.platformFee}`);
        console.log(`     ├─ Freelancer Receives: $${m.freelancerReceives}`);
        console.log(`     ├─ Status: ${m.status}`);
        console.log(`     └─ Due Date: ${m.dueDate || "N/A"}`);
      });
    }

    // Check if sync is needed by comparing milestone counts or if milestone IDs don't match
    const projectMilestoneIds = project.milestones.map((m) => m._id.toString()).sort();
    const escrowMilestoneIds = escrow.milestones.map((m) => m.milestoneId).sort();

    console.log(`🔍 SYNC ANALYSIS:`);
    console.log(`  ├─ Project milestone IDs: [${projectMilestoneIds.join(", ")}]`);
    console.log(`  ├─ Escrow milestone IDs: [${escrowMilestoneIds.join(", ")}]`);
    console.log(`  ├─ IDs match: ${JSON.stringify(projectMilestoneIds) === JSON.stringify(escrowMilestoneIds)}`);
    console.log(`  └─ Counts match: ${escrow.milestones.length === project.milestones.length}`);

    const needsSync =
      escrow.milestones.length !== project.milestones.length ||
      JSON.stringify(projectMilestoneIds) !== JSON.stringify(escrowMilestoneIds);

    // Special case: If project has milestones but escrow is empty, always sync
    const needsInitialSync = project.milestones.length > 0 && escrow.milestones.length === 0;

    // CRITICAL FIX: Check if milestone data (amounts, percentages) are out of sync
    let needsDataSync = false;
    if (project.milestones.length > 0 && escrow.milestones.length > 0) {
      console.log(`🔍 CHECKING DATA SYNC NECESSITY:`);

      // Check each project milestone against corresponding escrow milestone
      for (const projectMilestone of project.milestones) {
        const projectMilestoneId = projectMilestone._id.toString();
        const escrowMilestone = escrow.milestones.find((em) => em.milestoneId.toString() === projectMilestoneId);

        if (escrowMilestone) {
          // Calculate what the escrow milestone amount should be
          const expectedAmount = Math.round((escrow.totalAmount * projectMilestone.percentage) / 100);
          const actualAmount = escrowMilestone.amount;
          const expectedPercentage = projectMilestone.percentage;
          const actualPercentage = escrowMilestone.percentage;

          console.log(`  ├─ Milestone: ${projectMilestone.title}`);
          console.log(
            `  │   ├─ Expected Amount: $${expectedAmount} (${expectedPercentage}% of $${escrow.totalAmount})`
          );
          console.log(`  │   ├─ Actual Amount: $${actualAmount}`);
          console.log(`  │   ├─ Expected Percentage: ${expectedPercentage}%`);
          console.log(`  │   ├─ Actual Percentage: ${actualPercentage || "undefined"}%`);
          console.log(`  │   ├─ Amount Match: ${expectedAmount === actualAmount}`);
          console.log(`  │   └─ Percentage Match: ${expectedPercentage === actualPercentage}`);

          // CRITICAL FIX: Only trigger data sync for amount mismatches, not missing percentages
          // Missing percentages are expected and don't indicate data corruption
          const significantAmountDifference = Math.abs(expectedAmount - actualAmount) > 1; // Allow $1 rounding difference

          if (significantAmountDifference) {
            console.log(`  │   ⚠️ AMOUNT MISMATCH DETECTED! (Difference: $${Math.abs(expectedAmount - actualAmount)})`);
            needsDataSync = true;
          } else {
            console.log(`  │   ✅ Amount is correct (within $1 tolerance)`);
          }
        } else {
          console.log(`  ├─ Milestone: ${projectMilestone.title} - NOT FOUND in escrow`);
          needsDataSync = true;
        }
      }

      console.log(`  └─ Data sync needed: ${needsDataSync}`);
    }

    console.log(`🔧 SYNC DECISION:`);
    console.log(`  ├─ Needs sync (count/ID mismatch): ${needsSync}`);
    console.log(`  ├─ Needs initial sync (empty escrow): ${needsInitialSync}`);
    console.log(`  ├─ Needs data sync (amount/percentage mismatch): ${needsDataSync}`);
    console.log(`  └─ Will sync: ${needsSync || needsInitialSync || needsDataSync}`);

    if (needsSync || needsInitialSync || needsDataSync) {
      console.log(`🔧 SYNC NEEDED: Rebuilding escrow milestones to match project structure`);
      console.log(`  ├─ Project milestones: ${project.milestones.length}`);
      console.log(`  ├─ Escrow milestones: ${escrow.milestones.length}`);
      console.log(`  ├─ Project milestone IDs: [${projectMilestoneIds.join(", ")}]`);
      console.log(`  └─ Escrow milestone IDs: [${escrowMilestoneIds.join(", ")}]`);

      // Handle case where project has no milestones - clear escrow milestones too
      if (project.milestones.length === 0) {
        console.log(`🧹 Project has no milestones - clearing escrow milestones`);
        escrow.milestones = [];
        escrow.releasedAmount = 0;
        await escrow.save(session ? { session } : {});
        console.log(`✅ Escrow milestones cleared - client will create milestones manually`);
        console.log(`🔄 ====== ESCROW SYNC END ======`);
        return true;
      }

      // Use existing total amount from escrow or calculate from project budget
      const totalAmount = escrow.totalAmount || project.budget;

      // CRITICAL FIX: Always use 10% platform fee rate for freelancer fees
      // The client already paid their 10% when funding escrow
      const PLATFORM_FEE_RATE = 0.1; // Fixed 10% rate

      console.log(`💰 CALCULATION DETAILS:`);
      console.log(`  ├─ Total escrow amount: $${totalAmount}`);
      console.log(`  ├─ Existing platform revenue: $${escrow.platformRevenue}`);
      console.log(`  ├─ FIXED platform fee rate: ${PLATFORM_FEE_RATE * 100}% (freelancer side)`);
      console.log(`  ├─ Client fees already included in escrow total`);
      console.log(`  └─ Existing released amount: $${escrow.releasedAmount}`);

      // Preserve released milestone statuses
      const releasedMilestones = new Map();
      console.log(`🔒 PRESERVING RELEASED MILESTONES:`);

      // CRITICAL DEBUG: Show all milestones and their statuses
      console.log(`🔍 ANALYZING ALL ESCROW MILESTONES FOR RELEASE STATUS:`);
      escrow.milestones.forEach((m, idx) => {
        console.log(`  ${idx + 1}. Milestone: ${m.milestoneId} (${m.title || "No title"})`);
        console.log(`      ├─ Status: ${m.status}`);
        console.log(`      ├─ Amount: $${m.amount}`);
        console.log(`      ├─ Freelancer Receives: $${m.freelancerReceives}`);
        console.log(`      └─ Released At: ${m.releasedAt || "N/A"}`);

        // CRITICAL FIX: More robust preservation logic
        // Preserve if status is "released" OR if it has a releasedAt date (backup check)
        if (m.status === "released" || m.releasedAt) {
          releasedMilestones.set(m.milestoneId.toString(), {
            releasedAt: m.releasedAt,
            releasedBy: m.releasedBy,
            originalAmount: m.amount, // Preserve original amount for comparison
            originalFreelancerReceives: m.freelancerReceives,
            originalStatus: m.status, // Preserve original status
          });
          console.log(
            `      ✅ PRESERVED as released milestone (Status: ${m.status}, Released: ${m.releasedAt ? "YES" : "NO"})`
          );
        } else {
          console.log(`      ❌ NOT PRESERVED (status: ${m.status}, no release date)`);
        }
      });

      console.log(`📊 PRESERVATION SUMMARY:`);
      console.log(`  ├─ Total escrow milestones: ${escrow.milestones.length}`);
      console.log(`  ├─ Released milestones found: ${releasedMilestones.size}`);
      console.log(`  └─ Milestone IDs preserved: [${Array.from(releasedMilestones.keys()).join(", ")}]`);

      // Clear existing milestones
      console.log(`🗑️ Clearing existing escrow milestones...`);
      escrow.milestones = [];

      // Create new milestones based on current project milestones
      console.log(`🔨 CREATING NEW ESCROW MILESTONES:`);
      let runningTotal = 0;
      project.milestones.forEach((projectMilestone, index) => {
        const milestoneAmount = Math.round((totalAmount * projectMilestone.percentage) / 100);

        // CRITICAL FIX: Calculate freelancer fee based on original project value, not escrow amount
        const originalWorkValue = Math.round((project.budget * projectMilestone.percentage) / 100);
        const platformFee = Math.round(originalWorkValue * PLATFORM_FEE_RATE); // 10% of original work
        const freelancerReceives = originalWorkValue - platformFee; // Original work minus freelancer fee

        console.log(`🧮 MILESTONE ${index + 1} CALCULATION:`);
        console.log(
          `  ├─ Original work value: $${originalWorkValue} (${projectMilestone.percentage}% of $${project.budget})`
        );
        console.log(`  ├─ Escrow amount: $${milestoneAmount} (${projectMilestone.percentage}% of $${totalAmount})`);
        console.log(`  ├─ Platform fee (freelancer): $${platformFee} (10% of work value)`);
        console.log(`  ├─ Freelancer receives: $${freelancerReceives} (work value - freelancer fee)`);
        console.log(`  └─ Client already paid: $${milestoneAmount} (work value + client fee)`);

        const milestoneIdStr = projectMilestone._id.toString();
        runningTotal += milestoneAmount;

        const escrowMilestone = {
          milestoneId: milestoneIdStr,
          title: projectMilestone.title,
          description: projectMilestone.description,
          amount: milestoneAmount,
          platformFee: platformFee,
          freelancerReceives: freelancerReceives,
          status: releasedMilestones.has(milestoneIdStr) ? "released" : "pending",
          percentage: projectMilestone.percentage,
          dueDate: projectMilestone.dueDate,
        };

        console.log(`🔍 MILESTONE CREATION CHECK for ${milestoneIdStr}:`);
        console.log(`  ├─ In released map: ${releasedMilestones.has(milestoneIdStr)}`);
        console.log(`  ├─ Map keys: [${Array.from(releasedMilestones.keys()).join(", ")}]`);
        console.log(`  └─ Will be created with status: ${escrowMilestone.status}`);

        // Preserve release information if milestone was already released
        if (releasedMilestones.has(milestoneIdStr)) {
          const releaseInfo = releasedMilestones.get(milestoneIdStr);
          escrowMilestone.releasedAt = releaseInfo.releasedAt;
          escrowMilestone.releasedBy = releaseInfo.releasedBy;
          escrowMilestone.status = "released"; // Ensure status is preserved

          console.log(`🔄 PRESERVING RELEASE INFO for ${milestoneIdStr}:`);
          console.log(`  ├─ Released At: ${releaseInfo.releasedAt}`);
          console.log(`  ├─ Released By: ${releaseInfo.releasedBy}`);
          console.log(`  └─ Status set to: ${escrowMilestone.status}`);

          // CRITICAL: Check if released milestone had wrong amount
          if (
            releaseInfo.originalAmount !== milestoneAmount ||
            releaseInfo.originalFreelancerReceives !== freelancerReceives
          ) {
            const freelancerDifference = releaseInfo.originalFreelancerReceives - freelancerReceives;
            const escrowDifference = releaseInfo.originalAmount - milestoneAmount;

            console.log(`  🚨 WARNING: Previously released milestone had incorrect amounts!`);
            console.log(`      ├─ Milestone: ${projectMilestone.title}`);
            console.log(
              `      ├─ Originally Released: $${releaseInfo.originalAmount} (Freelancer got: $${releaseInfo.originalFreelancerReceives})`
            );
            console.log(
              `      ├─ Should Have Been: $${milestoneAmount} (Freelancer should get: $${freelancerReceives})`
            );
            console.log(
              `      ├─ Freelancer Over/Under paid: $${freelancerDifference} (${
                freelancerDifference > 0 ? "OVERPAID" : "UNDERPAID"
              })`
            );
            console.log(`      ├─ Escrow amount difference: $${escrowDifference}`);
            console.log(`      └─ ACTION NEEDED: Manual accounting adjustment may be required!`);

            // Keep the original amounts for released milestones to avoid double-payment issues
            // But log the discrepancy for manual review
            escrowMilestone.amount = releaseInfo.originalAmount;
            escrowMilestone.freelancerReceives = releaseInfo.originalFreelancerReceives;
            escrowMilestone.correctAmount = milestoneAmount; // Store what it should have been
            escrowMilestone.correctFreelancerReceives = freelancerReceives;
            escrowMilestone.correctPlatformFee = platformFee;

            console.log(`      ├─ PRESERVING original amounts to avoid accounting issues`);
            console.log(`      └─ Correct amounts stored in 'correctAmount', 'correctFreelancerReceives' fields`);
          }

          console.log(`  🟢 Preserved released status for milestone: ${projectMilestone.title}`);
        }

        escrow.milestones.push(escrowMilestone);
        console.log(
          `  ✅ ${escrowMilestone.status === "released" ? "Preserved" : "Created"} escrow milestone ${index + 1}:`
        );
        console.log(`      ├─ ID: ${milestoneIdStr}`);
        console.log(`      ├─ Title: ${projectMilestone.title}`);
        console.log(`      ├─ Amount: $${escrowMilestone.amount} (${projectMilestone.percentage}%)`);
        console.log(`      ├─ Platform Fee: $${escrowMilestone.platformFee}`);
        console.log(`      ├─ Freelancer Receives: $${escrowMilestone.freelancerReceives}`);
        console.log(`      ├─ Status: ${escrowMilestone.status}`);
        console.log(`      └─ Was in released map: ${releasedMilestones.has(milestoneIdStr) ? "YES ✅" : "NO ❌"}`);

        // Adjust running total - use actual escrow milestone amount (which might be preserved original)
        if (escrowMilestone.status === "released" && releasedMilestones.has(milestoneIdStr)) {
          // For released milestones, subtract the calculated amount and add the actual preserved amount
          runningTotal = runningTotal - milestoneAmount + escrowMilestone.amount;
          console.log(
            `      └─ Adjusted running total for preserved amount: -$${milestoneAmount} +$${escrowMilestone.amount}`
          );
        }
      });

      // CRITICAL FIX: Only adjust for rounding when milestones should total 100%
      const totalPercentages = project.milestones.reduce((sum, m) => sum + m.percentage, 0);
      const shouldTotalEscrow = Math.abs(totalPercentages - 100) < 0.01; // Allow tiny floating point differences

      console.log(`🔧 ROUNDING DECISION:`);
      console.log(`  ├─ Total percentages: ${totalPercentages}%`);
      console.log(`  ├─ Should total escrow: ${shouldTotalEscrow}`);
      console.log(`  ├─ Running total: $${runningTotal}`);
      console.log(`  └─ Total amount: $${totalAmount}`);

      // Adjust last milestone for any rounding differences ONLY if milestones total 100%
      const difference = totalAmount - runningTotal;
      if (difference !== 0 && escrow.milestones.length > 0 && shouldTotalEscrow) {
        const lastMilestone = escrow.milestones[escrow.milestones.length - 1];
        console.log(`🔧 ROUNDING ADJUSTMENT (100% milestones):`);
        console.log(`  ├─ Difference: $${difference}`);
        console.log(`  └─ Adjusting last milestone: ${lastMilestone.title}`);

        lastMilestone.amount += difference;
        lastMilestone.freelancerReceives += difference;
        console.log(`🔧 Adjusted last milestone by $${difference} for rounding`);
      } else if (difference !== 0) {
        console.log(`🔧 NO ROUNDING ADJUSTMENT:`);
        console.log(`  ├─ Difference: $${difference}`);
        console.log(`  └─ Reason: Milestones don't total 100% (${totalPercentages}%)`);
      }

      // Recalculate escrow totals
      console.log(`📊 RECALCULATING ESCROW TOTALS:`);
      const oldReleasedAmount = escrow.releasedAmount;
      const oldAmountToFreelancer = escrow.amountToFreelancer;
      const oldPlatformRevenue = escrow.platformRevenue;

      // CRITICAL DEBUG: Show detailed calculation of released amount
      console.log(`🔍 RELEASED AMOUNT CALCULATION:`);
      const releasedMilestonesForCalc = escrow.milestones.filter((m) => m.status === "released");
      console.log(`  ├─ Released milestones found: ${releasedMilestonesForCalc.length}`);
      releasedMilestonesForCalc.forEach((m, idx) => {
        console.log(`  │   ${idx + 1}. ${m.milestoneId} (${m.title}) - $${m.amount}`);
      });

      escrow.releasedAmount = releasedMilestonesForCalc.reduce((sum, m) => sum + m.amount, 0);

      escrow.amountToFreelancer = escrow.milestones.reduce((sum, m) => sum + m.freelancerReceives, 0);
      escrow.platformRevenue = escrow.milestones.reduce((sum, m) => sum + m.platformFee, 0);

      console.log(`📊 FINAL TOTALS COMPARISON:`);
      console.log(`  ├─ Released Amount: $${oldReleasedAmount} → $${escrow.releasedAmount}`);
      console.log(`  ├─ Amount to Freelancer: $${oldAmountToFreelancer} → $${escrow.amountToFreelancer}`);
      console.log(`  └─ Platform Revenue: $${oldPlatformRevenue} → $${escrow.platformRevenue}`);

      console.log(`💾 Saving escrow with updated milestones...`);
      await escrow.save(session ? { session } : {});
      console.log(`✅ Escrow milestones synchronized successfully`);
      console.log(`📊 Updated totals:`);
      console.log(`  ├─ Total Amount: $${escrow.totalAmount}`);
      console.log(`  ├─ Amount to freelancer: $${escrow.amountToFreelancer}`);
      console.log(`  ├─ Platform revenue: $${escrow.platformRevenue}`);
      console.log(`  ├─ Released amount: $${escrow.releasedAmount}`);
      console.log(`  └─ Total milestones: ${escrow.milestones.length}`);

      console.log(`🔄 ====== ESCROW SYNC END (SYNCED) ======`);
      return true;
    }

    console.log(`✅ No sync needed - escrow already has correct milestone structure`);
    console.log(`🔄 ====== ESCROW SYNC END (NO SYNC NEEDED) ======`);
    return false;
  } catch (error) {
    console.error("❌ Error syncing escrow milestones:", error);
    console.error("❌ Stack trace:", error.stack);
    console.log(`🔄 ====== ESCROW SYNC END (ERROR) ======`);
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

    // Count completed/approved milestones in project
    const approvedProjectMilestones = project.milestones.filter(
      (m) => m.status === "completed" && m.approvalStatus === "approved"
    ).length;
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
