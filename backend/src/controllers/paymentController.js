const { v4: uuidv4 } = require("uuid");
const { PaymentMethod, Transaction, Invoice, Wallet } = require("../models/Payment");
const User = require("../models/User");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const paypalService = require("../services/paypalService");
const giftogramService = require("../services/giftogramService");
const emailService = require("../services/emailService");

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

    // Store pending transaction
    const transaction = new Transaction({
      transactionId: `PPO-${uuidv4().substring(0, 8)}`,
      user: req.user.id,
      amount,
      type: "deposit",
      status: "pending",
      description: "PayPal wallet deposit - pending",
      metadata: {
        paypalOrderId: paypalOrder.orderId,
        paymentMethod: "paypal",
      },
    });

    await transaction.save();

    res.json({
      success: true,
      data: {
        orderId: paypalOrder.orderId,
        transactionId: transaction.transactionId,
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

    // Find the pending transaction
    const transaction = await Transaction.findOne({
      "metadata.paypalOrderId": orderId,
      user: req.user.id,
      status: "pending",
    }).session(session);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found or already processed",
      });
    }

    // Capture PayPal payment
    const captureResult = await paypalService.captureOrder(orderId);

    if (!captureResult.success) {
      // Update transaction status to failed
      transaction.status = "failed";
      transaction.metadata.error = captureResult.error;
      await transaction.save({ session });

      await session.commitTransaction();
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

    // Update transaction
    transaction.status = "completed";
    transaction.description = "PayPal wallet deposit - completed";
    transaction.metadata = {
      ...transaction.metadata,
      paypalCaptureId: captureResult.captureId,
      paypalTransactionId: captureResult.transactionId,
      payerInfo: captureResult.payerInfo,
    };
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
    const { campaignId, amount, recipientEmail, recipientName, message } = req.body;
    const userId = req.user.id;

    // Validation
    const validationResults = {
      hasCampaignId: !!campaignId,
      hasAmount: !!amount,
      hasRecipientEmail: !!recipientEmail,
      hasRecipientName: !!recipientName,
      amountIsPositive: amount > 0,
    };

    if (!campaignId || !amount || !recipientEmail || !recipientName) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Missing required fields: campaignId, amount, recipientEmail, recipientName",
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
