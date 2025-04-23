const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const authController = require("../controllers/authController");
const auth = require("../middleware/auth");

/**
 * @route   POST /api/auth/register
 * @desc    Register user
 * @access  Public
 */
router.post(
  "/register",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Please enter a password with 6 or more characters").isLength({ min: 6 }),
    check("role", "Role must be either client or freelancer").isIn(["client", "freelancer"]),
  ],
  authController.register
);

/**
 * @route   GET /api/auth/verify-email/:token
 * @desc    Verify user email
 * @access  Public
 */
router.get("/verify-email/:token", authController.verifyEmail);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend verification email
 * @access  Public
 */
router.post(
  "/resend-verification",
  [check("email", "Please include a valid email").isEmail()],
  authController.resendVerification
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post(
  "/login",
  [check("email", "Please include a valid email").isEmail(), check("password", "Password is required").exists()],
  authController.login
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get("/me", auth, authController.getMe);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put("/profile", auth, authController.updateProfile);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post(
  "/forgot-password",
  [check("email", "Please include a valid email").isEmail()],
  authController.forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password
 * @access  Public
 */
router.post(
  "/reset-password",
  [
    check("token", "Token is required").not().isEmpty(),
    check("password", "Please enter a password with 6 or more characters").isLength({ min: 6 }),
  ],
  authController.resetPassword
);

module.exports = router;
