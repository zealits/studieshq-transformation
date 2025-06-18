const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const auth = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");

// Import admin controller
const adminController = require("../controllers/adminController");
const escrowController = require("../controllers/escrowController");

// @route   POST /api/admin/projects/:projectId/milestones
// @desc    Create milestone for a project
// @access  Private (Admin only)
router.post(
  "/projects/:projectId/milestones",
  [
    auth,
    checkRole(["admin"]),
    [
      check("title", "Title is required").not().isEmpty(),
      check("description", "Description is required").not().isEmpty(),
      check("percentage", "Percentage is required").isInt({ min: 1, max: 100 }),
      check("amount", "Amount is required").isNumeric(),
      check("dueDate", "Due date is required").isISO8601(),
    ],
  ],
  adminController.createMilestone
);

// @route   GET /api/admin/projects
// @desc    Get all projects with escrow details
// @access  Private (Admin only)
router.get("/projects", [auth, checkRole(["admin"])], adminController.getProjectsWithEscrow);

// @route   GET /api/admin/projects/:projectId/milestones/:milestoneId
// @desc    Get milestone details for admin review
// @access  Private (Admin only)
router.get(
  "/projects/:projectId/milestones/:milestoneId",
  [auth, checkRole(["admin"])],
  adminController.getMilestoneDetails
);

// @route   POST /api/admin/projects/:projectId/milestones/:milestoneId/release
// @desc    Release milestone payment from escrow
// @access  Private (Admin only)
router.post(
  "/projects/:projectId/milestones/:milestoneId/release",
  [auth, checkRole(["admin"])],
  escrowController.releaseMilestonePayment
);

// @route   PUT /api/admin/settings
// @desc    Update platform settings
// @access  Private (Admin only)
router.put("/settings", [auth, checkRole(["admin"])], adminController.updatePlatformSettings);

// @route   GET /api/admin/settings
// @desc    Get platform settings
// @access  Private (Admin only)
router.get("/settings", [auth, checkRole(["admin"])], adminController.getPlatformSettings);

// @route   GET /api/admin/dashboard/stats
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get("/dashboard/stats", [auth, checkRole(["admin"])], adminController.getDashboardStats);

// @route   GET /api/admin/platform/revenue
// @desc    Get platform revenue statistics
// @access  Private (Admin only)
router.get("/platform/revenue", [auth, checkRole(["admin"])], escrowController.getPlatformRevenue);

module.exports = router;
