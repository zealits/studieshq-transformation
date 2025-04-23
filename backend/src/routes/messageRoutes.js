const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../middleware/auth');
const messageController = require('../controllers/messageController');

// @route   POST /api/messages/conversations
// @desc    Create or get a conversation between two users
// @access  Private
router.post(
  '/conversations',
  [
    auth,
    [
      check('recipientId', 'Recipient ID is required')
        .not()
        .isEmpty()
        .isMongoId()
    ]
  ],
  messageController.createOrGetConversation
);

// @route   GET /api/messages/conversations
// @desc    Get all conversations for a user
// @access  Private
router.get('/conversations', auth, messageController.getConversations);

// @route   GET /api/messages/conversations/:id
// @desc    Get conversation by ID
// @access  Private
router.get('/conversations/:id', auth, messageController.getConversationById);

// @route   POST /api/messages/conversations/:id
// @desc    Send a message in a conversation
// @access  Private
router.post(
  '/conversations/:id',
  [
    auth,
    [
      check('content', 'Message content is required').not().isEmpty()
    ]
  ],
  messageController.sendMessage
);

// @route   GET /api/messages/conversations/:id/messages
// @desc    Get all messages for a conversation
// @access  Private
router.get(
  '/conversations/:id/messages',
  auth,
  messageController.getMessages
);

// @route   PUT /api/messages/conversations/:id/read
// @desc    Mark messages as read
// @access  Private
router.put(
  '/conversations/:id/read',
  auth,
  messageController.markAsRead
);

// @route   DELETE /api/messages/conversations/:id
// @desc    Delete a conversation
// @access  Private
router.delete(
  '/conversations/:id',
  auth,
  messageController.deleteConversation
);

module.exports = router; 