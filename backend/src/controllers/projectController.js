const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const { Project, Attachment } = require("../models/Project");
const User = require("../models/User");
const { Job, Proposal } = require("../models/Job");

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

    // If user is client or admin, they can update client-only fields
    if (req.user.role === "client" || req.user.role === "admin") {
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
    if (percentage) milestone.percentage = percentage;
    if (dueDate) milestone.dueDate = dueDate;

    await project.save();

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

    const { title, description, percentage, dueDate } = req.body;

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

    // Create new milestone
    const milestone = {
      title,
      description,
      percentage,
      dueDate,
      status: "pending",
      createdBy: req.user.id,
      approvalStatus: "pending",
    };

    project.milestones.push(milestone);
    await project.save();

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
    }

    await project.save();

    res.json({
      success: true,
      data: { milestone },
    });
  } catch (err) {
    console.error("Error in approveMilestone:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
