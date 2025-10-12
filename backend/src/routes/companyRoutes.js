const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const companyController = require("../controllers/companyController");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

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

module.exports = router;
