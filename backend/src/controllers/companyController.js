const { validationResult } = require("express-validator");
const User = require("../models/User");
const Profile = require("../models/Profile");

/**
 * @desc    Get company profile
 * @route   GET /api/company/profile
 * @access  Private
 */
exports.getCompanyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    if (user.userType !== "company") {
      return res.status(400).json({
        success: false,
        error: "This endpoint is only available for company users",
      });
    }

    const profile = await Profile.findOne({ user: req.user.id });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          userType: user.userType,
          companyType: user.companyType,
          isVerified: user.isVerified,
          company: user.company,
          createdAt: user.createdAt,
        },
        profile: profile || {},
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * @desc    Update company profile
 * @route   PUT /api/company/profile
 * @access  Private
 */
exports.updateCompanyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    if (user.userType !== "company") {
      return res.status(400).json({
        success: false,
        error: "This endpoint is only available for company users",
      });
    }

    const { name, company } = req.body;

    // Update basic user info
    if (name) user.name = name;

    // Update company information
    if (company) {
      user.company = {
        ...user.company,
        ...company,
      };
    }

    await user.save();

    // Update profile if it exists
    let profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      profile = new Profile({
        user: req.user.id,
        ...req.body.profile,
      });
    } else {
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
          userType: user.userType,
          companyType: user.companyType,
          isVerified: user.isVerified,
          company: user.company,
        },
        profile,
      },
      message: "Company profile updated successfully",
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * @desc    Upload company logo
 * @route   POST /api/company/logo
 * @access  Private
 */
exports.uploadCompanyLogo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    if (user.userType !== "company") {
      return res.status(400).json({
        success: false,
        error: "This endpoint is only available for company users",
      });
    }

    const { logoUrl } = req.body;

    if (!logoUrl) {
      return res.status(400).json({
        success: false,
        error: "Logo URL is required",
      });
    }

    // Update company logo
    user.company.logo = logoUrl;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        logo: user.company.logo,
      },
      message: "Company logo updated successfully",
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * @desc    Upload company document
 * @route   POST /api/company/documents
 * @access  Private
 */
exports.uploadCompanyDocument = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    if (user.userType !== "company") {
      return res.status(400).json({
        success: false,
        error: "This endpoint is only available for company users",
      });
    }

    const { type, url } = req.body;

    if (!type || !url) {
      return res.status(400).json({
        success: false,
        error: "Document type and URL are required",
      });
    }

    // Add document to company documents array
    const document = {
      type,
      url,
      uploadedAt: new Date(),
      status: "pending",
    };

    user.company.documents.push(document);
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        document,
        message: "Document uploaded successfully",
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * @desc    Get company verification status
 * @route   GET /api/company/verification-status
 * @access  Private
 */
exports.getVerificationStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    if (user.userType !== "company") {
      return res.status(400).json({
        success: false,
        error: "This endpoint is only available for company users",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        verificationStatus: user.company?.verificationStatus || "pending",
        documents: user.company?.documents || [],
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * @desc    Get all companies (Admin only)
 * @route   GET /api/company/all
 * @access  Private (Admin)
 */
exports.getAllCompanies = async (req, res) => {
  try {
    const { page = 1, limit = 10, companyType, verificationStatus } = req.query;

    // Build filter
    const filter = { userType: "company" };
    if (companyType) filter.companyType = companyType;
    if (verificationStatus) filter["company.verificationStatus"] = verificationStatus;

    const companies = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        companies,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * @desc    Update company verification status (Admin only)
 * @route   PUT /api/company/:id/verification
 * @access  Private (Admin)
 */
exports.updateVerificationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { verificationStatus, rejectionReason } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, error: "Company not found" });
    }

    if (user.userType !== "company") {
      return res.status(400).json({
        success: false,
        error: "User is not a company",
      });
    }

    user.company.verificationStatus = verificationStatus;

    if (verificationStatus === "verified") {
      user.isVerified = true;
    } else if (verificationStatus === "rejected") {
      user.isVerified = false;
      // Add rejection reason to documents if provided
      if (rejectionReason) {
        user.company.documents.forEach((doc) => {
          if (doc.status === "pending") {
            doc.status = "rejected";
            doc.rejectionReason = rejectionReason;
          }
        });
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          companyType: user.companyType,
          verificationStatus: user.company.verificationStatus,
          isVerified: user.isVerified,
        },
      },
      message: `Company verification status updated to ${verificationStatus}`,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
