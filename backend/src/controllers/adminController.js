const mongoose = require("mongoose");
const { Project } = require("../models/Project");
const Escrow = require("../models/Escrow");
const { Transaction, Wallet } = require("../models/Payment");
const Settings = require("../models/Settings");
const User = require("../models/User");

/**
 * Create milestone for a project (Admin only)
 */
exports.createMilestone = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, percentage, dueDate, amount } = req.body;

    // Find the project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    // Create new milestone
    const milestone = {
      title,
      description,
      percentage,
      amount: amount || (percentage / 100) * project.budget, // Calculate amount if not provided
      dueDate: new Date(dueDate),
      status: "pending",
      createdBy: req.user.id,
    };

    project.milestones.push(milestone);
    await project.save();

    res.json({
      success: true,
      message: "Milestone created successfully",
      data: { milestone: project.milestones[project.milestones.length - 1] },
    });
  } catch (error) {
    console.error("Error creating milestone:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get all projects with escrow details (Admin only)
 */
exports.getProjectsWithEscrow = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let filter = {};
    if (status) {
      filter.escrowStatus = status;
    }

    const projects = await Project.find(filter)
      .populate("client", "name email")
      .populate("freelancer", "name email")
      .populate("escrow")
      .populate("job", "title")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Project.countDocuments(filter);

    res.json({
      success: true,
      data: {
        projects,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
      },
    });
  } catch (error) {
    console.error("Error getting projects with escrow:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get milestone details for admin review
 */
exports.getMilestoneDetails = async (req, res) => {
  try {
    const { projectId, milestoneId } = req.params;

    const project = await Project.findById(projectId)
      .populate("client", "name email")
      .populate("freelancer", "name email")
      .populate("escrow");

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const milestone = project.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ success: false, message: "Milestone not found" });
    }

    res.json({
      success: true,
      data: {
        project: {
          id: project._id,
          title: project.title,
          client: project.client,
          freelancer: project.freelancer,
          escrow: project.escrow,
        },
        milestone,
      },
    });
  } catch (error) {
    console.error("Error getting milestone details:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Update platform settings
 */
exports.updatePlatformSettings = async (req, res) => {
  try {
    const { settings } = req.body;

    const updates = [];
    for (const [key, value] of Object.entries(settings)) {
      let type = "string";
      if (typeof value === "number") type = "number";
      else if (typeof value === "boolean") type = "boolean";
      else if (typeof value === "object") type = "object";

      const setting = await Settings.setSetting(key, value, type, `Setting for ${key}`, "general", req.user.id);
      updates.push(setting);
    }

    res.json({
      success: true,
      message: "Settings updated successfully",
      data: { updates },
    });
  } catch (error) {
    console.error("Error updating platform settings:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get platform settings
 */
exports.getPlatformSettings = async (req, res) => {
  try {
    const settings = await Settings.find({});

    const settingsObject = {};
    settings.forEach((setting) => {
      settingsObject[setting.key] = setting.value;
    });

    res.json({
      success: true,
      data: { settings: settingsObject },
    });
  } catch (error) {
    console.error("Error getting platform settings:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get admin dashboard statistics
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
    }

    // Get project statistics
    const projectStats = await Project.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$escrowStatus",
          count: { $sum: 1 },
          totalBudget: { $sum: "$budget" },
        },
      },
    ]);

    // Get escrow statistics
    const escrowStats = await Escrow.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ]);

    // Get platform revenue statistics - ONLY from completed milestones
    const platformRevenueStats = await Transaction.aggregate([
      {
        $match: {
          ...dateFilter,
          type: "milestone",
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          platformRevenue: { $sum: "$fee" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get transaction statistics
    const transactionStats = await Transaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          totalFees: { $sum: "$fee" },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        projects: projectStats,
        escrow: escrowStats,
        transactions: transactionStats,
        platformRevenue: platformRevenueStats[0] || { platformRevenue: 0, count: 0 },
      },
    });
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get comprehensive payment analytics for admin dashboard
 */
exports.getPaymentAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, userType } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
    }

    // Get all users with wallet information

    const usersWithWallets = await User.aggregate([
      {
        $match: userType ? { role: userType } : {},
      },
      {
        $lookup: {
          from: "wallets",
          localField: "_id",
          foreignField: "user",
          as: "wallet",
        },
      },
      {
        $lookup: {
          from: "transactions",
          localField: "_id",
          foreignField: "user",
          as: "transactions",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          role: 1,
          createdAt: 1,
          wallet: { $arrayElemAt: ["$wallet", 0] },
          transactionCount: { $size: "$transactions" },
          totalDeposits: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$transactions",
                    cond: { $eq: ["$$this.type", "deposit"] },
                  },
                },
                as: "tx",
                in: "$$tx.amount",
              },
            },
          },
          totalWithdrawals: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$transactions",
                    cond: { $eq: ["$$this.type", "withdrawal"] },
                  },
                },
                as: "tx",
                in: "$$tx.amount",
              },
            },
          },
          totalFeesPaid: {
            $sum: {
              $map: {
                input: "$transactions",
                as: "tx",
                in: "$$tx.fee",
              },
            },
          },
        },
      },
    ]);

    // Get platform revenue statistics - ONLY from completed milestones
    const platformRevenue = await Transaction.aggregate([
      {
        $match: {
          ...dateFilter,
          type: "milestone",
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$fee" }, // Sum all fees from completed milestone transactions
          count: { $sum: 1 },
        },
      },
    ]);

    // Get escrow revenue - ONLY from completed transactions/milestones
    const escrowRevenue = await Transaction.aggregate([
      {
        $match: {
          ...dateFilter,
          type: "milestone",
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalPlatformRevenue: { $sum: "$fee" },
          totalTransactionAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get recent transactions for activity feed
    const recentTransactions = await Transaction.find(dateFilter)
      .populate("user", "name email role")
      .populate("recipient", "name email")
      .sort({ createdAt: -1 })
      .limit(20);

    // Calculate wallet summaries
    const walletSummary = await Wallet.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $unwind: "$userInfo",
      },
      {
        $group: {
          _id: "$userInfo.role",
          totalBalance: { $sum: "$balance" },
          totalEarned: { $sum: "$totalEarned" },
          totalSpent: { $sum: "$totalSpent" },
          totalWithdrawn: { $sum: "$totalWithdrawn" },
          userCount: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        usersWithWallets,
        platformRevenue: platformRevenue[0] || { totalRevenue: 0, count: 0 },
        escrowRevenue: escrowRevenue[0] || {
          totalPlatformRevenue: 0,
          totalTransactionAmount: 0,
          count: 0,
        },
        walletSummary,
        recentTransactions,
      },
    });
  } catch (error) {
    console.error("Error getting payment analytics:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get user payment details for admin
 */
exports.getUserPaymentDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, page = 1 } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Get user wallet
    const wallet = await Wallet.findOne({ user: userId });

    // Get user transactions
    const transactions = await Transaction.find({ user: userId })
      .populate("recipient", "name email")
      .populate("project", "title")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalTransactions = await Transaction.countDocuments({ user: userId });

    // Get user escrows
    const escrows = await Escrow.find({
      $or: [{ client: userId }, { freelancer: userId }],
    })
      .populate("client", "name email")
      .populate("freelancer", "name email")
      .populate("project", "title")
      .sort({ createdAt: -1 });

    // Calculate user statistics
    const userStats = await Transaction.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          totalFees: { $sum: "$fee" },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
        wallet: wallet || { balance: 0, totalEarned: 0, totalSpent: 0, totalWithdrawn: 0 },
        transactions,
        escrows,
        statistics: userStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalTransactions,
          pages: Math.ceil(totalTransactions / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error getting user payment details:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get platform financial overview
 */
exports.getPlatformFinancialOverview = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
    }

    // Total platform revenue from all sources - ONLY from completed milestones
    const totalPlatformRevenue = await Promise.all([
      // Revenue from completed milestone platform fees ONLY
      Transaction.aggregate([
        {
          $match: {
            ...dateFilter,
            type: "milestone",
            status: "completed",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$fee" },
          },
        },
      ]),
      // Revenue from other platform-specific transaction fees (if any)
      Transaction.aggregate([
        { $match: { ...dateFilter, type: "platform_fee", status: "completed" } },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]),
      // Platform fees collected ONLY from milestone transactions (same as first query)
      Transaction.aggregate([
        {
          $match: {
            ...dateFilter,
            type: "milestone",
            status: "completed",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$fee" },
          },
        },
      ]),
    ]);

    // Total funds in the system
    const totalFundsInSystem = await Wallet.aggregate([
      {
        $group: {
          _id: null,
          totalBalance: { $sum: "$balance" },
          totalEarned: { $sum: "$totalEarned" },
          totalSpent: { $sum: "$totalSpent" },
          totalWithdrawn: { $sum: "$totalWithdrawn" },
        },
      },
    ]);

    // Active escrow holdings - exclude completed escrows and those with no remaining amount
    const activeEscrowHoldings = await Escrow.aggregate([
      {
        $match: {
          status: { $in: ["active", "partially_released"] },
          $or: [
            { remainingAmount: { $gt: 0 } },
            { $expr: { $gt: [{ $subtract: ["$totalAmount", "$releasedAmount"] }, 0] } },
          ],
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
          remainingAmount: {
            $sum: {
              $subtract: ["$totalAmount", "$releasedAmount"],
            },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Transaction volume by type
    const transactionVolumeByType = await Transaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          totalFees: { $sum: "$fee" },
        },
      },
    ]);

    // User statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        platformRevenue: {
          escrowRevenue: totalPlatformRevenue[0][0]?.total || 0, // Milestone fees from escrow
          transactionFeeRevenue: totalPlatformRevenue[1][0]?.total || 0, // Other platform fees
          allFeesCollected: totalPlatformRevenue[0][0]?.total || 0, // Same as escrow revenue (milestone fees)
          totalRevenue: totalPlatformRevenue[0][0]?.total || 0, // Total is just milestone fees, not additive
        },
        systemFunds: totalFundsInSystem[0] || {
          totalBalance: 0,
          totalEarned: 0,
          totalSpent: 0,
          totalWithdrawn: 0,
        },
        activeEscrow: activeEscrowHoldings[0] || {
          totalAmount: 0,
          remainingAmount: 0,
          count: 0,
        },
        transactionVolumeByType,
        userStats,
      },
    });
  } catch (error) {
    console.error("Error getting platform financial overview:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createMilestone: exports.createMilestone,
  getProjectsWithEscrow: exports.getProjectsWithEscrow,
  getMilestoneDetails: exports.getMilestoneDetails,
  updatePlatformSettings: exports.updatePlatformSettings,
  getPlatformSettings: exports.getPlatformSettings,
  getDashboardStats: exports.getDashboardStats,
  getPaymentAnalytics: exports.getPaymentAnalytics,
  getUserPaymentDetails: exports.getUserPaymentDetails,
  getPlatformFinancialOverview: exports.getPlatformFinancialOverview,
};
