const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Notification Schema
const NotificationSchema = new Schema({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  type: {
    type: String,
    enum: [
      "message",
      "project_invitation",
      "project_acceptance",
      "project_milestone_completed",
      "project_completed",
      "payment_received",
      "payment_sent",
      "project_feedback",
      "proposal_accepted",
      "job_application",
      "system_notification",
    ],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },
  relatedId: {
    // ID of related entity (project, message, etc.)
    type: Schema.Types.ObjectId,
    required: true,
  },
  relatedModel: {
    // Name of related model
    type: String,
    enum: ["Project", "Job", "Message", "Payment", "Review", "Proposal"],
    required: true,
  },
  link: {
    // URL to navigate to when notification is clicked
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create Notification model
const Notification = mongoose.model("Notification", NotificationSchema);

module.exports = Notification;
