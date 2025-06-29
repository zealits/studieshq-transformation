const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const auth = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");

// Import escrow controller
const escrowController = require("../controllers/escrowController");

// Import debugging utilities
const { debugEscrowFlow, fixMilestoneMatching } = require("../utils/debugEscrowFlow");
const { validatePaymentFlow, fixWalletInconsistencies } = require("../utils/validatePaymentFlow");

// @route   POST /api/escrow/block-budget
// @desc    Block budget for a job posting
// @access  Private (Client only)
router.post(
  "/block-budget",
  [auth, checkRole(["client"]), [check("jobId", "Job ID is required").not().isEmpty()]],
  escrowController.blockJobBudget
);

// @route   POST /api/escrow/create
// @desc    Create escrow when freelancer is hired
// @access  Private (Client only)
router.post(
  "/create",
  [
    auth,
    checkRole(["client"]),
    [
      check("projectId", "Project ID is required").not().isEmpty(),
      check("freelancerId", "Freelancer ID is required").not().isEmpty(),
      check("agreedAmount", "Agreed amount is required").isNumeric(),
    ],
  ],
  escrowController.createEscrow
);

// @route   POST /api/escrow/:projectId/milestones/:milestoneId/release
// @desc    Release milestone payment from escrow
// @access  Private (Client and Admin)
router.post(
  "/:projectId/milestones/:milestoneId/release",
  [auth, checkRole(["client", "admin"])],
  escrowController.releaseMilestonePayment
);

// @route   GET /api/escrow/freelancer/data
// @desc    Get freelancer's escrow and payment data
// @access  Private (Freelancer only)
router.get("/freelancer/data", [auth, checkRole(["freelancer"])], escrowController.getFreelancerEscrowData);

// @route   GET /api/escrow/client/data
// @desc    Get client's escrow and payment data
// @access  Private (Client only)
router.get("/client/data", [auth, checkRole(["client"])], escrowController.getClientEscrowData);

// @route   GET /api/escrow/admin/all
// @desc    Get all escrow data for admin dashboard
// @access  Private (Admin only)
router.get("/admin/all", [auth, checkRole(["admin"])], escrowController.getAllEscrowData);

// @route   GET /api/escrow/platform/revenue
// @desc    Get platform revenue statistics
// @access  Private (Admin only)
router.get("/platform/revenue", [auth, checkRole(["admin"])], escrowController.getPlatformRevenue);

// @route   GET /api/escrow/:projectId
// @desc    Get escrow details for a project
// @access  Private
router.get("/:projectId", auth, escrowController.getEscrowDetails);

// @route   GET /api/escrow/debug
// @desc    Debug escrow data for current user
// @access  Private
router.get("/debug", auth, escrowController.debugEscrowData);

// @route   POST /api/escrow/test/excess-refund
// @desc    Test excess refund calculation
// @access  Private
router.post("/test/excess-refund", auth, escrowController.testExcessRefund);

// @route   POST /api/escrow/fix/existing
// @desc    Fix existing escrows that have no milestones
// @access  Private (Admin recommended)
router.post("/fix/existing", auth, escrowController.fixExistingEscrows);

// NEW DEBUGGING ROUTES
// @route   GET /api/escrow/debug/flow
// @desc    Run comprehensive escrow flow debugging
// @access  Private (Admin only)
router.get("/debug/flow", [auth, checkRole(["admin"])], async (req, res) => {
  try {
    console.log("🔍 Starting Escrow Flow Debug - Requested by:", req.user.email);

    // Capture console output
    const originalLog = console.log;
    const logs = [];
    console.log = (...args) => {
      logs.push(args.join(" "));
      originalLog(...args);
    };

    await debugEscrowFlow();

    // Restore console.log
    console.log = originalLog;

    res.json({
      success: true,
      message: "Escrow flow debugging completed",
      logs: logs,
    });
  } catch (error) {
    console.error("Error in escrow flow debugging:", error);
    res.status(500).json({
      success: false,
      message: "Error running escrow flow debug",
      error: error.message,
    });
  }
});

// @route   POST /api/escrow/fix/milestones
// @desc    Fix milestone matching issues
// @access  Private (Admin only)
router.post("/fix/milestones", [auth, checkRole(["admin"])], async (req, res) => {
  try {
    console.log("🔧 Starting Milestone Fix - Requested by:", req.user.email);

    // Capture console output
    const originalLog = console.log;
    const logs = [];
    console.log = (...args) => {
      logs.push(args.join(" "));
      originalLog(...args);
    };

    await fixMilestoneMatching();

    // Restore console.log
    console.log = originalLog;

    res.json({
      success: true,
      message: "Milestone matching issues fixed",
      logs: logs,
    });
  } catch (error) {
    console.error("Error fixing milestone matching:", error);
    res.status(500).json({
      success: false,
      message: "Error fixing milestone matching",
      error: error.message,
    });
  }
});

// @route   GET /api/escrow/validate/payments
// @desc    Validate payment flow and fix issues
// @access  Private (Admin only)
router.get("/validate/payments", [auth, checkRole(["admin"])], async (req, res) => {
  try {
    console.log("🔍 Starting Payment Flow Validation - Requested by:", req.user.email);

    // Capture console output
    const originalLog = console.log;
    const logs = [];
    console.log = (...args) => {
      logs.push(args.join(" "));
      originalLog(...args);
    };

    const result = await validatePaymentFlow();

    // Restore console.log
    console.log = originalLog;

    res.json({
      success: true,
      message: "Payment flow validation completed",
      data: result,
      logs: logs,
    });
  } catch (error) {
    console.error("Error validating payment flow:", error);
    res.status(500).json({
      success: false,
      message: "Error validating payment flow",
      error: error.message,
    });
  }
});

// @route   POST /api/escrow/fix/wallets
// @desc    Fix wallet inconsistencies
// @access  Private (Admin only)
router.post("/fix/wallets", [auth, checkRole(["admin"])], async (req, res) => {
  try {
    console.log("🔧 Starting Wallet Fix - Requested by:", req.user.email);

    // Capture console output
    const originalLog = console.log;
    const logs = [];
    console.log = (...args) => {
      logs.push(args.join(" "));
      originalLog(...args);
    };

    const fixed = await fixWalletInconsistencies();

    // Restore console.log
    console.log = originalLog;

    res.json({
      success: true,
      message: `Fixed ${fixed} wallet inconsistencies`,
      data: { walletsFixed: fixed },
      logs: logs,
    });
  } catch (error) {
    console.error("Error fixing wallet inconsistencies:", error);
    res.status(500).json({
      success: false,
      message: "Error fixing wallet inconsistencies",
      error: error.message,
    });
  }
});

// @route   POST /api/escrow/sync/:projectId
// @desc    Sync escrow milestones with project milestones
// @access  Private (Admin only)
router.post("/sync/:projectId", [auth, checkRole(["admin"])], async (req, res) => {
  try {
    const { syncEscrowMilestones } = require("../utils/escrowSync");
    console.log("🔄 Starting Escrow Milestone Sync - Requested by:", req.user.email);
    console.log("  ├─ Project ID:", req.params.projectId);

    // Capture console output
    const originalLog = console.log;
    const logs = [];
    console.log = (...args) => {
      logs.push(args.join(" "));
      originalLog(...args);
    };

    const result = await syncEscrowMilestones(req.params.projectId);

    // Restore console.log
    console.log = originalLog;

    res.json({
      success: true,
      synced: result,
      message: result ? "Escrow milestones synchronized successfully" : "No synchronization needed",
      logs: logs,
    });
  } catch (error) {
    console.error("Error syncing escrow milestones:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

module.exports = router;
