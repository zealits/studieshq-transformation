const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProposalSchema = new Schema({
  job: {
    type: Schema.Types.ObjectId,
    ref: "Job",
    required: true,
  },
  freelancer: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  coverLetter: {
    type: String,
    required: true,
  },
  bidPrice: {
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
  freelancerProfileSnapshot: {
    name: { type: String },
    avatar: { type: String },
    title: { type: String },
    skills: [{ type: String }],
    experience: { type: String },
    hourlyRate: {
      min: { type: Number },
      max: { type: Number },
    },
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

// Update the updatedAt field before saving
ProposalSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for better query performance
ProposalSchema.index({ freelancer: 1, status: 1 });
ProposalSchema.index({ job: 1, status: 1 });
ProposalSchema.index({ client: 1, status: 1 });

const Proposal = mongoose.model("Proposal", ProposalSchema);

module.exports = Proposal;
