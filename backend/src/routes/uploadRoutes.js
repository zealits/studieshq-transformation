const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
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
  serveCompanyVerificationDocument,
} = require("../controllers/uploadController");
const resumeParserService = require("../services/resumeParserService");

// @route   POST /api/upload/profile-image
// @desc    Upload profile image (Cloudinary)
// @access  Private
router.post("/profile-image", auth, upload.single("image"), uploadProfileImage);

// @route   POST /api/upload/verification-document
// @desc    Upload verification document (Local Storage)
// @access  Private
router.post(
  "/verification-document",
  auth,
  (req, res, next) => {
    console.log("Verification document upload - Content-Type:", req.headers["content-type"]);
    console.log("Verification document upload - Body:", req.body);
    next();
  },
  verificationUpload.single("document"),
  (err, req, res, next) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({
        success: false,
        message: err.message || "File upload error",
      });
    }
    next();
  },
  uploadVerificationDocument
);

// @route   POST /api/upload/milestone-deliverable
// @desc    Upload milestone deliverable files (Local Storage)
// @access  Private
router.post("/milestone-deliverable", auth, milestoneUpload.array("files", 10), uploadMilestoneDeliverable);

// @route   POST /api/upload/resume
// @desc    Upload resume (Local Storage)
// @access  Private
router.post("/resume", auth, resumeUpload.single("resume"), uploadResume);

// @route   DELETE /api/upload/resume
// @desc    Delete resume (Local Storage)
// @access  Private
router.delete("/resume", auth, deleteResume);

// @route   GET /api/upload/files/milestone-deliverables/:filename
// @desc    Serve milestone deliverable files (Local Storage only)
// @access  Public (files are protected by being stored with unique names)
router.get("/files/milestone-deliverables/:filename", serveFile);

// @route   GET /api/upload/files/resumes/:filename
// @desc    Serve resume files (Local Storage only)
// @access  Public (files are protected by being stored with unique names)
router.get("/files/resumes/:filename", serveResume);

// @route   GET /api/upload/files/company-verification/:companyId/:filename
// @desc    Serve company verification documents (Local Storage only)
// @access  Private (files are protected by company ID)
router.get("/files/company-verification/:companyId/:filename", auth, serveCompanyVerificationDocument);

// @route   GET /api/upload/test-resume-parser
// @desc    Test resume parser API connection
// @access  Private (Admin only)
router.get("/test-resume-parser", auth, async (req, res) => {
  try {
    const result = await resumeParserService.testConnection();
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to test resume parser connection",
      error: error.message,
    });
  }
});

module.exports = router;
