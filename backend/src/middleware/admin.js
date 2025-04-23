/**
 * Middleware to verify user is an admin
 *
 * This middleware should be used after the auth middleware
 * to ensure the authenticated user has admin privileges
 */
module.exports = function (req, res, next) {
  // Check if user exists on request (set by auth middleware)
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authorization required" });
  }

  // Check if user is admin
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied: Admin privileges required" });
  }

  next();
};
