const cloudinary = require("cloudinary").v2;
const { cloudinaryConfig } = require("../config/config");
const User = require("../models/User");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Configure Cloudinary
cloudinary.config(cloudinaryConfig);

// Configure storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "verification_documents",
    allowed_formats: ["jpg", "jpeg", "png", "pdf"],
    resource_type: "auto",
  },
});

// Configure multer upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only specific file types
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG and PDF files are allowed."), false);
    }
  },
});

/**
 * @desc    Upload profile image
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

    // Update user's avatar in database
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
 * @desc    Upload verification document
 * @route   POST /api/upload/verification-document
 * @access  Private
 */
const uploadVerificationDocument = async (req, res) => {
  try {
    if (!req.file) {
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

module.exports = {
  upload,
  uploadProfileImage,
  uploadVerificationDocument,
};
