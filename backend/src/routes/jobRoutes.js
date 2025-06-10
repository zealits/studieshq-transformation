const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const auth = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");

// Import job controller
const jobController = require("../controllers/jobController");

// @route   POST /api/jobs
// @desc    Create a new job
// @access  Private (Client only)
router.post(
  "/",
  [
    auth,
    checkRole(["client", "admin"]),
    [
      check("title", "Title is required").not().isEmpty(),
      check("description", "Description is required").not().isEmpty(),
      check("category", "Category is required").not().isEmpty(),
      check("skills", "Skills are required").isArray().not().isEmpty(),
      check("budget", "Budget information is required").isObject(),
      check("budget.min", "Minimum budget is required").isNumeric(),
      check("budget.max", "Maximum budget is required").isNumeric(),
      check("budget.budgetType", "Budget type is required").optional().isIn(["milestone", "completion"]),
      check("duration", "Duration is required").isIn([
        "less_than_1_month",
        "1_to_3_months",
        "3_to_6_months",
        "more_than_6_months",
      ]),
      check("deadline", "Deadline is required").isISO8601(),
      check("freelancersNeeded", "Number of freelancers needed is required").isInt({ min: 1 }),
    ],
  ],
  jobController.createJob
);

// @route   GET /api/jobs
// @desc    Get all jobs with optional filters
// @access  Public (limited) / Private (full access)
router.get("/", auth, jobController.getJobs);

// @route   GET /api/jobs/:id
// @desc    Get job by ID
// @access  Public (limited) / Private (full access)
router.get("/:id", auth, jobController.getJob);

// @route   PUT /api/jobs/:id
// @desc    Update job
// @access  Private (Client only, must be job owner)
router.put(
  "/:id",
  [
    auth,
    checkRole(["client", "admin"]),
    [
      check("title", "Title must be a string").optional().isString(),
      check("description", "Description must be a string").optional().isString(),
      check("category", "Category must be a string").optional().isString(),
      check("skills", "Skills must be an array").optional().isArray(),
      check("budget", "Budget must be an object").optional().isObject(),
      check("experience", "Experience must be a valid option").optional().isIn(["entry", "intermediate", "expert"]),
      check("duration", "Duration must be a valid option")
        .optional()
        .isIn(["less_than_1_month", "1_to_3_months", "3_to_6_months", "more_than_6_months"]),
      check("location", "Location must be a valid option").optional().isIn(["remote", "onsite", "hybrid"]),
      check("deadline", "Deadline must be a valid date").optional().isISO8601(),
      check("status", "Status must be a valid status")
        .optional()
        .isIn(["draft", "open", "in_progress", "completed", "cancelled"]),
      check("freelancersNeeded", "Number of freelancers needed must be at least 1").optional().isInt({ min: 1 }),
    ],
  ],
  jobController.updateJob
);

// @route   DELETE /api/jobs/:id
// @desc    Delete job
// @access  Private (Client only, must be job owner)
router.delete("/:id", auth, checkRole(["client", "admin"]), jobController.deleteJob);

// @route   POST /api/jobs/:id/proposals
// @desc    Submit a proposal for a job
// @access  Private (Freelancer only)
router.post(
  "/:id/proposals",
  [
    auth,
    checkRole(["freelancer"]),
    [
      check("coverLetter", "Cover letter is required").not().isEmpty(),
      check("bidPrice", "Bid price is required").isNumeric(),
      check("estimatedDuration", "Estimated duration is required").not().isEmpty(),
    ],
  ],
  jobController.submitProposal
);

// @route   GET /api/jobs/:id/proposals
// @desc    Get all proposals for a job
// @access  Private (Client only, must be job owner)
router.get("/:id/proposals", auth, checkRole(["client", "admin"]), jobController.getProposals);

// @route   PUT /api/jobs/:id/proposals/:proposalId
// @desc    Update proposal status (accept/reject)
// @access  Private (Client only, must be job owner)
router.put(
  "/:id/proposals/:proposalId",
  [
    auth,
    checkRole(["client", "admin"]),
    [check("status", "Status is required and must be valid").isIn(["pending", "shortlisted", "accepted", "rejected"])],
  ],
  jobController.updateProposalStatus
);

// @route   PUT /api/jobs/:id/publish
// @desc    Publish a draft job
// @access  Private (Client only, must be job owner)
router.put("/:id/publish", auth, checkRole(["client", "admin"]), jobController.publishJob);

// @route   GET /api/jobs/admin/all
// @desc    Get all jobs for admin dashboard (all statuses)
// @access  Private (Admin only)
router.get("/admin/all", auth, checkRole(["admin"]), jobController.getAllJobsForAdmin);

// @route   GET /api/jobs/categories/counts
// @desc    Get job counts by category for home page
// @access  Public
router.get("/categories/counts", jobController.getJobCountsByCategory);

module.exports = router;
