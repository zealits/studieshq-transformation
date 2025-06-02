const { Message, Conversation } = require("../models/Message");

const handleMessageEvents = (socket, io) => {
  // Join conversation rooms
  socket.on("join_conversation", (conversationId) => {
    socket.join(`conversation_${conversationId}`);
    console.log(`User ${socket.user.name} joined conversation ${conversationId}`);
  });

  // Leave conversation rooms
  socket.on("leave_conversation", (conversationId) => {
    socket.leave(`conversation_${conversationId}`);
    console.log(`User ${socket.user.name} left conversation ${conversationId}`);
  });

  // Handle real-time message sending
  socket.on("send_message", async (data) => {
    try {
      const { conversationId, content } = data;

      // Verify user is part of this conversation
      const conversation = await Conversation.findById(conversationId);
      if (!conversation || !conversation.participants.includes(socket.userId)) {
        socket.emit("error", { message: "Not authorized for this conversation" });
        return;
      }

      // Create the message
      const message = new Message({
        conversation: conversationId,
        sender: socket.userId,
        content: content.trim(),
        messageType: "text",
      });

      await message.save();
      await message.populate("sender", "name avatar");

      // Update conversation's last message
      conversation.lastMessage = message._id;
      conversation.lastActivity = new Date();
      await conversation.save();

      // Emit to all users in the conversation
      io.to(`conversation_${conversationId}`).emit("new_message", {
        message: message,
        conversationId: conversationId,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // Handle typing indicators
  socket.on("typing_start", (data) => {
    const { conversationId } = data;
    socket.to(`conversation_${conversationId}`).emit("user_typing", {
      userId: socket.userId,
      userName: socket.user.name,
      conversationId,
    });
  });

  socket.on("typing_stop", (data) => {
    const { conversationId } = data;
    socket.to(`conversation_${conversationId}`).emit("user_stop_typing", {
      userId: socket.userId,
      conversationId,
    });
  });

  // Handle message read status
  socket.on("mark_messages_read", async (data) => {
    try {
      const { conversationId } = data;

      await Message.updateMany(
        {
          conversation: conversationId,
          sender: { $ne: socket.userId },
          readBy: { $nin: [socket.userId] },
        },
        {
          $addToSet: { readBy: socket.userId },
        }
      );

      // Notify other participants that messages were read
      socket.to(`conversation_${conversationId}`).emit("messages_read", {
        conversationId,
        readBy: socket.userId,
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  });
};

module.exports = {
  handleMessageEvents,
};
