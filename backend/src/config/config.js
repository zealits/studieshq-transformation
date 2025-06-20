require("dotenv").config();
const path = require("path");

// Cloudinary Configuration
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

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

  // Hybrid file upload configuration
  uploads: {
    // Cloudinary settings for profile images and verification documents
    cloudinary: {
      profileImages: {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ["image/jpeg", "image/png"],
        folder: "profile_images",
      },
      verificationDocuments: {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ["image/jpeg", "image/png", "application/pdf"],
        folder: "verification_documents",
      },
    },
    // Local storage settings for milestone deliverables
    local: {
      baseDir: path.join(__dirname, "../uploads"),
      milestoneDeliverables: {
        maxSize: 50 * 1024 * 1024, // 50MB
        allowedTypes: [
          "image/jpeg",
          "image/png",
          "image/jpg",
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/zip",
          "application/x-rar-compressed",
        ],
        directory: "milestone-deliverables",
      },
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

  // Giftogram API Configuration
  giftogram: {
    apiUrl: process.env.GIFTOGRAM_ENVIRONMENT === "sandbox" 
      ? "https://sandbox-api.giftogram.com" 
      : (process.env.GIFTOGRAM_API_URL || "https://api.giftogram.com"),
    apiKey: process.env.GIFTOGRAM_API_KEY,
    environment: process.env.GIFTOGRAM_ENVIRONMENT || "sandbox", // sandbox or production
  },

  cloudinaryConfig,
};
