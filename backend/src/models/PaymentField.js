const mongoose = require("mongoose");

const paymentFieldSchema = new mongoose.Schema(
  {
    countryCode: {
      type: String,
      required: true,
      uppercase: true,
      minLength: 2,
      maxLength: 2,
    },
    countryName: {
      type: String,
      required: true,
    },
    currencyCode: {
      type: String,
      required: true,
      uppercase: true,
      minLength: 3,
      maxLength: 3,
    },
    currencyName: {
      type: String,
      required: true,
    },
    fields: [
      {
        fieldName: {
          type: String,
          required: true,
        },
        label: {
          type: String,
          required: true,
        },
        required: {
          type: Boolean,
          required: true,
        },
        pattern: {
          type: String,
          default: null,
        },
        minimumLength: {
          type: Number,
          default: null,
        },
        maximumLength: {
          type: Number,
          default: null,
        },
        description: {
          type: String,
          default: null,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    source: {
      type: String,
      default: "xe_api",
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for efficient querying
paymentFieldSchema.index({ countryCode: 1, currencyCode: 1 }, { unique: true });
paymentFieldSchema.index({ countryCode: 1 });
paymentFieldSchema.index({ isActive: 1 });

// Static method to find payment fields by country and currency
paymentFieldSchema.statics.findByCountryAndCurrency = function (countryCode, currencyCode) {
  return this.findOne({
    countryCode: countryCode.toUpperCase(),
    currencyCode: currencyCode.toUpperCase(),
    isActive: true,
  });
};

// Static method to get all countries
paymentFieldSchema.statics.getAllCountries = function () {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: "$countryCode",
        name: { $first: "$countryName" },
      },
    },
    {
      $project: {
        _id: 0,
        code: "$_id",
        name: 1,
      },
    },
    { $sort: { name: 1 } },
  ]);
};

// Static method to get currencies for a country
paymentFieldSchema.statics.getCurrenciesForCountry = function (countryCode) {
  return this.aggregate([
    {
      $match: {
        countryCode: countryCode.toUpperCase(),
        isActive: true,
      },
    },
    {
      $project: {
        _id: 0,
        code: "$currencyCode",
        name: "$currencyName",
      },
    },
    { $sort: { name: 1 } },
  ]);
};

// Instance method to get user-friendly field descriptions
paymentFieldSchema.methods.getFieldDescriptions = function () {
  const descriptions = {
    accountNumber: "Bank account number",
    routingNumber: "9-digit routing number for US banks",
    ncc: "Routing number or bank code",
    ifsc: "Indian Financial System Code",
    swiftCode: "SWIFT/BIC code for international transfers",
    iban: "International Bank Account Number",
    sortCode: "UK bank sort code",
    bsb: "Bank State Branch code for Australian banks",
    transitNumber: "Transit number for Canadian banks",
    institutionNumber: "Institution number for Canadian banks",
    bankCode: "Bank identification code",
    branchCode: "Bank branch code",
    country: "Bank location country",
  };

  return this.fields.map((field) => ({
    ...field.toObject(),
    description: descriptions[field.fieldName] || field.description || `Enter ${field.label.toLowerCase()}`,
  }));
};

const PaymentField = mongoose.model("PaymentField", paymentFieldSchema);

module.exports = PaymentField;
