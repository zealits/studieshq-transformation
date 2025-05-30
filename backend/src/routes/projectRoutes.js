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
    checkRole(["client", "admin"]),
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

// @route   GET /api/projects/:id
// @desc    Get project by ID
// @access  Private
router.get("/:id", auth, projectController.getProject);

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

// @route   POST /api/projects/:id/milestones
// @desc    Add milestone to project
// @access  Private (Client only)
router.post(
  "/:id/milestones",
  [
    auth,
    checkRole(["client", "admin"]),
    [
      check("title", "Title is required").not().isEmpty(),
      check("description", "Description is required").not().isEmpty(),
      check("amount", "Amount is required and must be a number").isNumeric(),
      check("dueDate", "Due date is required").isISO8601(),
    ],
  ],
  projectController.addMilestone
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
      check("amount", "Amount must be a number").optional().isNumeric(),
      check("dueDate", "Due date must be a valid date").optional().isISO8601(),
      check("status", "Status must be a valid status")
        .optional()
        .isIn(["pending", "in_progress", "submitted", "revision_requested", "completed"]),
    ],
  ],
  projectController.updateMilestone
);

// @route   DELETE /api/projects/:id/milestones/:milestoneId
// @desc    Delete milestone from project
// @access  Private (Client only)
router.delete(
  "/:id/milestones/:milestoneId",
  [auth, checkRole(["client", "admin"])],
  projectController.deleteMilestone
);

module.exports = router;
