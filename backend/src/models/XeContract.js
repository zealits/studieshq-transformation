const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// XE Payment Contract Schema - Stores XE payment and contract responses
const XeContractSchema = new Schema({
  // Link to transaction
  transaction: {
    type: Schema.Types.ObjectId,
    ref: "Transaction",
    required: true,
  },

  // Link to user
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // Link to XE recipient
  xeRecipient: {
    type: Schema.Types.ObjectId,
    ref: "XeRecipient",
    required: true,
  },

  // Payment details
  payment: {
    // XE Contract/Payment identifier
    contractNumber: {
      type: String,
      required: true,
      unique: true,
    },
    clientTransferNumber: String,

    // Quote details
    quote: {
      fxDetails: [
        {
          sell: {
            currency: String,
            amount: Number,
          },
          buy: {
            currency: String,
            amount: Number,
          },
          rate: {
            sellCurrency: String,
            buyCurrency: String,
            rate: Number,
            baseCurrency: String,
            inverseRate: Number,
          },
          effectiveDate: Date,
          valueDate: Date,
          quoteType: String,
        },
      ],
      quoteTime: Date,
      expires: Date,
    },

    // Settlement details
    summary: [
      {
        settlementDate: Date,
        xeBankAccount: {
          accountName: String,
          accountNumber: String,
          bic: String,
          ncc: String,
          iban: String,
          country: String,
          accountType: String,
        },
        settlementMethod: String,
        directDebitBankAccount: {
          accountName: String,
          accountNumber: String,
        },
        settlementFees: {
          currency: String,
          amount: Number,
        },
        settlementAmount: {
          currency: String,
          amount: Number,
        },
        initialMargin: {
          currency: String,
          amount: Number,
        },
        balanceSettlement: {
          currency: String,
          amount: Number,
          valueDate: Date,
        },
      },
    ],

    // Settlement options
    settlementOptions: [
      {
        method: String,
        isAvailable: Boolean,
        displayName: String,
        unAvailableReason: String,
        unAvailableReasonCode: String,
      },
    ],

    // Status tracking
    status: {
      type: String,
      enum: ["ContractUnconfirmed", "QuoteRequired", "Confirmed", "Settled", "Failed", "Cancelled"],
      required: true,
    },
    quoteStatus: {
      type: String,
      enum: ["Valid", "Expired", "NotSet"],
      default: "Valid",
    },
    settlementStatus: {
      type: String,
      enum: ["NotSettled", "Settled", "Failed"],
      default: "NotSettled",
    },
    deliveryMethod: String,
    contractType: String,

    // Payment creation timestamp
    createdDate: Date,
  },

  // Contract approval details (when approved)
  approval: {
    approvedAt: Date,
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    // Updated contract details after approval
    updatedStatus: String,
    updatedQuoteStatus: String,
    updatedSettlementStatus: String,

    // Raw approval response
    rawApprovalResponse: Schema.Types.Mixed,
  },

  // Client reference for tracking
  clientReference: {
    type: String,
    required: true,
  },

  // Status of the overall transaction
  overallStatus: {
    type: String,
    enum: ["payment_created", "payment_approved", "settlement_pending", "completed", "failed", "expired", "cancelled"],
    default: "payment_created",
  },

  // Amount details for tracking
  amounts: {
    sellAmount: Number,
    sellCurrency: String,
    buyAmount: Number,
    buyCurrency: String,
    settlementFees: Number,
    totalSettlementAmount: Number,
  },

  // Quote expiration handling
  quoteExpiration: {
    expiresAt: Date,
    isExpired: {
      type: Boolean,
      default: false,
    },
    autoApprovalAttempted: {
      type: Boolean,
      default: false,
    },
    approvalAttemptedAt: Date,
  },

  // Error information
  errorInfo: {
    hasErrors: {
      type: Boolean,
      default: false,
    },
    lastError: {
      stage: {
        type: String,
        enum: ["payment_creation", "contract_approval", "settlement"],
      },
      message: String,
      code: String,
      details: Schema.Types.Mixed,
      timestamp: Date,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
  },

  // Raw responses for debugging
  rawPaymentResponse: Schema.Types.Mixed,
  rawApprovalResponse: Schema.Types.Mixed,

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
XeContractSchema.index({ transaction: 1 });
XeContractSchema.index({ user: 1 });
XeContractSchema.index({ contractNumber: 1 });
XeContractSchema.index({ clientReference: 1 });
XeContractSchema.index({ overallStatus: 1 });
XeContractSchema.index({ "quoteExpiration.expiresAt": 1 });
XeContractSchema.index({ "payment.status": 1 });

// Pre-save middleware to update updatedAt field
XeContractSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Instance methods
XeContractSchema.methods.markAsExpired = function () {
  this.quoteExpiration.isExpired = true;
  this.overallStatus = "expired";
  this.payment.quoteStatus = "Expired";
  return this.save();
};

XeContractSchema.methods.markAsApproved = function (approvalResponse, userId) {
  this.approval = {
    approvedAt: new Date(),
    approvedBy: userId,
    rawApprovalResponse: approvalResponse,
  };
  this.overallStatus = "payment_approved";

  // Update status from approval response if available
  if (approvalResponse && approvalResponse.status) {
    this.approval.updatedStatus = approvalResponse.status;
  }
  if (approvalResponse && approvalResponse.quoteStatus) {
    this.approval.updatedQuoteStatus = approvalResponse.quoteStatus;
  }
  if (approvalResponse && approvalResponse.settlementStatus) {
    this.approval.updatedSettlementStatus = approvalResponse.settlementStatus;
  }

  return this.save();
};

XeContractSchema.methods.markAsFailed = function (stage, error) {
  this.errorInfo = {
    hasErrors: true,
    lastError: {
      stage: stage,
      message: error.message || error,
      code: error.code || null,
      details: error.details || error,
      timestamp: new Date(),
    },
    retryCount: (this.errorInfo?.retryCount || 0) + 1,
  };
  this.overallStatus = "failed";
  return this.save();
};

XeContractSchema.methods.isQuoteExpired = function () {
  if (!this.quoteExpiration.expiresAt) return false;
  return new Date() > this.quoteExpiration.expiresAt;
};

// Static methods
XeContractSchema.statics.findByTransaction = function (transactionId) {
  return this.findOne({ transaction: transactionId }).populate("transaction user xeRecipient");
};

XeContractSchema.statics.findByContractNumber = function (contractNumber) {
  return this.findOne({ "payment.contractNumber": contractNumber }).populate("transaction user xeRecipient");
};

XeContractSchema.statics.findExpiredContracts = function () {
  return this.find({
    "quoteExpiration.expiresAt": { $lt: new Date() },
    "quoteExpiration.isExpired": false,
    overallStatus: { $in: ["payment_created"] },
  });
};

XeContractSchema.statics.findPendingApprovals = function () {
  return this.find({
    overallStatus: "payment_created",
    "quoteExpiration.isExpired": false,
    "quoteExpiration.autoApprovalAttempted": false,
  }).populate("transaction user xeRecipient");
};

const XeContract = mongoose.model("XeContract", XeContractSchema);

module.exports = XeContract;






