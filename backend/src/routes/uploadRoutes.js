const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const uploadController = require("../controllers/uploadController");
const fileUpload = require("express-fileupload");

// Middleware for file upload
router.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

// @route   POST /api/upload/profile-image
// @desc    Upload profile image
// @access  Private
router.post("/profile-image", auth, uploadController.uploadProfileImage);

module.exports = router;
