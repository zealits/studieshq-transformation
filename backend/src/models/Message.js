const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Message Schema
const MessageSchema = new Schema({
  conversation: {
    type: Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  attachments: [
    {
      type: String, // URL to the attachment
      default: [],
    },
  ],
  readBy: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      readAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Conversation Schema
const ConversationSchema = new Schema({
  participants: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  lastMessage: {
    type: Schema.Types.ObjectId,
    ref: "Message",
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map(),
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before save
ConversationSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Message = mongoose.model("Message", MessageSchema);
const Conversation = mongoose.model("Conversation", ConversationSchema);

module.exports = { Message, Conversation };
