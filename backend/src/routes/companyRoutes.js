const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const multer = require("multer");
const companyController = require("../controllers/companyController");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files are allowed"), false);
    }
  },
});

/**
 * @route   GET /api/company/profile
 * @desc    Get company profile
 * @access  Private
 */
router.get("/profile", auth, companyController.getCompanyProfile);

/**
 * @route   PUT /api/company/profile
 * @desc    Update company profile
 * @access  Private
 */
router.put(
  "/profile",
  auth,
  [
    check("name", "Name is required").optional().not().isEmpty(),
    check("company.businessName", "Business name is required").optional().not().isEmpty(),
    check("company.industry", "Industry is required").optional().not().isEmpty(),
  ],
  companyController.updateCompanyProfile
);

/**
 * @route   POST /api/company/logo
 * @desc    Upload company logo
 * @access  Private
 */
router.post(
  "/logo",
  auth,
  [check("logoUrl", "Logo URL is required").not().isEmpty()],
  companyController.uploadCompanyLogo
);

/**
 * @route   POST /api/company/documents
 * @desc    Upload company document
 * @access  Private
 */
router.post(
  "/documents",
  auth,
  [
    check("type", "Document type is required").not().isEmpty(),
    check("url", "Document URL is required").not().isEmpty(),
  ],
  companyController.uploadCompanyDocument
);

/**
 * @route   GET /api/company/verification-status
 * @desc    Get company verification status
 * @access  Private
 */
router.get("/verification-status", auth, companyController.getVerificationStatus);

/**
 * @route   GET /api/company/all
 * @desc    Get all companies (Admin only)
 * @access  Private (Admin)
 */
router.get("/all", auth, admin, companyController.getAllCompanies);

/**
 * @route   PUT /api/company/:id/verification
 * @desc    Update company verification status (Admin only)
 * @access  Private (Admin)
 */
router.put(
  "/:id/verification",
  auth,
  admin,
  [check("verificationStatus", "Verification status is required").isIn(["pending", "verified", "rejected"])],
  companyController.updateVerificationStatus
);

/**
 * @route   PUT /api/company/:id/documents/:documentType/verify
 * @desc    Update company document verification status (Admin only)
 * @access  Private (Admin)
 */
router.put(
  "/:id/documents/:documentType/verify",
  auth,
  admin,
  [check("status", "Status is required").isIn(["pending", "approved", "rejected"])],
  companyController.updateCompanyDocumentVerification
);

/**
 * @route   PUT /api/company/:id/cleanup-documents
 * @desc    Clean up invalid company documents and update verification status (Admin only)
 * @access  Private (Admin)
 */
router.put("/:id/cleanup-documents", auth, admin, companyController.cleanupCompanyDocuments);

// Team Management Routes
/**
 * @route   GET /api/company/team-members
 * @desc    Get all team members for the company
 * @access  Private (Company)
 */
router.get("/team-members", auth, companyController.getTeamMembers);

/**
 * @route   DELETE /api/company/team-members/:memberId
 * @desc    Remove a team member from the company
 * @access  Private (Company)
 */
router.delete("/team-members/:memberId", auth, companyController.removeTeamMember);

/**
 * @route   PUT /api/company/team-members/:memberId/role
 * @desc    Update team member role
 * @access  Private (Company)
 */
router.put(
  "/team-members/:memberId/role",
  auth,
  [check("role", "Role is required").isIn(["member", "manager", "admin"])],
  companyController.updateTeamMemberRole
);

/**
 * @route   GET /api/company/team-members/:memberId/projects
 * @desc    Get freelancer's applied projects (proposals) and ongoing projects
 * @access  Private (Company)
 */
router.get("/team-members/:memberId/projects", auth, companyController.getFreelancerProjects);

// Freelancer Invitation Routes
/**
 * @route   GET /api/company/freelancer-invitations
 * @desc    Get all freelancer invitations for the company
 * @access  Private (Company)
 */
router.get("/freelancer-invitations", auth, companyController.getFreelancerInvitations);

/**
 * @route   GET /api/company/freelancer-invitations/template/:type
 * @desc    Download Excel template for freelancer invitations/addition
 * @access  Private (Company)
 */
router.get("/freelancer-invitations/template/:type", auth, companyController.downloadFreelancerTemplate);

/**
 * @route   POST /api/company/freelancer-invitations/upload
 * @desc    Upload Excel file for freelancer invitations or direct addition
 * @access  Private (Company)
 */
router.post(
  "/freelancer-invitations/upload",
  auth,
  upload.single("file"),
  (err, req, res, next) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({
        success: false,
        error: err.message || "File upload error",
      });
    }
    next();
  },
  companyController.uploadFreelancerInvitations
);

module.exports = router;
