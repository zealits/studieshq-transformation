const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const linkedinController = require("../controllers/linkedinController");

// Test route to verify router is working
router.get("/test", (req, res) => {
  console.log("✅ LinkedIn test route hit!");
  res.json({ success: true, message: "LinkedIn routes are working!" });
});

// @route   GET /api/linkedin/auth
// @desc    Initiate LinkedIn OAuth flow
// @access  Private
router.get("/auth", auth, linkedinController.initiateLinkedInAuth);

// @route   GET /api/linkedin/callback
// @desc    Handle LinkedIn OAuth callback
// @access  Public (LinkedIn redirects here without auth token)
router.get("/callback", linkedinController.handleLinkedInCallback);

// @route   GET /api/linkedin/status
// @desc    Get LinkedIn verification status
// @access  Private
router.get("/status", auth, linkedinController.getLinkedInStatus);

// @route   DELETE /api/linkedin/disconnect
// @desc    Disconnect LinkedIn account
// @access  Private
router.delete("/disconnect", auth, linkedinController.disconnectLinkedIn);

module.exports = router;

