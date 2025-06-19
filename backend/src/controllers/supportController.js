const { validationResult } = require("express-validator");
const SupportTicket = require("../models/SupportTicket");
const TicketReply = require("../models/TicketReply");
const User = require("../models/User");
const emailService = require("../services/emailService");

/**
 * @desc    Create a new support ticket
 * @route   POST /api/support/tickets
 * @access  Private (Freelancer, Client)
 */
exports.createTicket = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { subject, description, category, priority = "medium" } = req.body;

    // Generate ticket number manually as backup
    const generateTicketNumber = async () => {
      try {
        const count = await SupportTicket.countDocuments();
        let ticketNum = `ST-${String(count + 1).padStart(6, "0")}`;
        
        // Check for existing ticket with same number
        const existingTicket = await SupportTicket.findOne({ ticketNumber: ticketNum });
        if (existingTicket) {
          // Use timestamp as fallback
          const timestamp = Date.now().toString().slice(-6);
          ticketNum = `ST-${timestamp}`;
        }
        
        return ticketNum;
      } catch (error) {
        console.error("Error generating ticket number:", error);
        // Ultimate fallback
        const timestamp = Date.now().toString().slice(-6);
        return `ST-${timestamp}`;
      }
    };

    const ticketNumber = await generateTicketNumber();

    const ticket = new SupportTicket({
      ticketNumber,
      subject,
      description,
      category,
      priority,
      user: req.user.id,
    });

    await ticket.save();
    await ticket.populate("user", "name email role");

    console.log(`✅ New support ticket created: ${ticket.ticketNumber} by ${ticket.user.name}`);

    // Send notifications to admin users and support email
    try {
      // Get all admin users from database
      const adminUsers = await User.find({ role: "admin", isActive: true });
      console.log(`📧 Found ${adminUsers.length} admin users to notify`);

      // Send email to support email address (if configured)
      if (process.env.SMPT_MAIL && process.env.SMPT_PASSWORD) {
        try {
          await emailService.sendNewTicketNotification(ticket);
          console.log("✅ Support email notification sent successfully");
        } catch (emailError) {
          console.error("❌ Error sending support email notification:", emailError.message);
        }
      } else {
        console.log("⚠️ Email configuration not found - skipping support email notification");
      }

      // Send notifications to individual admin users
      if (adminUsers.length > 0) {
        const notificationPromises = adminUsers.map(async (admin) => {
          try {
            // Create in-app notification (you can implement this if you have notifications system)
            console.log(`📱 Notifying admin: ${admin.name} (${admin.email})`);
            
            // Send individual email to admin if email is configured
            if (process.env.SMPT_MAIL && process.env.SMPT_PASSWORD) {
              const adminEmailContent = `
                <p>Hello ${admin.name},</p>
                <p>A new support ticket requires your attention:</p>
                <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Ticket #:</strong> ${ticket.ticketNumber}</p>
                  <p><strong>Subject:</strong> ${ticket.subject}</p>
                  <p><strong>User:</strong> ${ticket.user.name} (${ticket.user.email})</p>
                  <p><strong>Priority:</strong> ${ticket.priority}</p>
                </div>
                <p>Please check the admin panel to respond.</p>
              `;
              
              await emailService.sendGenericNotification(
                admin.email,
                `New Support Ticket: ${ticket.subject}`,
                "New Support Ticket",
                adminEmailContent,
                "View Admin Panel",
                `${process.env.FRONTEND_URL || "http://localhost:5173"}/admin/support`
              );
              console.log(`✅ Email sent to admin: ${admin.email}`);
            }
          } catch (adminNotificationError) {
            console.error(`❌ Error notifying admin ${admin.email}:`, adminNotificationError.message);
          }
        });

        await Promise.allSettled(notificationPromises);
        console.log("📬 Admin notification process completed");
      } else {
        console.log("⚠️ No admin users found in database to notify");
      }

    } catch (notificationError) {
      console.error("❌ Error in notification process:", notificationError.message);
      // Don't fail the ticket creation if notifications fail
    }

    res.status(201).json({
      success: true,
      data: { ticket },
      message: "Support ticket created successfully. Our team will respond soon.",
    });
  } catch (err) {
    console.error("❌ Error in createTicket:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get user's tickets
 * @route   GET /api/support/tickets
 * @access  Private (Freelancer, Client)
 */
exports.getUserTickets = async (req, res) => {
  try {
    const { status, category, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { user: req.user.id };
    if (status) filter.status = status;
    if (category) filter.category = category;

    const tickets = await SupportTicket.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("user", "name email role")
      .populate("assignedAdmin", "name email");

    const totalTickets = await SupportTicket.countDocuments(filter);

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalTickets,
          pages: Math.ceil(totalTickets / limit),
        },
      },
    });
  } catch (err) {
    console.error("Error in getUserTickets:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get single ticket with replies
 * @route   GET /api/support/tickets/:id
 * @access  Private (Freelancer, Client, Admin)
 */
exports.getTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate("user", "name email role avatar")
      .populate("assignedAdmin", "name email");

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    // Check if user owns the ticket or is admin
    if (ticket.user._id.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // Get replies (exclude internal notes for non-admin users)
    const replyFilter = { ticket: ticket._id };
    if (req.user.role !== "admin") {
      replyFilter.isInternal = false;
    }

    const replies = await TicketReply.find(replyFilter)
      .sort({ createdAt: 1 })
      .populate("author", "name email role avatar");

    res.json({
      success: true,
      data: { ticket, replies },
    });
  } catch (err) {
    console.error("Error in getTicket:", err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Reply to a ticket
 * @route   POST /api/support/tickets/:id/replies
 * @access  Private (Freelancer, Client, Admin)
 */
exports.replyToTicket = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { content, isInternal = false } = req.body;

    const ticket = await SupportTicket.findById(req.params.id).populate("user", "name email");

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    // Check permissions
    const canReply = 
      ticket.user._id.toString() === req.user.id || 
      req.user.role === "admin";

    if (!canReply) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // Only admins can create internal notes
    const isInternalNote = isInternal && req.user.role === "admin";

    const reply = new TicketReply({
      ticket: ticket._id,
      author: req.user.id,
      content,
      isInternal: isInternalNote,
    });

    await reply.save();
    await reply.populate("author", "name email role avatar");

    // Update ticket status and first response time
    if (req.user.role === "admin" && !ticket.firstResponseAt && !isInternalNote) {
      ticket.firstResponseAt = new Date();
      if (ticket.status === "open") {
        ticket.status = "in-progress";
      }
    } else if (req.user.role !== "admin" && ticket.status === "waiting-for-response") {
      ticket.status = "in-progress";
    }

    await ticket.save();

    // Send email notifications
    try {
      if (!isInternalNote) {
        if (req.user.role === "admin") {
          // Admin replied to user
          await emailService.sendTicketReplyNotification(ticket.user, ticket, reply);
        } else {
          // User replied, notify support team
          await emailService.sendUserReplyNotification(ticket, reply);
        }
      }
    } catch (emailError) {
      console.error("Error sending reply notification:", emailError);
    }

    res.status(201).json({
      success: true,
      data: { reply },
    });
  } catch (err) {
    console.error("Error in replyToTicket:", err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get all tickets (Admin only)
 * @route   GET /api/support/admin/tickets
 * @access  Private (Admin only)
 */
exports.getAllTickets = async (req, res) => {
  try {
    const { 
      status, 
      category, 
      priority, 
      assignedAdmin, 
      search,
      page = 1, 
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (assignedAdmin) filter.assignedAdmin = assignedAdmin;

    // Search functionality
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { ticketNumber: { $regex: search, $options: "i" } },
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const tickets = await SupportTicket.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("user", "name email role avatar")
      .populate("assignedAdmin", "name email");

    const totalTickets = await SupportTicket.countDocuments(filter);

    // Get statistics
    const stats = await SupportTicket.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const statusStats = {};
    stats.forEach(stat => {
      statusStats[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalTickets,
          pages: Math.ceil(totalTickets / limit),
        },
        stats: statusStats,
      },
    });
  } catch (err) {
    console.error("Error in getAllTickets:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Update ticket (Admin only)
 * @route   PUT /api/support/admin/tickets/:id
 * @access  Private (Admin only)
 */
exports.updateTicket = async (req, res) => {
  try {
    const { status, priority, assignedAdmin, tags } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    // Update fields
    if (status) {
      ticket.status = status;
      
      // Set resolved/closed timestamps
      if (status === "resolved" && !ticket.resolvedAt) {
        ticket.resolvedAt = new Date();
      } else if (status === "closed" && !ticket.closedAt) {
        ticket.closedAt = new Date();
      }
    }
    
    if (priority) ticket.priority = priority;
    if (assignedAdmin !== undefined) ticket.assignedAdmin = assignedAdmin || null;
    if (tags) ticket.tags = tags;

    await ticket.save();
    await ticket.populate("user", "name email role avatar");
    await ticket.populate("assignedAdmin", "name email");

    res.json({
      success: true,
      data: { ticket },
    });
  } catch (err) {
    console.error("Error in updateTicket:", err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Add internal note (Admin only)
 * @route   POST /api/support/admin/tickets/:id/notes
 * @access  Private (Admin only)
 */
exports.addInternalNote = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { content } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    ticket.internalNotes.push({
      content,
      author: req.user.id,
    });

    await ticket.save();

    res.status(201).json({
      success: true,
      message: "Internal note added successfully",
    });
  } catch (err) {
    console.error("Error in addInternalNote:", err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Rate ticket (User only)
 * @route   POST /api/support/tickets/:id/rate
 * @access  Private (Freelancer, Client)
 */
exports.rateTicket = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { score, feedback } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    // Check if user owns the ticket
    if (ticket.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // Check if ticket is resolved/closed
    if (!["resolved", "closed"].includes(ticket.status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Can only rate resolved or closed tickets" 
      });
    }

    // Update rating
    ticket.rating = {
      score,
      feedback,
      ratedAt: new Date(),
    };

    await ticket.save();

    res.json({
      success: true,
      message: "Thank you for your feedback!",
    });
  } catch (err) {
    console.error("Error in rateTicket:", err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get support analytics (Admin only)
 * @route   GET /api/support/admin/analytics
 * @access  Private (Admin only)
 */
exports.getAnalytics = async (req, res) => {
  try {
    const { timeframe = "30d" } = req.query;
    
    // Calculate date range
    const now = new Date();
    const daysBack = timeframe === "7d" ? 7 : timeframe === "90d" ? 90 : timeframe === "1y" ? 365 : 30;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    // Basic statistics
    const totalTickets = await SupportTicket.countDocuments();
    const openTickets = await SupportTicket.countDocuments({ status: "open" });
    const inProgressTickets = await SupportTicket.countDocuments({ status: "in-progress" });
    const resolvedTickets = await SupportTicket.countDocuments({ status: "resolved" });

    // Tickets by category
    const categoryStats = await SupportTicket.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Tickets by priority
    const priorityStats = await SupportTicket.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]);

    // Daily ticket creation trend
    const dailyStats = await SupportTicket.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Average response time (for tickets with first response)
    const responseTimeStats = await SupportTicket.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate },
          firstResponseAt: { $exists: true }
        } 
      },
      {
        $project: {
          responseTime: {
            $divide: [
              { $subtract: ["$firstResponseAt", "$createdAt"] },
              1000 * 60 * 60 // Convert to hours
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: "$responseTime" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Admin performance
    const adminStats = await SupportTicket.aggregate([
      { 
        $match: { 
          assignedAdmin: { $exists: true },
          createdAt: { $gte: startDate }
        } 
      },
      {
        $group: {
          _id: "$assignedAdmin",
          totalAssigned: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] }
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "admin",
        },
      },
      { $unwind: "$admin" },
      {
        $project: {
          name: "$admin.name",
          email: "$admin.email",
          totalAssigned: 1,
          resolved: 1,
          resolutionRate: {
            $multiply: [{ $divide: ["$resolved", "$totalAssigned"] }, 100]
          },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalTickets,
          openTickets,
          inProgressTickets,
          resolvedTickets,
        },
        categoryStats,
        priorityStats,
        dailyStats,
        avgResponseTime: responseTimeStats[0]?.avgResponseTime || 0,
        adminStats,
        timeframe,
      },
    });
  } catch (err) {
    console.error("Error in getAnalytics:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
}; 