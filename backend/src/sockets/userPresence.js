const User = require('../models/User');

// Store active connections
const activeUsers = new Map();

const handleUserOnline = async (socket, io) => {
  try {
    const userId = socket.userId;
    
    // Add user to active users
    if (!activeUsers.has(userId)) {
      activeUsers.set(userId, new Set());
    }
    activeUsers.get(userId).add(socket.id);

    // Update user's online status in database
    await User.findByIdAndUpdate(userId, {
      isOnline: true,
      lastSeen: new Date()
    });

    // Broadcast user online status to all connected clients
    socket.broadcast.emit('user_online', {
      userId: userId,
      userName: socket.user.name
    });

    console.log(`User ${socket.user.name} is now online`);
  } catch (error) {
    console.error('Error handling user online:', error);
  }
};

const handleUserOffline = async (socket, io) => {
  try {
    const userId = socket.userId;
    
    if (activeUsers.has(userId)) {
      const userSockets = activeUsers.get(userId);
      userSockets.delete(socket.id);
      
      // If no more sockets for this user, mark as offline
      if (userSockets.size === 0) {
        activeUsers.delete(userId);
        
        // Update user's offline status in database
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date()
        });

        // Broadcast user offline status
        socket.broadcast.emit('user_offline', {
          userId: userId,
          userName: socket.user.name
        });

        console.log(`User ${socket.user.name} is now offline`);
      }
    }
  } catch (error) {
    console.error('Error handling user offline:', error);
  }
};

const getOnlineUsers = () => {
  return Array.from(activeUsers.keys());
};

const isUserOnline = (userId) => {
  return activeUsers.has(userId);
};

module.exports = {
  handleUserOnline,
  handleUserOffline,
  getOnlineUsers,
  isUserOnline
}; 