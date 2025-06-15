const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const {
  submitContactForm,
  getAllContacts,
  getContactById,
  updateContact,
  deleteContact,
  getContactStats,
} = require("../controllers/contactController");

const auth = require("../middleware/auth");
const adminAuth = require("../middleware/admin");

// Validation rules for contact form
const contactValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 100 })
    .withMessage("Name must not exceed 100 characters"),
  body("email").trim().isEmail().withMessage("Please enter a valid email address").normalizeEmail(),
  body("phone").optional().trim().isLength({ max: 20 }).withMessage("Phone number must not exceed 20 characters"),
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ max: 1000 })
    .withMessage("Message must not exceed 1000 characters"),
];

// Public Routes
// @route   POST /api/contact
// @desc    Submit contact form
// @access  Public
router.post("/", contactValidation, submitContactForm);

// Admin Routes
// @route   GET /api/admin/contacts/stats
// @desc    Get contact statistics
// @access  Private (Admin)
router.get("/admin/stats", auth, adminAuth, getContactStats);

// @route   GET /api/admin/contacts
// @desc    Get all contact submissions
// @access  Private (Admin)
router.get("/admin", auth, adminAuth, getAllContacts);

// @route   GET /api/admin/contacts/:id
// @desc    Get single contact submission
// @access  Private (Admin)
router.get("/admin/:id", auth, adminAuth, getContactById);

// @route   PUT /api/admin/contacts/:id
// @desc    Update contact status and notes
// @access  Private (Admin)
router.put(
  "/admin/:id",
  auth,
  adminAuth,
  [
    body("status")
      .optional()
      .isIn(["new", "in-progress", "resolved"])
      .withMessage("Status must be new, in-progress, or resolved"),
    body("adminNotes")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Admin notes must not exceed 500 characters"),
  ],
  updateContact
);

// @route   DELETE /api/admin/contacts/:id
// @desc    Delete contact submission
// @access  Private (Admin)
router.delete("/admin/:id", auth, adminAuth, deleteContact);

module.exports = router;
