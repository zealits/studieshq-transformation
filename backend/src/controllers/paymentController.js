const { v4: uuidv4 } = require("uuid");
const { PaymentMethod, Transaction, Invoice, Wallet } = require("../models/Payment");
const User = require("../models/User");
const XeRecipient = require("../models/XeRecipient");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const paypalService = require("../services/paypalService");
const giftogramService = require("../services/giftogramService");
const emailService = require("../services/emailService");
const xeApiService = require("../services/xeApiService");

// *** PAYMENT METHODS ***

// Get all payment methods for current user
exports.getPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = await PaymentMethod.find({ user: req.user.id });

    res.status(200).json({
      success: true,
      count: paymentMethods.length,
      data: paymentMethods,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Create new payment method
exports.addPaymentMethod = async (req, res) => {
  try {
    req.body.user = req.user.id;

    // If this is the first payment method, set it as default
    const existingMethods = await PaymentMethod.countDocuments({ user: req.user.id });
    if (existingMethods === 0) {
      req.body.isDefault = true;
    }

    const paymentMethod = await PaymentMethod.create(req.body);

    res.status(201).json({
      success: true,
      data: paymentMethod,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete payment method
exports.deletePaymentMethod = async (req, res) => {
  try {
    const paymentMethod = await PaymentMethod.findById(req.params.id);

    if (!paymentMethod) {
      return res.status(404).json({ success: false, message: `Payment method not found with id of ${req.params.id}` });
    }

    // Make sure user owns the payment method
    if (paymentMethod.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: "Not authorized to delete this payment method" });
    }

    // If deleting the default method, set another one as default if available
    if (paymentMethod.isDefault) {
      const anotherMethod = await PaymentMethod.findOne({
        user: req.user.id,
        _id: { $ne: req.params.id },
      });

      if (anotherMethod) {
        anotherMethod.isDefault = true;
        await anotherMethod.save();
      }
    }

    await PaymentMethod.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Set payment method as default
exports.setDefaultPaymentMethod = async (req, res) => {
  try {
    const paymentMethod = await PaymentMethod.findById(req.params.id);

    if (!paymentMethod) {
      return res.status(404).json({ success: false, message: `Payment method not found with id of ${req.params.id}` });
    }

    // Make sure user owns the payment method
    if (paymentMethod.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: "Not authorized to update this payment method" });
    }

    // Clear default status from all user's methods
    await PaymentMethod.updateMany({ user: req.user.id }, { isDefault: false });

    // Set this method as default
    paymentMethod.isDefault = true;
    await paymentMethod.save();

    res.status(200).json({
      success: true,
      data: paymentMethod,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// *** PAYPAL INTEGRATION ***

// Create PayPal order for adding funds
exports.createPayPalOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount. Amount must be greater than 0",
      });
    }

    if (amount < 1 || amount > 10000) {
      return res.status(400).json({
        success: false,
        message: "Amount must be between $1 and $10,000",
      });
    }

    // Create PayPal order
    const paypalOrder = await paypalService.createOrder(amount);

    if (!paypalOrder.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to create PayPal order",
        error: paypalOrder.error,
      });
    }

    // Don't create transaction yet - only create after successful payment capture
    // This prevents showing pending transactions when user just clicks add funds

    res.json({
      success: true,
      data: {
        orderId: paypalOrder.orderId,
        approvalUrl: paypalOrder.links.find((link) => link.rel === "approve")?.href,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Capture PayPal payment and add funds to wallet
exports.capturePayPalPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "PayPal order ID is required",
      });
    }

    // Capture PayPal payment first
    const captureResult = await paypalService.captureOrder(orderId);

    if (!captureResult.success) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Payment capture failed",
        error: captureResult.error,
      });
    }

    // Update wallet
    let wallet = await Wallet.findOne({ user: req.user.id }).session(session);
    if (!wallet) {
      wallet = new Wallet({ user: req.user.id });
    }

    const capturedAmount = parseFloat(captureResult.amount.value);
    wallet.balance += capturedAmount;
    await wallet.save({ session });

    // Create transaction only after successful payment capture
    const transaction = new Transaction({
      transactionId: `PPO-${uuidv4().substring(0, 8)}`,
      user: req.user.id,
      amount: capturedAmount,
      netAmount: capturedAmount,
      type: "deposit",
      status: "completed",
      description: "PayPal wallet deposit - completed",
      metadata: {
        paypalOrderId: orderId,
        paypalCaptureId: captureResult.captureId,
        paypalTransactionId: captureResult.transactionId,
        payerInfo: captureResult.payerInfo,
        paymentMethod: "paypal",
      },
    });

    await transaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Send email notification for successful deposit
    try {
      const user = await User.findById(req.user.id);
      if (user) {
        await emailService.sendClientPaymentNotification(user, transaction);
      }
    } catch (emailError) {
      // Don't fail the payment if email fails
    }

    res.json({
      success: true,
      message: "Funds added successfully via PayPal",
      data: {
        wallet,
        transaction,
        captureId: captureResult.captureId,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({ success: false, message: "Server error" });
  }
};

// *** FUNDS MANAGEMENT ***

// Add funds to wallet
exports.addFunds = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, paymentMethodId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    if (!paymentMethodId) {
      return res.status(400).json({ success: false, message: "Payment method is required" });
    }

    // Verify payment method belongs to user
    const paymentMethod = await PaymentMethod.findOne({
      _id: paymentMethodId,
      user: req.user.id,
    });

    if (!paymentMethod) {
      return res.status(404).json({ success: false, message: "Payment method not found" });
    }

    // In a real application, you would process the payment here with a payment provider

    // Update wallet
    let wallet = await Wallet.findOne({ user: req.user.id }).session(session);
    if (!wallet) {
      wallet = new Wallet({ user: req.user.id });
    }

    wallet.balance += amount;
    await wallet.save({ session });

    // Create transaction record
    const transaction = new Transaction({
      transactionId: `DEP-${uuidv4().substring(0, 8)}`,
      user: req.user.id,
      amount,
      netAmount: amount,
      type: "deposit",
      status: "completed",
      paymentMethod: paymentMethodId,
      description: "Wallet deposit",
      metadata: {
        paymentMethodType: paymentMethod.type,
      },
    });

    await transaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Send email notification for successful deposit
    try {
      const user = await User.findById(req.user.id);
      if (user) {
        await emailService.sendClientPaymentNotification(user, transaction);
      }
    } catch (emailError) {
      // Don't fail the payment if email fails
    }

    res.json({
      success: true,
      message: "Funds added successfully",
      data: { wallet, transaction },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Withdraw funds
exports.withdrawFunds = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, paymentMethodId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    if (!paymentMethodId) {
      return res.status(400).json({ success: false, message: "Payment method is required" });
    }

    // Verify payment method belongs to user
    const paymentMethod = await PaymentMethod.findOne({
      _id: paymentMethodId,
      user: req.user.id,
    });

    if (!paymentMethod) {
      return res.status(404).json({ success: false, message: "Payment method not found" });
    }

    // Check if user has enough balance
    let wallet = await Wallet.findOne({ user: req.user.id }).session(session);
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ success: false, message: "Insufficient funds" });
    }

    // Calculate withdrawal fee (example: 1% fee)
    const fee = amount * 0.01;
    const netAmount = amount - fee;

    // Update wallet
    wallet.balance -= amount;
    await wallet.save({ session });

    // Create transaction record
    const transaction = new Transaction({
      transactionId: `WDR-${uuidv4().substring(0, 8)}`,
      user: req.user.id,
      amount,
      fee,
      netAmount,
      type: "withdrawal",
      status: "pending", // Withdrawals typically need review
      paymentMethod: paymentMethodId,
      description: "Wallet withdrawal",
      metadata: {
        paymentMethodType: paymentMethod.type,
      },
    });

    await transaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Send email notification for withdrawal request
    try {
      const user = await User.findById(req.user.id);
      if (user) {
        await emailService.sendFreelancerPaymentNotification(user, transaction);
      }
    } catch (emailError) {
      // Don't fail the withdrawal if email fails
    }

    res.json({
      success: true,
      message: "Withdrawal request submitted",
      data: { wallet, transaction },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Release milestone payment - FIXED: Now properly handles escrow-based milestone payments
exports.releaseMilestonePayment = async (req, res) => {
  try {
    // Import escrow controller to delegate the request
    const escrowController = require("./escrowController");

    // Delegate to the proper escrow controller which handles milestone-based payments correctly
    await escrowController.releaseMilestonePayment(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while processing milestone payment release",
    });
  }
};

// *** INVOICES ***

// Create invoice (freelancer only)
exports.createInvoice = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { clientId, projectId, items, dueDate, notes } = req.body;

  try {
    // Validate client exists
    const client = await User.findById(clientId);
    if (!client || client.role !== "client") {
      return res.status(404).json({
        success: false,
        error: "Client not found",
      });
    }

    // If project provided, validate it exists and freelancer belongs to it
    if (projectId) {
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          error: "Project not found",
        });
      }

      if (project.freelancer.toString() !== req.user.id) {
        return res.status(401).json({
          success: false,
          error: "Not authorized - you are not assigned to this project",
        });
      }

      if (project.client.toString() !== clientId) {
        return res.status(400).json({
          success: false,
          error: "Client is not associated with this project",
        });
      }
    }

    // Calculate subtotal
    const subtotal = items.reduce((total, item) => {
      return total + item.amount * (item.quantity || 1);
    }, 0);

    // Calculate total (adding tax if provided)
    const tax = req.body.tax || 0;
    const total = subtotal + tax;

    // Generate invoice number
    const invoiceCount = await Invoice.countDocuments({ freelancer: req.user.id });
    const invoiceNumber = `INV-${req.user.id.substring(0, 5)}-${(invoiceCount + 1).toString().padStart(4, "0")}`;

    const invoice = new Invoice({
      invoiceNumber,
      freelancer: req.user.id,
      client: clientId,
      project: projectId,
      items,
      subtotal,
      tax,
      total,
      dueDate,
      notes,
      status: "pending",
    });

    await invoice.save();

    return res.status(201).json({
      success: true,
      data: invoice,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get all invoices (filtered by role)
exports.getInvoices = async (req, res) => {
  try {
    let query = {};

    // Different queries based on user role
    if (req.user.role === "freelancer") {
      query.freelancer = req.user.id;
    } else if (req.user.role === "client") {
      query.client = req.user.id;
    }

    const invoices = await Invoice.find(query)
      .populate("freelancer", "name avatar")
      .populate("client", "name avatar company")
      .populate("project", "title")
      .sort({ issueDate: -1 });

    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get single invoice
exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("fromUser", "fullName avatar email phone")
      .populate("toUser", "fullName avatar email phone")
      .populate("project", "title")
      .populate("transaction");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found",
      });
    }

    // Check if user is authorized to view this invoice
    if (
      invoice.fromUser._id.toString() !== req.user.id &&
      invoice.toUser._id.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(401).json({
        success: false,
        error: "Not authorized to view this invoice",
      });
    }

    return res.json({
      success: true,
      data: invoice,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// Pay invoice (client only)
exports.payInvoice = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { paymentMethodId } = req.body;

    if (!paymentMethodId) {
      return res.status(400).json({ success: false, message: "Payment method is required" });
    }

    // Verify payment method belongs to user
    const paymentMethod = await PaymentMethod.findOne({
      _id: paymentMethodId,
      user: req.user.id,
    });

    if (!paymentMethod) {
      return res.status(404).json({ success: false, message: "Payment method not found" });
    }

    // Get invoice
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      client: req.user.id,
      status: "pending",
    }).session(session);

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found or already paid" });
    }

    // Check if client has enough balance
    let clientWallet = await Wallet.findOne({ user: req.user.id }).session(session);
    if (!clientWallet || clientWallet.balance < invoice.total) {
      return res.status(400).json({ success: false, message: "Insufficient funds" });
    }

    // Get freelancer wallet
    let freelancerWallet = await Wallet.findOne({ user: invoice.freelancer }).session(session);
    if (!freelancerWallet) {
      freelancerWallet = new Wallet({ user: invoice.freelancer });
    }

    const amount = invoice.total;
    const platformFee = invoice.platformFee;
    const netAmount = amount - platformFee;

    // Update wallets
    clientWallet.balance -= amount;
    clientWallet.totalSpent += amount;
    await clientWallet.save({ session });

    freelancerWallet.balance += netAmount;
    freelancerWallet.totalEarned += netAmount;
    await freelancerWallet.save({ session });

    // Create transaction record
    const transaction = new Transaction({
      transactionId: `INV-${uuidv4().substring(0, 8)}`,
      user: req.user.id,
      relatedUser: invoice.freelancer,
      amount,
      fee: platformFee,
      netAmount,
      type: "payment",
      status: "completed",
      paymentMethod: paymentMethodId,
      project: invoice.project,
      invoice: invoice._id,
      description: `Payment for invoice ${invoice.invoiceNumber}`,
      metadata: {
        invoiceNumber: invoice.invoiceNumber,
      },
    });

    await transaction.save({ session });

    // Update invoice
    invoice.status = "paid";
    invoice.paidDate = Date.now();
    invoice.transaction = transaction._id;
    await invoice.save({ session });

    // Create platform fee transaction
    const feeTransaction = new Transaction({
      transactionId: `FEE-${uuidv4().substring(0, 8)}`,
      user: invoice.freelancer,
      amount: platformFee,
      netAmount: platformFee,
      type: "fee",
      status: "completed",
      invoice: invoice._id,
      description: "Platform fee for invoice payment",
      metadata: {
        originalTransactionId: transaction.transactionId,
        invoiceNumber: invoice.invoiceNumber,
      },
    });

    await feeTransaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: "Invoice paid successfully",
      data: { transaction, invoice },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({ success: false, message: "Server error" });
  }
};

// *** TRANSACTIONS ***

// Get all transactions for user
exports.getTransactions = async (req, res) => {
  try {
    const { type, status, startDate, endDate } = req.query;

    let query = { user: req.user.id };

    // Add filters if provided
    if (type) query.type = type;
    if (status) query.status = status;

    // Add date filter if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .populate("relatedUser", "name avatar")
      .populate("project", "title")
      .populate("invoice", "invoiceNumber")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get single transaction
exports.getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate("fromUser", "fullName avatar")
      .populate("toUser", "fullName avatar")
      .populate("project", "title")
      .populate("invoice")
      .populate("paymentMethod");

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: "Transaction not found",
      });
    }

    // Check if user is authorized to view this transaction
    if (
      transaction.fromUser &&
      transaction.fromUser._id.toString() !== req.user.id &&
      transaction.toUser &&
      transaction.toUser._id.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(401).json({
        success: false,
        error: "Not authorized to view this transaction",
      });
    }

    return res.json({
      success: true,
      data: transaction,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// *** BALANCE & STATISTICS ***

// Get user wallet/balance
exports.getWalletInfo = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user.id });

    // Create wallet if it doesn't exist
    if (!wallet) {
      wallet = new Wallet({ user: req.user.id });
      await wallet.save();
    }

    res.json({ success: true, data: wallet });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get earnings/spending statistics
exports.getStatistics = async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(new Date().getFullYear(), 0, 1); // Default: start of current year

    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date(); // Default: current date

    // Base time range filter
    const timeFilter = {
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    let statistics = {};

    if (req.user.role === "freelancer") {
      // For freelancers: calculate earnings
      const earnings = await Transaction.aggregate([
        {
          $match: {
            toUser: req.user.id,
            status: "completed",
            ...timeFilter,
          },
        },
        {
          $group: {
            _id: {
              month: { $month: "$createdAt" },
              year: { $year: "$createdAt" },
            },
            total: { $sum: "$netAmount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);

      // Get earnings by type
      const earningsByType = await Transaction.aggregate([
        {
          $match: {
            toUser: req.user.id,
            status: "completed",
            ...timeFilter,
          },
        },
        {
          $group: {
            _id: "$type",
            total: { $sum: "$netAmount" },
            count: { $sum: 1 },
          },
        },
      ]);

      statistics = {
        earnings,
        earningsByType,
        totalEarned: earnings.reduce((sum, item) => sum + item.total, 0),
        totalTransactions: earnings.reduce((sum, item) => sum + item.count, 0),
      };
    } else if (req.user.role === "client") {
      // For clients: calculate spending
      const spending = await Transaction.aggregate([
        {
          $match: {
            fromUser: req.user.id,
            ...timeFilter,
          },
        },
        {
          $group: {
            _id: {
              month: { $month: "$createdAt" },
              year: { $year: "$createdAt" },
            },
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);

      // Get spending by type
      const spendingByType = await Transaction.aggregate([
        {
          $match: {
            fromUser: req.user.id,
            ...timeFilter,
          },
        },
        {
          $group: {
            _id: "$type",
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]);

      statistics = {
        spending,
        spendingByType,
        totalSpent: spending.reduce((sum, item) => sum + item.total, 0),
        totalTransactions: spending.reduce((sum, item) => sum + item.count, 0),
      };
    }

    return res.json({
      success: true,
      data: statistics,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// Payment Statistics
exports.getPaymentStatistics = async (req, res) => {
  try {
    const { period } = req.query; // 'week', 'month', 'year'

    // Get date range
    let startDate = new Date();
    if (period === "week") {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === "month") {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === "year") {
      startDate.setFullYear(startDate.getFullYear() - 1);
    } else {
      // Default to last 30 days
      startDate.setDate(startDate.getDate() - 30);
    }

    // Get wallet info
    const wallet = await Wallet.findOne({ user: req.user.id });

    // Get transactions stats
    const transactions = await Transaction.find({
      user: req.user.id,
      createdAt: { $gte: startDate },
    });

    // Calculate income and spending based on user role and transaction types
    const isFreelancer = req.user.role === "freelancer";
    const isClient = req.user.role === "client";

    let income = 0;
    let spending = 0;

    transactions.forEach((tx) => {
      if (
        isFreelancer &&
        (tx.type === "payment" || tx.type === "milestone") &&
        tx.relatedUser?.toString() !== req.user.id
      ) {
        income += tx.netAmount;
      } else if (isClient && (tx.type === "payment" || tx.type === "milestone")) {
        spending += tx.amount;
      } else if (tx.type === "deposit") {
        income += tx.amount;
      } else if (tx.type === "withdrawal") {
        spending += tx.amount;
      }
    });

    // Get daily amounts for chart data
    const dailyData = [];
    const endDate = new Date();
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const dayTransactions = transactions.filter((tx) => tx.createdAt >= dayStart && tx.createdAt <= dayEnd);

      let dayIncome = 0;
      let daySpending = 0;

      dayTransactions.forEach((tx) => {
        if (
          isFreelancer &&
          (tx.type === "payment" || tx.type === "milestone") &&
          tx.relatedUser?.toString() !== req.user.id
        ) {
          dayIncome += tx.netAmount;
        } else if (isClient && (tx.type === "payment" || tx.type === "milestone")) {
          daySpending += tx.amount;
        } else if (tx.type === "deposit") {
          dayIncome += tx.amount;
        } else if (tx.type === "withdrawal") {
          daySpending += tx.amount;
        }
      });

      dailyData.push({
        date: dayStart.toISOString().split("T")[0],
        income: dayIncome,
        spending: daySpending,
      });

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate pending amounts
    const pendingInvoices = await Invoice.find({
      [isFreelancer ? "freelancer" : "client"]: req.user.id,
      status: "pending",
    });

    const pendingAmount = pendingInvoices.reduce((sum, invoice) => sum + invoice.total, 0);

    res.json({
      success: true,
      data: {
        currentBalance: wallet ? wallet.balance : 0,
        income,
        spending,
        pendingAmount,
        dailyData,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Helper functions
function getCardBrand(cardNumber) {
  // Simplified logic to determine card brand
  if (!cardNumber) return "Unknown";

  // Remove spaces and dashes
  cardNumber = cardNumber.replace(/[\s-]/g, "");

  if (/^4/.test(cardNumber)) return "Visa";
  if (/^5[1-5]/.test(cardNumber)) return "Mastercard";
  if (/^3[47]/.test(cardNumber)) return "American Express";
  if (/^6(?:011|5)/.test(cardNumber)) return "Discover";

  return "Unknown";
}

// *** GIFTOGRAM INTEGRATION ***

// Get giftogram configuration (for frontend)
exports.getGiftogramConfig = async (req, res) => {
  try {
    const config = giftogramService.getConfig();

    res.json({
      success: true,
      config: {
        environment: config.environment,
        defaultCampaignId: config.defaultCampaignId,
        hasApiKey: config.hasApiKey,
      },
    });
  } catch (error) {
    console.error("Error getting giftogram config:", error.message);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to get giftogram configuration",
    });
  }
};

// Get available gift card campaigns
exports.getGiftCardCampaigns = async (req, res) => {
  try {
    console.log(
      "🎁 CONTROLLER: User from token:",
      req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : "null"
    );

    const campaigns = await giftogramService.getCampaigns();

    let processedCampaigns = [];

    if (Array.isArray(campaigns)) {
      processedCampaigns = campaigns;
    } else if (campaigns && campaigns.data && Array.isArray(campaigns.data)) {
      processedCampaigns = campaigns.data;
    } else if (campaigns && campaigns.campaigns && Array.isArray(campaigns.campaigns)) {
      processedCampaigns = campaigns.campaigns;
    } else {
      processedCampaigns = [];
    }

    // Filter for active campaigns
    const activeCampaigns = processedCampaigns.filter((campaign) => {
      console.log("🎁 CONTROLLER: Checking campaign:", {
        id: campaign.id,
        name: campaign.name,
        active: campaign.active,
        type: campaign.type,
        status: campaign.status,
      });

      const isActive = campaign.active === true || campaign.active === "true";
      return isActive;
    });

    console.log(
      "🎁 CONTROLLER: Active campaign names:",
      activeCampaigns.map((c) => c.name)
    );
    console.log(
      "🎁 CONTROLLER: Active campaigns details:",
      activeCampaigns.map((c) => ({
        id: c.id,
        name: c.name,
        active: c.active,
        currencies: c.currencies,
        denominations: c.denominations,
      }))
    );

    const responseData = {
      success: true,
      message: "Gift card campaigns retrieved successfully",
      data: {
        campaigns: activeCampaigns,
        total: activeCampaigns.length,
      },
    };

    res.json(responseData);
  } catch (error) {
    const errorResponse = {
      success: false,
      message: error.message || "Failed to fetch gift card campaigns",
      error: process.env.NODE_ENV === "development" ? error.stack : "Internal server error",
    };

    res.status(500).json(errorResponse);
  }
};

// Withdraw funds as gift card
exports.withdrawAsGiftCard = async (req, res) => {
  console.log(
    "🎁 WITHDRAWAL CONTROLLER: User from token:",
    req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : "null"
  );

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, recipientEmail, recipientName, message } = req.body;
    const userId = req.user.id;

    // Get configured campaign ID from service
    const campaignId = giftogramService.getDefaultCampaignId();

    // Validation
    const validationResults = {
      hasCampaignId: !!campaignId,
      hasAmount: !!amount,
      hasRecipientEmail: !!recipientEmail,
      hasRecipientName: !!recipientName,
      amountIsPositive: amount > 0,
    };

    if (!amount || !recipientEmail || !recipientName) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Missing required fields: amount, recipientEmail, recipientName",
      });
    }

    if (amount <= 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    // Check user's wallet balance

    const wallet = await Wallet.findOne({ user: userId }).session(session);

    console.log("🎁 WITHDRAWAL CONTROLLER: Wallet check:", {
      walletFound: !!wallet,
      walletBalance: wallet ? wallet.balance : "N/A",
      requestedAmount: amount,
      hasSufficientBalance: wallet ? wallet.balance >= amount : false,
    });

    if (!wallet) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Wallet not found for user",
      });
    }

    if (wallet.balance < amount) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Insufficient balance for gift card withdrawal",
        data: {
          availableBalance: wallet.balance,
          requestedAmount: amount,
          shortfall: amount - wallet.balance,
        },
      });
    }

    // Get user details for sender information
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate unique transaction ID
    const transactionId = `GC-${uuidv4().substring(0, 8)}`;

    // Prepare gift card order data
    const orderData = {
      campaignId,
      amount,
      recipientEmail,
      recipientName,
      senderEmail: user.email,
      senderName: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
      message: message || "Congratulations on your earnings! Enjoy your gift card.",
      externalId: transactionId,
    };

    // Validate order data
    const validation = giftogramService.validateOrderData(orderData);
    if (!validation.valid) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    // Create gift card order with Giftogram

    const giftCardResult = await giftogramService.createGiftCardOrder(orderData);

    if (giftCardResult.success && giftCardResult.order) {
    }

    if (!giftCardResult.success) {
      await session.abortTransaction();
      return res.status(500).json({
        success: false,
        message: giftCardResult.error,
      });
    }

    // Deduct amount from wallet
    wallet.balance -= amount;
    await wallet.save({ session });

    // Create transaction record
    const transaction = new Transaction({
      transactionId,
      user: userId,
      amount: -amount, // Negative for withdrawal
      type: "gift_card_withdrawal",
      status: "completed",
      description: `Gift card withdrawal - ${giftCardResult.order.campaign_name || "Gift Card"}`,
      metadata: {
        giftogramOrderId: giftCardResult.order.order_id,
        campaignId,
        recipientEmail,
        recipientName,
        giftCardStatus: giftCardResult.order.status,
      },
    });

    await transaction.save({ session });

    await session.commitTransaction();

    const responseData = {
      success: true,
      data: {
        transaction: {
          id: transaction._id,
          transactionId,
          amount,
          type: "gift_card_withdrawal",
          status: "completed",
          giftCardOrder: {
            id: giftCardResult.order.order_id,
            status: giftCardResult.order.status,
            campaignName: giftCardResult.order.campaign_name,
            recipientEmail,
          },
          createdAt: transaction.createdAt,
        },
        newBalance: wallet.balance,
      },
    };

    res.json(responseData);
  } catch (error) {
    await session.abortTransaction();

    const errorResponse = {
      success: false,
      message: "Failed to process gift card withdrawal",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    };

    res.status(500).json(errorResponse);
  } finally {
    session.endSession();
  }
};

// Get gift card withdrawal history
exports.getGiftCardWithdrawals = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    console.log("🎁 GET WITHDRAWALS: Request params:", {
      userId,
      page,
      limit,
    });

    const transactions = await Transaction.find({
      user: userId,
      type: "gift_card_withdrawal",
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments({
      user: userId,
      type: "gift_card_withdrawal",
    });

    // Enrich with current gift card order status if needed
    const enrichedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        const transactionObj = transaction.toObject();

        if (transactionObj.metadata?.giftogramOrderId) {
          try {
            const orderResult = await giftogramService.getOrder(transactionObj.metadata.giftogramOrderId);
            if (orderResult.success) {
              transactionObj.giftCardOrder = orderResult.order;
            }
          } catch (error) {}
        }

        return transactionObj;
      })
    );

    res.json({
      success: true,
      data: {
        transactions: enrichedTransactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch gift card withdrawal history",
    });
  }
};

// Check gift card order status
exports.checkGiftCardOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    console.log("🎁 CHECK ORDER STATUS: Request params:", {
      userId,
      orderId,
    });

    // Verify the order belongs to the user
    const transaction = await Transaction.findOne({
      user: userId,
      "metadata.giftogramOrderId": orderId,
      type: "gift_card_withdrawal",
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Gift card order not found or access denied",
      });
    }

    // Get current order status from Giftogram
    const orderResult = await giftogramService.getOrder(orderId);

    if (!orderResult.success) {
      return res.status(500).json({
        success: false,
        message: orderResult.error,
      });
    }

    res.json({
      success: true,
      data: {
        order: orderResult.order,
        transaction: {
          id: transaction._id,
          transactionId: transaction.transactionId,
          amount: Math.abs(transaction.amount),
          status: transaction.status,
          createdAt: transaction.createdAt,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to check gift card order status",
    });
  }
};

// *** PAYPAL WITHDRAWAL INTEGRATION ***

// Withdraw funds via PayPal
exports.withdrawViaPayPal = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount } = req.body;
    const userId = req.user.id;

    console.log("💰 PAYPAL WITHDRAWAL: === STARTING PAYPAL WITHDRAWAL PROCESS ===");
    console.log("💰 PAYPAL WITHDRAWAL: Request received:", {
      userId,
      userEmail: req.user.email,
      userName: req.user.name,
      requestedAmount: amount,
      timestamp: new Date().toISOString(),
    });

    // Validate amount
    console.log("💰 PAYPAL WITHDRAWAL: Validating amount:", { amount, type: typeof amount });
    if (!amount || amount <= 0) {
      console.log("💰 PAYPAL WITHDRAWAL: ❌ Amount validation failed - invalid amount");
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Invalid amount. Amount must be greater than 0",
      });
    }
    console.log("💰 PAYPAL WITHDRAWAL: ✅ Amount validation passed");

    // Get user details for PayPal email
    console.log("💰 PAYPAL WITHDRAWAL: Fetching user details...");
    const user = await User.findById(userId).session(session);
    if (!user) {
      console.log("💰 PAYPAL WITHDRAWAL: ❌ User not found in database");
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("💰 PAYPAL WITHDRAWAL: User found:", {
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
      userRole: user.role,
    });

    if (!user.email) {
      console.log("💰 PAYPAL WITHDRAWAL: ❌ User email not found");
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "User email not found. Please update your profile with a valid PayPal email.",
      });
    }
    console.log("💰 PAYPAL WITHDRAWAL: ✅ User email validation passed");

    // Get user's wallet
    console.log("💰 PAYPAL WITHDRAWAL: Fetching user wallet...");
    const wallet = await Wallet.findOne({ user: userId }).session(session);
    if (!wallet) {
      console.log("💰 PAYPAL WITHDRAWAL: ❌ Wallet not found for user");
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Wallet not found for user",
      });
    }

    console.log("💰 PAYPAL WITHDRAWAL: Wallet found:", {
      walletId: wallet._id,
      currentBalance: wallet.balance,
      totalEarned: wallet.totalEarned,
    });

    // Check if user has sufficient balance
    console.log("💰 PAYPAL WITHDRAWAL: Checking balance sufficiency...");
    if (wallet.balance < amount) {
      console.log("💰 PAYPAL WITHDRAWAL: ❌ Insufficient balance:", {
        availableBalance: wallet.balance,
        requestedAmount: amount,
        shortfall: amount - wallet.balance,
      });
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Insufficient balance for PayPal withdrawal",
        data: {
          availableBalance: wallet.balance,
          requestedAmount: amount,
          shortfall: amount - wallet.balance,
        },
      });
    }
    console.log("💰 PAYPAL WITHDRAWAL: ✅ Balance check passed");

    // Calculate withdrawal fee (example: 1% fee)
    const fee = amount * 0.01;
    const netAmount = amount - fee;

    console.log("💰 PAYPAL WITHDRAWAL: Fee calculation:", {
      grossAmount: amount,
      feePercentage: "1%",
      platformFee: fee,
      netAmountToSend: netAmount,
    });

    // Generate unique transaction ID
    const transactionId = `PP-${uuidv4().substring(0, 8)}`;

    console.log("💰 PAYPAL WITHDRAWAL: Generated transaction ID:", transactionId);
    console.log("💰 PAYPAL WITHDRAWAL: === INITIATING PAYPAL PAYOUT ===");
    console.log("💰 PAYPAL WITHDRAWAL: Payout details:", {
      recipientEmail: user.email,
      netAmountToSend: netAmount,
      transactionId,
      timestamp: new Date().toISOString(),
    });

    // Import PayPal service
    const paypalService = require("../services/paypalService");

    // Create PayPal payout
    console.log("💰 PAYPAL WITHDRAWAL: Calling PayPal service to create payout...");
    const payoutResult = await paypalService.createPayout(
      user.email,
      netAmount,
      `User withdrawal from StudiesHQ - ${transactionId}`,
      transactionId
    );

    console.log("💰 PAYPAL WITHDRAWAL: PayPal service response:", {
      success: payoutResult.success,
      payoutBatchId: payoutResult.payoutBatchId,
      batchStatus: payoutResult.batchStatus,
      error: payoutResult.error,
    });

    if (!payoutResult.success) {
      console.log("💰 PAYPAL WITHDRAWAL: ❌ PayPal payout failed:", {
        error: payoutResult.error,
        details: payoutResult.details,
      });
      await session.abortTransaction();
      return res.status(500).json({
        success: false,
        message: "Failed to create PayPal payout: " + payoutResult.error,
        details: payoutResult.details,
      });
    }

    console.log("💰 PAYPAL WITHDRAWAL: ✅ PayPal payout created successfully!");
    console.log("💰 PAYPAL WITHDRAWAL: PayPal response details:", {
      payoutBatchId: payoutResult.payoutBatchId,
      batchStatus: payoutResult.batchStatus,
      timeCreated: payoutResult.timeCreated,
      senderBatchId: payoutResult.sender_batch_id,
    });

    // Deduct amount from wallet
    console.log("💰 PAYPAL WITHDRAWAL: === UPDATING DATABASE ===");
    console.log("💰 PAYPAL WITHDRAWAL: Deducting amount from wallet...");
    console.log("💰 PAYPAL WITHDRAWAL: Wallet balance before:", wallet.balance);
    wallet.balance -= amount;
    console.log("💰 PAYPAL WITHDRAWAL: Wallet balance after:", wallet.balance);
    await wallet.save({ session });
    console.log("💰 PAYPAL WITHDRAWAL: ✅ Wallet updated successfully");

    // Create transaction record
    console.log("💰 PAYPAL WITHDRAWAL: Creating transaction record...");
    const transaction = new Transaction({
      transactionId,
      user: userId,
      amount: -amount, // Negative for withdrawal
      fee,
      netAmount: -netAmount, // Negative for net amount sent out
      type: "paypal_withdrawal",
      status: payoutResult.batchStatus === "PENDING" ? "pending" : "completed",
      description: `PayPal withdrawal to ${user.email}`,
      metadata: {
        paypalPayoutBatchId: payoutResult.payoutBatchId,
        paypalBatchStatus: payoutResult.batchStatus,
        recipientEmail: user.email,
        paypalTimeCreated: payoutResult.timeCreated,
        senderBatchId: payoutResult.sender_batch_id,
      },
    });

    await transaction.save({ session });
    console.log("💰 PAYPAL WITHDRAWAL: ✅ Transaction record created:", {
      transactionId: transaction.transactionId,
      transactionDbId: transaction._id,
      status: transaction.status,
      type: transaction.type,
    });

    await session.commitTransaction();
    console.log("💰 PAYPAL WITHDRAWAL: ✅ Database transaction committed");

    console.log("💰 PAYPAL WITHDRAWAL: === WITHDRAWAL PROCESS COMPLETED SUCCESSFULLY ===");

    const responseData = {
      success: true,
      data: {
        transaction: {
          id: transaction._id,
          transactionId,
          amount,
          fee,
          netAmount: Math.abs(netAmount),
          type: "paypal_withdrawal",
          status: transaction.status,
          paypalPayout: {
            batchId: payoutResult.payoutBatchId,
            batchStatus: payoutResult.batchStatus,
            recipientEmail: user.email,
            timeCreated: payoutResult.timeCreated,
          },
          createdAt: transaction.createdAt,
        },
        newBalance: wallet.balance,
      },
    };

    console.log("💰 PAYPAL WITHDRAWAL: Sending success response to frontend:", {
      transactionId,
      newBalance: wallet.balance,
      paypalBatchId: payoutResult.payoutBatchId,
      status: transaction.status,
    });

    res.json(responseData);
  } catch (error) {
    await session.abortTransaction();
    console.error("💰 PAYPAL WITHDRAWAL: === ERROR OCCURRED ===");
    console.error("💰 PAYPAL WITHDRAWAL: Error type:", error.constructor.name);
    console.error("💰 PAYPAL WITHDRAWAL: Error message:", error.message);
    console.error("💰 PAYPAL WITHDRAWAL: Error stack:", error.stack);
    console.error("💰 PAYPAL WITHDRAWAL: === END ERROR DETAILS ===");

    const errorResponse = {
      success: false,
      message: "Failed to process PayPal withdrawal",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    };

    console.log("💰 PAYPAL WITHDRAWAL: Sending error response to frontend:", errorResponse);
    res.status(500).json(errorResponse);
  } finally {
    console.log("💰 PAYPAL WITHDRAWAL: Ending database session");
    session.endSession();
    console.log("💰 PAYPAL WITHDRAWAL: === PAYPAL WITHDRAWAL PROCESS FINISHED ===");
  }
};

// Get PayPal withdrawal history
exports.getPayPalWithdrawals = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    console.log("💰 GET PAYPAL WITHDRAWALS: Request params:", {
      userId,
      page,
      limit,
    });

    const transactions = await Transaction.find({
      user: userId,
      type: "paypal_withdrawal",
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments({
      user: userId,
      type: "paypal_withdrawal",
    });

    // Enrich with current PayPal payout status if needed
    const enrichedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        const transactionObj = transaction.toObject();

        if (transactionObj.metadata?.paypalPayoutBatchId) {
          try {
            const paypalService = require("../services/paypalService");
            const statusResult = await paypalService.getPayoutStatus(transactionObj.metadata.paypalPayoutBatchId);
            if (statusResult.success) {
              transactionObj.paypalPayout = statusResult.batch;
            }
          } catch (error) {
            console.warn("Failed to fetch PayPal payout status:", error.message);
          }
        }

        return transactionObj;
      })
    );

    res.json({
      success: true,
      data: {
        transactions: enrichedTransactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("💰 GET PAYPAL WITHDRAWALS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch PayPal withdrawal history",
    });
  }
};

// Check PayPal payout status
exports.checkPayPalPayoutStatus = async (req, res) => {
  try {
    const { batchId } = req.params;
    const userId = req.user.id;

    console.log("💰 CHECK PAYPAL PAYOUT STATUS: Request params:", {
      userId,
      batchId,
    });

    // Verify the payout belongs to the user
    const transaction = await Transaction.findOne({
      user: userId,
      "metadata.paypalPayoutBatchId": batchId,
      type: "paypal_withdrawal",
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "PayPal payout not found or access denied",
      });
    }

    // Get current payout status from PayPal
    const paypalService = require("../services/paypalService");
    const statusResult = await paypalService.getPayoutStatus(batchId);

    if (!statusResult.success) {
      return res.status(500).json({
        success: false,
        message: statusResult.error,
      });
    }

    res.json({
      success: true,
      data: {
        payout: statusResult.batch,
        transaction: {
          id: transaction._id,
          transactionId: transaction.transactionId,
          amount: Math.abs(transaction.amount),
          status: transaction.status,
          createdAt: transaction.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("💰 CHECK PAYPAL PAYOUT STATUS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check PayPal payout status",
    });
  }
};

// *** XE API BANK DETAILS INTEGRATION ***

// Get payment fields for a specific country and currency
exports.getPaymentFields = async (req, res) => {
  try {
    const { countryCode, currencyCode } = req.params;

    if (!countryCode || !currencyCode) {
      return res.status(400).json({
        success: false,
        message: "Country code and currency code are required",
      });
    }

    console.log("🏦 PAYMENT CONTROLLER: Getting payment fields for:", { countryCode, currencyCode });

    const result = await xeApiService.getPaymentFields(countryCode, currencyCode);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to get payment fields",
        error: result.error,
      });
    }

    res.json({
      success: true,
      data: result.fields,
    });
  } catch (error) {
    console.error("🏦 PAYMENT CONTROLLER: Error getting payment fields:", error);
    res.status(500).json({
      success: false,
      message: "Server error while getting payment fields",
    });
  }
};

// Get supported countries
exports.getSupportedCountries = async (req, res) => {
  try {
    console.log("🏦 PAYMENT CONTROLLER: Getting supported countries");

    const result = await xeApiService.getSupportedCountries();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to get supported countries",
        error: result.error,
      });
    }

    res.json({
      success: true,
      data: result.countries,
    });
  } catch (error) {
    console.error("🏦 PAYMENT CONTROLLER: Error getting supported countries:", error);
    res.status(500).json({
      success: false,
      message: "Server error while getting supported countries",
    });
  }
};

// Get supported currencies for a country
exports.getSupportedCurrencies = async (req, res) => {
  try {
    const { countryCode } = req.params;

    if (!countryCode) {
      return res.status(400).json({
        success: false,
        message: "Country code is required",
      });
    }

    console.log("🏦 PAYMENT CONTROLLER: Getting supported currencies for:", countryCode);

    const result = await xeApiService.getSupportedCurrencies(countryCode);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to get supported currencies",
        error: result.error,
      });
    }

    res.json({
      success: true,
      data: result.currencies,
    });
  } catch (error) {
    console.error("🏦 PAYMENT CONTROLLER: Error getting supported currencies:", error);
    res.status(500).json({
      success: false,
      message: "Server error while getting supported currencies",
    });
  }
};

// Add bank details payment method
exports.addBankPaymentMethod = async (req, res) => {
  try {
    const { consumerDetails, bankDetails, countryCode, currencyCode } = req.body;

    // Validate required fields
    if (!consumerDetails || !bankDetails || !countryCode || !currencyCode) {
      return res.status(400).json({
        success: false,
        message: "Consumer details, bank details, country code, and currency code are required",
      });
    }

    // Validate consumer details structure - Enhanced validation
    const requiredConsumerFields = ["givenNames", "familyName", "address"];
    for (const field of requiredConsumerFields) {
      if (!consumerDetails[field]) {
        return res.status(400).json({
          success: false,
          message: `Consumer ${field} is required`,
        });
      }
    }

    // Validate complete address information is mandatory
    const requiredAddressFields = ["country", "line1"];
    for (const field of requiredAddressFields) {
      if (!consumerDetails.address[field] || !consumerDetails.address[field].trim()) {
        return res.status(400).json({
          success: false,
          message: `Consumer address ${field} is required and cannot be empty`,
        });
      }
    }

    // Additional validation for address completeness
    if (!consumerDetails.address.locality && !consumerDetails.address.region) {
      return res.status(400).json({
        success: false,
        message: "Either city/locality or state/region is required for complete address information",
      });
    }

    // Validate bank details are not empty
    if (!bankDetails || Object.keys(bankDetails).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Bank details are required and cannot be empty",
      });
    }

    // Validate bank account name (optional field)
    if (bankDetails.bankName && bankDetails.bankName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Bank Name must be 100 characters or less",
      });
    }

    // Validate account type if provided (optional field)
    if (bankDetails.accountType && bankDetails.accountType.trim()) {
      const validAccountTypes = [
        "Savings",
        "Current",
        "Checking",
        "NRE",
        "NRO",
        "Loan",
        "Overdraft",
        "CashCredit",
        "Business",
        "Corporate",
      ];

      if (!validAccountTypes.includes(bankDetails.accountType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid account type. Please select a valid account type.",
        });
      }
    }

    // Auto-populate bank location with country code if not provided
    if (bankDetails && !bankDetails.location) {
      bankDetails.location = countryCode;
      console.log("🏦 PAYMENT CONTROLLER: Auto-populated bank location with country code:", countryCode);
    }

    console.log("🏦 PAYMENT CONTROLLER: Adding bank payment method for user:", req.user.id);
    console.log("🏦 PAYMENT CONTROLLER: Consumer details:", {
      name: `${consumerDetails.givenNames} ${consumerDetails.familyName}`,
      country: consumerDetails.address.country,
      hasAddress: !!(consumerDetails.address.line1 && consumerDetails.address.country),
    });

    // If this is the first payment method, set it as default
    const existingMethods = await PaymentMethod.countDocuments({ user: req.user.id });
    const isDefault = existingMethods === 0;

    // Create payment method record using the updated schema
    const paymentMethod = new PaymentMethod({
      user: req.user.id,
      type: "bank",
      provider: "xe",
      consumerDetails: {
        givenNames: consumerDetails.givenNames,
        familyName: consumerDetails.familyName,
        emailAddress: consumerDetails.emailAddress,
        mobileNumber: consumerDetails.mobileNumber,
        phoneNumber: consumerDetails.phoneNumber,
        title: consumerDetails.title,
        idCountry: consumerDetails.idCountry,
        idType: consumerDetails.idType,
        idNumber: consumerDetails.idNumber,
        taxNumber: consumerDetails.taxNumber,
        address: {
          line1: consumerDetails.address.line1,
          line2: consumerDetails.address.line2,
          country: consumerDetails.address.country,
          locality: consumerDetails.address.locality,
          region: consumerDetails.address.region,
          postcode: consumerDetails.address.postcode,
        },
      },
      bankDetails: bankDetails,
      countryCode: countryCode,
      currencyCode: currencyCode,
      details: {
        // Only store metadata and processing information, not the actual data
        autoPopulatedLocation: bankDetails.location === countryCode,
        submissionTimestamp: new Date().toISOString(),
        validationPassed: true,
      },
      isDefault: isDefault,
    });

    await paymentMethod.save();

    console.log("🏦 PAYMENT CONTROLLER: ✅ Bank payment method added successfully:", {
      id: paymentMethod._id,
      isDefault: paymentMethod.isDefault,
      autoPopulatedLocation: bankDetails.location === countryCode,
    });

    // Create XE recipient automatically after saving payment method
    let xeRecipientInfo = null;
    try {
      console.log("🏦 PAYMENT CONTROLLER: Creating XE recipient for payment method:", paymentMethod._id);

      const xeResult = await xeApiService.createRecipient(paymentMethod, req.user.id);

      if (xeResult.success && xeResult.recipient) {
        console.log("🏦 PAYMENT CONTROLLER: ✅ XE recipient API response received:", {
          recipientId: xeResult.recipient.recipientId?.xeRecipientId,
          clientReference: xeResult.recipient.recipientId?.clientReference,
          currency: xeResult.recipient.currency,
        });

        // Create XE recipient record with complete response data
        const xeRecipient = new XeRecipient({
          paymentMethod: paymentMethod._id,
          user: req.user.id,
          xeRecipientId: xeResult.recipient.recipientId.xeRecipientId,
          clientReference: xeResult.recipient.recipientId.clientReference,
          currency: xeResult.recipient.currency,
          payoutMethod: xeResult.recipient.payoutMethod,
          entity: xeResult.recipient.entity,
          status: "active",
          rawResponse: xeResult.recipient, // Store complete response for debugging
        });

        await xeRecipient.save();

        // Store minimal reference in payment method for quick access
        paymentMethod.details.xeRecipientId = xeResult.recipient.recipientId.xeRecipientId;
        paymentMethod.details.xeRecipientDocId = xeRecipient._id.toString();
        paymentMethod.details.xeRecipientCreatedAt = new Date().toISOString();

        // Mark payment method as approved since XE recipient was successfully created
        paymentMethod.approved = true;

        await paymentMethod.save();

        xeRecipientInfo = {
          recipientId: xeResult.recipient.recipientId.xeRecipientId,
          clientReference: xeResult.recipient.recipientId.clientReference,
          currency: xeResult.recipient.currency,
          documentId: xeRecipient._id,
          status: "created",
        };

        console.log("🏦 PAYMENT CONTROLLER: ✅ XE recipient saved to database:", {
          documentId: xeRecipient._id,
          recipientId: xeResult.recipient.recipientId.xeRecipientId,
          clientReference: xeResult.recipient.recipientId.clientReference,
        });
      } else {
        console.error("🏦 PAYMENT CONTROLLER: ❌ Failed to create XE recipient:", xeResult.error);

        // Create failed XE recipient record for retry tracking
        const xeRecipient = new XeRecipient({
          paymentMethod: paymentMethod._id,
          user: req.user.id,
          xeRecipientId: `failed-${Date.now()}`, // Temporary ID for failed records
          clientReference: `failed-${paymentMethod._id}`,
          currency: currencyCode,
          status: "failed",
          errorInfo: {
            message: xeResult.error,
            lastAttempt: new Date(),
            retryCount: 1,
          },
          rawResponse: xeResult, // Store error response
        });

        await xeRecipient.save();

        // Store minimal failure reference in payment method
        paymentMethod.details.xeRecipientError = xeResult.error;
        paymentMethod.details.xeRecipientDocId = xeRecipient._id.toString();
        paymentMethod.details.xeRecipientLastAttempt = new Date().toISOString();

        await paymentMethod.save();

        xeRecipientInfo = {
          status: "failed",
          error: xeResult.error,
          details: xeResult.details,
          documentId: xeRecipient._id,
        };
      }
    } catch (xeError) {
      console.error("🏦 PAYMENT CONTROLLER: ❌ XE recipient creation error:", xeError.message);

      try {
        // Create failed XE recipient record for error tracking
        const xeRecipient = new XeRecipient({
          paymentMethod: paymentMethod._id,
          user: req.user.id,
          xeRecipientId: `error-${Date.now()}`, // Temporary ID for error records
          clientReference: `error-${paymentMethod._id}`,
          currency: currencyCode,
          status: "failed",
          errorInfo: {
            message: xeError.message,
            lastAttempt: new Date(),
            retryCount: 1,
          },
        });

        await xeRecipient.save();

        // Store minimal error reference in payment method
        paymentMethod.details.xeRecipientError = xeError.message;
        paymentMethod.details.xeRecipientDocId = xeRecipient._id.toString();
        paymentMethod.details.xeRecipientLastAttempt = new Date().toISOString();

        await paymentMethod.save();

        xeRecipientInfo = {
          status: "failed",
          error: xeError.message,
          details: null, // No structured details for general errors
          documentId: xeRecipient._id,
        };
      } catch (dbError) {
        console.error("🏦 PAYMENT CONTROLLER: ❌ Failed to save XE recipient error to database:", dbError.message);

        xeRecipientInfo = {
          status: "failed",
          error: xeError.message,
          details: null, // No structured details for general errors
        };
      }
    }

    res.status(201).json({
      success: true,
      message: "Bank payment method added successfully",
      data: {
        id: paymentMethod._id,
        type: paymentMethod.type,
        provider: paymentMethod.provider,
        countryCode,
        currencyCode,
        consumerName: `${consumerDetails.givenNames} ${consumerDetails.familyName}`,
        isDefault: paymentMethod.isDefault,
        approved: paymentMethod.approved,
        hasCompleteAddress: !!(consumerDetails.address.line1 && consumerDetails.address.country),
        bankLocationAutoPopulated: bankDetails.location === countryCode,
        createdAt: paymentMethod.createdAt,
        xeRecipient: xeRecipientInfo,
      },
    });
  } catch (error) {
    console.error("🏦 PAYMENT CONTROLLER: Error adding bank payment method:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding bank payment method",
    });
  }
};

// Retry XE recipient creation for failed payment methods
exports.retryXeRecipientCreation = async (req, res) => {
  try {
    const { paymentMethodId } = req.params;

    // Get payment method
    const paymentMethod = await PaymentMethod.findOne({
      _id: paymentMethodId,
      user: req.user.id,
      type: "bank",
      provider: "xe",
    });

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: "Payment method not found or not eligible for XE recipient creation",
      });
    }

    // Get existing XE recipient record
    const existingXeRecipient = await XeRecipient.findOne({
      paymentMethod: paymentMethodId,
      user: req.user.id,
    });

    if (existingXeRecipient && existingXeRecipient.status === "active") {
      return res.status(400).json({
        success: false,
        message: "XE recipient already exists and is active for this payment method",
      });
    }

    console.log("🏦 PAYMENT CONTROLLER: Retrying XE recipient creation for payment method:", paymentMethodId);

    // Attempt to create XE recipient
    const xeResult = await xeApiService.createRecipient(paymentMethod, req.user.id);

    if (xeResult.success && xeResult.recipient) {
      console.log("🏦 PAYMENT CONTROLLER: ✅ XE recipient API response received on retry:", {
        recipientId: xeResult.recipient.recipientId?.xeRecipientId,
        clientReference: xeResult.recipient.recipientId?.clientReference,
        currency: xeResult.recipient.currency,
      });

      if (existingXeRecipient) {
        // Update existing failed record
        existingXeRecipient.xeRecipientId = xeResult.recipient.recipientId.xeRecipientId;
        existingXeRecipient.clientReference = xeResult.recipient.recipientId.clientReference;
        existingXeRecipient.currency = xeResult.recipient.currency;
        existingXeRecipient.payoutMethod = xeResult.recipient.payoutMethod;
        existingXeRecipient.entity = xeResult.recipient.entity;
        existingXeRecipient.status = "active";
        existingXeRecipient.rawResponse = xeResult.recipient;
        existingXeRecipient.errorInfo = undefined; // Clear error info

        await existingXeRecipient.save();
      } else {
        // Create new XE recipient record
        const xeRecipient = new XeRecipient({
          paymentMethod: paymentMethod._id,
          user: req.user.id,
          xeRecipientId: xeResult.recipient.recipientId.xeRecipientId,
          clientReference: xeResult.recipient.recipientId.clientReference,
          currency: xeResult.recipient.currency,
          payoutMethod: xeResult.recipient.payoutMethod,
          entity: xeResult.recipient.entity,
          status: "active",
          rawResponse: xeResult.recipient,
        });

        await xeRecipient.save();
        existingXeRecipient = xeRecipient;
      }

      // Update payment method details
      paymentMethod.details.xeRecipientId = xeResult.recipient.recipientId.xeRecipientId;
      paymentMethod.details.xeRecipientDocId = existingXeRecipient._id.toString();
      paymentMethod.details.xeRecipientCreatedAt = new Date().toISOString();

      // Clear previous error information
      delete paymentMethod.details.xeRecipientError;
      delete paymentMethod.details.xeRecipientLastAttempt;

      // Mark payment method as approved since XE recipient was successfully created
      paymentMethod.approved = true;

      await paymentMethod.save();

      console.log("🏦 PAYMENT CONTROLLER: ✅ XE recipient created successfully on retry:", {
        documentId: existingXeRecipient._id,
        recipientId: xeResult.recipient.recipientId.xeRecipientId,
        clientReference: xeResult.recipient.recipientId.clientReference,
      });

      res.json({
        success: true,
        message: "XE recipient created successfully",
        data: {
          recipientId: xeResult.recipient.recipientId.xeRecipientId,
          clientReference: xeResult.recipient.recipientId.clientReference,
          currency: xeResult.recipient.currency,
          documentId: existingXeRecipient._id,
        },
      });
    } else {
      console.error("🏦 PAYMENT CONTROLLER: ❌ XE recipient creation failed on retry:", xeResult.error);

      if (existingXeRecipient) {
        // Update existing record with retry information
        await existingXeRecipient.incrementRetryCount();
        existingXeRecipient.errorInfo.message = xeResult.error;
        existingXeRecipient.rawResponse = xeResult;
        await existingXeRecipient.save();
      }

      // Update payment method error information
      paymentMethod.details.xeRecipientError = xeResult.error;
      paymentMethod.details.xeRecipientLastAttempt = new Date().toISOString();
      await paymentMethod.save();

      res.status(400).json({
        success: false,
        message: "Failed to create XE recipient",
        error: xeResult.error,
      });
    }
  } catch (error) {
    console.error("🏦 PAYMENT CONTROLLER: Error retrying XE recipient creation:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrying XE recipient creation",
    });
  }
};

// Get XE recipient details for a payment method
exports.getXeRecipientDetails = async (req, res) => {
  try {
    const { paymentMethodId } = req.params;

    // Verify payment method belongs to user
    const paymentMethod = await PaymentMethod.findOne({
      _id: paymentMethodId,
      user: req.user.id,
    });

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: "Payment method not found",
      });
    }

    // Get XE recipient details
    const xeRecipient = await XeRecipient.findByPaymentMethod(paymentMethodId);

    if (!xeRecipient) {
      return res.status(404).json({
        success: false,
        message: "XE recipient not found for this payment method",
      });
    }

    res.json({
      success: true,
      data: xeRecipient,
    });
  } catch (error) {
    console.error("🏦 PAYMENT CONTROLLER: Error getting XE recipient details:", error);
    res.status(500).json({
      success: false,
      message: "Server error while getting XE recipient details",
    });
  }
};

// Get all XE recipients for current user
exports.getUserXeRecipients = async (req, res) => {
  try {
    const { status } = req.query;

    let query = { user: req.user.id };
    if (status) {
      query.status = status;
    }

    const xeRecipients = await XeRecipient.find(query)
      .populate("paymentMethod", "type provider countryCode currencyCode isDefault")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: xeRecipients.length,
      data: xeRecipients,
    });
  } catch (error) {
    console.error("🏦 PAYMENT CONTROLLER: Error getting user XE recipients:", error);
    res.status(500).json({
      success: false,
      message: "Server error while getting XE recipients",
    });
  }
};

// Get failed XE recipients for retry
exports.getFailedXeRecipients = async (req, res) => {
  try {
    const failedRecipients = await XeRecipient.getFailedRecipients(req.user.id);

    res.json({
      success: true,
      count: failedRecipients.length,
      data: failedRecipients,
    });
  } catch (error) {
    console.error("🏦 PAYMENT CONTROLLER: Error getting failed XE recipients:", error);
    res.status(500).json({
      success: false,
      message: "Server error while getting failed XE recipients",
    });
  }
};

// Update existing bank payment method
exports.updateBankPaymentMethod = async (req, res) => {
  try {
    const { paymentMethodId } = req.params;
    const { consumerDetails, bankDetails, countryCode, currencyCode } = req.body;

    // Validate required fields
    if (!consumerDetails || !bankDetails || !countryCode || !currencyCode) {
      return res.status(400).json({
        success: false,
        message: "Consumer details, bank details, country code, and currency code are required",
      });
    }

    // Find the payment method
    const paymentMethod = await PaymentMethod.findOne({
      _id: paymentMethodId,
      user: req.user.id,
      type: "bank",
      provider: "xe",
    });

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: "Bank payment method not found",
      });
    }

    // Update the payment method
    paymentMethod.consumerDetails = {
      givenNames: consumerDetails.givenNames,
      familyName: consumerDetails.familyName,
      emailAddress: consumerDetails.emailAddress,
      mobileNumber: consumerDetails.mobileNumber,
      phoneNumber: consumerDetails.phoneNumber,
      title: consumerDetails.title,
      idCountry: consumerDetails.idCountry,
      idType: consumerDetails.idType,
      idNumber: consumerDetails.idNumber,
      taxNumber: consumerDetails.taxNumber,
      address: {
        line1: consumerDetails.address.line1,
        line2: consumerDetails.address.line2,
        country: consumerDetails.address.country,
        locality: consumerDetails.address.locality,
        region: consumerDetails.address.region,
        postcode: consumerDetails.address.postcode,
      },
    };
    paymentMethod.bankDetails = bankDetails;
    paymentMethod.countryCode = countryCode;
    paymentMethod.currencyCode = currencyCode;
    paymentMethod.details.updatedAt = new Date().toISOString();

    await paymentMethod.save();

    res.json({
      success: true,
      message: "Bank payment method updated successfully",
      data: {
        id: paymentMethod._id,
        type: paymentMethod.type,
        provider: paymentMethod.provider,
        countryCode,
        currencyCode,
        consumerName: `${consumerDetails.givenNames} ${consumerDetails.familyName}`,
        isDefault: paymentMethod.isDefault,
        approved: paymentMethod.approved,
        updatedAt: paymentMethod.details.updatedAt,
      },
    });
  } catch (error) {
    console.error("🏦 PAYMENT CONTROLLER: Error updating bank payment method:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating bank payment method",
    });
  }
};

// Get XE FX quotation for withdrawal
exports.getXeFxQuotation = async (req, res) => {
  try {
    const { paymentMethodId } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid withdrawal amount is required",
      });
    }

    // Verify payment method belongs to user
    const paymentMethod = await PaymentMethod.findOne({
      _id: paymentMethodId,
      user: req.user.id,
      type: "bank",
      provider: "xe",
    });

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: "Bank payment method not found",
      });
    }

    // Get XE recipient details
    const xeRecipient = await XeRecipient.findByPaymentMethod(paymentMethodId);
    if (!xeRecipient || xeRecipient.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Active XE recipient not found for this payment method",
      });
    }

    // Get FX quotation from XE API
    const countryCode = xeApiService.getCountryCodeFromCurrency(xeRecipient.currency);
    const quotationResult = await xeApiService.getFxQuotation(amount, paymentMethod.currencyCode, countryCode);

    if (!quotationResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to get FX quotation",
        error: quotationResult.error,
      });
    }

    res.json({
      success: true,
      data: {
        quotation: quotationResult.quotation,
        sourceAmount: amount,
        sourceCurrency: paymentMethod.currencyCode,
        targetCurrency: xeRecipient.currency,
        exchangeRate: quotationResult.quotation?.rate,
        targetAmount: quotationResult.quotation?.targetAmount,
        validUntil: quotationResult.quotation?.validUntil,
      },
    });
  } catch (error) {
    console.error("🏦 PAYMENT CONTROLLER: Error getting XE FX quotation:", error);
    res.status(500).json({
      success: false,
      message: "Server error while getting FX quotation",
    });
  }
};

// Proceed with XE withdrawal
exports.proceedXeWithdrawal = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { paymentMethodId } = req.params;
    const { amount, purpose } = req.body;

    if (!amount || amount <= 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Valid withdrawal amount is required",
      });
    }

    // Verify payment method belongs to user
    const paymentMethod = await PaymentMethod.findOne({
      _id: paymentMethodId,
      user: req.user.id,
      type: "bank",
      provider: "xe",
    }).session(session);

    if (!paymentMethod) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Bank payment method not found",
      });
    }

    // Get XE recipient details
    const xeRecipient = await XeRecipient.findByPaymentMethod(paymentMethodId);
    if (!xeRecipient || xeRecipient.status !== "active") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Active XE recipient not found for this payment method",
      });
    }

    // Check user's wallet balance
    const wallet = await Wallet.findOne({ user: req.user.id }).session(session);
    if (!wallet || wallet.balance < amount) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Insufficient balance for XE withdrawal",
        data: {
          availableBalance: wallet ? wallet.balance : 0,
          requestedAmount: amount,
          shortfall: amount - (wallet ? wallet.balance : 0),
        },
      });
    }

    // Get FX quotation
    const countryCode = xeApiService.getCountryCodeFromCurrency(xeRecipient.currency);
    const quotationResult = await xeApiService.getFxQuotation(
      amount,
      paymentMethod.currencyCode,
      countryCode,
      xeRecipient.xeRecipientId
    );

    if (!quotationResult.success) {
      await session.abortTransaction();
      return res.status(500).json({
        success: false,
        message: "Failed to get FX quotation for withdrawal",
        error: quotationResult.error,
      });
    }

    // Create XE payment
    const paymentResult = await xeApiService.createPayment({
      amount: amount,
      sourceCurrency: paymentMethod.currencyCode,
      targetCurrency: xeRecipient.currency,
      recipientId: xeRecipient.xeRecipientId,
      clientReference: `shq${req.user.id.slice(-6)}${Date.now().toString().slice(-8)}`,
      purpose: purpose || "Withdrawal from StudiesHQ",
      quotationId: quotationResult.quotation?.id,
    });

    if (!paymentResult.success) {
      await session.abortTransaction();
      return res.status(500).json({
        success: false,
        message: "Failed to create XE payment",
        error: paymentResult.error,
      });
    }

    // Approve the contract if we have a contract number
    let contractApprovalResult = null;
    if (paymentResult.contractNumber) {
      console.log(`🏦 PAYMENT CONTROLLER: Approving contract ${paymentResult.contractNumber}...`);
      contractApprovalResult = await xeApiService.approveContract(paymentResult.contractNumber);

      if (!contractApprovalResult.success) {
        console.error(`🏦 PAYMENT CONTROLLER: Failed to approve contract:`, contractApprovalResult.error);
        // Note: We don't abort the transaction here as the payment was created successfully
        // The contract can be approved later manually if needed
      } else {
        console.log(`🏦 PAYMENT CONTROLLER: ✅ Contract approved successfully`);
      }
    }

    // Deduct amount from wallet
    wallet.balance -= amount;
    await wallet.save({ session });

    // Create transaction record
    const transactionId = `XE-${uuidv4().substring(0, 8)}`;
    const transaction = new Transaction({
      transactionId,
      user: req.user.id,
      amount: -amount, // Negative for withdrawal
      type: "xe_withdrawal",
      status: "pending", // XE payments typically start as pending
      description: `XE withdrawal to ${xeRecipient.currency}`,
      metadata: {
        xePaymentId: paymentResult.payment?.id,
        xeRecipientId: xeRecipient.xeRecipientId,
        contractNumber: paymentResult.contractNumber,
        contractApproved: contractApprovalResult?.success || false,
        contractApprovalError: contractApprovalResult?.error || null,
        sourceCurrency: paymentMethod.currencyCode,
        targetCurrency: xeRecipient.currency,
        exchangeRate: quotationResult.quotation?.rate,
        targetAmount: quotationResult.quotation?.targetAmount,
        purpose: purpose || "Withdrawal from StudiesHQ",
      },
    });

    await transaction.save({ session });
    await session.commitTransaction();

    res.json({
      success: true,
      message: "XE withdrawal initiated successfully",
      data: {
        transaction: {
          id: transaction._id,
          transactionId,
          amount,
          type: "xe_withdrawal",
          status: "pending",
          xePayment: {
            id: paymentResult.payment?.id,
            status: paymentResult.payment?.status,
            contractNumber: paymentResult.contractNumber,
            contractApproved: contractApprovalResult?.success || false,
            contractApprovalError: contractApprovalResult?.error || null,
            targetAmount: quotationResult.quotation?.targetAmount,
            targetCurrency: xeRecipient.currency,
            exchangeRate: quotationResult.quotation?.rate,
          },
          createdAt: transaction.createdAt,
        },
        newBalance: wallet.balance,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("🏦 PAYMENT CONTROLLER: Error proceeding with XE withdrawal:", error);
    res.status(500).json({
      success: false,
      message: "Server error while processing XE withdrawal",
    });
  } finally {
    session.endSession();
  }
};
