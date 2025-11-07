const XLSX = require("xlsx");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const FreelancerInvitation = require("../models/FreelancerInvitation");
const User = require("../models/User");
const Profile = require("../models/Profile");
const emailService = require("../services/emailService");
const resumeParserService = require("../services/resumeParserService");

/**
 * Download Excel template for bulk freelancer invitations
 * @route GET /api/admin/freelancer-invitations/template
 * @access Private (Admin only)
 */
exports.downloadTemplate = async (req, res) => {
  try {
    // Create a sample workbook with headers
    const workbook = XLSX.utils.book_new();

    // Define the headers and sample data with new columns
    const worksheetData = [
      ["Email", "First Name", "Last Name", "Current Address", "Skills Set"],
      ["harry.potter@example.com", "harry", "potter", "123 Main St, New York, NY 10001", "JavaScript, React, Node.js"],
      ["Ron.Weasley@example.com", "Ron", "Weasley", "456 Oak Ave, Los Angeles, CA 90001", "Python, Django, PostgreSQL"],
    ];

    // Create worksheet from the data
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths for better readability
    worksheet["!cols"] = [
      { wch: 30 }, // Email
      { wch: 20 }, // First Name
      { wch: 20 }, // Last Name
      { wch: 40 }, // Current Address
      { wch: 40 }, // Skills Set
    ];

    // Append worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Freelancer Registration");

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Set headers for file download
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=freelancer_registration_template.xlsx");

    // Send the file
    res.send(excelBuffer);
  } catch (error) {
    console.error("Error generating template:", error);
    res.status(500).json({ success: false, message: "Error generating template file" });
  }
};

/**
 * Generate a random temporary password
 */
const generateTemporaryPassword = () => {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

/**
 * Upload and process Excel file for bulk freelancer registration
 * @route POST /api/admin/freelancer-invitations/upload
 * @access Private (Admin only)
 */
exports.uploadAndInvite = async (req, res) => {
  try {
    // Check if file is uploaded
    if (!req.files || !req.files.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const file = req.files.file;

    // Validate file type
    const allowedMimeTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({ success: false, message: "Invalid file type. Please upload an Excel file." });
    }

    // Read the Excel file
    const workbook = XLSX.read(file.data, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return res.status(400).json({ success: false, message: "Excel file is empty" });
    }

    // Generate batch ID for tracking
    const batchId = crypto.randomBytes(8).toString("hex");

    const results = {
      total: jsonData.length,
      successful: 0,
      failed: 0,
      errors: [],
      registrations: [],
    };

    // Process each row
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNumber = i + 2; // +2 because Excel is 1-indexed and has header row

      try {
        // Validate required fields
        const email = row["Email"] || row["email"];
        const firstName = row["First Name"] || row["firstName"] || row["first_name"];
        const lastName = row["Last Name"] || row["lastName"] || row["last_name"];
        const currentAddress = row["Current Address"] || row["currentAddress"] || row["current_address"] || "";
        const skillsSet = row["Skills Set"] || row["skillsSet"] || row["skills_set"] || "";

        if (!email || !firstName || !lastName) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            email: email || "N/A",
            error: "Missing required fields (Email, First Name, or Last Name)",
          });
          continue;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            email: email,
            error: "Invalid email format",
          });
          continue;
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            email: email,
            error: "User with this email already exists",
          });
          continue;
        }

        // Generate temporary password
        const temporaryPassword = generateTemporaryPassword();

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(temporaryPassword, salt);

        // Create user directly
        const newUser = await User.create({
          name: `${firstName} ${lastName}`.trim(),
          email: email.toLowerCase(),
          password: hashedPassword,
          role: "freelancer",
          isVerified: true, // Mark as verified since admin is creating
          isActive: true,
          status: "active",
          firstLogin: true,
          requirePasswordChange: true,
          temporaryPassword: temporaryPassword, // Store for tracking (will be removed after first login)
        });

        // Parse skills from comma-separated string
        const skillsArray = skillsSet
          ? skillsSet
              .split(",")
              .map((skill) => skill.trim())
              .filter((skill) => skill)
          : [];

        // Create profile with address and skills
        const profile = await Profile.create({
          user: newUser._id,
          skills: skillsArray,
          location: currentAddress || "",
          address: {
            line1: currentAddress || "",
          },
        });

        // Register freelancer with resume parser API (non-blocking)
        try {
          const registerResult = await resumeParserService.registerCandidate(newUser, profile);
          if (registerResult.success && registerResult.candidateId) {
            newUser.candidateId = registerResult.candidateId;
            await newUser.save();
            console.log(`Freelancer registered with resume parser API. Candidate ID: ${registerResult.candidateId}`);
          } else {
            console.error("Failed to register freelancer with resume parser API:", registerResult.error);
          }
        } catch (err) {
          console.error("Error registering freelancer with resume parser API:", err.message);
        }

        // Create invitation record for tracking
        // Generate a unique token for direct registrations (not used for email links)
        const trackingToken = crypto.randomBytes(16).toString("hex");

        await FreelancerInvitation.create({
          email: email.toLowerCase(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          status: "registered",
          invitedBy: req.user.id,
          invitationToken: trackingToken, // Use unique token for tracking
          registeredUser: newUser._id,
          registeredAt: new Date(),
          sentAt: new Date(),
          metadata: {
            batchId,
            source: "bulk_registration",
          },
        });

        // Send email with temporary credentials
        try {
          await emailService.sendFreelancerCredentials(
            email.toLowerCase(),
            firstName.trim(),
            lastName.trim(),
            temporaryPassword
          );

          results.successful++;
          results.registrations.push({
            email: email.toLowerCase(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            status: "registered",
            temporaryPassword: temporaryPassword, // Include in response for admin reference
          });
        } catch (emailError) {
          console.error(`Error sending credentials email to ${email}:`, emailError);

          // User is created but email failed - still count as success but note the email error
          results.successful++;
          results.registrations.push({
            email: email.toLowerCase(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            status: "registered_email_failed",
            temporaryPassword: temporaryPassword,
            emailError: emailError.message,
          });
        }
      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error);
        results.failed++;
        results.errors.push({
          row: rowNumber,
          email: row["Email"] || row["email"] || "N/A",
          error: error.message,
        });
      }
    }

    // Return summary
    res.json({
      success: true,
      message: `Processed ${results.total} registrations. ${results.successful} registered successfully, ${results.failed} failed.`,
      data: {
        batchId,
        summary: {
          total: results.total,
          successful: results.successful,
          failed: results.failed,
        },
        registrations: results.registrations,
        errors: results.errors,
      },
    });
  } catch (error) {
    console.error("Error processing bulk registrations:", error);
    res.status(500).json({ success: false, message: "Error processing registrations", error: error.message });
  }
};

/**
 * Get all freelancer invitations
 * @route GET /api/admin/freelancer-invitations
 * @access Private (Admin only)
 */
exports.getAllInvitations = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;

    // Build filter
    let filter = {};
    if (status) {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: "i" } },
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
      ];
    }

    // Get invitations with pagination
    const invitations = await FreelancerInvitation.find(filter)
      .populate("invitedBy", "name email")
      .populate("registeredUser", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await FreelancerInvitation.countDocuments(filter);

    // Get statistics
    const stats = await FreelancerInvitation.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        invitations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
        statistics: stats,
      },
    });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    res.status(500).json({ success: false, message: "Error fetching invitations" });
  }
};

/**
 * Resend invitation email
 * @route POST /api/admin/freelancer-invitations/:id/resend
 * @access Private (Admin only)
 */
exports.resendInvitation = async (req, res) => {
  try {
    const { id } = req.params;

    const invitation = await FreelancerInvitation.findById(id);
    if (!invitation) {
      return res.status(404).json({ success: false, message: "Invitation not found" });
    }

    // Check if invitation is already registered
    if (invitation.status === "registered") {
      return res.status(400).json({ success: false, message: "User has already registered" });
    }

    // Generate new invitation token if expired
    if (invitation.invitationTokenExpire < new Date()) {
      invitation.invitationToken = crypto.randomBytes(32).toString("hex");
      invitation.invitationTokenExpire = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    }

    // Resend email
    try {
      await emailService.sendFreelancerInvitation(
        invitation.email,
        invitation.firstName,
        invitation.lastName,
        invitation.invitationToken
      );

      invitation.status = "sent";
      invitation.sentAt = new Date();
      invitation.errorMessage = null;
      await invitation.save();

      res.json({
        success: true,
        message: "Invitation email resent successfully",
        data: { invitation },
      });
    } catch (emailError) {
      console.error("Error resending invitation email:", emailError);
      invitation.status = "failed";
      invitation.errorMessage = emailError.message;
      await invitation.save();

      res.status(500).json({ success: false, message: "Failed to send invitation email", error: emailError.message });
    }
  } catch (error) {
    console.error("Error resending invitation:", error);
    res.status(500).json({ success: false, message: "Error resending invitation" });
  }
};

/**
 * Delete invitation
 * @route DELETE /api/admin/freelancer-invitations/:id
 * @access Private (Admin only)
 */
exports.deleteInvitation = async (req, res) => {
  try {
    const { id } = req.params;

    const invitation = await FreelancerInvitation.findById(id);
    if (!invitation) {
      return res.status(404).json({ success: false, message: "Invitation not found" });
    }

    // Don't allow deletion of registered invitations
    if (invitation.status === "registered") {
      return res.status(400).json({ success: false, message: "Cannot delete invitation for registered user" });
    }

    await FreelancerInvitation.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Invitation deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting invitation:", error);
    res.status(500).json({ success: false, message: "Error deleting invitation" });
  }
};

module.exports = {
  downloadTemplate: exports.downloadTemplate,
  uploadAndInvite: exports.uploadAndInvite,
  getAllInvitations: exports.getAllInvitations,
  resendInvitation: exports.resendInvitation,
  deleteInvitation: exports.deleteInvitation,
};
