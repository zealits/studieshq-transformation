const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const auth = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");
const profileController = require("../controllers/profileController");

// Placeholder for controller functions
// These would be imported from ../controllers/profileController

// @route   GET /api/profile/me
// @desc    Get current user's profile
// @access  Private
router.get("/me", auth, profileController.getCurrentProfile);

// @route   POST /api/profile
// @desc    Create or update user profile
// @access  Private
router.post(
  "/",
  [auth, [check("skills", "Skills are required").not().isEmpty()]],
  profileController.createOrUpdateProfile
);

// @route   GET /api/profile
// @desc    Get all profiles
// @access  Public
router.get("/", profileController.getAllProfiles);

// @route   GET /api/profile/freelancers
// @desc    Get all freelancer profiles
// @access  Public
router.get("/freelancers", profileController.getAllFreelancers);

// @route   GET /api/profile/user/:user_id
// @desc    Get profile by user ID
// @access  Public
router.get("/user/:user_id", profileController.getProfileByUserId);

// @route   PUT /api/profile/education
// @desc    Add education to profile
// @access  Private
router.put(
  "/education",
  [
    auth,
    [
      check("institution", "Institution is required").not().isEmpty(),
      check("degree", "Degree is required").not().isEmpty(),
      check("fieldOfStudy", "Field of study is required").not().isEmpty(),
      check("from", "From date is required").not().isEmpty().isISO8601(),
    ],
  ],
  profileController.addEducation
);

// @route   DELETE /api/profile/education/:edu_id
// @desc    Delete education from profile
// @access  Private
router.delete("/education/:edu_id", auth, profileController.deleteEducation);

// @route   PUT /api/profile/experience
// @desc    Add experience to profile
// @access  Private
router.put(
  "/experience",
  [
    auth,
    [
      check("title", "Title is required").not().isEmpty(),
      check("company", "Company is required").not().isEmpty(),
      check("from", "From date is required").not().isEmpty().isISO8601(),
    ],
  ],
  profileController.addExperience
);

// @route   DELETE /api/profile/experience/:exp_id
// @desc    Delete experience from profile
// @access  Private
router.delete("/experience/:exp_id", auth, profileController.deleteExperience);

// @route   PUT /api/profile/portfolio
// @desc    Add portfolio item to profile
// @access  Private (Freelancer only)
router.put(
  "/portfolio",
  [
    auth,
    checkRole(["freelancer"]),
    [
      check("title", "Title is required").not().isEmpty(),
      check("description", "Description is required").not().isEmpty(),
      check("imageUrl", "Image URL is required").not().isEmpty(),
    ],
  ],
  profileController.addPortfolioItem
);

// @route   DELETE /api/profile/portfolio/:portfolio_id
// @desc    Delete portfolio item from profile
// @access  Private (Freelancer only)
router.delete("/portfolio/:portfolio_id", auth, checkRole(["freelancer"]), profileController.deletePortfolioItem);

module.exports = router;
