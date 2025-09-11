const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Job Invitation Schema
const JobInvitationSchema = new Schema({
  job: {
    type: Schema.Types.ObjectId,
    ref: "Job",
    required: true,
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  freelancer: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  message: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "declined", "expired"],
    default: "pending",
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
JobInvitationSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
JobInvitationSchema.index({ job: 1, freelancer: 1 });
JobInvitationSchema.index({ freelancer: 1, status: 1 });
JobInvitationSchema.index({ client: 1, status: 1 });

// Create model
const JobInvitation = mongoose.model("JobInvitation", JobInvitationSchema);

module.exports = JobInvitation;

