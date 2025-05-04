const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Proposal Schema
const ProposalSchema = new Schema({
  freelancer: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  coverLetter: {
    type: String,
    required: true,
  },
  bidAmount: {
    type: Number,
    required: true,
  },
  estimatedDuration: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "shortlisted", "accepted", "rejected"],
    default: "pending",
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
});

// Job Schema
const JobSchema = new Schema({
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
    type: Object,
    required: true,
    min: {
      type: Number,
      required: true,
    },
    max: {
      type: Number,
      required: true,
    },
    budgetType: {
      type: String,
      enum: ["fixed", "hourly"],
      default: "fixed",
    },
  },
  experience: {
    type: String,
    enum: ["entry", "intermediate", "expert"],
    default: "intermediate",
  },
  duration: {
    type: String,
    enum: ["less_than_1_month", "1_to_3_months", "3_to_6_months", "more_than_6_months"],
    required: true,
  },
  location: {
    type: String,
    enum: ["remote", "onsite", "hybrid"],
    default: "remote",
  },
  deadline: {
    type: Date,
    required: true,
  },
  attachments: [
    {
      type: Schema.Types.ObjectId,
      ref: "Attachment",
    },
  ],
  status: {
    type: String,
    enum: ["draft", "open", "in_progress", "completed", "cancelled"],
    default: "draft",
  },
  companyDetails: {
    name: { type: String },
    website: { type: String },
    logo: { type: String },
    description: { type: String },
    location: { type: String },
  },
  proposals: [ProposalSchema],
  viewCount: {
    type: Number,
    default: 0,
  },
  applicationCount: {
    type: Number,
    default: 0,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: "Project",
  },
});

// Update the updatedAt field before saving
JobSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

ProposalSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Create models
const Job = mongoose.model("Job", JobSchema);
const Proposal = mongoose.model("Proposal", ProposalSchema);

module.exports = { Job, Proposal };
