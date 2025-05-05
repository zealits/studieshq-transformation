const jwt = require("jsonwebtoken");
const config = require("../config/config");
const mongoose = require("mongoose");
const User = require("../models/User");

/**
 * Authentication middleware
 * Verifies JWT token in the request header
 * For GET requests, allows access but doesn't populate req.user if no token
 */
module.exports = function (req, res, next) {
  // Get token from header
  const token = req.header("x-auth-token");

  // For GET requests, we can be more lenient and just set req.user to null
  // This allows public routes to still work but with limited access
  if (!token) {
    if (req.method === "GET") {
      console.log("No auth token provided for GET request, proceeding with public access");
      req.user = null;
      return next();
    }

    // For non-GET requests, require authentication
    return res.status(401).json({
      success: false,
      error: "No token, authorization denied",
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Add user from payload to request
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error("Invalid token:", err.message);

    // For GET requests, proceed without authentication
    if (req.method === "GET") {
      console.log("Invalid token for GET request, proceeding with public access");
      req.user = null;
      return next();
    }

    return res.status(401).json({
      success: false,
      error: "Token is not valid",
    });
  }
};
