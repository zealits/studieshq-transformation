const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const Job = require("../models/Job");
const Proposal = require("../models/Proposal");
const User = require("../models/User");
const Profile = require("../models/Profile");
const { Project } = require("../models/Project");

/**
 * Helper function to check if the user is the owner of a job or an admin
 * @param {Object} req - Express request object
 * @param {Object} job - Job document
 * @returns {boolean} - True if the user is the owner or an admin
 */
const isJobOwnerOrAdmin = (req, job) => {
  if (!req.user) return false;

  // If the user is an admin, they have access
  if (req.user.role === "admin") return true;

  // For clients, compare the job's client ID with the user's ID
  if (job.client) {
    // Handle both populated and unpopulated client field
    let jobClientId;

    if (typeof job.client === "object" && job.client._id) {
      // If client is populated, use _id
      jobClientId = job.client._id.toString();
    } else {
      // If client is just an ObjectId reference
      jobClientId = job.client.toString();
    }

    const userId = req.user.id.toString();

    // console.log(`Comparing job client ID: ${jobClientId} with user ID: ${userId}`);

    return jobClientId === userId;
  }

  return false;
};

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
    const {
      title,
      description,
      category,
      skills,
      budget,
      experience,
      duration,
      location,
      deadline,
      status,
      freelancersNeeded,
    } = req.body;

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
      type: budget.budgetType || budget.type || "milestone", // Support both budgetType and type
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
      freelancersNeeded: freelancersNeeded || 1,
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
  console.log("req.query", req.query);
  try {
    const { category, skills, min_budget, max_budget, experience, duration, location, status, mine, clientId } =
      req.query;

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

    // Check if request is authenticated - req.user will be populated by auth middleware
    // If auth fails, the middleware sets req.user to undefined but allows the request to continue
    if (req.user) {
      // Log the authenticated user
      console.log(`Authenticated user: ${req.user.id}, role: ${req.user.role}`);

      if (req.user.role === "client") {
        console.log("Client user detected");
        if (mine === "true") {
          console.log("mine is true");
          // IMPORTANT: Filter to only show the client's own jobs by exact ID match
          // If clientId is passed, use it for additional validation
          const filterClientId = clientId || req.user.id;

          // Verify the requesting user owns these jobs
          if (clientId && clientId !== req.user.id) {
            console.log(`Warning: Client ${req.user.id} attempted to access jobs for client ${clientId}`);
            return res.status(403).json({
              success: false,
              message: "Not authorized to view jobs from another client",
            });
          }

          console.log(`Filtering jobs for client ID: ${filterClientId}`);
          query.client = new mongoose.Types.ObjectId(filterClientId);

          // If status is provided, filter by status
          if (status) {
            query.status = status;
          }
          // By default show all job statuses for the client's own jobs
        } else {
          // For public access by a client, only show open jobs from other clients
          query.status = "open";
          // Don't show their own jobs in public listings to avoid confusion
          query.client = { $ne: new mongoose.Types.ObjectId(req.user.id) };
        }
      } else if (req.user.role === "freelancer") {
        // Freelancers should only see open jobs
        query.status = "open";
      } else if (req.user.role === "admin") {
        // Admin can see all jobs or filter by status
        if (status) {
          query.status = status;
        }
      }
    } else {
      // For unauthenticated requests with mine=true parameter, return an error
      if (mine === "true") {
        console.log("Unauthorized request tried to access client-specific jobs");
        return res.status(401).json({
          success: false,
          message: "Authentication required to view your jobs",
        });
      }

      // Unauthenticated users only see open jobs
      query.status = "open";
    }

    // Log the final query for debugging
    console.log("Final query:", JSON.stringify(query));

    const jobs = await Job.find(query)
      .populate("client", "name avatar email")
      .populate("client.profile")
      .select("-__v")
      .sort({ featured: -1, createdAt: -1 });

    // Get proposal counts for each job
    const jobsWithProposalCounts = await Promise.all(
      jobs.map(async (job) => {
        const proposalCount = await Proposal.countDocuments({ job: job._id });
        const jobObj = job.toObject();
        return {
          ...jobObj,
          proposals: [], // Initialize empty proposals array
          applicationCount: proposalCount, // Add the actual proposal count
        };
      })
    );

    // Log the number of jobs found
    console.log(`Found ${jobsWithProposalCounts.length} jobs matching the query`);

    // Always return an array of jobs, even if empty
    res.json({
      success: true,
      count: jobsWithProposalCounts.length,
      data: { jobs: jobsWithProposalCounts || [] },
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
    const job = await Job.findById(req.params.id).populate("client", "name avatar");

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
        data: { job: null },
      });
    }

    // Check if user is authenticated
    if (req.user) {
      // Log for debugging
      console.log(`Job client ID: ${job.client._id}, User ID: ${req.user.id}`);

      // If user is a client, they should only access their own jobs
      if (req.user.role === "client") {
        // Convert IDs to strings for proper comparison
        const jobClientId = job.client._id.toString();
        const userId = req.user.id.toString();

        if (jobClientId !== userId) {
          // If it's not the client's job and it's not an open job, deny access
          if (job.status !== "open") {
            console.log("Access denied: Client attempting to view another client's non-open job");
            return res.status(403).json({
              success: false,
              message: "Not authorized to view this job",
            });
          }

          // If it's an open job from another client, they can see basic details but not proposals
          console.log("Returning limited job info for another client's open job");
          const basicJobInfo = {
            _id: job._id,
            title: job.title,
            description: job.description,
            category: job.category,
            skills: job.skills,
            budget: job.budget,
            experience: job.experience,
            duration: job.duration,
            location: job.location,
            deadline: job.deadline,
            status: job.status,
            companyDetails: job.companyDetails,
            client: job.client,
            createdAt: job.createdAt,
            updatedAt: job.updatedAt,
            proposals: [], // Empty proposals array
          };

          return res.json({
            success: true,
            data: { job: basicJobInfo },
          });
        }
      }
    }

    // Increment view count
    job.viewCount += 1;
    await job.save();

    // If authenticated user is the job owner, show full details
    const isOwner = req.user && req.user.id === job.client._id.toString();
    const isAdmin = req.user && req.user.role === "admin";

    let responseJob = job.toObject();

    // If owner or admin, populate proposals
    if (isOwner || isAdmin) {
      const proposals = await Proposal.find({ job: job._id })
        .populate("freelancer", "name avatar")
        .select("-coverLetter");
      responseJob.proposals = proposals;
    } else {
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

    // Verify ownership using the helper function
    if (!isJobOwnerOrAdmin(req, job)) {
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
      "freelancersNeeded",
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

    // Verify ownership using the helper function
    if (!isJobOwnerOrAdmin(req, job)) {
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
    const existingProposal = await Proposal.findOne({
      job: job._id,
      freelancer: req.user.id,
    });

    if (existingProposal) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted a proposal for this job",
      });
    }

    const { coverLetter, bidPrice, estimatedDuration } = req.body;

    // Get freelancer profile information
    const freelancerProfile = await Profile.findOne({ user: req.user.id }).populate("user", "name avatar");

    if (!freelancerProfile) {
      return res.status(400).json({
        success: false,
        message: "You must complete your profile before submitting a proposal",
      });
    }

    // Validate bid price against freelancer's hourly rate
    if (job.budget.type === "hourly" && freelancerProfile.hourlyRate) {
      const minHourlyRate = freelancerProfile.hourlyRate.min || 0;
      if (bidPrice < minHourlyRate) {
        return res.status(400).json({
          success: false,
          message: `Your bid price ($${bidPrice}/hr) cannot be lower than your minimum hourly rate ($${minHourlyRate}/hr)`,
        });
      }
    }

    // Create profile snapshot with relevant freelancer information
    const profileSnapshot = {
      name: freelancerProfile.user.name,
      avatar: freelancerProfile.user.avatar,
      title: freelancerProfile.title || null,
      skills: freelancerProfile.skills || [],
      experience: Array.isArray(freelancerProfile.experience)
        ? freelancerProfile.experience.map((exp) => `${exp.title} at ${exp.company}`).join(", ")
        : "",
      hourlyRate: freelancerProfile.hourlyRate || { min: 0, max: 0 },
    };

    // Create new proposal
    const newProposal = new Proposal({
      job: job._id,
      freelancer: req.user.id,
      client: job.client,
      coverLetter,
      bidPrice,
      estimatedDuration,
      status: "pending",
      freelancerProfileSnapshot: profileSnapshot,
    });

    await newProposal.save();

    // Update job application count
    job.applicationCount += 1;
    await job.save();

    res.status(201).json({
      success: true,
      data: { proposal: newProposal },
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

    // Verify ownership using the helper function
    if (!isJobOwnerOrAdmin(req, job)) {
      return res.status(403).json({ success: false, message: "Not authorized to view proposals for this job" });
    }

    // Get proposals for this job
    const proposals = await Proposal.find({ job: job._id })
      .populate("freelancer", "name avatar")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: proposals.length,
      data: { proposals },
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

    // Verify ownership using the helper function
    if (!isJobOwnerOrAdmin(req, job)) {
      return res.status(403).json({ success: false, message: "Not authorized to update proposals for this job" });
    }

    // Find the proposal
    const proposal = await Proposal.findOne({
      _id: req.params.proposalId,
      job: job._id,
    });

    if (!proposal) {
      return res.status(404).json({ success: false, message: "Proposal not found" });
    }

    const { status } = req.body;

    // If accepting, check if we can accept more freelancers
    if (status === "accepted") {
      const acceptedProposals = await Proposal.countDocuments({
        job: job._id,
        status: "accepted",
      });

      if (acceptedProposals >= job.freelancersNeeded) {
        return res.status(400).json({
          success: false,
          message: "Maximum number of freelancers already hired for this job",
        });
      }

      // Create a project for the accepted freelancer
      const project = new Project({
        title: job.title,
        description: job.description,
        client: job.client,
        freelancer: proposal.freelancer,
        category: job.category,
        skills: job.skills,
        budget: proposal.bidPrice,
        startDate: new Date(),
        deadline: job.deadline,
        status: "in_progress",
        job: job._id,
      });

      console.log("project", project);
      await project.save();

      // Update proposal with project reference
      proposal.project = project._id;
      proposal.status = status;
      await proposal.save();

      // If this was the last required freelancer, update job status
      if (acceptedProposals + 1 >= job.freelancersNeeded) {
        job.status = "in_progress";
        await job.save();
      }

      // Send notifications
      // TODO: Implement notification system
      // - Notify freelancer about acceptance
      // - Notify client about successful hiring
      // - Notify other applicants if job is now closed

      return res.json({
        success: true,
        data: {
          proposal,
          project,
          jobStatus: job.status,
          remainingSlots: job.freelancersNeeded - (acceptedProposals + 1),
        },
      });
    }

    // For other status updates (rejected, shortlisted, etc.)
    proposal.status = status;
    await proposal.save();

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

    // Verify ownership using the helper function
    if (!isJobOwnerOrAdmin(req, job)) {
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

/**
 * @desc    Get all jobs for admin dashboard (all statuses)
 * @route   GET /api/jobs/admin/all
 * @access  Private (Admin only)
 */
exports.getAllJobsForAdmin = async (req, res) => {
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
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { skills: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get all jobs with filters, sorting, and pagination
    const jobs = await Job.find(filter)
      .sort({ createdAt: -1 })
      .populate("client", "name email avatar")
      .select("-__v")
      .skip(skip)
      .limit(parseInt(limit));

    // Get proposal counts for each job
    const jobsWithProposalCounts = await Promise.all(
      jobs.map(async (job) => {
        const proposalCount = await Proposal.countDocuments({ job: job._id });
        const jobObj = job.toObject();
        return {
          ...jobObj,
          applicationCount: proposalCount,
        };
      })
    );

    // Get total count for pagination
    const totalJobs = await Job.countDocuments(filter);

    // Get unique categories for filter dropdown
    const categories = await Job.distinct("category");

    res.status(200).json({
      success: true,
      data: {
        jobs: jobsWithProposalCounts,
        categories,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalJobs / parseInt(limit)),
          totalJobs,
          hasNext: skip + jobs.length < totalJobs,
          hasPrev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error in getAllJobsForAdmin:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching jobs for admin",
      error: error.message,
    });
  }
};

/**
 * @desc    Get job counts by category for home page
 * @route   GET /api/jobs/categories/counts
 * @access  Public
 */
exports.getJobCountsByCategory = async (req, res) => {
  try {
    // Get job counts by category for open jobs only
    const categoryCounts = await Job.aggregate([
      { $match: { status: "open" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Format the response
    const formattedCounts = categoryCounts.map((item) => ({
      category: item._id,
      count: item.count,
    }));

    res.status(200).json({
      success: true,
      data: formattedCounts,
    });
  } catch (error) {
    console.error("Error in getJobCountsByCategory:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching job counts by category",
      error: error.message,
    });
  }
};

const getAllJobs = async (req, res) => {
  try {
    const { query, category, budget, jobType, experience, sortBy = "newest" } = req.query;

    // Build the filter object
    const filter = { status: "open" };

    // Add category filter
    if (category) {
      filter.category = category;
    }

    // Add job type filter
    if (jobType) {
      filter["budget.type"] = jobType;
    }

    // Add experience level filter
    if (experience) {
      filter.experience = experience;
    }

    // Add budget range filter
    if (budget) {
      const [min, max] = budget.split("-").map(Number);
      if (budget === "10000+") {
        filter["budget.max"] = { $gte: 10000 };
      } else {
        filter["budget.max"] = { $gte: min, $lte: max };
      }
    }

    // Build the search query
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { skills: { $in: [new RegExp(query, "i")] } },
      ];
    }

    // Build the sort object
    let sort = {};
    switch (sortBy) {
      case "newest":
        sort = { createdAt: -1 };
        break;
      case "budget-high":
        sort = { "budget.max": -1 };
        break;
      case "budget-low":
        sort = { "budget.min": 1 };
        break;
      case "proposals":
        sort = { "proposals.length": -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    // Get all jobs with filters and sorting
    const jobs = await Job.find(filter)
      .sort(sort)
      .populate("client", "name email profile")
      .populate("proposals")
      .lean();

    // Get unique categories for the filter dropdown
    const categories = await Job.distinct("category", { status: "open" });

    res.status(200).json({
      success: true,
      data: {
        jobs,
        categories,
      },
    });
  } catch (error) {
    console.error("Error in getAllJobs:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching jobs",
      error: error.message,
    });
  }
};
