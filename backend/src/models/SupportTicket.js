const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Technical Issue",
        "Payment Problem", 
        "Account Issue",
        "Project Dispute",
        "General Inquiry",
        "Bug Report",
        "Feature Request",
        "Other"
      ],
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "in-progress", "waiting-for-response", "resolved", "closed"],
      default: "open",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    tags: [{
      type: String,
      trim: true,
    }],
    attachments: [{
      filename: String,
      originalname: String,
      mimetype: String,
      size: Number,
      url: String,
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    // Internal admin notes
    internalNotes: [{
      content: String,
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
    // First response time tracking
    firstResponseAt: Date,
    resolvedAt: Date,
    closedAt: Date,
    // Satisfaction rating
    rating: {
      score: {
        type: Number,
        min: 1,
        max: 5,
      },
      feedback: String,
      ratedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
supportTicketSchema.index({ user: 1, status: 1 });
supportTicketSchema.index({ ticketNumber: 1 });
supportTicketSchema.index({ category: 1, status: 1 });
supportTicketSchema.index({ assignedAdmin: 1, status: 1 });

// Generate ticket number before saving
supportTicketSchema.pre("save", async function (next) {
  if (this.isNew && !this.ticketNumber) {
    try {
      // Get count with retry logic for race conditions
      let attempts = 0;
      const maxAttempts = 5;
      
      while (attempts < maxAttempts) {
        try {
          const count = await this.constructor.countDocuments();
          const ticketNum = `ST-${String(count + 1).padStart(6, "0")}`;
          
          // Check if this ticket number already exists
          const existingTicket = await this.constructor.findOne({ ticketNumber: ticketNum });
          
          if (!existingTicket) {
            this.ticketNumber = ticketNum;
            break;
          }
          
          // If ticket number exists, increment and try again
          attempts++;
          if (attempts >= maxAttempts) {
            // Use timestamp as fallback
            const timestamp = Date.now().toString().slice(-6);
            this.ticketNumber = `ST-${timestamp}`;
          }
        } catch (err) {
          attempts++;
          if (attempts >= maxAttempts) {
            // Use timestamp as fallback
            const timestamp = Date.now().toString().slice(-6);
            this.ticketNumber = `ST-${timestamp}`;
          }
        }
      }
    } catch (error) {
      console.error("Error generating ticket number:", error);
      // Fallback to timestamp-based ticket number
      const timestamp = Date.now().toString().slice(-6);
      this.ticketNumber = `ST-${timestamp}`;
    }
  }
  next();
});

// Add custom validation for ticketNumber
supportTicketSchema.path('ticketNumber').validate(function(value) {
  return value && value.length > 0;
}, 'Ticket number is required');

module.exports = mongoose.model("SupportTicket", supportTicketSchema); 