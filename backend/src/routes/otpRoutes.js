const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const otpController = require("../controllers/otpController");
const auth = require("../middleware/auth");

// Validation rules for sending OTP
const sendOTPValidation = [
  body("countryCode")
    .notEmpty()
    .withMessage("Country code is required")
    .matches(/^\+\d{1,4}$/)
    .withMessage("Country code must be in format +XX"),
  body("phoneNumber")
    .notEmpty()
    .withMessage("Phone number is required")
    .isLength({ min: 6, max: 15 })
    .withMessage("Phone number must be between 6 and 15 digits")
    .matches(/^\d+$/)
    .withMessage("Phone number must contain only digits"),
];

// Validation rules for verifying OTP
const verifyOTPValidation = [
  body("countryCode")
    .notEmpty()
    .withMessage("Country code is required")
    .matches(/^\+\d{1,4}$/)
    .withMessage("Country code must be in format +XX"),
  body("phoneNumber")
    .notEmpty()
    .withMessage("Phone number is required")
    .isLength({ min: 6, max: 15 })
    .withMessage("Phone number must be between 6 and 15 digits")
    .matches(/^\d+$/)
    .withMessage("Phone number must contain only digits"),
  body("otpCode")
    .notEmpty()
    .withMessage("OTP code is required")
    .isLength({ min: 4, max: 8 })
    .withMessage("OTP code must be between 4 and 8 digits")
    .matches(/^\d+$/)
    .withMessage("OTP code must contain only digits"),
];

/**
 * @route   POST /api/otp/send-verification
 * @desc    Send OTP verification to phone number
 * @access  Private
 */
router.post("/send-verification", auth, sendOTPValidation, otpController.sendOTPVerification);

/**
 * @route   POST /api/otp/verify
 * @desc    Verify OTP code
 * @access  Private
 */
router.post("/verify", auth, verifyOTPValidation, otpController.verifyOTP);

/**
 * @route   GET /api/otp/verification-status
 * @desc    Get phone verification status
 * @access  Private
 */
router.get("/verification-status", auth, otpController.getVerificationStatus);

module.exports = router;
