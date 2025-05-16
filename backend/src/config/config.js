require("dotenv").config();

module.exports = {
  // Server configuration
  port: process.env.PORT || 2001,
  env: process.env.NODE_ENV || "development",

  // MongoDB configuration
  mongoURI: process.env.MONGODB_URI || "mongodb://localhost:27017/studieshq",

  // JWT configuration
  jwtSecret: process.env.JWT_SECRET || "studieshq_secret_key",
  jwtExpire: process.env.JWT_EXPIRE || "7d",

  // Frontend URL for CORS and email links
  frontendURL: process.env.FRONTEND_URL || "http://localhost:5173",

  // Email configuration
  email: {
    host: process.env.SMPT_HOST,
    port: process.env.SMPT_PORT || 587,
    user: process.env.SMPT_MAIL,
    password: process.env.SMPT_PASSWORD,
    from: process.env.SMPT_MAIL || "aniketkhillare17@gmail.com",
    service: process.env.SMPT_SERVICE,
  },

  // File upload configuration
  uploads: {
    profileImage: {
      maxSize: 1024 * 1024 * 2, // 2MB
      allowedTypes: ["image/jpeg", "image/png"],
    },
    projectFiles: {
      maxSize: 1024 * 1024 * 10, // 10MB
      allowedTypes: [
        "image/jpeg",
        "image/png",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ],
    },
  },

  // Payment configuration (for integration with payment gateways)
  payment: {
    platformFeePercentage: process.env.PLATFORM_FEE_PERCENTAGE || 10, // 10%
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
    paypalClientId: process.env.PAYPAL_CLIENT_ID,
    paypalSecret: process.env.PAYPAL_SECRET,
  },
};
