const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");
const userManagementController = require("../controllers/userManagementController");

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with pagination and filters
 * @access  Private/Admin
 */
router.get("/", auth, checkRole("admin"), userManagementController.getAllUsers);

/**
 * @route   PUT /api/admin/users/:userId/verify
 * @desc    Update user verification status
 * @access  Private/Admin
 */
router.put("/:userId/verify", auth, checkRole("admin"), userManagementController.updateUserVerification);

module.exports = router;
