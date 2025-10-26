const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const { Project, Attachment } = require("../models/Project");
const User = require("../models/User");
const { Job, Proposal } = require("../models/Job");
const emailService = require("../services/emailService");

/**
 * Helper function to check if project should be marked as completed
 * @param {Object} project - The project document
 * @returns {boolean} - Whether the project should be completed
 */
const checkProjectCompletion = (project) => {
  // Only check for projects that have milestones
  if (!project.milestones || project.milestones.length === 0) {
    return false;
  }

  // Check if all milestones are completed
  const allMilestonesCompleted = project.milestones.every((milestone) => milestone.status === "completed");

  // Check if total percentage of completed milestones is 100%
  const completedMilestonesPercentage = project.milestones
    .filter((milestone) => milestone.status === "completed")
    .reduce((sum, milestone) => sum + milestone.percentage, 0);

  // Project is complete only if all milestones are completed AND total percentage is 100%
  return allMilestonesCompleted && completedMilestonesPercentage === 100;
};

/**
 * Utility function to check if user is authorized for project operations
 * @param {Object} project - Project document
 * @param {Object} user - User from req.user
 * @param {string} operation - Type of operation (freelancer, client, both)
 * @returns {Object} - { authorized: boolean, message: string, role: string }
 */
const checkProjectAuthorization = (project, user, operation = "freelancer") => {
  if (!project) {
    return { authorized: false, message: "Project not found", role: null };
  }

  if (!user || !user.id) {
    return { authorized: false, message: "User not authenticated", role: null };
  }

  const isClient = project.client && project.client.toString() === user.id;
  const isFreelancer = project.freelancer && project.freelancer.toString() === user.id;
  const isAdmin = user.role === "admin";

  console.log(`🔐 AUTHORIZATION CHECK:`);
  console.log(`  ├─ Operation: ${operation}`);
  console.log(`  ├─ User ID: ${user.id} (${user.role})`);
  console.log(`  ├─ Project Client: ${project.client}`);
  console.log(`  ├─ Project Freelancer: ${project.freelancer || "Not assigned"}`);
  console.log(`  ├─ Is Client: ${isClient}`);
  console.log(`  ├─ Is Freelancer: ${isFreelancer}`);
  console.log(`  └─ Is Admin: ${isAdmin}`);

  switch (operation) {
    case "freelancer":
      if (!project.freelancer) {
        return {
          authorized: false,
          message: "No freelancer assigned to this project yet",
          role: null,
        };
      }
      if (isFreelancer || isAdmin) {
        return {
          authorized: true,
          message: "Authorized",
          role: isAdmin ? "admin" : "freelancer",
        };
      }
      return {
        authorized: false,
        message: `Not authorized. You are not the assigned freelancer for this project. Expected: ${project.freelancer}, Got: ${user.id}`,
        role: user.role,
      };

    case "client":
      if (isClient || isAdmin) {
        return {
          authorized: true,
          message: "Authorized",
          role: isAdmin ? "admin" : "client",
        };
      }
      return {
        authorized: false,
        message: "Not authorized. You are not the client for this project.",
        role: user.role,
      };

    case "both":
      if (isClient || isFreelancer || isAdmin) {
        return {
          authorized: true,
          message: "Authorized",
          role: isAdmin ? "admin" : isClient ? "client" : "freelancer",
        };
      }
      return {
        authorized: false,
        message: "Not authorized to access this project.",
        role: user.role,
      };

    default:
      return {
        authorized: false,
        message: "Invalid operation type",
        role: user.role,
      };
  }
};

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private (Client only)
 */
exports.createProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { title, description, freelancerId, category, skills, budget, deadline, milestones, jobId } = req.body;

    // Verify freelancer exists and is a freelancer
    const freelancer = await User.findById(freelancerId);
    if (!freelancer || freelancer.role !== "freelancer") {
      return res.status(404).json({ success: false, message: "Freelancer not found" });
    }

    let job = null;
    if (jobId) {
      // If project is created from a job, get the job details
      job = await Job.findOne({ _id: jobId, client: req.user.id });
      if (!job) {
        return res.status(404).json({ success: false, message: "Job not found" });
      }
    }

    // Create project instance
    const project = new Project({
      title,
      description,
      client: req.user.id,
      freelancer: freelancerId,
      category,
      skills: skills || [],
      budget,
      startDate: new Date(),
      deadline,
      status: "pending",
      job: jobId,
    });

    // Add milestones if provided
    if (milestones && milestones.length > 0) {
      project.milestones = milestones.map((milestone) => ({
        title: milestone.title,
        description: milestone.description,
        amount: milestone.amount,
        dueDate: milestone.dueDate,
        status: "pending",
      }));
    }

    await project.save();

    // If project was created from a job, update the job status
    if (job) {
      job.status = "in_progress";
      job.project = project._id;
      await job.save();

      // Update the accepted proposal if exists
      const proposal = await Proposal.findOne({
        freelancer: freelancerId,
        job: jobId,
        status: "accepted",
      });

      if (proposal) {
        proposal.status = "accepted";
        await proposal.save();
      }
    }

    res.status(201).json({
      success: true,
      data: { project },
    });
  } catch (err) {
    console.error("Error in createProject:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get all projects for the authenticated user (based on role)
 * @route   GET /api/projects
 * @access  Private
 */
exports.getProjects = async (req, res) => {
  console.log("req.user", req.user);
  try {
    let query = {};

    console.log(req.query.status);

    // Different queries based on user role
    if (req.user.role === "client") {
      query.client = req.user.id;
    } else if (req.user.role === "freelancer") {
      query.freelancer = req.user.id;
    } else if (req.user.role === "admin") {
      // Admin can see all projects
    } else if (req.user.role === "freelancer_company") {
      // Company users acting as freelancers can see projects assigned to them
      query.freelancer = req.user.id;
    } else if (req.user.role === "project_sponsor_company") {
      // Company users acting as clients can see projects they created
      query.client = req.user.id;
    } else {
      return res.status(403).json({ success: false, message: "Unauthorized role" });
    }

    // Add status filter if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    console.log(query);

    const projects = await Project.find(query)
      .populate("client", "name avatar")
      .populate("freelancer", "name avatar")
      .select("-__v")
      .sort({ createdAt: -1 });

    console.log(projects);

    res.json({
      success: true,
      count: projects.length,
      data: { projects },
    });
  } catch (err) {
    console.error("Error in getProjects:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get all projects for admin dashboard (all statuses)
 * @route   GET /api/projects/admin/all
 * @access  Private (Admin only)
 */
exports.getAllProjectsForAdmin = async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 50 } = req.query;

    // Build the filter object
    const filter = {};

    // Add status filter if provided
    if (status && status !== "all") {
      filter.status = status;
    }

    // Add category filter if provided
    if (category) {
      filter.category = category;
    }

    // Add search functionality
    if (search) {
      filter.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get all projects with filters, sorting, and pagination
    const projects = await Project.find(filter)
      .sort({ createdAt: -1 })
      .populate("client", "name email avatar")
      .populate("freelancer", "name email avatar")
      .select("-__v")
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalProjects = await Project.countDocuments(filter);

    // Get unique categories for filter dropdown
    const categories = await Project.distinct("category");

    res.status(200).json({
      success: true,
      data: {
        projects,
        categories,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalProjects / parseInt(limit)),
          totalProjects,
          hasNext: skip + projects.length < totalProjects,
          hasPrev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error in getAllProjectsForAdmin:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching projects for admin",
      error: error.message,
    });
  }
};

/**
 * @desc    Get a single project by ID
 * @route   GET /api/projects/:id
 * @access  Private
 */
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("client", "name avatar")
      .populate("freelancer", "name avatar")
      .populate({
        path: "milestones.attachments",
        model: "Attachment",
      })
      .populate("attachments");

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    // Check if user is authorized to view this project
    if (
      req.user.role !== "admin" &&
      project.client._id.toString() !== req.user.id &&
      project.freelancer._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ success: false, message: "Not authorized to view this project" });
    }

    res.json({
      success: true,
      data: { project },
    });
  } catch (err) {
    console.error("Error in getProject:", err.message);

    if (err.kind === "ObjectId") {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Update a project
 * @route   PUT /api/projects/:id
 * @access  Private
 */
exports.updateProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    // Check if user is authorized to update this project
    if (
      req.user.role !== "admin" &&
      project.client.toString() !== req.user.id &&
      (req.user.role !== "freelancer" || project.freelancer.toString() !== req.user.id)
    ) {
      return res.status(403).json({ success: false, message: "Not authorized to update this project" });
    }

    // Fields that can be updated
    const updateableFields = ["title", "description", "status", "completionPercentage", "deadline"];

    // Only client can update certain fields
    const clientOnlyFields = ["budget", "category", "skills"];

    // Update fields that are provided
    updateableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        project[field] = req.body[field];
      }
    });

    // If user is client, project sponsor company, or admin, they can update client-only fields
    if (req.user.role === "client" || req.user.role === "project_sponsor_company" || req.user.role === "admin") {
      clientOnlyFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          project[field] = req.body[field];
        }
      });
    }

    // Set completedDate if status is set to completed
    if (req.body.status === "completed" && project.status !== "completed") {
      project.completedDate = new Date();
    }

    // Save the updated project
    await project.save();

    res.json({
      success: true,
      data: { project },
    });
  } catch (err) {
    console.error("Error in updateProject:", err.message);

    if (err.kind === "ObjectId") {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Update a milestone
 * @route   PUT /api/projects/:id/milestones/:milestoneId
 * @access  Private
 */
exports.updateMilestone = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    // Check if user is authorized to update milestone
    if (project.client.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized to update milestone" });
    }

    const milestone = project.milestones.id(req.params.milestoneId);
    if (!milestone) {
      return res.status(404).json({ success: false, message: "Milestone not found" });
    }

    const { title, description, percentage, dueDate } = req.body;

    // If percentage is being changed, validate the new total
    if (percentage !== undefined && percentage !== milestone.percentage) {
      const totalPercentage = project.milestones.reduce((sum, m) => {
        if (m._id.toString() === req.params.milestoneId) {
          return sum;
        }
        return sum + m.percentage;
      }, 0);

      if (totalPercentage + percentage > 100) {
        return res.status(400).json({
          success: false,
          message: `Cannot update milestone. Total percentage would exceed 100%. Current total: ${totalPercentage}%, Remaining: ${
            100 - totalPercentage
          }%`,
        });
      }
    }

    // Update milestone fields
    if (title) milestone.title = title;
    if (description) milestone.description = description;
    if (percentage) {
      milestone.percentage = percentage;
      // Recalculate amount based on new percentage
      milestone.amount = (project.budget * percentage) / 100;
    }
    if (dueDate) milestone.dueDate = dueDate;

    await project.save();

    // CRITICAL FIX: Sync escrow milestones after project milestone update
    try {
      const { syncEscrowMilestones } = require("../utils/escrowSync");
      console.log(`🔄 MILESTONE UPDATE: Syncing escrow after milestone update for project ${req.params.id}`);
      const syncResult = await syncEscrowMilestones(req.params.id);
      if (syncResult) {
        console.log(`✅ Escrow milestones synchronized after milestone update`);
      }
    } catch (syncError) {
      console.error("Error syncing escrow milestones after update:", syncError);
      // Don't fail the milestone update if escrow sync fails, just log it
    }

    res.json({
      success: true,
      data: { milestone },
    });
  } catch (err) {
    console.error("Error in updateMilestone:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Add a milestone to a project
 * @route   POST /api/projects/:id/milestones
 * @access  Private (Client only)
 */
exports.addMilestone = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    // Only client can add milestones
    if (req.user.role !== "admin" && project.client.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized to add milestones to this project" });
    }

    const { title, description, amount, dueDate } = req.body;

    // Create new milestone
    const milestone = {
      title,
      description,
      amount,
      dueDate,
      status: "pending",
    };

    project.milestones.push(milestone);
    await project.save();

    // CRITICAL FIX: Sync escrow milestones after adding new milestone
    try {
      const { syncEscrowMilestones } = require("../utils/escrowSync");
      console.log(`🔄 MILESTONE ADD: Syncing escrow after adding milestone to project ${req.params.id}`);
      const syncResult = await syncEscrowMilestones(req.params.id);
      if (syncResult) {
        console.log(`✅ Escrow milestones synchronized after adding milestone`);
      }
    } catch (syncError) {
      console.error("Error syncing escrow milestones after add:", syncError);
      // Don't fail the milestone creation if escrow sync fails, just log it
    }

    res.status(201).json({
      success: true,
      data: { milestone },
    });
  } catch (err) {
    console.error("Error in addMilestone:", err.message);

    if (err.kind === "ObjectId") {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Delete a milestone from a project
 * @route   DELETE /api/projects/:id/milestones/:milestoneId
 * @access  Private (Client only)
 */
exports.deleteMilestone = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    // Check if user is authorized to delete milestone
    if (project.client.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized to delete milestone" });
    }

    const milestone = project.milestones.id(req.params.milestoneId);
    if (!milestone) {
      return res.status(404).json({ success: false, message: "Milestone not found" });
    }

    // Check if milestone is already completed
    if (milestone.status === "completed") {
      return res.status(400).json({ success: false, message: "Cannot delete a completed milestone" });
    }

    project.milestones.pull(req.params.milestoneId);
    await project.save();

    // CRITICAL FIX: Sync escrow milestones after deleting milestone
    try {
      const { syncEscrowMilestones } = require("../utils/escrowSync");
      console.log(`🔄 MILESTONE DELETE: Syncing escrow after deleting milestone from project ${req.params.id}`);
      const syncResult = await syncEscrowMilestones(req.params.id);
      if (syncResult) {
        console.log(`✅ Escrow milestones synchronized after deleting milestone`);
      }
    } catch (syncError) {
      console.error("Error syncing escrow milestones after delete:", syncError);
      // Don't fail the milestone deletion if escrow sync fails, just log it
    }

    res.json({
      success: true,
      data: {},
    });
  } catch (err) {
    console.error("Error in deleteMilestone:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Create a new milestone
 * @route   POST /api/projects/:id/milestones
 * @access  Private
 */
exports.createMilestone = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    // Check if user is authorized to create milestone
    if (project.client.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized to create milestone" });
    }

    const { title, description, percentage, dueDate, amount } = req.body;

    // Calculate total percentage of existing milestones
    const totalPercentage = project.milestones.reduce((sum, m) => sum + m.percentage, 0);

    // Check if adding this milestone would exceed 100%
    if (totalPercentage + percentage > 100) {
      return res.status(400).json({
        success: false,
        message: `Cannot add milestone. Total percentage would exceed 100%. Current total: ${totalPercentage}%, Remaining: ${
          100 - totalPercentage
        }%`,
      });
    }

    // Calculate amount if not provided
    const milestoneAmount = amount || (percentage / 100) * project.budget;

    // Create new milestone
    const milestone = {
      title,
      description,
      percentage,
      amount: milestoneAmount,
      dueDate,
      status: "pending",
      createdBy: req.user.id,
      approvalStatus: "pending",
    };

    project.milestones.push(milestone);
    await project.save();

    // CRITICAL FIX: Sync escrow milestones after creating new milestone
    try {
      const { syncEscrowMilestones } = require("../utils/escrowSync");
      console.log(`🔄 MILESTONE CREATE: Syncing escrow after creating milestone for project ${req.params.id}`);

      // Special handling for first milestone creation
      const Escrow = require("../models/Escrow");
      const escrow = await Escrow.findOne({ project: req.params.id });
      if (escrow && escrow.milestones.length === 0) {
        console.log(`📝 First milestone created - initializing escrow milestone structure`);
      }

      const syncResult = await syncEscrowMilestones(req.params.id);
      if (syncResult) {
        console.log(`✅ Escrow milestones synchronized after creating milestone`);
      }
    } catch (syncError) {
      console.error("Error syncing escrow milestones after create:", syncError);
      // Don't fail the milestone creation if escrow sync fails, just log it
    }

    // Send email notification to freelancer about new milestone
    try {
      const client = await User.findById(project.client);
      const freelancer = await User.findById(project.freelancer);

      if (client && freelancer) {
        const createdMilestone = project.milestones[project.milestones.length - 1]; // Get the newly added milestone
        await emailService.sendNewMilestoneNotification(freelancer, client, project, createdMilestone);
      }
    } catch (emailError) {
      console.error("Error sending new milestone notification:", emailError);
      // Don't fail the milestone creation if email fails
    }

    res.status(201).json({
      success: true,
      data: { milestone },
    });
  } catch (err) {
    console.error("Error in createMilestone:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Approve or reject a milestone
 * @route   PUT /api/projects/:id/milestones/:milestoneId/approve
 * @access  Private (Admin only)
 */
exports.approveMilestone = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    // Check if user is authorized to approve milestone
    if (project.client.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized to approve milestone" });
    }

    const milestone = project.milestones.id(req.params.milestoneId);
    if (!milestone) {
      return res.status(404).json({ success: false, message: "Milestone not found" });
    }

    const { approvalStatus, approvalComment } = req.body;

    milestone.approvalStatus = approvalStatus;
    milestone.approvalComment = approvalComment;

    if (approvalStatus === "approved") {
      milestone.status = "completed";
      milestone.completedAt = new Date();

      // Check if all milestones are completed and update project status
      if (checkProjectCompletion(project) && project.status !== "completed") {
        project.status = "completed";
        project.completedDate = new Date();
      }
    }

    await project.save();

    // Send email notification to freelancer about milestone approval/rejection
    try {
      const client = await User.findById(project.client);
      const freelancer = await User.findById(project.freelancer);

      if (client && freelancer) {
        if (approvalStatus === "approved") {
          await emailService.sendMilestoneApprovedNotification(freelancer, client, project, milestone);
        } else if (approvalStatus === "rejected") {
          await emailService.sendMilestoneRevisionNotification(freelancer, client, project, milestone);
        }
      }
    } catch (emailError) {
      console.error("Error sending milestone approval notification:", emailError);
      // Don't fail the milestone approval if email fails
    }

    res.json({
      success: true,
      data: { milestone },
    });
  } catch (err) {
    console.error("Error in approveMilestone:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Start working on a milestone (freelancer)
 * @route   PUT /api/projects/:id/milestones/:milestoneId/start
 * @access  Private (Freelancer only)
 */
exports.startMilestone = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    // Use the robust authorization check
    const authCheck = checkProjectAuthorization(project, req.user, "freelancer");
    if (!authCheck.authorized) {
      return res.status(403).json({
        success: false,
        message: authCheck.message,
        debug: {
          projectFreelancer: project.freelancer?.toString() || null,
          currentUser: req.user.id,
          userRole: req.user.role,
          operation: "freelancer",
        },
      });
    }

    const milestone = project.milestones.id(req.params.milestoneId);
    if (!milestone) {
      return res.status(404).json({ success: false, message: "Milestone not found" });
    }

    // Check if milestone is in pending status
    if (milestone.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Milestone is already ${milestone.status}. Only pending milestones can be started.`,
      });
    }

    const { estimatedCompletionDate } = req.body;

    // Update milestone status
    milestone.status = "in_progress";
    milestone.workStartedDate = new Date();
    if (estimatedCompletionDate) {
      milestone.estimatedCompletionDate = estimatedCompletionDate;
    }

    await project.save();

    console.log(`✅ Milestone started successfully: ${milestone.title} by ${req.user.role} ${req.user.id}`);

    res.json({
      success: true,
      message: "Milestone started successfully",
      data: { milestone },
    });
  } catch (err) {
    console.error("Error in startMilestone:", err.message);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

/**
 * @desc    Submit work for a milestone (freelancer)
 * @route   PUT /api/projects/:id/milestones/:milestoneId/submit
 * @access  Private (Freelancer only)
 */
exports.submitMilestoneWork = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    // Check if user is the freelancer for this project
    if (project.freelancer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized to submit work for this milestone" });
    }

    const milestone = project.milestones.id(req.params.milestoneId);
    if (!milestone) {
      return res.status(404).json({ success: false, message: "Milestone not found" });
    }

    // Check if milestone is in progress
    if (milestone.status !== "in_progress") {
      return res.status(400).json({ success: false, message: "Milestone must be in progress to submit work" });
    }

    const { submissionDetails, attachmentUrls } = req.body;

    if (!submissionDetails || submissionDetails.trim() === "") {
      return res.status(400).json({ success: false, message: "Submission details are required" });
    }

    // Create attachment records if files were uploaded
    const attachmentIds = [];
    if (attachmentUrls && attachmentUrls.length > 0) {
      for (const fileData of attachmentUrls) {
        const attachment = new Attachment({
          filename: fileData.filename,
          originalname: fileData.originalname,
          mimetype: fileData.mimetype,
          size: fileData.size,
          url: fileData.url,
          uploadedBy: req.user.id,
        });
        await attachment.save();
        attachmentIds.push(attachment._id);
      }
    }

    // Update milestone
    milestone.status = "submitted_for_review";
    milestone.submissionDetails = submissionDetails;
    milestone.submissionDate = new Date();
    milestone.attachments = attachmentIds;

    await project.save();

    // Send email notification to client about milestone completion
    try {
      const client = await User.findById(project.client);
      const freelancer = await User.findById(project.freelancer);

      if (client && freelancer) {
        await emailService.sendMilestoneCompletedNotification(client, freelancer, project, milestone);
      }
    } catch (emailError) {
      console.error("Error sending milestone completion notification:", emailError);
      // Don't fail the milestone submission if email fails
    }

    // Populate the updated milestone with attachments
    await project.populate({
      path: "milestones.attachments",
      model: "Attachment",
    });

    res.json({
      success: true,
      data: { milestone },
    });
  } catch (err) {
    console.error("Error in submitMilestoneWork:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Review and approve/reject submitted milestone work (client)
 * @route   PUT /api/projects/:id/milestones/:milestoneId/review
 * @access  Private (Client only)
 */
exports.reviewMilestoneWork = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    // Check if user is the client for this project
    if (project.client.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized to review this milestone" });
    }

    const milestone = project.milestones.id(req.params.milestoneId);
    if (!milestone) {
      return res.status(404).json({ success: false, message: "Milestone not found" });
    }

    // Check if milestone is submitted for review
    if (milestone.status !== "submitted_for_review") {
      return res.status(400).json({ success: false, message: "Milestone is not submitted for review" });
    }

    const { action, feedback } = req.body; // action: 'approve' or 'request_revision'

    if (!action || !["approve", "request_revision"].includes(action)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid action. Must be 'approve' or 'request_revision'" });
    }

    // Declare payment result variables outside the if block
    let paymentResult = null;
    let paymentError = null;

    if (action === "approve") {
      // Approve the milestone
      milestone.status = "completed";
      milestone.approvalStatus = "approved";
      milestone.approvedBy = req.user.id;
      milestone.approvalDate = new Date();
      milestone.actualCompletionDate = new Date();
      milestone.completedAt = new Date();
      if (feedback) {
        milestone.feedback = feedback;
      }

      // Save the project first to ensure milestone approval is persisted
      await project.save();

      console.log(`🎯 MILESTONE APPROVED: ${milestone.title}`);
      console.log(`  ├─ Milestone ID: ${milestone._id}`);
      console.log(`  ├─ Project ID: ${project._id}`);
      console.log(`  ├─ Client ID: ${req.user.id}`);
      console.log(`  └─ Attempting automatic payment release...`);

      // Automatically release milestone payment from escrow
      const escrowController = require("./escrowController");

      // Enhanced validation before payment release
      try {
        // Check if escrow exists for this project
        const Escrow = require("../models/Escrow");
        const escrow = await Escrow.findOne({ project: project._id });

        if (!escrow) {
          console.error(`❌ No escrow found for project: ${project._id}`);
          paymentError = { success: false, message: "No escrow found for project" };
        } else {
          console.log(`✅ Found escrow: ${escrow.escrowId}`);

          // Check if milestone exists in escrow
          const escrowMilestone = escrow.milestones?.find(
            (em) => em.milestoneId.toString() === milestone._id.toString()
          );

          if (!escrowMilestone) {
            console.error(`❌ Milestone not found in escrow: ${milestone._id}`);
            console.error(
              `Available escrow milestones:`,
              escrow.milestones.map((m) => ({
                id: m.milestoneId.toString(),
                title: m.title,
                status: m.status,
              }))
            );
            paymentError = { success: false, message: "Milestone not found in escrow" };
          } else {
            console.log(`✅ Found escrow milestone: ${escrowMilestone.title} (Status: ${escrowMilestone.status})`);

            // Create a mock request object for the escrow controller
            const escrowReq = {
              user: { id: req.user.id },
              params: {
                projectId: project._id.toString(),
                milestoneId: milestone._id.toString(),
              },
            };

            // Create a mock response object to capture the result
            const escrowRes = {
              json: (data) => {
                paymentResult = data;
              },
              status: (code) => ({
                json: (data) => {
                  paymentError = data;
                  paymentResult = { success: false, statusCode: code, ...data };
                },
              }),
            };

            // Attempt to release payment
            await escrowController.releaseMilestonePayment(escrowReq, escrowRes);

            if (paymentResult && paymentResult.success) {
              console.log(`✅ Payment released automatically for milestone: ${milestone.title}`);
              console.log(`💰 Amount released: $${paymentResult.data?.transaction?.netAmount || "N/A"}`);
            } else {
              console.error(
                `❌ Failed to release payment for milestone: ${milestone.title}`,
                paymentResult || paymentError
              );
            }
          }
        }
      } catch (paymentReleaseError) {
        console.error("❌ Error during automatic payment release:", paymentReleaseError);
        paymentError = { success: false, message: paymentReleaseError.message };
        // Don't fail the milestone approval if payment release fails
        // The payment can be released manually later
      }

      // Check if all milestones are completed and update project status
      if (checkProjectCompletion(project) && project.status !== "completed") {
        project.status = "completed";
        project.completedDate = new Date();
        await project.save(); // Save again after status update
      }
    } else if (action === "request_revision") {
      // Request revision
      if (!feedback || feedback.trim() === "") {
        return res.status(400).json({ success: false, message: "Feedback is required when requesting revision" });
      }

      milestone.status = "revision_requested";
      milestone.revisionCount += 1;
      milestone.feedback = feedback;

      // Add to revision history
      milestone.revisionHistory.push({
        feedback: feedback,
        requestedBy: req.user.id,
      });
    }

    await project.save();

    // Check if project was just completed
    const isProjectCompleted = project.status === "completed";

    res.json({
      success: true,
      data: {
        milestone,
        projectCompleted: isProjectCompleted,
        paymentReleased: action === "approve" && paymentResult?.success,
        paymentAmount:
          action === "approve" && paymentResult?.success ? paymentResult.data?.transaction?.netAmount : null,
        project: isProjectCompleted
          ? {
              _id: project._id,
              title: project.title,
              status: project.status,
              completedDate: project.completedDate,
            }
          : undefined,
      },
    });
  } catch (err) {
    console.error("Error in reviewMilestoneWork:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Resubmit work after revision request (freelancer)
 * @route   PUT /api/projects/:id/milestones/:milestoneId/resubmit
 * @access  Private (Freelancer only)
 */
exports.resubmitMilestoneWork = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    // Check if user is the freelancer for this project
    if (project.freelancer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized to resubmit work for this milestone" });
    }

    const milestone = project.milestones.id(req.params.milestoneId);
    if (!milestone) {
      return res.status(404).json({ success: false, message: "Milestone not found" });
    }

    // Check if milestone needs revision
    if (milestone.status !== "revision_requested") {
      return res.status(400).json({ success: false, message: "Milestone is not requesting revision" });
    }

    const { submissionDetails, attachmentUrls } = req.body;

    if (!submissionDetails || submissionDetails.trim() === "") {
      return res.status(400).json({ success: false, message: "Submission details are required" });
    }

    // Handle new attachments if provided
    const attachmentIds = [...milestone.attachments]; // Keep existing attachments
    if (attachmentUrls && attachmentUrls.length > 0) {
      for (const fileData of attachmentUrls) {
        const attachment = new Attachment({
          filename: fileData.filename,
          originalname: fileData.originalname,
          mimetype: fileData.mimetype,
          size: fileData.size,
          url: fileData.url,
          uploadedBy: req.user.id,
        });
        await attachment.save();
        attachmentIds.push(attachment._id);
      }
    }

    // Update milestone
    milestone.status = "submitted_for_review";
    milestone.submissionDetails = submissionDetails;
    milestone.submissionDate = new Date();
    milestone.attachments = attachmentIds;

    await project.save();

    // Populate the updated milestone with attachments
    await project.populate({
      path: "milestones.attachments",
      model: "Attachment",
    });

    res.json({
      success: true,
      data: { milestone },
    });
  } catch (err) {
    console.error("Error in resubmitMilestoneWork:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get milestone attachments/deliverables
 * @route   GET /api/projects/:id/milestones/:milestoneId/attachments
 * @access  Private (Client and Freelancer of the project)
 */
exports.getMilestoneAttachments = async (req, res) => {
  try {
    console.log("getMilestoneAttachments called with:", {
      projectId: req.params.id,
      milestoneId: req.params.milestoneId,
      userId: req.user.id,
      userRole: req.user.role,
    });

    const project = await Project.findById(req.params.id);
    if (!project) {
      console.log("Project not found:", req.params.id);
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    // Check if user is authorized (client or freelancer of this project)
    if (project.client.toString() !== req.user.id && project.freelancer.toString() !== req.user.id) {
      console.log("Authorization failed:", {
        projectClient: project.client.toString(),
        projectFreelancer: project.freelancer.toString(),
        currentUser: req.user.id,
      });
      return res.status(403).json({ success: false, message: "Not authorized to view milestone attachments" });
    }

    const milestone = project.milestones.id(req.params.milestoneId);
    if (!milestone) {
      console.log("Milestone not found:", req.params.milestoneId);
      return res.status(404).json({ success: false, message: "Milestone not found" });
    }

    console.log("Milestone found:", {
      milestoneId: milestone._id,
      status: milestone.status,
      attachmentCount: milestone.attachments?.length || 0,
    });

    // Populate attachments
    await project.populate({
      path: "milestones.attachments",
      model: "Attachment",
      populate: {
        path: "uploadedBy",
        select: "name avatar",
      },
    });

    const populatedMilestone = project.milestones.id(req.params.milestoneId);

    // console.log("Populated attachments:", {
    //   attachmentCount: populatedMilestone.attachments?.length || 0,
    //   attachments: populatedMilestone.attachments?.map((att) => ({
    //     id: att._id,
    //     filename: att.filename,
    //     originalname: att.originalname,
    //   })),
    // });

    res.json({
      success: true,
      data: {
        attachments: populatedMilestone.attachments,
        milestoneTitle: populatedMilestone.title,
        submissionDetails: populatedMilestone.submissionDetails,
      },
    });
  } catch (err) {
    console.error("Error in getMilestoneAttachments:", err.message);
    console.error("Full error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Debug project authorization (temporary debugging endpoint)
 * @route   GET /api/projects/:id/debug-auth
 * @access  Private
 */
exports.debugProjectAuth = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("client", "name email role")
      .populate("freelancer", "name email role");

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const debugInfo = {
      project: {
        id: project._id.toString(),
        title: project.title,
        status: project.status,
        client: project.client,
        freelancer: project.freelancer,
        createdAt: project.createdAt,
      },
      currentUser: {
        id: req.user.id,
        role: req.user.role,
        email: req.user.email,
      },
      authorization: {
        isClient: project.client._id.toString() === req.user.id,
        isFreelancer: project.freelancer ? project.freelancer._id.toString() === req.user.id : false,
        freelancerAssigned: !!project.freelancer,
        clientMatch: {
          projectClientId: project.client._id.toString(),
          userIdType: typeof req.user.id,
          userId: req.user.id,
          match: project.client._id.toString() === req.user.id,
        },
        freelancerMatch: project.freelancer
          ? {
              projectFreelancerId: project.freelancer._id.toString(),
              userIdType: typeof req.user.id,
              userId: req.user.id,
              match: project.freelancer._id.toString() === req.user.id,
            }
          : null,
      },
    };

    res.json({
      success: true,
      data: debugInfo,
    });
  } catch (err) {
    console.error("Error in debugProjectAuth:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Reassign project to a different freelancer (Admin only)
 * @route   PUT /api/projects/:id/reassign-freelancer
 * @access  Private (Admin only)
 */
exports.reassignProjectFreelancer = async (req, res) => {
  try {
    const { newFreelancerId } = req.body;

    if (!newFreelancerId) {
      return res.status(400).json({ success: false, message: "New freelancer ID is required" });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    // Verify new freelancer exists and is a freelancer
    const newFreelancer = await User.findById(newFreelancerId);
    if (!newFreelancer || newFreelancer.role !== "freelancer") {
      return res.status(404).json({ success: false, message: "New freelancer not found or invalid role" });
    }

    const oldFreelancerId = project.freelancer;

    // Update project freelancer
    project.freelancer = newFreelancerId;
    await project.save();

    console.log(`🔄 PROJECT REASSIGNED:`);
    console.log(`  ├─ Project: ${project.title}`);
    console.log(`  ├─ Old Freelancer: ${oldFreelancerId}`);
    console.log(`  ├─ New Freelancer: ${newFreelancerId}`);
    console.log(`  └─ Updated by Admin: ${req.user.id}`);

    // Get user details for response
    const [oldFreelancer, updatedProject] = await Promise.all([
      User.findById(oldFreelancerId).select("name email"),
      Project.findById(req.params.id).populate("client", "name email").populate("freelancer", "name email"),
    ]);

    res.json({
      success: true,
      message: "Project freelancer reassigned successfully",
      data: {
        project: updatedProject,
        oldFreelancer: oldFreelancer,
        newFreelancer: newFreelancer,
      },
    });
  } catch (err) {
    console.error("Error in reassignProjectFreelancer:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
