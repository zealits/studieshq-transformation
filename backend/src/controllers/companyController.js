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
      // Handle documents separately to maintain proper structure
      const { documents, ...otherCompanyData } = company;

      user.company = {
        ...user.company,
        ...otherCompanyData,
      };

      // Handle document updates
      if (documents) {
        // Update existing documents or add new ones
        if (documents.businessLicense && documents.businessLicense.url) {
          const existingDocIndex = user.company.documents.findIndex((doc) => doc.type === "business_license");
          const documentData = {
            type: "business_license",
            url: documents.businessLicense.url,
            status: documents.businessLicense.status || "pending",
            uploadedAt: new Date(),
          };

          if (existingDocIndex >= 0) {
            user.company.documents[existingDocIndex] = documentData;
          } else {
            user.company.documents.push(documentData);
          }
        }

        if (documents.taxCertificate && documents.taxCertificate.url) {
          const existingDocIndex = user.company.documents.findIndex((doc) => doc.type === "tax_certificate");
          const documentData = {
            type: "tax_certificate",
            url: documents.taxCertificate.url,
            status: documents.taxCertificate.status || "pending",
            uploadedAt: new Date(),
          };

          if (existingDocIndex >= 0) {
            user.company.documents[existingDocIndex] = documentData;
          } else {
            user.company.documents.push(documentData);
          }
        }
      }
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

/**
 * @desc    Update company document verification status (Admin only)
 * @route   PUT /api/company/:id/documents/:documentType/verify
 * @access  Private (Admin)
 */
exports.updateCompanyDocumentVerification = async (req, res) => {
  try {
    const { id, documentType } = req.params;
    const { status, rejectionReason } = req.body;

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

    // Find the document by type
    const documentIndex = user.company.documents.findIndex((doc) => doc.type === documentType);

    if (documentIndex === -1) {
      return res.status(404).json({ success: false, error: "Document not found" });
    }

    // Update the document status
    user.company.documents[documentIndex].status = status;
    user.company.documents[documentIndex].verifiedAt = status === "approved" ? new Date() : null;
    user.company.documents[documentIndex].rejectionReason = status === "rejected" ? rejectionReason : null;

    // Check if all documents are approved and update overall verification status
    // Filter out documents with missing or invalid types
    const validDocuments = user.company.documents.filter((doc) => doc.type && doc.type.trim() !== "");
    const allDocumentsApproved = validDocuments.every((doc) => doc.status === "approved");
    const hasRejectedDocuments = validDocuments.some((doc) => doc.status === "rejected");

    console.log(`Company ${id} verification check:`, {
      totalDocuments: user.company.documents.length,
      validDocuments: validDocuments.length,
      allApproved: allDocumentsApproved,
      hasRejected: hasRejectedDocuments,
      documentStatuses: validDocuments.map((doc) => ({ type: doc.type, status: doc.status })),
    });

    if (allDocumentsApproved && validDocuments.length > 0) {
      user.company.verificationStatus = "verified";
      user.isVerified = true;
    } else if (hasRejectedDocuments) {
      user.company.verificationStatus = "rejected";
      user.isVerified = false;
    } else {
      // If some documents are still pending, keep verification as pending
      user.company.verificationStatus = "pending";
      user.isVerified = false;
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        document: user.company.documents[documentIndex],
        verificationStatus: user.company.verificationStatus,
        isVerified: user.isVerified,
      },
      message: `Document ${status} successfully`,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * @desc    Clean up invalid company documents and update verification status (Admin only)
 * @route   PUT /api/company/:id/cleanup-documents
 * @access  Private (Admin)
 */
exports.cleanupCompanyDocuments = async (req, res) => {
  try {
    const { id } = req.params;

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

    // Remove documents with missing or invalid types
    const originalCount = user.company.documents.length;
    user.company.documents = user.company.documents.filter((doc) => doc.type && doc.type.trim() !== "");
    const removedCount = originalCount - user.company.documents.length;

    // Recalculate verification status based on remaining valid documents
    const validDocuments = user.company.documents;
    const allDocumentsApproved = validDocuments.every((doc) => doc.status === "approved");
    const hasRejectedDocuments = validDocuments.some((doc) => doc.status === "rejected");

    console.log(`Company ${id} cleanup:`, {
      originalDocuments: originalCount,
      removedDocuments: removedCount,
      remainingDocuments: validDocuments.length,
      allApproved: allDocumentsApproved,
      hasRejected: hasRejectedDocuments,
      documentStatuses: validDocuments.map((doc) => ({ type: doc.type, status: doc.status })),
    });

    if (allDocumentsApproved && validDocuments.length > 0) {
      user.company.verificationStatus = "verified";
      user.isVerified = true;
    } else if (hasRejectedDocuments) {
      user.company.verificationStatus = "rejected";
      user.isVerified = false;
    } else {
      user.company.verificationStatus = "pending";
      user.isVerified = false;
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        removedDocuments: removedCount,
        remainingDocuments: validDocuments.length,
        verificationStatus: user.company.verificationStatus,
        isVerified: user.isVerified,
        documents: validDocuments,
      },
      message: `Cleaned up ${removedCount} invalid documents. Verification status updated.`,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
