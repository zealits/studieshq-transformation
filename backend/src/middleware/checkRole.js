/**
 * Role-based access control middleware
 *
 * This middleware should be used after the auth middleware to check
 * if the authenticated user has one of the allowed roles
 *
 * @param {Array} roles - Array of allowed roles
 * @returns {Function} - Express middleware
 */
module.exports = function (roles) {
  return function (req, res, next) {
    // Check if user exists on request (set by auth middleware)
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authorization required" });
    }

    // Check if user role is included in the allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: ${roles.join(" or ")} role required`,
      });
    }

    next();
  };
};
