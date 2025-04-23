const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Review Schema
const ReviewSchema = new Schema({
  from: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  to: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: "Project",
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  text: {
    type: String,
    required: true,
  },
  // Specific rating categories
  communication: {
    type: Number,
    min: 1,
    max: 5,
  },
  quality: {
    type: Number,
    min: 1,
    max: 5,
  },
  expertise: {
    type: Number,
    min: 1,
    max: 5,
  },
  professionalism: {
    type: Number,
    min: 1,
    max: 5,
  },
  rehireOrRecommend: {
    type: Boolean,
  },
  // Admin moderation
  isPublic: {
    type: Boolean,
    default: true,
  },
  isReported: {
    type: Boolean,
    default: false,
  },
  reportReason: {
    type: String,
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
ReviewSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Create Review model
const Review = mongoose.model("Review", ReviewSchema);

module.exports = Review;
