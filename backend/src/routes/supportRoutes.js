const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const auth = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");

// Import support controller
const supportController = require("../controllers/supportController");

// Validation rules
const ticketValidation = [
  check("subject", "Subject is required and must be between 5-200 characters")
    .isLength({ min: 5, max: 200 }),
  check("description", "Description is required and must be at least 10 characters")
    .isLength({ min: 10 }),
  check("category", "Please select a valid category")
    .isIn([
      "Technical Issue",
      "Payment Problem", 
      "Account Issue",
      "Project Dispute",
      "General Inquiry",
      "Bug Report",
      "Feature Request",
      "Other"
    ]),
  check("priority", "Priority must be low, medium, high, or urgent")
    .optional()
    .isIn(["low", "medium", "high", "urgent"]),
];

const replyValidation = [
  check("content", "Reply content is required and must be at least 5 characters")
    .isLength({ min: 5 }),
];

const ratingValidation = [
  check("score", "Rating score must be between 1 and 5")
    .isInt({ min: 1, max: 5 }),
  check("feedback", "Feedback must be less than 1000 characters")
    .optional()
    .isLength({ max: 1000 }),
];

const noteValidation = [
  check("content", "Note content is required and must be at least 5 characters")
    .isLength({ min: 5 }),
];

// ================================
// USER ROUTES (Freelancer, Client)
// ================================

// @route   POST /api/support/tickets
// @desc    Create a new support ticket
// @access  Private (Freelancer, Client)
router.post(
  "/tickets",
  [
    auth,
    checkRole(["freelancer", "client"]),
    ...ticketValidation
  ],
  supportController.createTicket
);

// @route   GET /api/support/tickets
// @desc    Get user's tickets
// @access  Private (Freelancer, Client)
router.get(
  "/tickets",
  [auth, checkRole(["freelancer", "client"])],
  supportController.getUserTickets
);

// @route   GET /api/support/tickets/:id
// @desc    Get single ticket with replies
// @access  Private (Freelancer, Client, Admin)
router.get(
  "/tickets/:id",
  [auth, checkRole(["freelancer", "client", "admin"])],
  supportController.getTicket
);

// @route   POST /api/support/tickets/:id/replies
// @desc    Reply to a ticket
// @access  Private (Freelancer, Client, Admin)
router.post(
  "/tickets/:id/replies",
  [
    auth,
    checkRole(["freelancer", "client", "admin"]),
    ...replyValidation
  ],
  supportController.replyToTicket
);

// @route   POST /api/support/tickets/:id/rate
// @desc    Rate a resolved/closed ticket
// @access  Private (Freelancer, Client)
router.post(
  "/tickets/:id/rate",
  [
    auth,
    checkRole(["freelancer", "client"]),
    ...ratingValidation
  ],
  supportController.rateTicket
);

// ================================
// ADMIN ROUTES
// ================================

// @route   GET /api/support/admin/tickets
// @desc    Get all tickets with filtering and pagination
// @access  Private (Admin only)
router.get(
  "/admin/tickets",
  [auth, checkRole(["admin"])],
  supportController.getAllTickets
);

// @route   PUT /api/support/admin/tickets/:id
// @desc    Update ticket (status, priority, assignment, etc.)
// @access  Private (Admin only)
router.put(
  "/admin/tickets/:id",
  [
    auth,
    checkRole(["admin"]),
    check("status", "Invalid status")
      .optional()
      .isIn(["open", "in-progress", "waiting-for-response", "resolved", "closed"]),
    check("priority", "Invalid priority")
      .optional()
      .isIn(["low", "medium", "high", "urgent"]),
  ],
  supportController.updateTicket
);

// @route   POST /api/support/admin/tickets/:id/notes
// @desc    Add internal note to ticket
// @access  Private (Admin only)
router.post(
  "/admin/tickets/:id/notes",
  [
    auth,
    checkRole(["admin"]),
    ...noteValidation
  ],
  supportController.addInternalNote
);

// @route   GET /api/support/admin/analytics
// @desc    Get support analytics and statistics
// @access  Private (Admin only)
router.get(
  "/admin/analytics",
  [auth, checkRole(["admin"])],
  supportController.getAnalytics
);

module.exports = router; 