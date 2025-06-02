import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

// Async thunks
export const fetchConversations = createAsyncThunk("chat/fetchConversations", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get("/api/messages/conversations");
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || "Failed to fetch conversations");
  }
});

export const fetchMessages = createAsyncThunk("chat/fetchMessages", async (conversationId, { rejectWithValue }) => {
  try {
    const response = await api.get(`/api/messages/conversations/${conversationId}/messages`);
    return { conversationId, messages: response.data.messages };
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || "Failed to fetch messages");
  }
});

export const createConversation = createAsyncThunk(
  "chat/createConversation",
  async (recipientId, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/messages/conversations", { recipientId });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to create conversation");
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    conversations: [],
    currentConversation: null,
    messages: {},
    onlineUsers: [],
    typingUsers: {},
    unreadCounts: {},
    totalUnreadCount: 0,
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    loading: false,
    error: null,
    notifications: [],
  },
  reducers: {
    setCurrentConversation: (state, action) => {
      state.currentConversation = action.payload;
      // Don't automatically mark messages as read when just selecting conversation
      // Read status should be handled separately when user actually views messages
    },

    addMessage: (state, action) => {
      const { conversationId, message } = action.payload;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      state.messages[conversationId].push(message);

      // Update conversation's last message
      const conversation = state.conversations.find((c) => c._id === conversationId);
      if (conversation) {
        conversation.lastMessage = message;
        conversation.lastActivity = message.createdAt;
      }
    },

    addRealtimeMessage: (state, action) => {
      const { message, conversationId } = action.payload;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }

      // Check if message already exists (avoid duplicates)
      const exists = state.messages[conversationId].some((m) => m._id === message._id);
      if (!exists) {
        state.messages[conversationId].push(message);

        // Update or create conversation in the list
        let conversation = state.conversations.find((c) => c._id === conversationId);

        if (conversation) {
          // Update existing conversation
          conversation.lastMessage = message;
          conversation.lastActivity = message.createdAt;

          // Move conversation to top
          const index = state.conversations.findIndex((c) => c._id === conversationId);
          if (index > 0) {
            state.conversations.splice(index, 1);
            state.conversations.unshift(conversation);
          }
        } else {
          // Create a minimal conversation object if it doesn't exist
          // This can happen if a new conversation was created by another user
          const newConversation = {
            _id: conversationId,
            participants: [message.sender, { _id: "unknown", name: "Loading..." }],
            lastMessage: message,
            lastActivity: message.createdAt,
          };
          state.conversations.unshift(newConversation);
          console.log("Added new conversation from real-time message:", conversationId);
        }

        // Update unread count if not current conversation
        if (!state.currentConversation || state.currentConversation._id !== conversationId) {
          state.unreadCounts[conversationId] = (state.unreadCounts[conversationId] || 0) + 1;
          state.totalUnreadCount = Object.values(state.unreadCounts).reduce((sum, count) => sum + count, 0);

          // Add notification
          state.notifications.push({
            id: Date.now(),
            type: "message",
            title: "New Message",
            message: `New message from ${message.sender.name}`,
            conversationId,
            timestamp: new Date().toISOString(),
          });

          console.log("Added notification for message from:", message.sender.name);
        }
      }
    },

    setUserOnline: (state, action) => {
      const { userId } = action.payload;
      if (!state.onlineUsers.includes(userId)) {
        state.onlineUsers.push(userId);
      }
    },

    setUserOffline: (state, action) => {
      const { userId } = action.payload;
      state.onlineUsers = state.onlineUsers.filter((id) => id !== userId);
    },

    setUserTyping: (state, action) => {
      const { userId, userName, conversationId } = action.payload;
      if (!state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = [];
      }

      const exists = state.typingUsers[conversationId].some((user) => user.userId === userId);
      if (!exists) {
        state.typingUsers[conversationId].push({ userId, userName });
      }
    },

    setUserStopTyping: (state, action) => {
      const { userId, conversationId } = action.payload;
      if (state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = state.typingUsers[conversationId].filter((user) => user.userId !== userId);
      }
    },

    markConversationAsRead: (state, action) => {
      const conversationId = action.payload;
      if (conversationId) {
        state.unreadCounts[conversationId] = 0;
        state.totalUnreadCount = Object.values(state.unreadCounts).reduce((sum, count) => sum + count, 0);
      }
    },

    markMessagesAsRead: (state, action) => {
      const { conversationId, readBy } = action.payload;
      if (state.messages[conversationId]) {
        state.messages[conversationId].forEach((message) => {
          if (!message.readBy.includes(readBy)) {
            message.readBy.push(readBy);
          }
        });
      }
      // Note: Don't reset unread count here - that's handled by markConversationAsRead
    },

    setConnectionStatus: (state, action) => {
      state.isConnected = action.payload;
      state.isConnecting = false;
      if (action.payload) {
        state.connectionError = null;
      }
    },

    setConnecting: (state, action) => {
      state.isConnecting = action.payload;
      if (action.payload) {
        state.connectionError = null;
      }
    },

    setConnectionError: (state, action) => {
      state.connectionError = action.payload;
      state.isConnecting = false;
      state.isConnected = false;
    },

    updateUnreadCount: (state, action) => {
      const { conversationId, count } = action.payload;
      state.unreadCounts[conversationId] = count;
      state.totalUnreadCount = Object.values(state.unreadCounts).reduce((sum, count) => sum + count, 0);
    },

    dismissNotification: (state, action) => {
      const notificationId = action.payload;
      state.notifications = state.notifications.filter((n) => n.id !== notificationId);
    },

    clearNotifications: (state) => {
      state.notifications = [];
    },

    clearError: (state) => {
      state.error = null;
    },

    clearChat: (state) => {
      state.conversations = [];
      state.currentConversation = null;
      state.messages = {};
      state.onlineUsers = [];
      state.typingUsers = {};
      state.unreadCounts = {};
      state.totalUnreadCount = 0;
      state.isConnected = false;
      state.isConnecting = false;
      state.connectionError = null;
      state.notifications = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch conversations
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload;

        // Initialize unread counts
        action.payload.forEach((conversation) => {
          if (!state.unreadCounts[conversation._id]) {
            state.unreadCounts[conversation._id] = conversation.unreadCount || 0;
          }
        });
        state.totalUnreadCount = Object.values(state.unreadCounts).reduce((sum, count) => sum + count, 0);
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        const { conversationId, messages } = action.payload;
        state.messages[conversationId] = messages.reverse();
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create conversation
      .addCase(createConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createConversation.fulfilled, (state, action) => {
        state.loading = false;
        const conversation = action.payload;
        const exists = state.conversations.some((c) => c._id === conversation._id);
        if (!exists) {
          state.conversations.unshift(conversation);
          state.unreadCounts[conversation._id] = 0;
        }
      })
      .addCase(createConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setCurrentConversation,
  addMessage,
  addRealtimeMessage,
  setUserOnline,
  setUserOffline,
  setUserTyping,
  setUserStopTyping,
  markConversationAsRead,
  markMessagesAsRead,
  setConnectionStatus,
  setConnecting,
  setConnectionError,
  updateUnreadCount,
  dismissNotification,
  clearNotifications,
  clearError,
  clearChat,
} = chatSlice.actions;

export default chatSlice.reducer;
