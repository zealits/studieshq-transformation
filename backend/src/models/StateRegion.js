const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// State/Region Schema for storing country states and regions
const StateRegionSchema = new Schema({
  countryCode: {
    type: String,
    required: true,
    index: true, // Add index for faster queries
  },
  countryName: {
    type: String,
    required: true,
  },
  geonameId: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  isoCode: {
    type: String,
    required: true,
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
StateRegionSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for better query performance
StateRegionSchema.index({ countryCode: 1, name: 1 });
StateRegionSchema.index({ countryCode: 1, isoCode: 1 });

// Create StateRegion model
const StateRegion = mongoose.model("StateRegion", StateRegionSchema);

module.exports = StateRegion;
