const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const auth = require("../middleware/auth");
const reviewController = require("../controllers/reviewController");

/**
 * @route   POST /api/reviews
 * @desc    Create a new review
 * @access  Private
 */
router.post(
  "/",
  [
    auth,
    [
      check("to", "Recipient is required").not().isEmpty(),
      check("rating", "Rating is required and must be between 1 and 5").isInt({ min: 1, max: 5 }),
      check("text", "Text is required").not().isEmpty(),
    ],
  ],
  reviewController.createReview
);

/**
 * @route   GET /api/reviews/user/:userId
 * @desc    Get all reviews for a user
 * @access  Public
 */
router.get("/user/:userId", reviewController.getUserReviews);

/**
 * @route   GET /api/reviews/project/:projectId
 * @desc    Get all reviews for a project
 * @access  Public
 */
router.get("/project/:projectId", reviewController.getProjectReviews);

/**
 * @route   PUT /api/reviews/:id
 * @desc    Update a review
 * @access  Private
 */
router.put(
  "/:id",
  [
    auth,
    [
      check("rating", "Rating must be between 1 and 5").optional().isInt({ min: 1, max: 5 }),
      check("text", "Text is required when updating a review").optional().not().isEmpty(),
    ],
  ],
  reviewController.updateReview
);

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete a review
 * @access  Private
 */
router.delete("/:id", auth, reviewController.deleteReview);

module.exports = router;
