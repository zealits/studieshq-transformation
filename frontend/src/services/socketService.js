import io from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(token) {
    if (this.socket && this.isConnected) {
      console.log("Socket already connected");
      return this.socket;
    }

    try {
      console.log("Connecting to socket server...");
      this.socket = io(import.meta.env.VITE_API_URL || "http://localhost:2001", {
        auth: {
          token: token,
        },
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      this.socket.on("connect", () => {
        console.log("Connected to server");
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });

      this.socket.on("disconnect", (reason) => {
        console.log("Disconnected from server:", reason);
        this.isConnected = false;
      });

      this.socket.on("connect_error", (error) => {
        console.error("Connection error:", error);
        this.isConnected = false;
        this.reconnectAttempts++;

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error("Max reconnection attempts reached");
        }
      });

      this.socket.on("error", (error) => {
        console.error("Socket error:", error);
      });
    } catch (error) {
      console.error("Failed to create socket connection:", error);
    }

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      console.log("Disconnecting socket...");
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
    }
  }

  // Message events
  joinConversation(conversationId) {
    if (this.socket && this.isConnected) {
      this.socket.emit("join_conversation", conversationId);
    } else {
      console.warn("Socket not connected, cannot join conversation");
    }
  }

  leaveConversation(conversationId) {
    if (this.socket && this.isConnected) {
      this.socket.emit("leave_conversation", conversationId);
    }
  }

  sendMessage(conversationId, content) {
    if (this.socket && this.isConnected) {
      this.socket.emit("send_message", { conversationId, content });
    } else {
      console.warn("Socket not connected, cannot send message");
    }
  }

  markMessagesRead(conversationId) {
    if (this.socket && this.isConnected) {
      this.socket.emit("mark_messages_read", { conversationId });
    }
  }

  // Typing events
  startTyping(conversationId) {
    if (this.socket && this.isConnected) {
      this.socket.emit("typing_start", { conversationId });
    }
  }

  stopTyping(conversationId) {
    if (this.socket && this.isConnected) {
      this.socket.emit("typing_stop", { conversationId });
    }
  }

  // Event listeners
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on("new_message", callback);
    }
  }

  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on("user_typing", callback);
    }
  }

  onUserStopTyping(callback) {
    if (this.socket) {
      this.socket.on("user_stop_typing", callback);
    }
  }

  onUserOnline(callback) {
    if (this.socket) {
      this.socket.on("user_online", callback);
    }
  }

  onUserOffline(callback) {
    if (this.socket) {
      this.socket.on("user_offline", callback);
    }
  }

  onMessagesRead(callback) {
    if (this.socket) {
      this.socket.on("messages_read", callback);
    }
  }

  // Remove listeners
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  getSocket() {
    return this.socket;
  }

  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }
}

export default new SocketService();
