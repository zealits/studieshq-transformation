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
    check("userType", "User type must be either individual or company").optional().isIn(["individual", "company"]),
    check("role").custom((value, { req }) => {
      const userType = req.body.userType || "individual";
      if (userType === "individual") {
        if (!value) {
          throw new Error("Role is required for individual users");
        }
        if (!["client", "freelancer", "admin"].includes(value)) {
          throw new Error("Role must be either client or freelancer");
        }
      } else if (userType === "company") {
        if (value) {
          throw new Error("Role should not be provided for company users");
        }
      }
      return true;
    }),
    check("companyType", "Company type must be either freelancer_company or project_sponsor_company")
      .optional()
      .isIn(["freelancer_company", "project_sponsor_company"]),
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

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change password for authenticated users
 * @access  Private
 */
router.put(
  "/change-password",
  auth,
  [
    check("currentPassword", "Current password is required").not().isEmpty(),
    check("newPassword", "Please enter a password with 6 or more characters").isLength({ min: 6 }),
  ],
  authController.changePassword
);

/**
 * @route   GET /api/auth/check-verification/:email
 * @desc    Check user verification status
 * @access  Public
 */
router.get("/check-verification/:email", authController.checkVerificationStatus);

/**
 * @route   GET /api/auth/validate-invitation/:token
 * @desc    Validate invitation token and get invitation details
 * @access  Public
 */
router.get("/validate-invitation/:token", authController.validateInvitation);

/**
 * @route   POST /api/auth/register-invitation
 * @desc    Register user through invitation
 * @access  Public
 */
router.post(
  "/register-invitation",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Please enter a password with 6 or more characters").isLength({ min: 6 }),
    check("invitationToken", "Invitation token is required").not().isEmpty(),
  ],
  authController.registerInvitation
);

module.exports = router;
