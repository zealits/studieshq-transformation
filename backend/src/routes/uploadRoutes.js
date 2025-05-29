const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { upload, uploadProfileImage, uploadVerificationDocument } = require("../controllers/uploadController");

// @route   POST /api/upload/profile-image
// @desc    Upload profile image
// @access  Private
router.post("/profile-image", auth, uploadProfileImage);

// @route   POST /api/upload/verification-document
// @desc    Upload verification document
// @access  Private
router.post("/verification-document", auth, upload.single("document"), uploadVerificationDocument);

module.exports = router;
