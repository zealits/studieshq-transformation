const mongoose = require("mongoose");

const ticketReplySchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportTicket",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    isInternal: {
      type: Boolean,
      default: false, // Internal notes only visible to admins
    },
    attachments: [{
      filename: String,
      originalname: String,
      mimetype: String,
      size: Number,
      url: String,
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  {
    timestamps: true,
  }
);

// Index for better performance
ticketReplySchema.index({ ticket: 1, createdAt: 1 });

module.exports = mongoose.model("TicketReply", ticketReplySchema); 