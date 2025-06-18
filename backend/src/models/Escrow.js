const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Escrow Schema
const EscrowSchema = new Schema({
  escrowId: {
    type: String,
    required: true,
    unique: true,
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
  project: {
    type: Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  job: {
    type: Schema.Types.ObjectId,
    ref: "Job",
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  clientPlatformFee: {
    type: Number,
    required: true,
  },
  freelancerPlatformFee: {
    type: Number,
    required: true,
  },
  projectAmount: {
    type: Number,
    required: true,
  },
  totalChargedToClient: {
    type: Number,
    required: true,
  },
  amountToFreelancer: {
    type: Number,
    required: true,
  },
  platformRevenue: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: "USD",
  },
  status: {
    type: String,
    enum: ["active", "partially_released", "completed", "disputed", "refunded"],
    default: "active",
  },
  releasedAmount: {
    type: Number,
    default: 0,
  },
  remainingAmount: {
    type: Number,
  },
  platformFeePercentage: {
    type: Number,
    required: true,
  },
  milestones: [
    {
      milestoneId: {
        type: Schema.Types.ObjectId,
        required: true,
      },
      title: {
        type: String,
      },
      amount: {
        type: Number,
        required: true,
      },
      freelancerReceives: {
        type: Number,
        required: true,
      },
      platformFee: {
        type: Number,
        required: true,
      },
      status: {
        type: String,
        enum: ["pending", "released"],
        default: "pending",
      },
      releasedAt: Date,
      releasedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
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

// Calculate remaining amount before saving
EscrowSchema.pre("save", function (next) {
  this.remainingAmount = this.totalAmount - this.releasedAmount;
  this.updatedAt = Date.now();
  next();
});

// Calculate platform revenue
EscrowSchema.methods.calculatePlatformRevenue = function () {
  return this.clientPlatformFee + this.freelancerPlatformFee;
};

const Escrow = mongoose.model("Escrow", EscrowSchema);

module.exports = Escrow;
