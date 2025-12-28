const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const Job = require("../models/Job");
const Proposal = require("../models/Proposal");
const User = require("../models/User");
const Profile = require("../models/Profile");
const { Project } = require("../models/Project");
const JobInvitation = require("../models/JobInvitation");
const emailService = require("../services/emailService");
const resumeParserService = require("../services/resumeParserService");

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
      verificationMandatory,
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
      status: status === "draft" ? "draft" : "draft", // Always start as draft, will be open after budget blocking
      companyDetails,
      freelancersNeeded: freelancersNeeded || 1,
      verificationMandatory: verificationMandatory || false,
    });

    await job.save();

    // Register project with resume parser API
    try {
      const projectRegistrationResult = await resumeParserService.registerProject(
        description,
        skills,
        title,
        deadline
      );
      if (projectRegistrationResult.success && projectRegistrationResult.projectId) {
        job.project_id = projectRegistrationResult.projectId;
        await job.save();
        console.log(`Project registered successfully with ID: ${projectRegistrationResult.projectId}`);
      } else {
        console.warn("Project registration failed, but job was created:", projectRegistrationResult.error);
      }
    } catch (projectRegError) {
      // Don't fail job creation if project registration fails
      console.error("Error registering project with resume parser API:", projectRegError);
    }

    // If not a draft, require budget blocking
    if (status !== "draft") {
      const Settings = require("../models/Settings");
      const { Wallet } = require("../models/Payment");

      // Calculate total amount to block: max budget * freelancers needed
      const amountToBlock = normalizedBudget.max * (freelancersNeeded || 1);

      // Get platform fee percentage
      const platformFeePercentage = await Settings.getSetting("platformFee", 10);
      const clientPlatformFee = (amountToBlock * platformFeePercentage) / 100;
      const totalChargedToClient = amountToBlock + clientPlatformFee;

      // Check if client has enough balance
      let clientWallet = await Wallet.findOne({ user: req.user.id });
      if (!clientWallet) {
        clientWallet = new Wallet({ user: req.user.id });
        await clientWallet.save();
      }

      if (clientWallet.balance < totalChargedToClient) {
        // Delete the job if insufficient funds
        await Job.findByIdAndDelete(job._id);
        return res.status(400).json({
          success: false,
          message: `Insufficient funds to post job. Required: $${totalChargedToClient.toFixed(
            2
          )}, Available: $${clientWallet.balance.toFixed(2)}`,
          data: {
            required: totalChargedToClient,
            available: clientWallet.balance,
            breakdown: {
              projectBudget: amountToBlock,
              platformFee: clientPlatformFee,
              total: totalChargedToClient,
            },
          },
        });
      }
    }

    res.status(201).json({
      success: true,
      data: { job },
      message:
        status === "draft"
          ? "Job saved as draft"
          : "Job created successfully. Please confirm budget blocking to make it live.",
    });
  } catch (err) {
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
      // console.log(`Authenticated user: ${req.user.id}, role: ${req.user.role}`);

      if (req.user.role === "client" || req.user.role === "project_sponsor_company") {
        if (mine === "true") {
          // IMPORTANT: Filter to only show the client's own jobs by exact ID match
          // If clientId is passed, use it for additional validation
          const filterClientId = clientId || req.user.id;

          // Verify the requesting user owns these jobs
          if (clientId && clientId !== req.user.id) {
            return res.status(403).json({
              success: false,
              message: "Not authorized to view jobs from another client",
            });
          }

          // console.log(`Filtering jobs for client ID: ${filterClientId}`);
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
        return res.status(401).json({
          success: false,
          message: "Authentication required to view your jobs",
        });
      }

      // Unauthenticated users only see open jobs
      query.status = "open";
    }

    // Log the final query for debugging
    // console.log("Final query:", JSON.stringify(query));

    // If user is a freelancer with candidateId, fetch relevant projects from API
    // Only do AI matching if bestMatch query parameter is true
    let relevantProjectsMap = new Map(); // Map of project_id -> overall_score
    let shouldSortByRelevance = false;
    const bestMatch = req.query.bestMatch === "true";

    if (req.user && req.user.role === "freelancer" && bestMatch) {
      try {
        // Get user with candidateId
        const user = await User.findById(req.user.id).select("candidateId");
        
        if (user && user.candidateId) {
          console.log(`Fetching relevant projects for freelancer with candidateId: ${user.candidateId}`);
          
          const relevantProjectsResult = await resumeParserService.getRelevantProjects(user.candidateId, 100);
          
          if (relevantProjectsResult.success && relevantProjectsResult.projects) {
            // Create a map of project_id -> overall_score for quick lookup
            relevantProjectsResult.projects.forEach((project) => {
              relevantProjectsMap.set(project.project_id, {
                overall_score: project.overall_score,
                description_score: project.description_score,
                skills_score: project.skills_score,
              });
            });
            
            shouldSortByRelevance = true;
            console.log(`Found ${relevantProjectsMap.size} relevant projects from API`);
          } else {
            console.warn("Failed to fetch relevant projects:", relevantProjectsResult.error);
          }
        }
      } catch (apiError) {
        console.error("Error fetching relevant projects from API:", apiError);
        // Continue with normal job fetching if API fails
      }
    }

    // Build the base query for jobs - fetch all jobs matching the filters
    // We'll sort by relevance later if we have API data
    const jobs = await Job.find(query)
      .populate("client", "name avatar email role company")
      .populate("client.profile")
      .select("-__v")
      .sort({ featured: -1, createdAt: -1 });

    // Get proposal counts for each job and add relevance scores
    const jobsWithProposalCounts = await Promise.all(
      jobs.map(async (job) => {
        const proposalCount = await Proposal.countDocuments({ job: job._id });
        const jobObj = job.toObject();
        
        // Add relevance scores if available
        if (shouldSortByRelevance && job.project_id && relevantProjectsMap.has(job.project_id)) {
          const relevanceData = relevantProjectsMap.get(job.project_id);
          jobObj.overall_score = relevanceData.overall_score;
          jobObj.description_score = relevanceData.description_score;
          jobObj.skills_score = relevanceData.skills_score;
        } else {
          // Set default scores for jobs not in the API response
          jobObj.overall_score = 0;
          jobObj.description_score = 0;
          jobObj.skills_score = 0;
        }
        
        return {
          ...jobObj,
          proposals: [], // Initialize empty proposals array
          applicationCount: proposalCount, // Add the actual proposal count
        };
      })
    );

    // Calculate tags for all jobs (after all jobs are processed)
    // First, calculate thresholds that require all jobs data
    const allScores = jobsWithProposalCounts
      .map((j) => j.overall_score || 0)
      .filter((score) => score > 0)
      .sort((a, b) => b - a);
    const top20Percentile = allScores.length > 0 ? (allScores[Math.floor(allScores.length * 0.2)] || 0) : 0;
    
    const budgets = jobs.map((j) => j.budget?.max || 0).sort((a, b) => b - a);
    const top25Percentile = budgets.length > 0 ? (budgets[Math.floor(budgets.length * 0.25)] || 0) : 0;

    // Now add tags to each job
    const jobsWithTags = jobsWithProposalCounts.map((jobObj) => {
      const tags = [];
      const job = jobs.find((j) => j._id.toString() === jobObj._id.toString());
      
      // "Best Match" tag - if overall_score is high (top 20% or > 0.5)
      if (shouldSortByRelevance && jobObj.overall_score > 0) {
        if (jobObj.overall_score >= top20Percentile || jobObj.overall_score >= 0.5) {
          tags.push({
            type: "best_match",
            label: "Best Match",
            color: "green", // Green for best match
          });
        }
      }
      
      // "Posted Today" tag - if job was posted today
      if (job && job.createdAt) {
        const today = new Date();
        const jobDate = new Date(job.createdAt);
        today.setHours(0, 0, 0, 0);
        jobDate.setHours(0, 0, 0, 0);
        
        if (jobDate.getTime() === today.getTime()) {
          tags.push({
            type: "posted_today",
            label: "Posted Today",
            color: "blue", // Blue for posted today
          });
        }
      }
      
      // "Closing Soon" tag - if deadline is within 3 days
      if (job && job.deadline) {
        const deadline = new Date(job.deadline);
        const now = new Date();
        const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDeadline >= 0 && daysUntilDeadline <= 3) {
          tags.push({
            type: "closing_soon",
            label: daysUntilDeadline === 0 ? "Closing Today" : daysUntilDeadline === 1 ? "Closing Tomorrow" : "Closing Soon",
            color: "red", // Red for urgency
          });
        }
      }
      
      // "New" tag - if job was posted within last 24 hours
      if (job && job.createdAt) {
        const now = new Date();
        const jobDate = new Date(job.createdAt);
        const hoursSincePosted = (now - jobDate) / (1000 * 60 * 60);
        
        if (hoursSincePosted <= 24 && !tags.find((t) => t.type === "posted_today")) {
          tags.push({
            type: "new",
            label: "New",
            color: "purple", // Purple for new
          });
        }
      }
      
      // "High Budget" tag - if budget max is in top 25%
      if (job && job.budget?.max >= top25Percentile && job.budget?.max >= 1000) {
        tags.push({
          type: "high_budget",
          label: "High Budget",
          color: "gold", // Gold for high budget
        });
      }
      
      // "Featured" tag - if job is featured
      if (job && job.featured) {
        tags.push({
          type: "featured",
          label: "Featured",
          color: "yellow", // Yellow for featured
        });
      }
      
      return {
        ...jobObj,
        tags: tags, // Add tags array
      };
    });

    // Sort by overall_score (descending) if we have relevance data, otherwise keep original sort
    if (shouldSortByRelevance) {
      jobsWithTags.sort((a, b) => {
        // First sort by overall_score (descending)
        if (b.overall_score !== a.overall_score) {
          return b.overall_score - a.overall_score;
        }
        // Then by featured status
        if (b.featured !== a.featured) {
          return b.featured ? 1 : -1;
        }
        // Finally by creation date (newest first)
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    }

    // Log the number of jobs found
    // console.log(`Found ${jobsWithTags.length} jobs matching the query`);

    // Always return an array of jobs, even if empty
    res.json({
      success: true,
      count: jobsWithTags.length,
      data: { jobs: jobsWithTags || [] },
    });
  } catch (err) {
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
      // console.log(`Job client ID: ${job.client._id}, User ID: ${req.user.id}`);

      // If user is a client or project_sponsor_company, they should only access their own jobs
      if (req.user.role === "client" || req.user.role === "project_sponsor_company") {
        // Convert IDs to strings for proper comparison
        const jobClientId = job.client._id.toString();
        const userId = req.user.id.toString();

        if (jobClientId !== userId) {
          // If it's not the client's job and it's not an open job, deny access
          if (job.status !== "open") {
            return res.status(403).json({
              success: false,
              message: "Not authorized to view this job",
            });
          }

          // If it's an open job from another client, they can see basic details but not proposals
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
      "verificationMandatory",
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
    const freelancerProfile = await Profile.findOne({ user: req.user.id }).populate(
      "user",
      "name avatar companyFreelancer companyFreelancerName"
    );

    if (!freelancerProfile) {
      return res.status(400).json({
        success: false,
        message: "You must complete your profile before submitting a proposal",
      });
    }

    // Check if verification is mandatory for this job
    if (job.verificationMandatory) {
      // Check if freelancer is verified
      const isVerified =
        freelancerProfile.verificationStatus === "verified" ||
        (freelancerProfile.verificationDocuments?.addressProof?.status === "approved" &&
          freelancerProfile.verificationDocuments?.identityProof?.status === "approved");

      if (!isVerified) {
        return res.status(403).json({
          success: false,
          message: "Verification is required to apply for this project. Please complete your verification documents first.",
          requiresVerification: true,
        });
      }
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
      companyName:
        freelancerProfile.user.companyFreelancer?.companyName || freelancerProfile.user.companyFreelancerName || null,
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

    // Send email notification to client about new proposal
    try {
      const client = await User.findById(job.client);
      const freelancer = await User.findById(req.user.id);

      if (client && freelancer) {
        await emailService.sendNewProposalNotification(client, freelancer, job, newProposal);
      }
    } catch (emailError) {
      // Don't fail the proposal submission if email fails
    }

    res.status(201).json({
      success: true,
      data: { proposal: newProposal },
    });
  } catch (err) {
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
      .populate("freelancer", "name avatar companyFreelancer companyFreelancerName")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: proposals.length,
      data: { proposals },
    });
  } catch (err) {
    if (err.kind === "ObjectId") {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get ranked candidates for a job
 * @route   GET /api/jobs/:id/ranked-candidates
 * @access  Private (Client only, must be job owner)
 */
exports.getRankedCandidates = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    // Verify ownership using the helper function
    if (!isJobOwnerOrAdmin(req, job)) {
      return res.status(403).json({ success: false, message: "Not authorized to view ranked candidates for this job" });
    }

    // Check if job has a project_id
    if (!job.project_id) {
      return res.status(400).json({
        success: false,
        message: "This job does not have a project ID. Ranked candidates are only available for jobs with registered projects.",
      });
    }

    // Get top_k from query params (default: 100)
    const topK = parseInt(req.query.top_k) || 100;

    // Get optional filters from query params
    const filters = {
      has_leadership: req.query.has_leadership || null,
      highest_education: req.query.highest_education || null,
      seniority_level: req.query.seniority_level || null,
    };

    // Call the resume parser service to get ranked candidates
    const rankedCandidatesResult = await resumeParserService.getRankedCandidates(job.project_id, topK, filters);

    if (!rankedCandidatesResult.success) {
      return res.status(500).json({
        success: false,
        message: rankedCandidatesResult.error?.message || "Failed to fetch ranked candidates",
        error: rankedCandidatesResult.error,
      });
    }

    // Get all proposals for this job with freelancer populated
    const proposals = await Proposal.find({ job: job._id }).populate("freelancer", "name avatar candidateId");

    // Create a map of candidate_id to ranked candidate data
    const rankedCandidatesMap = new Map();
    rankedCandidatesResult.rankedCandidates.forEach((candidate) => {
      rankedCandidatesMap.set(candidate.candidate_id, candidate);
    });

    // Match proposals with ranked candidates using candidateId
    const matchedProposals = proposals
      .map((proposal) => {
        const freelancerCandidateId = proposal.freelancer?.candidateId;
        if (!freelancerCandidateId) {
          return null; // Skip proposals where freelancer doesn't have a candidateId
        }

        const rankedCandidate = rankedCandidatesMap.get(freelancerCandidateId);
        if (!rankedCandidate) {
          return null; // Skip proposals where freelancer is not in ranked results
        }

        // Return proposal with ranking data
        return {
          proposal: proposal.toObject(),
          ranking: {
            overallScore: rankedCandidate.overall_score,
            professionalScore: rankedCandidate.professional_score,
            projectScore: rankedCandidate.project_score,
            skillsScore: rankedCandidate.skills_score,
            seniorityLevel: rankedCandidate.seniority_level,
            highestEducation: rankedCandidate.highest_education,
            hasLeadership: rankedCandidate.has_leadership,
          },
        };
      })
      .filter((item) => item !== null) // Remove null entries
      .sort((a, b) => b.ranking.overallScore - a.ranking.overallScore); // Sort by overall score descending

    res.json({
      success: true,
      data: {
        projectId: rankedCandidatesResult.projectId,
        projectDescription: rankedCandidatesResult.projectDescription,
        requiredSkills: rankedCandidatesResult.requiredSkills,
        filtersApplied: rankedCandidatesResult.filtersApplied,
        topK: rankedCandidatesResult.topK,
        resultsCount: rankedCandidatesResult.resultsCount,
        matchedProposals: matchedProposals.map((item) => item.proposal),
        rankings: matchedProposals.reduce((acc, item) => {
          acc[item.proposal._id.toString()] = item.ranking;
          return acc;
        }, {}),
      },
    });
  } catch (err) {
    console.error("Error getting ranked candidates:", err);
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

      // Create a project for the accepted freelancer WITHOUT default milestones
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
        status: "pending", // Start as pending until escrow is created
        job: job._id,
        escrowStatus: "none",
        milestones: [], // Initialize with empty milestones - client will create them manually
      });

      // console.log("project", project);
      await project.save();

      // Call the escrow service to create escrow and handle refund
      const escrowController = require("./escrowController");

      // Create a mock request object for the escrow controller
      const escrowReq = {
        user: { id: job.client.toString() },
        body: {
          projectId: project._id,
          freelancerId: proposal.freelancer,
          agreedAmount: proposal.bidPrice,
        },
      };

      // Create a mock response object to capture the result
      let escrowResult = null;
      const escrowRes = {
        json: (data) => {
          escrowResult = data;
        },
        status: () => escrowRes,
      };

      try {
        await escrowController.createEscrow(escrowReq, escrowRes);

        if (escrowResult && escrowResult.success) {
          // Update project status to in_progress since escrow is now created
          project.status = "in_progress";
          project.escrowStatus = "escrowed";
          await project.save();
        } else {
          throw new Error("Escrow creation failed");
        }
      } catch (escrowError) {
        // Delete the project since escrow creation failed
        await Project.findByIdAndDelete(project._id);
        throw new Error("Failed to create escrow for project");
      }

      // Update proposal with project reference
      proposal.project = project._id;
      proposal.status = status;
      await proposal.save();

      // If this was the last required freelancer, update job status
      if (acceptedProposals + 1 >= job.freelancersNeeded) {
        job.status = "in_progress";
        await job.save();
      }

      // Send email notifications
      try {
        const client = await User.findById(job.client);
        const freelancer = await User.findById(proposal.freelancer);

        if (client && freelancer) {
          // Notify freelancer about acceptance
          await emailService.sendProposalStatusNotification(freelancer, job, proposal, proposal.status);

          // Notify client about successful hiring
          await emailService.sendFreelancerHiredNotification(client, freelancer, project);
        }
      } catch (emailError) {
        // Don't fail the proposal acceptance if email fails
      }

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
    const oldStatus = proposal.status;
    proposal.status = status;
    await proposal.save();

    // Send email notification to freelancer about status change
    try {
      const freelancer = await User.findById(proposal.freelancer);

      if (freelancer) {
        await emailService.sendProposalStatusNotification(freelancer, job, proposal, oldStatus);
      }
    } catch (emailError) {
      // Don't fail the proposal update if email fails
    }

    res.json({
      success: true,
      data: { proposal },
    });
  } catch (err) {
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

    // Block budget before publishing the job
    const escrowController = require("./escrowController");

    // Create a mock request object for the escrow controller
    const escrowReq = {
      user: { id: req.user.id },
      body: { jobId: job._id },
    };

    // Create a mock response object to capture the result
    let escrowResult = null;
    let escrowError = null;
    const escrowRes = {
      json: (data) => {
        escrowResult = data;
      },
      status: (code) => ({
        json: (data) => {
          escrowError = data;
          escrowResult = { success: false, statusCode: code, ...data };
        },
      }),
    };

    // Try to block the budget
    try {
      await escrowController.blockJobBudget(escrowReq, escrowRes);

      if (escrowResult && escrowResult.success) {
        // Budget blocked successfully, update job status
        job.status = "open";
        await job.save();

        res.json({
          success: true,
          data: { job },
          message: "Job published successfully and budget blocked in escrow",
        });
      } else {
        // Budget blocking failed
        const errorMessage = escrowResult?.message || escrowError?.message || "Failed to block budget";
        return res.status(400).json({
          success: false,
          message: errorMessage,
          data: escrowResult || escrowError,
        });
      }
    } catch (budgetError) {
      return res.status(400).json({
        success: false,
        message: "Failed to block budget for job publication",
        error: budgetError.message,
      });
    }
  } catch (err) {
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
    res.status(500).json({
      success: false,
      message: "Error fetching jobs",
      error: error.message,
    });
  }
};

/**
 * @desc    Invite a freelancer to a job
 * @route   POST /api/jobs/:id/invite
 * @access  Private (Client only, must be job owner)
 */
exports.inviteFreelancer = async (req, res) => {
  console.log("Invitation request received:", {
    body: req.body,
    params: req.params,
    headers: req.headers,
    user: req.user,
  });

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("Validation errors:", errors.array());
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    // Check if user is the job owner or admin
    console.log("Authorization check:", {
      userId: req.user?.id,
      userRole: req.user?.role,
      jobClientId: job.client,
      jobId: job._id,
      isOwner: isJobOwnerOrAdmin(req, job),
    });

    if (!isJobOwnerOrAdmin(req, job)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to invite freelancers to this job",
      });
    }

    // Check if job is open for invitations
    if (job.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "Can only invite freelancers to open jobs",
      });
    }

    const { freelancerId, message } = req.body;

    console.log("Freelancer validation:", {
      freelancerId,
      message,
      freelancerIdType: typeof freelancerId,
    });

    // Check if freelancer exists and has freelancer role
    const freelancer = await User.findById(freelancerId);
    console.log("Freelancer found:", {
      exists: !!freelancer,
      role: freelancer?.role,
      name: freelancer?.name,
    });

    if (!freelancer || freelancer.role !== "freelancer") {
      return res.status(400).json({
        success: false,
        message: "Invalid freelancer",
      });
    }

    // Check if freelancer already has a proposal for this job
    const existingProposal = await Proposal.findOne({
      job: job._id,
      freelancer: freelancerId,
    });

    if (existingProposal) {
      return res.status(400).json({
        success: false,
        message: "This freelancer has already applied to this job",
      });
    }

    // Check if freelancer already has a pending invitation
    const existingInvitation = await JobInvitation.findOne({
      job: job._id,
      freelancer: freelancerId,
      status: "pending",
    });

    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        message: "This freelancer has already been invited to this job",
      });
    }

    // Create invitation
    const invitation = new JobInvitation({
      job: job._id,
      client: req.user.id,
      freelancer: freelancerId,
      message: message || "",
    });

    await invitation.save();

    // Populate the invitation with freelancer and job details
    await invitation.populate([
      { path: "freelancer", select: "name email avatar" },
      { path: "job", select: "title description budget" },
    ]);

    // Send email notification to freelancer
    try {
      const client = await User.findById(req.user.id);
      if (client && freelancer) {
        await emailService.sendJobInvitationNotification(client, freelancer, job, invitation);
      }
    } catch (emailError) {
      // Don't fail the invitation if email fails
      console.error("Email notification failed:", emailError);
    }

    res.status(201).json({
      success: true,
      data: { invitation },
      message: "Invitation sent successfully",
    });
  } catch (err) {
    console.error("Error inviting freelancer:", err);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ success: false, message: "Job not found" });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get invitations for a freelancer
 * @route   GET /api/jobs/invitations
 * @access  Private (Freelancer only)
 */
exports.getFreelancerInvitations = async (req, res) => {
  try {
    const invitations = await JobInvitation.find({
      freelancer: req.user.id,
      status: "pending",
      expiresAt: { $gt: new Date() }, // Only non-expired invitations
    })
      .populate("job", "title description budget category skills deadline")
      .populate("client", "name email avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { invitations },
    });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching invitations",
      error: error.message,
    });
  }
};

/**
 * @desc    Respond to a job invitation
 * @route   PUT /api/jobs/invitations/:id/respond
 * @access  Private (Freelancer only)
 */
exports.respondToInvitation = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { response } = req.body; // "accepted" or "declined"

    if (!["accepted", "declined"].includes(response)) {
      return res.status(400).json({
        success: false,
        message: "Invalid response. Must be 'accepted' or 'declined'",
      });
    }

    const invitation = await JobInvitation.findById(req.params.id);

    if (!invitation) {
      return res.status(404).json({ success: false, message: "Invitation not found" });
    }

    // Check if invitation belongs to the freelancer
    if (invitation.freelancer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to respond to this invitation",
      });
    }

    // Check if invitation is still pending and not expired
    if (invitation.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "This invitation has already been responded to",
      });
    }

    if (invitation.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "This invitation has expired",
      });
    }

    // Update invitation status
    invitation.status = response;
    await invitation.save();

    // If accepted, create a proposal automatically
    if (response === "accepted") {
      const job = await Job.findById(invitation.job);
      const freelancerProfile = await Profile.findOne({ user: req.user.id }).populate(
        "user",
        "name avatar companyFreelancer companyFreelancerName"
      );

      if (job && freelancerProfile) {
        // Create profile snapshot
        const profileSnapshot = {
          name: freelancerProfile.user?.name || req.user.name,
          avatar: freelancerProfile.user?.avatar || req.user.avatar,
          title: freelancerProfile.title || null,
          skills: freelancerProfile.skills || [],
          experience: Array.isArray(freelancerProfile.experience)
            ? freelancerProfile.experience.map((exp) => `${exp.title} at ${exp.company}`).join(", ")
            : "",
          hourlyRate: freelancerProfile.hourlyRate || { min: 0, max: 0 },
          companyName:
            freelancerProfile.user?.companyFreelancer?.companyName ||
            freelancerProfile.user?.companyFreelancerName ||
            null,
        };

        // Create proposal
        const proposal = new Proposal({
          job: job._id,
          freelancer: req.user.id,
          client: job.client,
          coverLetter: `I'm interested in this opportunity. ${invitation.message || ""}`,
          bidPrice: job.budget.max, // Use max budget as bid price
          estimatedDuration: job.duration,
          status: "pending",
          freelancerProfileSnapshot: profileSnapshot,
          isFromInvitation: true, // Mark as from invitation
        });

        await proposal.save();

        // Update job application count
        job.applicationCount += 1;
        await job.save();

        // Send email notification to client
        try {
          const client = await User.findById(job.client);
          const freelancer = await User.findById(req.user.id);

          if (client && freelancer) {
            await emailService.sendNewProposalNotification(client, freelancer, job, proposal);
          }
        } catch (emailError) {
          // Don't fail the response if email fails
          console.error("Email notification failed:", emailError);
        }
      }
    }

    res.status(200).json({
      success: true,
      data: { invitation },
      message: `Invitation ${response} successfully`,
    });
  } catch (err) {
    console.error("Error responding to invitation:", err);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ success: false, message: "Invitation not found" });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};
