const mongoose = require("mongoose");
const { Project } = require("../models/Project");
const Escrow = require("../models/Escrow");
const { Transaction } = require("../models/Payment");
const Settings = require("../models/Settings");

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
          totalRevenue: { $sum: "$platformRevenue" },
        },
      },
    ]);

    // Get platform fee transactions
    const feeTransactions = await Transaction.aggregate([
      {
        $match: {
          type: "platform_fee",
          status: "completed",
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: null,
          totalFees: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get milestone statistics
    const milestoneStats = await Project.aggregate([
      { $match: dateFilter },
      { $unwind: "$milestones" },
      {
        $group: {
          _id: "$milestones.status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$milestones.amount" },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        projectStats,
        escrowStats,
        feeTransactions: feeTransactions[0] || { totalFees: 0, count: 0 },
        milestoneStats,
      },
    });
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
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
};
