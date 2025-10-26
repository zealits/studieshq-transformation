const { validationResult } = require("express-validator");
const User = require("../models/User");
const Profile = require("../models/Profile");
const FreelancerInvitation = require("../models/FreelancerInvitation");
const multer = require("multer");
const XLSX = require("xlsx");
const crypto = require("crypto");
const emailService = require("../services/emailService");

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

// Team Management Methods

/**
 * @desc    Get all team members for the company
 * @route   GET /api/company/team-members
 * @access  Private (Company)
 */
exports.getTeamMembers = async (req, res) => {
  try {
    const company = await User.findById(req.user.id);

    if (!company || company.userType !== "company") {
      return res.status(400).json({
        success: false,
        error: "This endpoint is only available for company users",
      });
    }

    // Find all freelancers who belong to this company
    const teamMembers = await User.find({
      userType: "freelancer",
      "companyFreelancer.companyId": company._id,
    }).select("-password");

    // Get additional stats
    const stats = {
      totalMembers: teamMembers.length,
      activeMembers: teamMembers.filter((member) => member.status === "active").length,
      pendingMembers: teamMembers.filter((member) => member.status === "pending").length,
      totalProjects: 0, // This would need to be calculated from projects
      totalRevenue: 0, // This would need to be calculated from payments
    };

    res.status(200).json({
      success: true,
      data: {
        teamMembers,
        stats,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * @desc    Remove a team member from the company
 * @route   DELETE /api/company/team-members/:memberId
 * @access  Private (Company)
 */
exports.removeTeamMember = async (req, res) => {
  try {
    const company = await User.findById(req.user.id);

    if (!company || company.userType !== "company") {
      return res.status(400).json({
        success: false,
        error: "This endpoint is only available for company users",
      });
    }

    const member = await User.findById(req.params.memberId);

    if (!member || member.userType !== "freelancer") {
      return res.status(404).json({
        success: false,
        error: "Team member not found",
      });
    }

    // Check if the member belongs to this company
    if (!member.companyFreelancer || member.companyFreelancer.companyId.toString() !== company._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "This member does not belong to your company",
      });
    }

    // Remove company association
    member.companyFreelancer = undefined;
    member.companyFreelancerName = undefined;
    await member.save();

    res.status(200).json({
      success: true,
      message: "Team member removed successfully",
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * @desc    Update team member role
 * @route   PUT /api/company/team-members/:memberId/role
 * @access  Private (Company)
 */
exports.updateTeamMemberRole = async (req, res) => {
  try {
    const company = await User.findById(req.user.id);

    if (!company || company.userType !== "company") {
      return res.status(400).json({
        success: false,
        error: "This endpoint is only available for company users",
      });
    }

    const member = await User.findById(req.params.memberId);

    if (!member || member.userType !== "freelancer") {
      return res.status(404).json({
        success: false,
        error: "Team member not found",
      });
    }

    // Check if the member belongs to this company
    if (!member.companyFreelancer || member.companyFreelancer.companyId.toString() !== company._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "This member does not belong to your company",
      });
    }

    const { role } = req.body;

    // Update the member's role in company context
    if (!member.companyFreelancer) {
      member.companyFreelancer = {};
    }
    member.companyFreelancer.role = role;

    await member.save();

    res.status(200).json({
      success: true,
      data: {
        member: {
          id: member._id,
          name: member.name,
          email: member.email,
          role: role,
        },
      },
      message: "Team member role updated successfully",
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// Freelancer Invitation Methods

/**
 * @desc    Get all freelancer invitations for the company
 * @route   GET /api/company/freelancer-invitations
 * @access  Private (Company)
 */
exports.getFreelancerInvitations = async (req, res) => {
  try {
    const company = await User.findById(req.user.id);

    if (!company || company.userType !== "company") {
      return res.status(400).json({
        success: false,
        error: "This endpoint is only available for company users",
      });
    }

    const invitations = await FreelancerInvitation.find({
      invitedBy: company._id,
    }).sort({ createdAt: -1 });

    // Calculate stats
    const stats = {
      total: invitations.length,
      sent: invitations.filter((inv) => inv.status === "sent").length,
      registered: invitations.filter((inv) => inv.status === "registered").length,
      pending: invitations.filter((inv) => inv.status === "pending").length,
      failed: invitations.filter((inv) => inv.status === "failed").length,
    };

    res.status(200).json({
      success: true,
      data: {
        invitations,
        stats,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * @desc    Download Excel template for freelancer invitations/addition
 * @route   GET /api/company/freelancer-invitations/template/:type
 * @access  Private (Company)
 */
exports.downloadFreelancerTemplate = async (req, res) => {
  try {
    const company = await User.findById(req.user.id);

    if (!company || company.userType !== "company") {
      return res.status(400).json({
        success: false,
        error: "This endpoint is only available for company users",
      });
    }

    const { type } = req.params;

    let headers, sampleData;

    if (type === "invitation") {
      headers = ["Email", "First Name", "Last Name"];
      sampleData = [
        ["john.doe@example.com", "John", "Doe"],
        ["jane.smith@example.com", "Jane", "Smith"],
      ];
    } else if (type === "addition") {
      headers = ["Email", "First Name", "Last Name", "Current Address", "Skills Set"];
      sampleData = [
        ["john.doe@example.com", "John", "Doe", "123 Main St, City, State", "React, Node.js, JavaScript"],
        ["jane.smith@example.com", "Jane", "Smith", "456 Oak Ave, City, State", "Python, Django, PostgreSQL"],
      ];
    } else {
      return res.status(400).json({
        success: false,
        error: "Invalid template type",
      });
    }

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);

    // Set column widths
    const colWidths = headers.map(() => ({ wch: 20 }));
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Freelancer Data");

    // Generate buffer
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="freelancer_${type}_template.xlsx"`);
    res.send(buffer);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * @desc    Upload Excel file for freelancer invitations or direct addition
 * @route   POST /api/company/freelancer-invitations/upload
 * @access  Private (Company)
 */
exports.uploadFreelancerInvitations = async (req, res) => {
  try {
    const company = await User.findById(req.user.id);

    if (!company || company.userType !== "company") {
      return res.status(400).json({
        success: false,
        error: "This endpoint is only available for company users",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Excel file is required",
      });
    }

    const { type } = req.body;

    if (!type || !["invitation", "addition"].includes(type)) {
      return res.status(400).json({
        success: false,
        error: "Type must be either 'invitation' or 'addition'",
      });
    }

    // Parse Excel file
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (data.length < 2) {
      return res.status(400).json({
        success: false,
        error: "Excel file must contain at least one data row",
      });
    }

    const headers = data[0];
    const rows = data.slice(1);

    const results = {
      totalProcessed: rows.length,
      successful: 0,
      failed: 0,
      successfulUsers: [],
      errors: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        if (type === "invitation") {
          // Handle invitation system
          const email = row[0];
          const firstName = row[1] || "";
          const lastName = row[2] || "";

          if (!email || !email.includes("@")) {
            results.errors.push({
              email: email || "Unknown",
              error: "Invalid email address",
            });
            results.failed++;
            continue;
          }

          // Check if user already exists
          const existingUser = await User.findOne({ email: email.toLowerCase() });
          if (existingUser) {
            results.errors.push({
              email: email,
              error: "User already exists",
            });
            results.failed++;
            continue;
          }

          // Check if invitation already exists
          const existingInvitation = await FreelancerInvitation.findOne({
            email: email.toLowerCase(),
            invitedBy: company._id,
          });

          if (existingInvitation) {
            results.errors.push({
              email: email,
              error: "Invitation already sent",
            });
            results.failed++;
            continue;
          }

          // Create invitation
          const invitationToken = crypto.randomBytes(32).toString("hex");
          const invitation = new FreelancerInvitation({
            email: email.toLowerCase(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            invitedBy: company._id,
            invitationToken,
            invitationTokenExpire: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            metadata: {
              batchId: `batch_${Date.now()}`,
              source: "company_invitation",
              companyName: company.company.businessName,
            },
          });

          await invitation.save();

          // Send invitation email
          try {
            const invitationLink = `${
              process.env.FRONTEND_URL
            }/register?token=${invitationToken}&company=${encodeURIComponent(company.company.businessName)}`;
            await emailService.sendCompanyFreelancerInvitation(company, email, invitationLink);

            invitation.status = "sent";
            invitation.sentAt = new Date();
            await invitation.save();

            results.successfulUsers.push({
              email: email,
              name: firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || email,
            });
            results.successful++;
          } catch (emailError) {
            console.error("Email sending failed:", emailError);
            invitation.status = "failed";
            invitation.errorMessage = emailError.message;
            await invitation.save();

            results.errors.push({
              email: email,
              error: "Failed to send email",
            });
            results.failed++;
          }
        } else if (type === "addition") {
          // Handle direct addition system
          const [email, firstName, lastName, currentAddress, skillsSet] = row;

          if (!email || !email.includes("@")) {
            results.errors.push({
              email: email || "Unknown",
              error: "Invalid email address",
            });
            results.failed++;
            continue;
          }

          if (!firstName || !lastName) {
            results.errors.push({
              email: email,
              error: "First name and last name are required",
            });
            results.failed++;
            continue;
          }

          // Check if user already exists
          const existingUser = await User.findOne({ email: email.toLowerCase() });
          if (existingUser) {
            results.errors.push({
              email: email,
              error: "User already exists",
            });
            results.failed++;
            continue;
          }

          // Generate temporary password
          const temporaryPassword = crypto.randomBytes(8).toString("hex");

          // Create user
          const user = new User({
            name: `${firstName} ${lastName}`,
            email: email.toLowerCase(),
            password: temporaryPassword, // This will be hashed by the pre-save middleware
            role: "freelancer",
            userType: "freelancer",
            isVerified: true, // Company freelancers are automatically verified
            companyFreelancer: {
              companyId: company._id,
              companyName: company.company.businessName,
              role: "member",
              joinedAt: new Date(),
            },
            companyFreelancerName: company.company.businessName,
            requirePasswordChange: true, // Force password change on first login
          });

          await user.save();

          // Create profile
          const profile = new Profile({
            user: user._id,
            bio: "",
            skills: skillsSet ? skillsSet.split(",").map((skill) => skill.trim()) : [],
            location: currentAddress || "",
            isVerified: true,
          });

          await profile.save();

          // Create invitation record for tracking
          const invitation = new FreelancerInvitation({
            email: email.toLowerCase(),
            firstName,
            lastName,
            invitedBy: company._id,
            status: "registered",
            registeredUser: user._id,
            registeredAt: new Date(),
            sentAt: new Date(),
            temporaryPassword,
            metadata: {
              batchId: `batch_${Date.now()}`,
              source: "company_addition",
              companyName: company.company.businessName,
            },
          });

          await invitation.save();

          // Send login credentials email
          try {
            await emailService.sendCompanyFreelancerCredentials(company, user, temporaryPassword);

            results.successfulUsers.push({
              email: email,
              name: `${firstName} ${lastName}`,
              temporaryPassword,
            });
            results.successful++;
          } catch (emailError) {
            console.error("Email sending failed:", emailError);

            results.errors.push({
              email: email,
              error: "Account created but failed to send credentials email",
            });
            results.failed++;
          }
        }
      } catch (rowError) {
        console.error(`Error processing row ${i + 1}:`, rowError);
        results.errors.push({
          email: row[0] || "Unknown",
          error: rowError.message,
        });
        results.failed++;
      }
    }

    res.status(200).json({
      success: true,
      data: results,
      message: `${type === "invitation" ? "Invitations processed" : "Accounts created"} successfully`,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
