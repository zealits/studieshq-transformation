const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const Conversation = require("../models/Message").Conversation;
const Message = require("../models/Message").Message;
const User = require("../models/User");

// @desc    Create or get a conversation between two users
// @route   POST /api/messages/conversations
exports.createOrGetConversation = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { recipientId } = req.body;
    const senderId = req.user.id;

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ msg: "Recipient not found" });
    }

    // Check if we already have a conversation between these users
    let conversation = await Conversation.findOne({
      participants: {
        $all: [
          { $elemMatch: { user: mongoose.Types.ObjectId(senderId) } },
          { $elemMatch: { user: mongoose.Types.ObjectId(recipientId) } },
        ],
      },
    }).populate({
      path: "participants.user",
      select: "name email avatar role",
    });

    // If no conversation exists, create a new one
    if (!conversation) {
      conversation = new Conversation({
        participants: [{ user: senderId }, { user: recipientId }],
      });

      await conversation.save();

      // Populate the newly created conversation's participants
      conversation = await Conversation.findById(conversation._id).populate({
        path: "participants.user",
        select: "name email avatar role",
      });
    }

    res.json(conversation);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get all conversations for a user
// @route   GET /api/messages/conversations
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all conversations where the user is a participant
    const conversations = await Conversation.find({
      "participants.user": userId,
    })
      .populate({
        path: "participants.user",
        select: "name email avatar role",
      })
      .populate({
        path: "lastMessage",
        select: "content sender createdAt isRead",
      })
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get conversation by ID
// @route   GET /api/messages/conversations/:id
exports.getConversationById = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;

    // Find the conversation
    const conversation = await Conversation.findById(conversationId).populate({
      path: "participants.user",
      select: "name email avatar role",
    });

    // Check if conversation exists
    if (!conversation) {
      return res.status(404).json({ msg: "Conversation not found" });
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some((participant) => participant.user._id.toString() === userId);

    if (!isParticipant && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Not authorized to access this conversation" });
    }

    res.json(conversation);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Conversation not found" });
    }
    res.status(500).send("Server Error");
  }
};

// @desc    Send a message in a conversation
// @route   POST /api/messages/conversations/:id
exports.sendMessage = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const userId = req.user.id;
    const conversationId = req.params.id;
    const { content, attachment } = req.body;

    // Find the conversation
    const conversation = await Conversation.findById(conversationId);

    // Check if conversation exists
    if (!conversation) {
      return res.status(404).json({ msg: "Conversation not found" });
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some((participant) => participant.user.toString() === userId);

    if (!isParticipant && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Not authorized to send messages in this conversation" });
    }

    // Create new message
    const newMessage = new Message({
      conversation: conversationId,
      sender: userId,
      content,
      attachment: attachment || undefined,
    });

    // Save the message
    const message = await newMessage.save();

    // Update conversation's lastMessage and updatedAt
    conversation.lastMessage = message._id;
    conversation.updatedAt = Date.now();
    await conversation.save();

    // Populate the sender info for the response
    await message
      .populate({
        path: "sender",
        select: "name email avatar role",
      })
      .execPopulate();

    // Return the message
    res.json(message);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Conversation not found" });
    }
    res.status(500).send("Server Error");
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/messages/conversations/:id/messages
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    // Find the conversation
    const conversation = await Conversation.findById(conversationId);

    // Check if conversation exists
    if (!conversation) {
      return res.status(404).json({ msg: "Conversation not found" });
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some((participant) => participant.user.toString() === userId);

    if (!isParticipant && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Not authorized to view messages in this conversation" });
    }

    // Get messages with pagination
    const messages = await Message.find({ conversation: conversationId })
      .populate({
        path: "sender",
        select: "name email avatar role",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Count total messages for pagination info
    const total = await Message.countDocuments({ conversation: conversationId });

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        isRead: false,
      },
      { isRead: true }
    );

    // Update unread count for the user in this conversation
    const participant = conversation.participants.find((p) => p.user.toString() === userId);

    if (participant) {
      participant.unreadCount = 0;
      await conversation.save();
    }

    res.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Conversation not found" });
    }
    res.status(500).send("Server Error");
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/conversations/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;

    // Find the conversation
    const conversation = await Conversation.findById(conversationId);

    // Check if conversation exists
    if (!conversation) {
      return res.status(404).json({ msg: "Conversation not found" });
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some((participant) => participant.user.toString() === userId);

    if (!isParticipant && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Not authorized" });
    }

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        isRead: false,
      },
      { isRead: true }
    );

    // Update unread count for the user in this conversation
    const participant = conversation.participants.find((p) => p.user.toString() === userId);

    if (participant) {
      participant.unreadCount = 0;
      await conversation.save();
    }

    res.json({ msg: "Messages marked as read" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Conversation not found" });
    }
    res.status(500).send("Server Error");
  }
};

// @desc    Delete a conversation
// @route   DELETE /api/messages/conversations/:id
exports.deleteConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;

    // Find the conversation
    const conversation = await Conversation.findById(conversationId);

    // Check if conversation exists
    if (!conversation) {
      return res.status(404).json({ msg: "Conversation not found" });
    }

    // Check if user is a participant or admin
    const isParticipant = conversation.participants.some((participant) => participant.user.toString() === userId);

    if (!isParticipant && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Not authorized to delete this conversation" });
    }

    // Delete all messages in the conversation
    await Message.deleteMany({ conversation: conversationId });

    // Delete the conversation
    await conversation.remove();

    res.json({ msg: "Conversation and messages deleted" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Conversation not found" });
    }
    res.status(500).send("Server Error");
  }
};
