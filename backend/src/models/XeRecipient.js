const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// XE Recipient Schema - Stores complete XE API recipient response
const XeRecipientSchema = new Schema({
  // Link to payment method
  paymentMethod: {
    type: Schema.Types.ObjectId,
    ref: "PaymentMethod",
    required: true,
  },

  // Link to user
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // XE Recipient identification
  xeRecipientId: {
    type: String,
    required: true,
    unique: true,
  },

  clientReference: {
    type: String,
    required: true,
  },

  // Currency
  currency: {
    type: String,
    required: true,
  },

  // Payout Method details
  payoutMethod: {
    type: {
      type: String,
      required: true,
    },
    bank: {
      account: {
        accountName: String,
        accountNumber: String,
        bic: String,
        ncc: String,
        iban: String,
        country: String,
        accountType: String,
      },
      intermAccount: {
        accountName: String,
        accountNumber: String,
        bic: String,
        ncc: String,
        iban: String,
        country: String,
      },
    },
  },

  // Entity details (Company or Consumer)
  entity: {
    type: {
      type: String,
      enum: ["Company", "Consumer"],
      required: true,
    },
    isDeactivated: {
      type: Boolean,
      default: false,
    },
    company: {
      name: String,
      address: {
        line1: String,
        line2: String,
        country: String,
        locality: String,
        region: String,
        postcode: String,
      },
      industryTypeCode: String,
      emailAddress: String,
      idCountry: String,
      idType: String,
      idNumber: String,
      taxNumber: String,
      phoneNumber: String,
    },
    consumer: {
      givenNames: String,
      familyName: String,
      emailAddress: String,
      address: {
        line1: String,
        line2: String,
        country: String,
        locality: String,
        region: String,
        postcode: String,
      },
      title: String,
      idCountry: String,
      idType: String,
      idNumber: String,
      taxNumber: String,
      phoneNumber: String,
    },
  },

  // Status and metadata
  status: {
    type: String,
    enum: ["active", "deactivated", "failed"],
    default: "active",
  },

  // Raw response for debugging
  rawResponse: {
    type: Schema.Types.Mixed,
  },

  // Error information if creation failed
  errorInfo: {
    message: String,
    code: String,
    lastAttempt: Date,
    retryCount: {
      type: Number,
      default: 0,
    },
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for better performance
XeRecipientSchema.index({ paymentMethod: 1 });
XeRecipientSchema.index({ user: 1 });
XeRecipientSchema.index({ xeRecipientId: 1 });
XeRecipientSchema.index({ clientReference: 1 });

// Pre-save middleware to update updatedAt field
XeRecipientSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Instance methods
XeRecipientSchema.methods.markAsDeactivated = function () {
  this.status = "deactivated";
  this.entity.isDeactivated = true;
  return this.save();
};

XeRecipientSchema.methods.incrementRetryCount = function () {
  if (!this.errorInfo) {
    this.errorInfo = {};
  }
  this.errorInfo.retryCount = (this.errorInfo.retryCount || 0) + 1;
  this.errorInfo.lastAttempt = new Date();
  return this.save();
};

// Static methods
XeRecipientSchema.statics.findByPaymentMethod = function (paymentMethodId) {
  return this.findOne({ paymentMethod: paymentMethodId }).populate("paymentMethod user");
};

XeRecipientSchema.statics.findByXeRecipientId = function (xeRecipientId) {
  return this.findOne({ xeRecipientId }).populate("paymentMethod user");
};

XeRecipientSchema.statics.getFailedRecipients = function (userId = null) {
  const query = { status: "failed" };
  if (userId) {
    query.user = userId;
  }
  return this.find(query).populate("paymentMethod user");
};

const XeRecipient = mongoose.model("XeRecipient", XeRecipientSchema);

module.exports = XeRecipient;

