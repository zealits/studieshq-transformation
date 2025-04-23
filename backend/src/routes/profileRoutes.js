const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const auth = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");
const profileController = require("../controllers/profileController");

// Placeholder for controller functions
// These would be imported from ../controllers/profileController
const {
  getProfile,
  updateProfile,
  getFreelancerProfile,
  getFreelancerProfiles,
  createEducation,
  updateEducation,
  deleteEducation,
  createExperience,
  updateExperience,
  deleteExperience,
  updateSkills,
  getClientProfile,
  getClientProfiles,
} = {
  // Temporary implementations for development
  getProfile: (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        profile: {
          user: "user123",
          bio: "Experienced web developer",
          location: "New York, NY",
          website: "https://example.com",
          social: {
            twitter: "twitter.com/user",
            linkedin: "linkedin.com/in/user",
            github: "github.com/user",
          },
          createdAt: "2023-05-01T00:00:00.000Z",
        },
      },
    });
  },
  updateProfile: (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        profile: {
          user: "user123",
          ...req.body,
          updatedAt: new Date().toISOString(),
        },
      },
    });
  },
  getFreelancerProfile: (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        profile: {
          user: {
            id: req.params.id || "freelancer123",
            name: "Jane Freelancer",
            email: "jane@example.com",
          },
          title: "Full Stack Developer",
          bio: "Experienced web developer with 5+ years experience",
          hourlyRate: 45,
          skills: ["JavaScript", "React", "Node.js", "MongoDB"],
          education: [
            {
              id: "edu123",
              school: "University of Technology",
              degree: "Bachelor of Science",
              fieldOfStudy: "Computer Science",
              from: "2014-09-01T00:00:00.000Z",
              to: "2018-06-01T00:00:00.000Z",
              description: "Graduated with honors",
            },
          ],
          experience: [
            {
              id: "exp123",
              title: "Senior Developer",
              company: "Tech Solutions Inc",
              location: "Remote",
              from: "2018-07-01T00:00:00.000Z",
              to: null,
              current: true,
              description: "Working on full stack web applications",
            },
          ],
          portfolio: [
            {
              id: "port123",
              title: "E-commerce Platform",
              description: "Built a complete e-commerce solution",
              imageUrl: "https://example.com/portfolio1.jpg",
              projectUrl: "https://project1.example.com",
            },
          ],
          location: "New York, NY",
          website: "https://jane-freelancer.com",
          social: {
            twitter: "twitter.com/janefreelancer",
            linkedin: "linkedin.com/in/janefreelancer",
            github: "github.com/janefreelancer",
          },
          rating: 4.8,
          reviews: 24,
          completedJobs: 28,
          createdAt: "2023-01-15T00:00:00.000Z",
        },
      },
    });
  },
  getFreelancerProfiles: (req, res) => {
    res.status(200).json({
      success: true,
      count: 2,
      data: {
        profiles: [
          {
            user: {
              id: "freelancer123",
              name: "Jane Freelancer",
            },
            title: "Full Stack Developer",
            skills: ["JavaScript", "React", "Node.js"],
            hourlyRate: 45,
            location: "New York, NY",
            rating: 4.8,
            reviews: 24,
            completedJobs: 28,
          },
          {
            user: {
              id: "freelancer124",
              name: "Bob Developer",
            },
            title: "Frontend Developer",
            skills: ["JavaScript", "Vue.js", "CSS"],
            hourlyRate: 40,
            location: "San Francisco, CA",
            rating: 4.6,
            reviews: 18,
            completedJobs: 22,
          },
        ],
      },
    });
  },
  createEducation: (req, res) => {
    res.status(201).json({
      success: true,
      data: {
        education: {
          id: "edu124",
          ...req.body,
          createdAt: new Date().toISOString(),
        },
      },
    });
  },
  updateEducation: (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        education: {
          id: req.params.edu_id,
          ...req.body,
          updatedAt: new Date().toISOString(),
        },
      },
    });
  },
  deleteEducation: (req, res) => {
    res.status(200).json({
      success: true,
      data: {},
    });
  },
  createExperience: (req, res) => {
    res.status(201).json({
      success: true,
      data: {
        experience: {
          id: "exp124",
          ...req.body,
          createdAt: new Date().toISOString(),
        },
      },
    });
  },
  updateExperience: (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        experience: {
          id: req.params.exp_id,
          ...req.body,
          updatedAt: new Date().toISOString(),
        },
      },
    });
  },
  deleteExperience: (req, res) => {
    res.status(200).json({
      success: true,
      data: {},
    });
  },
  updateSkills: (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        skills: req.body.skills,
        updatedAt: new Date().toISOString(),
      },
    });
  },
  getClientProfile: (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        profile: {
          user: {
            id: req.params.id || "client123",
            name: "John Client",
            email: "john@example.com",
          },
          company: "ABC Corporation",
          industry: "Software & IT",
          companySize: "10-50",
          website: "https://abc-corp.com",
          bio: "Growing tech company focused on innovative solutions",
          location: "Chicago, IL",
          social: {
            twitter: "twitter.com/abccorp",
            linkedin: "linkedin.com/company/abccorp",
          },
          rating: 4.7,
          reviews: 15,
          postedJobs: 22,
          completedProjects: 18,
          createdAt: "2023-02-10T00:00:00.000Z",
        },
      },
    });
  },
  getClientProfiles: (req, res) => {
    res.status(200).json({
      success: true,
      count: 2,
      data: {
        profiles: [
          {
            user: {
              id: "client123",
              name: "John Client",
            },
            company: "ABC Corporation",
            industry: "Software & IT",
            location: "Chicago, IL",
            rating: 4.7,
            reviews: 15,
            postedJobs: 22,
            completedProjects: 18,
          },
          {
            user: {
              id: "client124",
              name: "Sarah Manager",
            },
            company: "XYZ Ventures",
            industry: "Finance",
            location: "Boston, MA",
            rating: 4.9,
            reviews: 12,
            postedJobs: 16,
            completedProjects: 14,
          },
        ],
      },
    });
  },
};

// @route   GET /api/profile/me
// @desc    Get current user's profile
// @access  Private
router.get("/me", auth, profileController.getCurrentProfile);

// @route   POST /api/profile
// @desc    Create or update user profile
// @access  Private
router.post(
  "/",
  [auth, [check("skills", "Skills are required").not().isEmpty()]],
  profileController.createOrUpdateProfile
);

// @route   GET /api/profile
// @desc    Get all profiles
// @access  Public
router.get("/", profileController.getAllProfiles);

// @route   GET /api/profile/freelancers
// @desc    Get all freelancer profiles
// @access  Public
router.get("/freelancers", profileController.getAllFreelancers);

// @route   GET /api/profile/user/:user_id
// @desc    Get profile by user ID
// @access  Public
router.get("/user/:user_id", profileController.getProfileByUserId);

// @route   PUT /api/profile/education
// @desc    Add education to profile
// @access  Private
router.put(
  "/education",
  [
    auth,
    [
      check("institution", "Institution is required").not().isEmpty(),
      check("degree", "Degree is required").not().isEmpty(),
      check("fieldOfStudy", "Field of study is required").not().isEmpty(),
      check("from", "From date is required").not().isEmpty().isISO8601(),
    ],
  ],
  profileController.addEducation
);

// @route   DELETE /api/profile/education/:edu_id
// @desc    Delete education from profile
// @access  Private
router.delete("/education/:edu_id", auth, profileController.deleteEducation);

// @route   PUT /api/profile/experience
// @desc    Add experience to profile
// @access  Private
router.put(
  "/experience",
  [
    auth,
    [
      check("title", "Title is required").not().isEmpty(),
      check("company", "Company is required").not().isEmpty(),
      check("from", "From date is required").not().isEmpty().isISO8601(),
    ],
  ],
  profileController.addExperience
);

// @route   DELETE /api/profile/experience/:exp_id
// @desc    Delete experience from profile
// @access  Private
router.delete("/experience/:exp_id", auth, profileController.deleteExperience);

// @route   PUT /api/profile/portfolio
// @desc    Add portfolio item to profile
// @access  Private (Freelancer only)
router.put(
  "/portfolio",
  [
    auth,
    checkRole(["freelancer"]),
    [
      check("title", "Title is required").not().isEmpty(),
      check("description", "Description is required").not().isEmpty(),
      check("imageUrl", "Image URL is required").not().isEmpty(),
    ],
  ],
  profileController.addPortfolioItem
);

// @route   DELETE /api/profile/portfolio/:portfolio_id
// @desc    Delete portfolio item from profile
// @access  Private (Freelancer only)
router.delete("/portfolio/:portfolio_id", auth, checkRole(["freelancer"]), profileController.deletePortfolioItem);

module.exports = router;
