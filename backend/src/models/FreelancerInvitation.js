const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Freelancer Invitation Schema
const FreelancerInvitationSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    firstName: {
      type: String,
      required: false, // Made optional for invitation-only workflows
      trim: true,
    },
    lastName: {
      type: String,
      required: false, // Made optional for invitation-only workflows
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "sent", "registered", "failed"],
      default: "pending",
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    invitationToken: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values but ensures uniqueness for non-null values
    },
    invitationTokenExpire: {
      type: Date,
    },
    registeredUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    sentAt: {
      type: Date,
    },
    registeredAt: {
      type: Date,
    },
    errorMessage: {
      type: String,
    },
    metadata: {
      batchId: String,
      source: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
FreelancerInvitationSchema.index({ email: 1 });
FreelancerInvitationSchema.index({ status: 1 });
FreelancerInvitationSchema.index({ invitedBy: 1 });

// Virtual for full name
FreelancerInvitationSchema.virtual("fullName").get(function () {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  } else if (this.firstName) {
    return this.firstName;
  } else if (this.lastName) {
    return this.lastName;
  } else {
    return this.email; // Fallback to email if no names provided
  }
});

// Create FreelancerInvitation model
const FreelancerInvitation = mongoose.model("FreelancerInvitation", FreelancerInvitationSchema);

module.exports = FreelancerInvitation;
