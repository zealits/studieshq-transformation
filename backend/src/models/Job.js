const mongoose = require("mongoose");
const Schema = mongoose.Schema;

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
      enum: ["milestone", "completion"],
      default: "milestone",
    },
  },
  freelancersNeeded: {
    type: Number,
    required: true,
    default: 1,
    min: 1,
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
  blockedBudget: {
    amount: { type: Number },
    platformFee: { type: Number },
    total: { type: Number },
    transactionId: { type: String },
  },
  project_id: {
    type: String,
    default: null,
  },
});

// Update the updatedAt field before saving
JobSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Create model
const Job = mongoose.model("Job", JobSchema);

module.exports = Job;
