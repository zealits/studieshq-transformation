const Contact = require("../models/Contact");
const { validationResult } = require("express-validator");

// @desc    Submit contact form
// @route   POST /api/contact
// @access  Public
const submitContactForm = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { name, email, phone, message } = req.body;

    // Create new contact submission
    const contact = new Contact({
      name,
      email,
      phone,
      message,
    });

    await contact.save();

    res.status(201).json({
      success: true,
      message: "Thank you for your message! We'll get back to you soon.",
      data: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
        submittedAt: contact.createdAt,
      },
    });
  } catch (error) {
    console.error("Error submitting contact form:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit contact form. Please try again.",
    });
  }
};

// @desc    Get all contact submissions (Admin only)
// @route   GET /api/admin/contacts
// @access  Private (Admin)
const getAllContacts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    if (status) {
      query.status = status;
    }

    // Get total count for pagination
    const total = await Contact.countDocuments(query);

    // Get contacts with pagination
    const contacts = await Contact.find(query)
      .populate("respondedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: {
        contacts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalContacts: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch contact submissions",
    });
  }
};

// @desc    Get single contact submission (Admin only)
// @route   GET /api/admin/contacts/:id
// @access  Private (Admin)
const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id).populate("respondedBy", "name email");

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact submission not found",
      });
    }

    res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error("Error fetching contact:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch contact submission",
    });
  }
};

// @desc    Update contact status and add notes (Admin only)
// @route   PUT /api/admin/contacts/:id
// @access  Private (Admin)
const updateContact = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const adminId = req.user.id;

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact submission not found",
      });
    }

    // Update fields if provided
    if (status) contact.status = status;
    if (adminNotes !== undefined) contact.adminNotes = adminNotes;

    // If status is being changed to resolved and it wasn't resolved before
    if (status === "resolved" && contact.status !== "resolved") {
      contact.respondedAt = new Date();
      contact.respondedBy = adminId;
    }

    await contact.save();

    // Populate the updated contact
    await contact.populate("respondedBy", "name email");

    res.status(200).json({
      success: true,
      message: "Contact submission updated successfully",
      data: contact,
    });
  } catch (error) {
    console.error("Error updating contact:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update contact submission",
    });
  }
};

// @desc    Delete contact submission (Admin only)
// @route   DELETE /api/admin/contacts/:id
// @access  Private (Admin)
const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact submission not found",
      });
    }

    await Contact.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Contact submission deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting contact:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete contact submission",
    });
  }
};

// @desc    Get contact statistics (Admin only)
// @route   GET /api/admin/contacts/stats
// @access  Private (Admin)
const getContactStats = async (req, res) => {
  try {
    const stats = await Contact.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get total count
    const totalCount = await Contact.countDocuments();

    // Get recent contacts (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCount = await Contact.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Format stats
    const formattedStats = {
      total: totalCount,
      recent: recentCount,
      byStatus: {
        new: 0,
        "in-progress": 0,
        resolved: 0,
      },
    };

    stats.forEach((stat) => {
      formattedStats.byStatus[stat._id] = stat.count;
    });

    res.status(200).json({
      success: true,
      data: formattedStats,
    });
  } catch (error) {
    console.error("Error fetching contact stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch contact statistics",
    });
  }
};

module.exports = {
  submitContactForm,
  getAllContacts,
  getContactById,
  updateContact,
  deleteContact,
  getContactStats,
};
