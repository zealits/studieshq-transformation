const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Field Schema for individual fields
const FieldSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "number", "email", "tel", "select", "textarea", "date"],
      default: "text",
    },
    placeholder: {
      type: String,
    },
    required: {
      type: Boolean,
      default: false,
    },
    options: [
      {
        value: String,
        label: String,
      },
    ],
    validation: {
      pattern: String,
      minLength: Number,
      maxLength: Number,
      min: Number,
      max: Number,
    },
    documentType: {
      type: String,
      enum: ["business_license", "tax_certificate", "incorporation_certificate", "other"],
    },
    documentLabel: {
      type: String,
    },
  },
  { _id: false }
);

// Country Business Fields Schema
const CountryBusinessFieldsSchema = new Schema(
  {
    country: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    countryCode: {
      type: String,
      required: true,
      trim: true,
    },
    fields: [FieldSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
CountryBusinessFieldsSchema.index({ country: 1 });
CountryBusinessFieldsSchema.index({ countryCode: 1 });

module.exports = mongoose.model("CountryBusinessFields", CountryBusinessFieldsSchema);





