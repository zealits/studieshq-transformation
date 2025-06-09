const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Milestone Schema
const MilestoneSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  percentage: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "in_progress", "submitted_for_review", "completed", "revision_requested"],
    default: "pending",
  },
  approvalStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  approvalDate: {
    type: Date,
  },
  approvalComment: {
    type: String,
  },
  submissionDetails: {
    type: String,
  },
  submissionDate: {
    type: Date,
  },
  feedback: {
    type: String,
  },
  attachments: [
    {
      type: Schema.Types.ObjectId,
      ref: "Attachment",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: Date,
  revisionCount: {
    type: Number,
    default: 0,
  },
  estimatedCompletionDate: {
    type: Date,
  },
  actualCompletionDate: {
    type: Date,
  },
  workStartedDate: {
    type: Date,
  },
  revisionHistory: [
    {
      date: {
        type: Date,
        default: Date.now,
      },
      feedback: String,
      requestedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    },
  ],
});

// Attachment Schema
const AttachmentSchema = new Schema({
  filename: {
    type: String,
    required: true,
  },
  originalname: {
    type: String,
    required: true,
  },
  mimetype: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

// Project Schema
const ProjectSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
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
  job: {
    type: Schema.Types.ObjectId,
    ref: "Job",
  },
  category: {
    type: String,
    required: true,
  },
  skills: [
    {
      type: String,
    },
  ],
  budget: {
    type: Number,
    required: true,
  },
  startDate: {
    type: Date,
  },
  deadline: {
    type: Date,
    required: true,
  },
  completedDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ["pending", "in_progress", "completed", "cancelled", "disputed"],
    default: "pending",
  },
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  milestones: [MilestoneSchema],
  attachments: [
    {
      type: Schema.Types.ObjectId,
      ref: "Attachment",
    },
  ],
  clientReview: {
    type: Schema.Types.ObjectId,
    ref: "Review",
  },
  freelancerReview: {
    type: Schema.Types.ObjectId,
    ref: "Review",
  },
  contract: {
    type: String,
  },
  paymentType: {
    type: String,
    enum: ["fixed", "hourly"],
    default: "fixed",
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
ProjectSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

MilestoneSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Create models
const Project = mongoose.model("Project", ProjectSchema);
const Attachment = mongoose.model("Attachment", AttachmentSchema);

module.exports = { Project, Attachment };
