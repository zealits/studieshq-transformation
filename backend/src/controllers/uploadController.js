const cloudinary = require("cloudinary").v2;
const { cloudinaryConfig } = require("../config/config");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const User = require("../models/User");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const resumeParserService = require("../services/resumeParserService");

// Configure Cloudinary
cloudinary.config(cloudinaryConfig);

// Cloudinary storage for profile images
const profileImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "profile_images",
    allowed_formats: ["jpg", "jpeg", "png"],
    resource_type: "image",
  },
});

// Cloudinary storage for verification documents
const verificationStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "verification_documents",
    allowed_formats: ["jpg", "jpeg", "png", "pdf"],
    resource_type: "auto",
  },
});

// LOCAL STORAGE for milestone deliverables only
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Create upload directory for milestone deliverables
const uploadsDir = path.join(__dirname, "../uploads");
const milestoneDeliverablesDir = path.join(uploadsDir, "milestone-deliverables");
const resumesDir = path.join(uploadsDir, "resumes");

// Ensure milestone deliverables directory exists
ensureDirectoryExists(uploadsDir);
ensureDirectoryExists(milestoneDeliverablesDir);
ensureDirectoryExists(resumesDir);

// Local storage for milestone deliverables
const milestoneStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, milestoneDeliverablesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    cb(null, `milestone-${req.user.id}-${uniqueSuffix}${fileExtension}`);
  },
});

// Local storage for resumes
const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, resumesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    cb(null, `resume-${req.user.id}-${uniqueSuffix}${fileExtension}`);
  },
});

// Configure multer upload for profile images (Cloudinary)
const upload = multer({
  storage: profileImageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only specific file types
    const allowedTypes = ["image/jpeg", "image/png"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG files are allowed."), false);
    }
  },
});

// Configure multer upload for verification documents (Cloudinary)
const verificationUpload = multer({
  storage: verificationStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log("Multer fileFilter - file:", file);
    // Accept only specific file types
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
      console.log("File type accepted:", file.mimetype);
      cb(null, true);
    } else {
      console.log("File type rejected:", file.mimetype);
      cb(new Error("Invalid file type. Only JPEG, PNG and PDF files are allowed."), false);
    }
  },
});

// Configure multer upload for milestone deliverables (Local Storage)
const milestoneUpload = multer({
  storage: milestoneStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for deliverables
  },
  fileFilter: (req, file, cb) => {
    // Accept deliverable file types
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/zip",
      "application/x-rar-compressed",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Please upload valid deliverable files."), false);
    }
  },
});

// Configure multer upload for resumes (Local Storage)
const resumeUpload = multer({
  storage: resumeStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for resumes
  },
  fileFilter: (req, file, cb) => {
    // Accept resume file types
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed for resumes."), false);
    }
  },
});

/**
 * @desc    Upload profile image (Cloudinary)
 * @route   POST /api/upload/profile-image
 * @access  Private
 */
const uploadProfileImage = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    // Check if file is provided
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }

    // Update user's avatar in database with Cloudinary URL
    const user = await User.findByIdAndUpdate(req.user.id, { avatar: req.file.path }, { new: true }).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      data: {
        user,
        imageUrl: req.file.path,
      },
    });
  } catch (err) {
    console.error("Error in uploadProfileImage:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Upload verification document (Cloudinary)
 * @route   POST /api/upload/verification-document
 * @access  Private
 */
const uploadVerificationDocument = async (req, res) => {
  try {
    console.log("Upload verification document - req.file:", req.file);
    console.log("Upload verification document - req.body:", req.body);
    console.log("Upload verification document - req.files:", req.files);

    if (!req.file) {
      console.log("No file found in req.file");
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Return the Cloudinary URL and document details
    res.status(200).json({
      success: true,
      data: {
        documentUrl: req.file.path,
        documentType: req.body.documentType,
      },
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading document",
      error: error.message,
    });
  }
};

/**
 * @desc    Upload milestone deliverable files (Local Storage)
 * @route   POST /api/upload/milestone-deliverable
 * @access  Private
 */
const uploadMilestoneDeliverable = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    // Return the uploaded files information with local URLs
    const uploadedFiles = req.files.map((file) => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/api/upload/files/milestone-deliverables/${file.filename}`,
      uploadedAt: new Date(),
    }));

    res.status(200).json({
      success: true,
      data: {
        files: uploadedFiles,
      },
    });
  } catch (error) {
    console.error("Error uploading milestone deliverable:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading files",
      error: error.message,
    });
  }
};

/**
 * @desc    Upload resume (Local Storage) and parse it
 * @route   POST /api/upload/resume
 * @access  Private
 */
const uploadResume = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    // Check if file is provided
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No resume file provided" });
    }

    // Prepare resume data
    const resumeData = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date(),
    };

    // Update user's resume in database first (without parsed data)
    const user = await User.findByIdAndUpdate(req.user.id, { resume: resumeData }, { new: true }).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Send immediate response to user
    res.json({
      success: true,
      data: {
        user,
        resume: resumeData,
        parsedData: null, // Will be updated later
        downloadUrl: `/api/upload/files/resumes/${req.file.filename}`,
      },
    });

    // Parse the resume asynchronously in the background
    setImmediate(async () => {
      try {
        console.log("Starting background resume parsing...");
        const filePath = path.join(resumesDir, req.file.filename);

        // Check if file still exists
        if (!fs.existsSync(filePath)) {
          console.error("Resume file not found for parsing:", filePath);
          return;
        }

        // Read the file from disk
        const fileBuffer = fs.readFileSync(filePath);

        const parseResult = await resumeParserService.parseResume(fileBuffer, req.file.originalname, req.file.mimetype);

        if (parseResult.success) {
          console.log("Background resume parsing successful:", parseResult.filename);

          // Update user with parsed data
          await User.findByIdAndUpdate(req.user.id, {
            parsedResumeData: parseResult.parsedData,
            resumeParsedAt: new Date(),
          });

          console.log("User profile updated with parsed resume data");
        } else {
          console.warn("Background resume parsing failed:", parseResult.error);
        }
      } catch (parseError) {
        console.error("Background resume parsing error:", parseError.message);
      }
    });
  } catch (err) {
    console.error("Error in uploadResume:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Serve milestone deliverable files (Local Storage only)
 * @route   GET /api/upload/files/milestone-deliverables/:filename
 * @access  Public (files are protected by being stored with unique names)
 */
const serveFile = async (req, res) => {
  try {
    const { filename } = req.params;

    const filePath = path.join(milestoneDeliverablesDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    // Serve the file
    res.sendFile(filePath);
  } catch (error) {
    console.error("Error serving file:", error);
    res.status(500).json({ success: false, message: "Error serving file" });
  }
};

/**
 * @desc    Serve resume files (Local Storage only)
 * @route   GET /api/upload/files/resumes/:filename
 * @access  Public (files are protected by being stored with unique names)
 */
const serveResume = async (req, res) => {
  try {
    const { filename } = req.params;

    const filePath = path.join(resumesDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    // Serve the file
    res.sendFile(filePath);
  } catch (error) {
    console.error("Error serving resume:", error);
    res.status(500).json({ success: false, message: "Error serving resume" });
  }
};

/**
 * @desc    Delete resume (Local Storage) and remove from user profile
 * @route   DELETE /api/upload/resume
 * @access  Private
 */
const deleteResume = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    // Get user's current resume data
    const user = await User.findById(req.user.id).select("resume");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.resume || !user.resume.filename) {
      return res.status(404).json({ success: false, message: "No resume found to delete" });
    }

    // Delete the physical file
    const filePath = path.join(resumesDir, user.resume.filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log("Resume file deleted:", user.resume.filename);
      } catch (fileError) {
        console.warn("Failed to delete resume file:", fileError.message);
        // Continue with database cleanup even if file deletion fails
      }
    }

    // Remove resume data from user profile
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        $unset: {
          resume: 1,
          parsedResumeData: 1,
          resumeParsedAt: 1,
        },
      },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "Failed to update user profile" });
    }

    res.json({
      success: true,
      message: "Resume deleted successfully",
      data: {
        user: updatedUser,
      },
    });
  } catch (err) {
    console.error("Error in deleteResume:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  upload,
  verificationUpload,
  milestoneUpload,
  resumeUpload,
  uploadProfileImage,
  uploadVerificationDocument,
  uploadMilestoneDeliverable,
  uploadResume,
  deleteResume,
  serveFile,
  serveResume,
};
