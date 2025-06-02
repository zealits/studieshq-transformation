const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const { Conversation, Message } = require("../models/Message");
const User = require("../models/User");
const { getIO } = require("../sockets/chatSocket");

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
        $all: [senderId, recipientId],
      },
    })
      .populate("participants", "name email avatar role")
      .populate("lastMessage");

    let isNewConversation = false;

    // If no conversation exists, create a new one
    if (!conversation) {
      conversation = new Conversation({
        participants: [senderId, recipientId],
      });

      await conversation.save();
      isNewConversation = true;

      // Populate the newly created conversation's participants
      conversation = await Conversation.findById(conversation._id)
        .populate("participants", "name email avatar role")
        .populate("lastMessage");

      // Auto-join both users to the new conversation room via Socket.io
      try {
        const io = getIO();
        const connectedSockets = await io.fetchSockets();

        connectedSockets.forEach((socket) => {
          if (socket.userId === senderId || socket.userId === recipientId) {
            socket.join(`conversation_${conversation._id}`);
            console.log(`Auto-joined user ${socket.user.name} to new conversation ${conversation._id}`);
          }
        });
      } catch (socketError) {
        console.error("Error auto-joining users to new conversation:", socketError);
        // Don't fail the request if socket operation fails
      }
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
      participants: userId,
    })
      .populate("participants", "name email avatar role")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "name email avatar role",
        },
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
    const conversation = await Conversation.findById(conversationId).populate("participants", "name email avatar role");

    // Check if conversation exists
    if (!conversation) {
      return res.status(404).json({ msg: "Conversation not found" });
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some((participant) => participant._id.toString() === userId);

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
    const { content } = req.body;

    // Find the conversation
    const conversation = await Conversation.findById(conversationId);

    // Check if conversation exists
    if (!conversation) {
      return res.status(404).json({ msg: "Conversation not found" });
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some((participant) => participant.toString() === userId);

    if (!isParticipant && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Not authorized to send messages in this conversation" });
    }

    // Create new message
    const newMessage = new Message({
      conversation: conversationId,
      sender: userId,
      content,
      messageType: "text",
    });

    // Save the message
    const message = await newMessage.save();

    // Update conversation's lastMessage and updatedAt
    conversation.lastMessage = message._id;
    conversation.lastActivity = new Date();
    await conversation.save();

    // Populate the sender info for the response
    await message.populate("sender", "name email avatar role");

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
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    // Find the conversation
    const conversation = await Conversation.findById(conversationId);

    // Check if conversation exists
    if (!conversation) {
      return res.status(404).json({ msg: "Conversation not found" });
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some((participant) => participant.toString() === userId);

    if (!isParticipant && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Not authorized to view messages in this conversation" });
    }

    // Get messages with pagination
    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "name email avatar role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Count total messages for pagination info
    const total = await Message.countDocuments({ conversation: conversationId });

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
    const isParticipant = conversation.participants.some((participant) => participant.toString() === userId);

    if (!isParticipant && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Not authorized" });
    }

    // Mark messages as read by adding user to readBy array
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        readBy: { $nin: [userId] },
      },
      {
        $addToSet: { readBy: userId },
      }
    );

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
    const isParticipant = conversation.participants.some((participant) => participant.toString() === userId);

    if (!isParticipant && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Not authorized to delete this conversation" });
    }

    // Delete all messages in the conversation
    await Message.deleteMany({ conversation: conversationId });

    // Delete the conversation
    await Conversation.findByIdAndDelete(conversationId);

    res.json({ msg: "Conversation and messages deleted" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Conversation not found" });
    }
    res.status(500).send("Server Error");
  }
};
