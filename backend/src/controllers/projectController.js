const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const { Project, Attachment } = require("../models/Project");
const User = require("../models/User");
const { Job, Proposal } = require("../models/Job");

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
  return project.milestones.every((milestone) => milestone.status === "completed");
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

      // Check if all milestones are completed and update project status
      if (checkProjectCompletion(project) && project.status !== "completed") {
        project.status = "completed";
        project.completedDate = new Date();
      }
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

    // Check if user is the freelancer for this project
    if (project.freelancer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized to start this milestone" });
    }

    const milestone = project.milestones.id(req.params.milestoneId);
    if (!milestone) {
      return res.status(404).json({ success: false, message: "Milestone not found" });
    }

    // Check if milestone is in pending status
    if (milestone.status !== "pending") {
      return res.status(400).json({ success: false, message: "Milestone is already started or completed" });
    }

    const { estimatedCompletionDate } = req.body;

    // Update milestone status
    milestone.status = "in_progress";
    milestone.workStartedDate = new Date();
    if (estimatedCompletionDate) {
      milestone.estimatedCompletionDate = estimatedCompletionDate;
    }

    await project.save();

    res.json({
      success: true,
      data: { milestone },
    });
  } catch (err) {
    console.error("Error in startMilestone:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
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

      // Check if all milestones are completed and update project status
      if (checkProjectCompletion(project) && project.status !== "completed") {
        project.status = "completed";
        project.completedDate = new Date();
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

    console.log("Populated attachments:", {
      attachmentCount: populatedMilestone.attachments?.length || 0,
      attachments: populatedMilestone.attachments?.map((att) => ({
        id: att._id,
        filename: att.filename,
        originalname: att.originalname,
      })),
    });

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
