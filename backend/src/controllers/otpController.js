const { validationResult } = require("express-validator");
const Profile = require("../models/Profile");
const User = require("../models/User");
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

    // Get user to check if they are a company user
    const user = await User.findById(userId);
    const isCompanyUser = user && user.userType === "company";

    // Check if phone number is already verified by another user
    // Check in Profile model (for regular users)
    const existingProfile = await Profile.findOne({
      "phone.number": phoneNumber,
      "phone.countryCode": countryCode,
      "phone.isVerified": true,
      user: { $ne: userId },
    });

    // Check in User model (for company users)
    const existingCompany = await User.findOne({
      "company.phone.number": phoneNumber,
      "company.phone.countryCode": countryCode,
      "company.phone.isVerified": true,
      _id: { $ne: userId },
    });

    if (existingProfile || existingCompany) {
      return res.status(400).json({
        success: false,
        error: "This phone number is already verified by another user",
      });
    }

    // Send OTP via Twilio
    const otpResult = await otpService.sendOTPVerification(formattedPhoneNumber);

    if (otpResult.success) {
      if (isCompanyUser) {
        // Update company's phone number (but not verified yet)
        user.company.phone = {
          countryCode: countryCode,
          number: phoneNumber,
          isVerified: false,
          verifiedAt: null,
        };
        await user.save();
      } else {
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
      }

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

    // Get user to check if they are a company user
    const user = await User.findById(userId);
    const isCompanyUser = user && user.userType === "company";

    let phoneData = null;

    if (isCompanyUser) {
      // For company users, check phone in User.company.phone
      if (!user.company || !user.company.phone) {
        return res.status(404).json({
          success: false,
          error: "Phone number not found. Please send OTP first.",
        });
      }

      // Check if the phone number matches
      if (user.company.phone.countryCode !== countryCode || user.company.phone.number !== phoneNumber) {
        return res.status(400).json({
          success: false,
          error: "Phone number does not match the one for which OTP was sent",
        });
      }

      phoneData = user.company.phone;
    } else {
      // For regular users, check phone in Profile
      const profile = await Profile.findOne({ user: userId });
      if (!profile || !profile.phone) {
        return res.status(404).json({
          success: false,
          error: "Profile not found. Please send OTP first.",
        });
      }

      // Check if the phone number matches
      if (profile.phone.countryCode !== countryCode || profile.phone.number !== phoneNumber) {
        return res.status(400).json({
          success: false,
          error: "Phone number does not match the one for which OTP was sent",
        });
      }

      phoneData = profile.phone;
    }

    // Verify OTP with Twilio
    const verificationResult = await otpService.verifyOTP(formattedPhoneNumber, otpCode);

    if (verificationResult.success) {
      const verifiedAt = new Date();

      if (isCompanyUser) {
        // Ensure phone object exists before updating
        if (!user.company.phone) {
          user.company.phone = {
            countryCode: countryCode,
            number: phoneNumber,
            isVerified: false,
            verifiedAt: null,
          };
        }
        
        // Update company's phone verification status
        user.company.phone.isVerified = true;
        user.company.phone.verifiedAt = verifiedAt;
        user.company.phone.countryCode = countryCode;
        user.company.phone.number = phoneNumber;
        
        // Mark the company field as modified to ensure it's saved
        user.markModified('company');
        await user.save();

        // Fetch updated user to ensure we return the latest data
        const updatedUser = await User.findById(userId).select("-password");
        
        res.status(200).json({
          success: true,
          message: "Phone number verified successfully",
          data: {
            phoneNumber: formattedPhoneNumber,
            verifiedAt: verifiedAt,
            phone: updatedUser.company?.phone || null,
          },
        });
      } else {
        // Update profile to mark phone as verified
        const profile = await Profile.findOne({ user: userId });
        profile.phone.isVerified = true;
        profile.phone.verifiedAt = verifiedAt;
        await profile.save();

        res.status(200).json({
          success: true,
          message: "Phone number verified successfully",
          data: {
            phoneNumber: formattedPhoneNumber,
            verifiedAt: verifiedAt,
          },
        });
      }
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

    // Get user to check if they are a company user
    const user = await User.findById(userId);
    const isCompanyUser = user && user.userType === "company";

    let phoneData = null;

    if (isCompanyUser) {
      // For company users, get phone from User.company.phone
      if (user.company && user.company.phone) {
        phoneData = {
          countryCode: user.company.phone.countryCode || null,
          number: user.company.phone.number || null,
          isVerified: user.company.phone.isVerified || false,
          verifiedAt: user.company.phone.verifiedAt || null,
        };
      } else {
        phoneData = {
          countryCode: null,
          number: null,
          isVerified: false,
          verifiedAt: null,
        };
      }
    } else {
      // For regular users, get phone from Profile
      const profile = await Profile.findOne({ user: userId });
      if (!profile) {
        return res.status(404).json({
          success: false,
          error: "Profile not found",
        });
      }

      phoneData = {
        countryCode: profile.phone?.countryCode || null,
        number: profile.phone?.number || null,
        isVerified: profile.phone?.isVerified || false,
        verifiedAt: profile.phone?.verifiedAt || null,
      };
    }

    res.status(200).json({
      success: true,
      data: {
        phone: phoneData,
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
