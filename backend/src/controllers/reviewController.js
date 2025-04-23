const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Review = require('../models/Review');
const User = require('../models/User');
const Project = require('../models/Project').Project;

/**
 * @desc    Create a review
 * @route   POST /api/reviews
 * @access  Private (Client can review freelancer, Freelancer can review client)
 */
exports.createReview = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { to, project, rating, text } = req.body;
    const from = req.user.id;

    // Check if user is trying to review themselves
    if (to === from) {
      return res.status(400).json({ success: false, message: 'You cannot review yourself' });
    }

    // Check if recipient exists
    const recipient = await User.findById(to);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }

    // Check if the project exists and is completed
    if (project) {
      const projectDoc = await Project.findById(project);
      
      if (!projectDoc) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }
      
      if (projectDoc.status !== 'completed') {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot leave a review for a project that is not completed' 
        });
      }
      
      // Check if user is either the client or the freelancer of the project
      const isClient = projectDoc.client.toString() === from;
      const isFreelancer = projectDoc.freelancer && projectDoc.freelancer.toString() === from;
      
      if (!isClient && !isFreelancer) {
        return res.status(403).json({ 
          success: false, 
          message: 'You must be the client or freelancer of the project to leave a review' 
        });
      }
      
      // Check if review recipient is part of the project
      const isRecipientClient = projectDoc.client.toString() === to;
      const isRecipientFreelancer = projectDoc.freelancer && projectDoc.freelancer.toString() === to;
      
      if (!isRecipientClient && !isRecipientFreelancer) {
        return res.status(400).json({ 
          success: false, 
          message: 'Review recipient must be part of the project' 
        });
      }
    }

    // Check if user has already reviewed this recipient for this project
    const existingReview = await Review.findOne({
      from,
      to,
      project: project || { $exists: false }
    });

    if (existingReview) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already reviewed this user for this project' 
      });
    }

    // Create new review
    const newReview = new Review({
      from,
      to,
      project: project || undefined,
      rating,
      text
    });

    const review = await newReview.save();

    // Populate user information for the response
    await review.populate([
      { path: 'from', select: 'name avatar role' },
      { path: 'to', select: 'name avatar role' }
    ]).execPopulate();

    // Update user's average rating
    const allUserReviews = await Review.find({ to });
    const totalRating = allUserReviews.reduce((acc, review) => acc + review.rating, 0);
    const averageRating = totalRating / allUserReviews.length;

    await User.findByIdAndUpdate(to, { rating: averageRating.toFixed(1) });

    res.status(201).json({ success: true, data: { review } });
  } catch (err) {
    console.error('Error in createReview:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Get all reviews for a user
 * @route   GET /api/reviews/user/:userId
 * @access  Public
 */
exports.getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const reviews = await Review.find({ to: userId })
      .populate('from', 'name avatar role')
      .populate('to', 'name avatar role')
      .populate('project', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ to: userId });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (err) {
    console.error('Error in getUserReviews:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Get all reviews for a project
 * @route   GET /api/reviews/project/:projectId
 * @access  Public
 */
exports.getProjectReviews = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const reviews = await Review.find({ project: projectId })
      .populate('from', 'name avatar role')
      .populate('to', 'name avatar role')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { reviews } });
  } catch (err) {
    console.error('Error in getProjectReviews:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Update a review
 * @route   PUT /api/reviews/:id
 * @access  Private (Review creator only)
 */
exports.updateReview = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { rating, text } = req.body;
    const { id } = req.params;

    // Find the review
    let review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Check if user is the review creator
    if (review.from.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this review' });
    }

    // Update review
    review.rating = rating || review.rating;
    review.text = text || review.text;

    await review.save();

    // Update user's average rating
    const allUserReviews = await Review.find({ to: review.to });
    const totalRating = allUserReviews.reduce((acc, review) => acc + review.rating, 0);
    const averageRating = totalRating / allUserReviews.length;

    await User.findByIdAndUpdate(review.to, { rating: averageRating.toFixed(1) });

    // Populate the review before sending the response
    await review.populate([
      { path: 'from', select: 'name avatar role' },
      { path: 'to', select: 'name avatar role' },
      { path: 'project', select: 'title' }
    ]).execPopulate();

    res.json({ success: true, data: { review } });
  } catch (err) {
    console.error('Error in updateReview:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Delete a review
 * @route   DELETE /api/reviews/:id
 * @access  Private (Review creator or admin)
 */
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the review
    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Check if user is the review creator or admin
    if (review.from.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
    }

    await review.remove();

    // Update user's average rating if they have other reviews
    const allUserReviews = await Review.find({ to: review.to });
    
    if (allUserReviews.length > 0) {
      const totalRating = allUserReviews.reduce((acc, review) => acc + review.rating, 0);
      const averageRating = totalRating / allUserReviews.length;
      await User.findByIdAndUpdate(review.to, { rating: averageRating.toFixed(1) });
    } else {
      // If no reviews left, reset rating to default (0)
      await User.findByIdAndUpdate(review.to, { rating: 0 });
    }

    res.json({ success: true, data: {} });
  } catch (err) {
    console.error('Error in deleteReview:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
}; 