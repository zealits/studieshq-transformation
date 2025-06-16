const { validationResult } = require("express-validator");
const Profile = require("../models/Profile");
const otpService = require("../services/otpService");

/**
 * @desc    Send OTP to phone number
 * @route   POST /api/otp/send-verification
 * @access  Private
 */
exports.sendOTPVerification = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  try {
    const { countryCode, phoneNumber } = req.body;
    const userId = req.user.id;

    console.log("📞 OTP Send Request:", { userId, countryCode, phoneNumber });

    // Check if Twilio is configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_VERIFY_SERVICE_SID) {
      console.error("❌ Twilio credentials missing");
      return res.status(500).json({
        success: false,
        error: "SMS service is not configured. Please contact administrator.",
      });
    }

    // Format phone number to E.164 format
    const formattedPhoneNumber = otpService.formatPhoneNumber(countryCode, phoneNumber);
    console.log("📱 Formatted phone number:", formattedPhoneNumber);

    // Validate phone number format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(formattedPhoneNumber)) {
      return res.status(400).json({
        success: false,
        error: "Invalid phone number format",
      });
    }

    // Check if phone number is already verified by another user
    const existingProfile = await Profile.findOne({
      "phone.number": phoneNumber,
      "phone.countryCode": countryCode,
      "phone.isVerified": true,
      user: { $ne: userId },
    });

    if (existingProfile) {
      return res.status(400).json({
        success: false,
        error: "This phone number is already verified by another user",
      });
    }

    // Send OTP via Twilio
    const otpResult = await otpService.sendOTPVerification(formattedPhoneNumber);

    if (otpResult.success) {
      // Update user's profile with the phone number (but not verified yet)
      await Profile.findOneAndUpdate(
        { user: userId },
        {
          "phone.countryCode": countryCode,
          "phone.number": phoneNumber,
          "phone.isVerified": false,
          "phone.verifiedAt": null,
        },
        { upsert: true, new: true }
      );

      res.status(200).json({
        success: true,
        message: "OTP sent successfully to your phone number",
        data: {
          phoneNumber: formattedPhoneNumber,
          status: otpResult.status,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to send OTP",
      });
    }
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to send OTP verification",
    });
  }
};

/**
 * @desc    Verify OTP code
 * @route   POST /api/otp/verify
 * @access  Private
 */
exports.verifyOTP = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  try {
    const { countryCode, phoneNumber, otpCode } = req.body;
    const userId = req.user.id;

    // Format phone number to E.164 format
    const formattedPhoneNumber = otpService.formatPhoneNumber(countryCode, phoneNumber);

    // Find user's profile
    const profile = await Profile.findOne({ user: userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: "Profile not found",
      });
    }

    // Check if the phone number matches the one in profile
    if (profile.phone.countryCode !== countryCode || profile.phone.number !== phoneNumber) {
      return res.status(400).json({
        success: false,
        error: "Phone number does not match the one for which OTP was sent",
      });
    }

    // Verify OTP with Twilio
    const verificationResult = await otpService.verifyOTP(formattedPhoneNumber, otpCode);

    if (verificationResult.success) {
      // Update profile to mark phone as verified
      profile.phone.isVerified = true;
      profile.phone.verifiedAt = new Date();
      await profile.save();

      res.status(200).json({
        success: true,
        message: "Phone number verified successfully",
        data: {
          phoneNumber: formattedPhoneNumber,
          verifiedAt: profile.phone.verifiedAt,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        error: verificationResult.message || "Invalid or expired OTP code",
      });
    }
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to verify OTP",
    });
  }
};

/**
 * @desc    Get phone verification status
 * @route   GET /api/otp/verification-status
 * @access  Private
 */
exports.getVerificationStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await Profile.findOne({ user: userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: "Profile not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        phone: {
          countryCode: profile.phone.countryCode,
          number: profile.phone.number,
          isVerified: profile.phone.isVerified || false,
          verifiedAt: profile.phone.verifiedAt || null,
        },
      },
    });
  } catch (error) {
    console.error("Get verification status error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get verification status",
    });
  }
};
