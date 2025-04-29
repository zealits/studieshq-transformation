const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const Profile = require("../models/Profile");
const User = require("../models/User");

/**
 * @desc    Get current user's profile
 * @route   GET /api/profile/me
 * @access  Private
 */
exports.getCurrentProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate("user", ["name", "email", "avatar", "role"]);

    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found for this user" });
    }

    res.json({ success: true, data: { profile } });
  } catch (err) {
    console.error("Error in getCurrentProfile:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Create or update user profile
 * @route   POST /api/profile
 * @access  Private
 */
exports.createOrUpdateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  // Log the incoming profile data
  console.log("Received Profile Data:", {
    fullName: req.body.fullName,
    email: req.body.email,
    phone: req.body.phone,
    location: req.body.location,
    bio: req.body.bio,
    hourlyRate: req.body.hourlyRate,
    skills: req.body.skills,
    education: req.body.education,
    experience: req.body.experience,
    socialLinks: req.body.socialLinks,
  });

  const {
    bio,
    location,
    website,
    social,
    skills,
    // Freelancer specific fields
    hourlyRate,
    title,
    availability,
    // Client specific fields
    company,
    industry,
    companySize,
    companyWebsite,
  } = req.body;

  // Build profile object
  const profileFields = {
    user: req.user.id,
    bio: bio || "",
    location: location || "",
    website: website || "",
    skills: Array.isArray(skills) ? skills : skills?.split(",").map((skill) => skill.trim()),
    social: social || {},
  };

  // Add role-specific fields
  if (req.user.role === "freelancer") {
    profileFields.hourlyRate = hourlyRate;
    profileFields.title = title;
    profileFields.availability = availability;
  } else if (req.user.role === "client") {
    profileFields.company = company;
    profileFields.industry = industry;
    profileFields.companySize = companySize;
    profileFields.companyWebsite = companyWebsite;
  }

  try {
    // Using upsert option (creates new doc if no match is found)
    let profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      { $set: profileFields },
      { new: true, upsert: true }
    );

    res.json({ success: true, data: { profile } });
  } catch (err) {
    console.error("Error in createOrUpdateProfile:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get all profiles
 * @route   GET /api/profile
 * @access  Public
 */
exports.getAllProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "email", "avatar", "role"]);
    res.json({ success: true, data: { profiles } });
  } catch (err) {
    console.error("Error in getAllProfiles:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get all freelancer profiles
 * @route   GET /api/profile/freelancers
 * @access  Public
 */
exports.getAllFreelancers = async (req, res) => {
  try {
    const users = await User.find({ role: "freelancer" }).select("_id");
    const userIds = users.map((user) => user._id);

    const freelancerProfiles = await Profile.find({
      user: { $in: userIds },
    }).populate("user", ["name", "email", "avatar"]);

    res.json({ success: true, data: { freelancers: freelancerProfiles } });
  } catch (err) {
    console.error("Error in getAllFreelancers:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get profile by user ID
 * @route   GET /api/profile/user/:user_id
 * @access  Public
 */
exports.getProfileByUserId = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.user_id }).populate("user", [
      "name",
      "email",
      "avatar",
      "role",
    ]);

    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    res.json({ success: true, data: { profile } });
  } catch (err) {
    console.error("Error in getProfileByUserId:", err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Add education to profile
 * @route   PUT /api/profile/education
 * @access  Private
 */
exports.addEducation = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { institution, degree, fieldOfStudy, from, to, current, description } = req.body;

  const newEdu = {
    institution,
    degree,
    fieldOfStudy,
    from,
    to,
    current,
    description,
  };

  try {
    const profile = await Profile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    // Add to education array
    profile.education.unshift(newEdu);
    await profile.save();

    res.json({ success: true, data: { profile } });
  } catch (err) {
    console.error("Error in addEducation:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Delete education from profile
 * @route   DELETE /api/profile/education/:edu_id
 * @access  Private
 */
exports.deleteEducation = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    // Get remove index
    const removeIndex = profile.education.map((item) => item.id).indexOf(req.params.edu_id);

    if (removeIndex === -1) {
      return res.status(404).json({ success: false, message: "Education not found" });
    }

    // Remove education
    profile.education.splice(removeIndex, 1);
    await profile.save();

    res.json({ success: true, data: { profile } });
  } catch (err) {
    console.error("Error in deleteEducation:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Add experience to profile
 * @route   PUT /api/profile/experience
 * @access  Private
 */
exports.addExperience = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { title, company, location, from, to, current, description } = req.body;

  const newExp = {
    title,
    company,
    location,
    from,
    to,
    current,
    description,
  };

  try {
    const profile = await Profile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    // Add to experience array
    profile.experience.unshift(newExp);
    await profile.save();

    res.json({ success: true, data: { profile } });
  } catch (err) {
    console.error("Error in addExperience:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Delete experience from profile
 * @route   DELETE /api/profile/experience/:exp_id
 * @access  Private
 */
exports.deleteExperience = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    // Get remove index
    const removeIndex = profile.experience.map((item) => item.id).indexOf(req.params.exp_id);

    if (removeIndex === -1) {
      return res.status(404).json({ success: false, message: "Experience not found" });
    }

    // Remove experience
    profile.experience.splice(removeIndex, 1);
    await profile.save();

    res.json({ success: true, data: { profile } });
  } catch (err) {
    console.error("Error in deleteExperience:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Add portfolio item to profile
 * @route   PUT /api/profile/portfolio
 * @access  Private (Freelancer only)
 */
exports.addPortfolioItem = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  // Check if user is freelancer
  if (req.user.role !== "freelancer") {
    return res.status(403).json({ success: false, message: "Only freelancers can add portfolio items" });
  }

  const { title, description, imageUrl, projectUrl } = req.body;

  const newPortfolioItem = {
    title,
    description,
    imageUrl,
    projectUrl,
  };

  try {
    const profile = await Profile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    // Add to portfolio array
    profile.portfolioItems.unshift(newPortfolioItem);
    await profile.save();

    res.json({ success: true, data: { profile } });
  } catch (err) {
    console.error("Error in addPortfolioItem:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Delete portfolio item from profile
 * @route   DELETE /api/profile/portfolio/:portfolio_id
 * @access  Private (Freelancer only)
 */
exports.deletePortfolioItem = async (req, res) => {
  // Check if user is freelancer
  if (req.user.role !== "freelancer") {
    return res.status(403).json({ success: false, message: "Only freelancers can delete portfolio items" });
  }

  try {
    const profile = await Profile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    // Get remove index
    const removeIndex = profile.portfolioItems.map((item) => item.id).indexOf(req.params.portfolio_id);

    if (removeIndex === -1) {
      return res.status(404).json({ success: false, message: "Portfolio item not found" });
    }

    // Remove portfolio item
    profile.portfolioItems.splice(removeIndex, 1);
    await profile.save();

    res.json({ success: true, data: { profile } });
  } catch (err) {
    console.error("Error in deletePortfolioItem:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
