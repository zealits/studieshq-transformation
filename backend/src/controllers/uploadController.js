const cloudinary = require("cloudinary").v2;
const { cloudinaryConfig } = require("../config/config");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const User = require("../models/User");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

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

// Ensure milestone deliverables directory exists
ensureDirectoryExists(uploadsDir);
ensureDirectoryExists(milestoneDeliverablesDir);

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

module.exports = {
  upload,
  verificationUpload,
  milestoneUpload,
  uploadProfileImage,
  uploadVerificationDocument,
  uploadMilestoneDeliverable,
  serveFile,
};
