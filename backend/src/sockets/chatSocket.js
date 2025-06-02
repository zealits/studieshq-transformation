const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { Conversation } = require("../models/Message");
const messageEvents = require("./messageEvents");
const userPresence = require("./userPresence");

let io;

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.user.id).select("-password");

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", async (socket) => {
    console.log(`User ${socket.user.name} connected: ${socket.id}`);

    try {
      // Auto-join all user conversations
      const userConversations = await Conversation.find({
        participants: socket.userId,
      }).select("_id");

      userConversations.forEach((conversation) => {
        socket.join(`conversation_${conversation._id}`);
        console.log(`Auto-joined user ${socket.user.name} to conversation ${conversation._id}`);
      });

      console.log(`User ${socket.user.name} auto-joined ${userConversations.length} conversations`);
    } catch (error) {
      console.error("Error auto-joining conversations:", error);
    }

    // Handle user presence
    userPresence.handleUserOnline(socket, io);

    // Handle message events
    messageEvents.handleMessageEvents(socket, io);

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User ${socket.user.name} disconnected: ${socket.id}`);
      userPresence.handleUserOffline(socket, io);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO,
};
