import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { format } from "date-fns";
import { fetchConversations } from "../../redux/chatSlice";
import OnlineIndicator from "./OnlineIndicator";
import CreateConversationButton from "./CreateConversationButton";

const ChatList = ({ onSelectConversation, selectedConversation }) => {
  const dispatch = useDispatch();
  const {
    conversations = [],
    loading,
    onlineUsers = [],
    error,
    unreadCounts = {},
  } = useSelector((state) => state.chat);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  const getOtherParticipant = (conversation) => {
    return conversation.participants?.find((p) => p._id !== user.id);
  };

  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  const formatLastActivity = (date) => {
    if (!date) return "";
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return format(messageDate, "h:mm a");
    } else if (diffInHours < 168) {
      // 7 days
      return format(messageDate, "EEE");
    } else {
      return format(messageDate, "MMM d");
    }
  };

  const getUnreadCount = (conversationId) => {
    return unreadCounts[conversationId] || 0;
  };

  if (loading) {
    return (
      <div className="w-80 border-r bg-white">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Messages</h2>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-80 border-r bg-white">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Messages</h2>
        </div>
        <div className="flex items-center justify-center h-64 text-center">
          <div>
            <div className="text-red-500 text-4xl mb-2">⚠️</div>
            <p className="text-sm text-red-600">Failed to load conversations</p>
            <button
              onClick={() => dispatch(fetchConversations())}
              className="mt-2 text-blue-500 text-sm hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-r bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Messages</h2>
          {Object.values(unreadCounts).reduce((sum, count) => sum + count, 0) > 0 && (
            <div className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
              {Object.values(unreadCounts).reduce((sum, count) => sum + count, 0)}
            </div>
          )}
        </div>
      </div>

      {/* Create Conversation Button (for testing) */}
      <CreateConversationButton />

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {!Array.isArray(conversations) || conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs text-gray-400 mt-1">Create a conversation above to start messaging</p>
          </div>
        ) : (
          conversations.map((conversation) => {
            const otherParticipant = getOtherParticipant(conversation);
            const isSelected = selectedConversation?._id === conversation._id;
            const isOnline = otherParticipant && isUserOnline(otherParticipant._id);
            const unreadCount = getUnreadCount(conversation._id);

            return (
              <div
                key={conversation._id}
                onClick={() => onSelectConversation(conversation)}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors relative ${
                  isSelected ? "bg-blue-50 border-blue-200" : ""
                } ${unreadCount > 0 ? "bg-blue-25" : ""}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {otherParticipant?.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <OnlineIndicator isOnline={isOnline} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-medium text-gray-900 truncate ${unreadCount > 0 ? "font-semibold" : ""}`}>
                        {otherParticipant?.name || "Unknown User"}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">{formatLastActivity(conversation.lastActivity)}</span>
                        {unreadCount > 0 && (
                          <div className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center font-medium">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </div>
                        )}
                      </div>
                    </div>

                    <p className={`text-sm text-gray-600 truncate mt-1 ${unreadCount > 0 ? "font-medium" : ""}`}>
                      {conversation.lastMessage?.content || "No messages yet"}
                    </p>
                  </div>
                </div>

                {/* Unread indicator */}
                {unreadCount > 0 && !isSelected && (
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r"></div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatList;
