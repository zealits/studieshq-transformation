const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  upload,
  verificationUpload,
  milestoneUpload,
  uploadProfileImage,
  uploadVerificationDocument,
  uploadMilestoneDeliverable,
  serveFile,
} = require("../controllers/uploadController");

// @route   POST /api/upload/profile-image
// @desc    Upload profile image (Cloudinary)
// @access  Private
router.post("/profile-image", auth, upload.single("image"), uploadProfileImage);

// @route   POST /api/upload/verification-document
// @desc    Upload verification document (Cloudinary)
// @access  Private
router.post("/verification-document", auth, verificationUpload.single("document"), uploadVerificationDocument);

// @route   POST /api/upload/milestone-deliverable
// @desc    Upload milestone deliverable files (Local Storage)
// @access  Private
router.post("/milestone-deliverable", auth, milestoneUpload.array("files", 10), uploadMilestoneDeliverable);

// @route   GET /api/upload/files/milestone-deliverables/:filename
// @desc    Serve milestone deliverable files (Local Storage only)
// @access  Public (files are protected by being stored with unique names)
router.get("/files/milestone-deliverables/:filename", serveFile);

module.exports = router;
