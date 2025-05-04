const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const { Job, Proposal } = require("../models/Job");
const User = require("../models/User");
const Profile = require("../models/Profile");

/**
 * @desc    Create a new job posting
 * @route   POST /api/jobs
 * @access  Private (Client only)
 */
exports.createJob = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { title, description, category, skills, budget, experience, duration, location, deadline, status } = req.body;

    // Get client profile for company details
    const clientProfile = await Profile.findOne({ user: req.user.id }).populate("user", "name email");

    if (!clientProfile) {
      return res.status(400).json({
        success: false,
        message: "You must complete your profile before posting a job",
      });
    }

    // Extract company details from client profile
    const companyDetails = {
      name: clientProfile.company ? clientProfile.company.name : null,
      website: clientProfile.company ? clientProfile.company.website : null,
      logo: clientProfile.company ? clientProfile.company.logo : null,
      description: clientProfile.company ? clientProfile.company.description : null,
      location: clientProfile.location || null,
    };

    // Handle the budget field to ensure we use budgetType
    const normalizedBudget = {
      min: budget.min,
      max: budget.max,
      type: budget.budgetType || budget.type || "fixed", // Support both budgetType and type
    };

    // Create new job
    const job = new Job({
      title,
      description,
      client: req.user.id,
      category,
      skills,
      budget: normalizedBudget,
      experience,
      duration,
      location,
      deadline,
      status: status === "draft" ? "draft" : "open", // Default to open if not explicitly set to draft
      companyDetails,
    });

    await job.save();

    res.status(201).json({
      success: true,
      data: { job },
    });
  } catch (err) {
    console.error("Error in createJob:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get all jobs (with filters)
 * @route   GET /api/jobs
 * @access  Public
 */
exports.getJobs = async (req, res) => {
  try {
    const { category, skills, min_budget, max_budget, experience, duration, location, status, mine } = req.query;

    let query = {};

    // Add filters if provided
    if (category) query.category = category;
    if (skills) {
      const skillsArray = skills.split(",").map((skill) => skill.trim());
      query.skills = { $in: skillsArray };
    }

    // Budget filtering
    if (min_budget || max_budget) {
      query["budget.min"] = {};
      query["budget.max"] = {};

      if (min_budget) query["budget.min"].$gte = parseInt(min_budget);
      if (max_budget) query["budget.max"].$lte = parseInt(max_budget);
    }

    if (experience) query.experience = experience;
    if (duration) query.duration = duration;
    if (location) query.location = location;

    // If client is requesting their own jobs, show all of their jobs
    if (mine === "true" && req.user && req.user.role === "client") {
      query.client = req.user.id;

      // If status is provided, filter by status
      if (status) {
        query.status = status;
      }
    } else {
      // For freelancers or public access, only show open jobs
      query.status = "open";
    }

    // Admin can see all jobs or filter by status
    if (req.user && req.user.role === "admin") {
      if (status) {
        query.status = status;
      } else {
        delete query.status; // Admin can see all statuses if not specified
      }
    }

    const jobs = await Job.find(query)
      .populate("client", "name avatar email")
      .populate("client.profile")
      .select("-__v")
      .sort({ featured: -1, createdAt: -1 });

    // Always return an array of jobs, even if empty
    res.json({
      success: true,
      count: jobs.length,
      data: { jobs: jobs || [] },
    });
  } catch (err) {
    console.error("Error in getJobs:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get a single job by ID
 * @route   GET /api/jobs/:id
 * @access  Public
 */
exports.getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate("client", "name avatar")
      .populate({
        path: "proposals",
        populate: {
          path: "freelancer",
          select: "name avatar",
        },
        select: "-coverLetter",
      });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
        data: { job: null },
      });
    }

    // Increment view count
    job.viewCount += 1;
    await job.save();

    // If authenticated user is the job owner, show full details
    const isOwner = req.user && req.user.id === job.client._id.toString();
    const isAdmin = req.user && req.user.role === "admin";

    let responseJob = job.toObject();

    // If not owner or admin, remove proposals
    if (!isOwner && !isAdmin) {
      responseJob.proposals = [];
    }

    res.json({
      success: true,
      data: { job: responseJob },
    });
  } catch (err) {
    console.error("Error in getJob:", err.message);

    if (err.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        message: "Job not found",
        data: { job: null },
      });
    }

    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Update a job
 * @route   PUT /api/jobs/:id
 * @access  Private (Client only, must be job owner)
 */
exports.updateJob = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    // Verify ownership
    if (job.client.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized to update this job" });
    }

    // Cannot update a job that already has a hired freelancer
    if (job.status !== "open" && job.status !== "draft" && req.user.role !== "admin") {
      return res.status(400).json({
        success: false,
        message: "Cannot update a job that is not in open or draft status",
      });
    }

    // If the job doesn't have company details, get them from the client profile
    if (!job.companyDetails || Object.keys(job.companyDetails).every((key) => !job.companyDetails[key])) {
      // Get client profile for company details
      const clientProfile = await Profile.findOne({ user: req.user.id });

      if (clientProfile && clientProfile.company) {
        job.companyDetails = {
          name: clientProfile.company.name || null,
          website: clientProfile.company.website || null,
          logo: clientProfile.company.logo || null,
          description: clientProfile.company.description || null,
          location: clientProfile.location || null,
        };
      }
    }

    // Update fields that are provided
    const updatableFields = [
      "title",
      "description",
      "category",
      "skills",
      "budget",
      "experience",
      "duration",
      "location",
      "deadline",
      "status",
      "featured",
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        // Special handling for budget field to handle the type/budgetType transition
        if (field === "budget" && req.body.budget) {
          const { min, max, type, budgetType } = req.body.budget;
          job.budget = {
            min: min !== undefined ? min : job.budget.min,
            max: max !== undefined ? max : job.budget.max,
            type: budgetType || type || job.budget.type, // Support both old and new field names
          };
        } else {
          job[field] = req.body[field];
        }
      }
    });

    await job.save();

    res.json({
      success: true,
      data: { job },
    });
  } catch (err) {
    console.error("Error in updateJob:", err.message);

    if (err.kind === "ObjectId") {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Delete a job
 * @route   DELETE /api/jobs/:id
 * @access  Private (Client only, must be job owner)
 */
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    // Verify ownership
    if (job.client.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized to delete this job" });
    }

    // Cannot delete a job that already has a hired freelancer
    if (job.status !== "open" && job.status !== "draft" && req.user.role !== "admin") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete a job that is not in open or draft status",
      });
    }

    await job.remove();

    res.json({
      success: true,
      data: {},
    });
  } catch (err) {
    console.error("Error in deleteJob:", err.message);

    if (err.kind === "ObjectId") {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Submit a proposal for a job
 * @route   POST /api/jobs/:id/proposals
 * @access  Private (Freelancer only)
 */
exports.submitProposal = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    // Verify job is open
    if (job.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "Cannot submit a proposal for a job that is not open",
      });
    }

    // Check if freelancer already submitted a proposal
    const existingProposal = job.proposals.find((proposal) => proposal.freelancer.toString() === req.user.id);

    if (existingProposal) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted a proposal for this job",
      });
    }

    const { coverLetter, bidAmount, estimatedDuration } = req.body;

    // Create new proposal
    const newProposal = {
      freelancer: req.user.id,
      coverLetter,
      bidAmount,
      estimatedDuration,
      status: "pending",
    };

    // Add proposal to job
    job.proposals.push(newProposal);
    job.applicationCount += 1;
    await job.save();

    res.status(201).json({
      success: true,
      data: { proposal: job.proposals[job.proposals.length - 1] },
    });
  } catch (err) {
    console.error("Error in submitProposal:", err.message);

    if (err.kind === "ObjectId") {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get all proposals for a job
 * @route   GET /api/jobs/:id/proposals
 * @access  Private (Client only, must be job owner)
 */
exports.getProposals = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    // Verify ownership
    if (job.client.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized to view proposals for this job" });
    }

    // Populate freelancer details
    await job.populate({
      path: "proposals.freelancer",
      select: "name avatar",
    });

    res.json({
      success: true,
      count: job.proposals.length,
      data: { proposals: job.proposals },
    });
  } catch (err) {
    console.error("Error in getProposals:", err.message);

    if (err.kind === "ObjectId") {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Update proposal status (accept/reject)
 * @route   PUT /api/jobs/:id/proposals/:proposalId
 * @access  Private (Client only, must be job owner)
 */
exports.updateProposalStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    // Verify ownership
    if (job.client.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized to update proposals for this job" });
    }

    // Find the proposal
    const proposal = job.proposals.id(req.params.proposalId);
    if (!proposal) {
      return res.status(404).json({ success: false, message: "Proposal not found" });
    }

    const { status } = req.body;

    // If accepting, make sure no other proposal is already accepted
    if (status === "accepted") {
      const alreadyAccepted = job.proposals.find((p) => p.status === "accepted");
      if (alreadyAccepted) {
        return res.status(400).json({
          success: false,
          message: "Another proposal has already been accepted for this job",
        });
      }

      // Update job status to in_progress when a proposal is accepted
      job.status = "in_progress";
    }

    // Update proposal status
    proposal.status = status;
    await job.save();

    res.json({
      success: true,
      data: { proposal },
    });
  } catch (err) {
    console.error("Error in updateProposalStatus:", err.message);

    if (err.kind === "ObjectId") {
      return res.status(404).json({ success: false, message: "Job or proposal not found" });
    }

    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Publish a draft job
 * @route   PUT /api/jobs/:id/publish
 * @access  Private (Client only, must be job owner)
 */
exports.publishJob = async (req, res) => {
  try {
    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    // Verify ownership
    if (job.client.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized to publish this job" });
    }

    // Verify the job is in draft status
    if (job.status !== "draft") {
      return res.status(400).json({
        success: false,
        message: "Only draft jobs can be published",
      });
    }

    // Ensure required fields are present
    const requiredFields = ["title", "description", "category", "budget", "deadline"];
    const missingFields = requiredFields.filter((field) => !job[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Update job status to open
    job.status = "open";
    await job.save();

    res.json({
      success: true,
      data: { job },
    });
  } catch (err) {
    console.error("Error in publishJob:", err.message);

    if (err.kind === "ObjectId") {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    res.status(500).json({ success: false, message: "Server error" });
  }
};
