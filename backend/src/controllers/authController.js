const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const Profile = require("../models/Profile");
const config = require("../config/config");
const { sendEmail } = require("../utils/email");
const crypto = require("crypto");
const emailService = require("../services/emailService");

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, email, password, role } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, errors: [{ msg: "User already exists" }] });
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
      role,
      isVerified: false,
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Generate verification token
    const verificationToken = crypto.randomBytes(20).toString("hex");
    user.verificationToken = verificationToken;
    user.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    await user.save();

    // Create empty profile
    const profile = new Profile({
      user: user._id,
      bio: "",
      location: "",
      skills: [],
      social: {},
      // If freelancer, add these fields
      ...(role === "freelancer" && {
        hourlyRate: 0,
        availability: "As Needed",
        education: [],
        experience: [],
      }),
      // If client, add these fields
      ...(role === "client" && {
        company: "",
        companySize: "",
        industry: "",
      }),
    });

    await profile.save();

    // Send verification email
    try {
      await emailService.sendVerificationEmail(email, name, verificationToken);
    } catch (err) {
      console.error("Error sending verification email:", err);
      // Continue with registration process even if email fails
    }

    // Generate JWT
    const payload = {
      user: {
        id: user._id,
        role: user.role,
      },
    };

    jwt.sign(payload, config.jwtSecret, { expiresIn: "7d" }, (err, token) => {
      if (err) throw err;
      res.status(201).json({
        success: true,
        token,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
          },
          message: "Registration successful. Please check your email to verify your account.",
        },
      });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * @desc    Verify user email
 * @route   GET /api/auth/verify-email/:token
 * @access  Public
 */
exports.verifyEmail = async (req, res) => {
  try {
    // Get token from params
    const token = req.params.token;

    // Find user with matching verification token
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, error: "Invalid or expired token" });
    }

    // Activate account
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;

    await user.save();

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user.email, user.name);
    } catch (err) {
      console.error("Error sending welcome email:", err);
    }

    res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now log in.",
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, errors: [{ msg: "Invalid credentials" }] });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, errors: [{ msg: "Invalid credentials" }] });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        errors: [{ msg: "Please verify your email before logging in" }],
        needsVerification: true,
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate JWT
    const payload = {
      user: {
        id: user._id,
        role: user.role,
      },
    };

    jwt.sign(payload, config.jwtSecret, { expiresIn: "7d" }, (err, token) => {
      if (err) throw err;
      res.status(200).json({
        success: true,
        token,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            requirePasswordChange: user.requirePasswordChange,
            firstLogin: user.firstLogin,
            temporaryPassword: user.temporaryPassword,
          },
        },
      });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * @desc    Resend verification email
 * @route   POST /api/auth/resend-verification
 * @access  Public
 */
exports.resendVerification = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({ success: false, error: "No user with that email" });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, error: "Email already verified" });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(20).toString("hex");
    user.verificationToken = verificationToken;
    user.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    await user.save();

    // Send verification email
    await emailService.sendVerificationEmail(user.email, user.name, verificationToken);

    res.status(200).json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    const profile = await Profile.findOne({ user: req.user.id });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          requirePasswordChange: user.requirePasswordChange,
          firstLogin: user.firstLogin,
          temporaryPassword: user.temporaryPassword,
          createdAt: user.createdAt,
          profile: profile || {},
        },
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Update basic user info if provided
    if (req.body.name) user.name = req.body.name;
    if (req.body.email && req.body.email !== user.email) {
      // If email is being changed, require reverification
      user.email = req.body.email;
      user.isVerified = false;

      // Generate new verification token
      const verificationToken = crypto.randomBytes(20).toString("hex");
      user.verificationToken = verificationToken;
      user.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

      // Send verification email
      try {
        await emailService.sendVerificationEmail(user.email, user.name, verificationToken);
      } catch (err) {
        console.error("Error sending verification email:", err);
      }
    }

    await user.save();

    // Update profile if it exists
    let profile = await Profile.findOne({ user: req.user.id });

    if (!profile) {
      // Create profile if it doesn't exist
      profile = new Profile({
        user: req.user.id,
        ...req.body.profile,
      });
    } else {
      // Update existing profile
      if (req.body.profile) {
        Object.keys(req.body.profile).forEach((key) => {
          profile[key] = req.body.profile[key];
        });
      }
    }

    await profile.save();

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          profile,
        },
        message:
          user.email !== req.body.email
            ? "Profile updated. Please verify your new email address."
            : "Profile updated successfully.",
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * @desc    Send password reset email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({ success: false, error: "No user with that email" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hash the token and set to resetPasswordToken field
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Set expiration (1 hour)
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;

    await user.save();

    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail(user.email, user.name, resetToken);

      res.status(200).json({ success: true, message: "Password reset email sent" });
    } catch (err) {
      console.error("Error sending password reset email:", err);

      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return res.status(500).json({ success: false, error: "Email could not be sent" });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * @desc    Reset password
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
exports.resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    // Get hashed token
    const resetPasswordToken = crypto.createHash("sha256").update(req.body.token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, error: "Invalid or expired token" });
    }

    // Set new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * @desc    Change password for authenticated users
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
exports.changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Check if current password is correct
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ success: false, error: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear temporary password flags (for admin-created accounts)
    if (user.requirePasswordChange) {
      user.requirePasswordChange = false;
      user.firstLogin = false;
      user.temporaryPassword = undefined;
    }

    await user.save();

    // Return updated user data
    const updatedUser = await User.findById(req.user.id).select("-password");

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
      data: {
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          isVerified: updatedUser.isVerified,
          requirePasswordChange: updatedUser.requirePasswordChange,
          firstLogin: updatedUser.firstLogin,
        },
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * @desc    Check user verification status
 * @route   GET /api/auth/check-verification/:email
 * @access  Public
 */
exports.checkVerificationStatus = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.status(200).json({
      success: true,
      isVerified: user.isVerified,
      message: user.isVerified ? "Email is verified" : "Email is not verified yet",
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
