const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const auth = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");

// Import project controller
const projectController = require("../controllers/projectController");

// @route   POST /api/projects
// @desc    Create a new project
// @access  Private (Client only)
router.post(
  "/",
  [
    auth,
    checkRole(["client", "admin", "project_sponsor_company"]),
    [
      check("title", "Title is required").not().isEmpty(),
      check("description", "Description is required").not().isEmpty(),
      check("freelancerId", "Freelancer ID is required").not().isEmpty(),
      check("category", "Category is required").not().isEmpty(),
      check("budget", "Budget is required").isNumeric(),
      check("deadline", "Deadline is required").isISO8601(),
    ],
  ],
  projectController.createProject
);

// @route   GET /api/projects
// @desc    Get all projects for authenticated user
// @access  Private
router.get("/", auth, projectController.getProjects);

// @route   GET /api/projects/admin/all
// @desc    Get all projects for admin dashboard (all statuses)
// @access  Private (Admin only)
router.get("/admin/all", auth, checkRole(["admin"]), projectController.getAllProjectsForAdmin);

// @route   GET /api/projects/:id
// @desc    Get project by ID
// @access  Private
router.get("/:id", auth, projectController.getProject);

// @route   GET /api/projects/:id/debug-auth
// @desc    Debug project authorization (temporary debugging endpoint)
// @access  Private
router.get("/:id/debug-auth", auth, projectController.debugProjectAuth);

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private
router.put(
  "/:id",
  [
    auth,
    [
      check("title", "Title must be a string").optional().isString(),
      check("description", "Description must be a string").optional().isString(),
      check("budget", "Budget must be a number").optional().isNumeric(),
      check("deadline", "Deadline must be a valid date").optional().isISO8601(),
    ],
  ],
  projectController.updateProject
);

// @route   PUT /api/projects/:id/reassign-freelancer
// @desc    Reassign project to different freelancer (Admin only)
// @access  Private (Admin only)
router.put(
  "/:id/reassign-freelancer",
  [auth, checkRole(["admin"]), [check("newFreelancerId", "New freelancer ID is required").not().isEmpty()]],
  projectController.reassignProjectFreelancer
);

// @route   POST /api/projects/:id/milestones
// @desc    Create milestone
// @access  Private
router.post(
  "/:id/milestones",
  [
    auth,
    [
      check("title", "Title is required").not().isEmpty(),
      check("description", "Description is required").not().isEmpty(),
      check("percentage", "Percentage is required and must be between 1 and 100").isInt({ min: 1, max: 100 }),
      check("dueDate", "Due date is required").isISO8601(),
    ],
  ],
  projectController.createMilestone
);

// @route   PUT /api/projects/:id/milestones/:milestoneId
// @desc    Update milestone
// @access  Private
router.put(
  "/:id/milestones/:milestoneId",
  [
    auth,
    [
      check("title", "Title must be a string").optional().isString(),
      check("description", "Description must be a string").optional().isString(),
      check("percentage", "Percentage must be between 1 and 100").optional().isInt({ min: 1, max: 100 }),
      check("dueDate", "Due date must be a valid date").optional().isISO8601(),
    ],
  ],
  projectController.updateMilestone
);

// @route   PUT /api/projects/:id/milestones/:milestoneId/approve
// @desc    Approve or reject milestone
// @access  Private (Admin only)
router.put(
  "/:id/milestones/:milestoneId/approve",
  [
    auth,
    checkRole(["admin"]),
    [
      check("approvalStatus", "Approval status is required").isIn(["approved", "rejected"]),
      check("approvalComment", "Approval comment is required").not().isEmpty(),
    ],
  ],
  projectController.approveMilestone
);

// @route   DELETE /api/projects/:id/milestones/:milestoneId
// @desc    Delete milestone from project
// @access  Private (Client only)
router.delete(
  "/:id/milestones/:milestoneId",
  [auth, checkRole(["client", "admin"])],
  projectController.deleteMilestone
);

// Milestone management routes
router.post("/:projectId/milestones", auth, projectController.createMilestone);
router.put("/:projectId/milestones/:milestoneId", auth, projectController.updateMilestone);
router.delete("/:projectId/milestones/:milestoneId", auth, projectController.deleteMilestone);
router.put("/:projectId/milestones/:milestoneId/approve", auth, projectController.approveMilestone);

// New milestone workflow routes
router.put("/:id/milestones/:milestoneId/start", auth, projectController.startMilestone);
router.put("/:id/milestones/:milestoneId/submit", auth, projectController.submitMilestoneWork);
router.put("/:id/milestones/:milestoneId/review", auth, projectController.reviewMilestoneWork);
router.put("/:id/milestones/:milestoneId/resubmit", auth, projectController.resubmitMilestoneWork);
router.get("/:id/milestones/:milestoneId/attachments", auth, projectController.getMilestoneAttachments);

module.exports = router;
