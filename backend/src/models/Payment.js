const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Payment Method Schema
const PaymentMethodSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["card", "paypal", "bank"],
    required: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  // Card specific fields
  card: {
    last4: String,
    brand: String,
    expiryMonth: Number,
    expiryYear: Number,
    country: String,
    name: String,
  },
  // PayPal specific fields
  paypal: {
    email: String,
  },
  // Bank account specific fields
  bank: {
    accountNumber: String,
    routingNumber: String,
    accountType: String,
    bankName: String,
    accountHolderName: String,
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

// Transaction Schema
const TransactionSchema = new Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  fee: {
    type: Number,
    default: 0,
  },
  netAmount: {
    type: Number,
  },
  type: {
    type: String,
    enum: ["deposit", "withdrawal", "payment", "refund", "milestone", "platform_fee"],
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "disputed"],
    default: "pending",
  },
  paymentMethod: {
    type: Schema.Types.ObjectId,
    ref: "PaymentMethod",
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: "Project",
  },
  milestone: {
    type: Schema.Types.ObjectId,
    ref: "Milestone",
  },
  invoice: {
    type: Schema.Types.ObjectId,
    ref: "Invoice",
  },
  recipient: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  relatedUser: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  description: String,
  metadata: Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Invoice Schema
const InvoiceSchema = new Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
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
  project: {
    type: Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  items: [
    {
      description: String,
      quantity: Number,
      rate: Number,
      amount: Number,
    },
  ],
  subtotal: {
    type: Number,
    required: true,
  },
  platformFee: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["draft", "sent", "paid", "overdue", "cancelled"],
    default: "draft",
  },
  dueDate: {
    type: Date,
    required: true,
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  paidAt: Date,
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Wallet Schema
const WalletSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
  totalEarned: {
    type: Number,
    default: 0,
  },
  totalSpent: {
    type: Number,
    default: 0,
  },
  currency: {
    type: String,
    default: "USD",
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

// Pre-save middleware to update updatedAt field
TransactionSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

WalletSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Create and export models
const PaymentMethod = mongoose.model("PaymentMethod", PaymentMethodSchema);
const Transaction = mongoose.model("Transaction", TransactionSchema);
const Invoice = mongoose.model("Invoice", InvoiceSchema);
const Wallet = mongoose.model("Wallet", WalletSchema);

module.exports = {
  PaymentMethod,
  Transaction,
  Invoice,
  Wallet,
};
