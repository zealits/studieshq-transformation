const jwt = require("jsonwebtoken");
const config = require("../config/config");
const mongoose = require("mongoose");
const User = require("../models/User");

/**
 * Authentication middleware
 * Verifies JWT token in the request header
 */
module.exports = function (req, res, next) {
  // Get token from header
  const token = req.header("x-auth-token");

  // Check if no token
  if (!token) {
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
    return res.status(401).json({
      success: false,
      error: "Token is not valid",
    });
  }
};
