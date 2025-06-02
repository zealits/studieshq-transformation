const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// User Schema
const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    avatar: {
      type: String,
    },
    role: {
      type: String,
      enum: ["client", "freelancer", "admin"],
      default: "freelancer",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    verificationDocuments: {
      identityProof: {
        type: {
          type: String,
          enum: ["Passport", "Driver's License", "National ID", "Other"],
        },
        status: {
          type: String,
          enum: ["pending", "verified", "rejected"],
          default: "pending",
        },
        uploadDate: Date,
        documentUrl: String,
      },
      addressProof: {
        type: {
          type: String,
          enum: ["Utility Bill", "Bank Statement", "Government Document", "Other"],
        },
        status: {
          type: String,
          enum: ["pending", "verified", "rejected"],
          default: "pending",
        },
        uploadDate: Date,
        documentUrl: String,
      },
    },
    status: {
      type: String,
      enum: ["active", "suspended", "pending"],
      default: "active",
    },
    verificationToken: String,
    verificationTokenExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    lastLogin: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Update the updatedAt field before saving
UserSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Create User model
const User = mongoose.model("User", UserSchema);

module.exports = User;
