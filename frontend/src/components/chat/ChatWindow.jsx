import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { format } from "date-fns";
import socketService from "../../services/socketService";
import {
  setCurrentConversation,
  addRealtimeMessage,
  setUserTyping,
  setUserStopTyping,
  markMessagesAsRead,
  markConversationAsRead,
  fetchMessages,
} from "../../redux/chatSlice";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import OnlineIndicator from "./OnlineIndicator";

const ChatWindow = ({ conversation, onClose }) => {
  const dispatch = useDispatch();
  const messagesEndRef = useRef(null);
  const [isWindowVisible, setIsWindowVisible] = useState(true);
  const { user } = useSelector((state) => state.auth);
  const { messages, typingUsers, onlineUsers } = useSelector((state) => state.chat);

  const conversationMessages = messages[conversation?._id] || [];
  const isTyping = typingUsers[conversation?._id] || [];

  const otherParticipant = conversation?.participants?.find((p) => p._id !== user.id);
  const isOtherUserOnline = otherParticipant && onlineUsers.includes(otherParticipant._id);

  // Track window visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsWindowVisible(!document.hidden);

      // Mark conversation as read when window becomes visible and conversation is selected
      if (!document.hidden && conversation?._id) {
        dispatch(markConversationAsRead(conversation._id));
        socketService.markMessagesRead(conversation._id);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [conversation, dispatch]);

  useEffect(() => {
    if (conversation?._id) {
      // Set current conversation
      dispatch(setCurrentConversation(conversation));

      // Join conversation room
      socketService.joinConversation(conversation._id);

      // Fetch messages if not already loaded
      if (!messages[conversation._id]) {
        dispatch(fetchMessages(conversation._id));
      }

      // Mark conversation as read only if window is visible
      if (isWindowVisible) {
        setTimeout(() => {
          dispatch(markConversationAsRead(conversation._id));
          socketService.markMessagesRead(conversation._id);
        }, 500); // Small delay to ensure user actually sees the messages
      }

      // Set up socket listeners
      const handleNewMessage = (data) => {
        dispatch(addRealtimeMessage(data));

        // Auto-mark as read if this conversation is active and window is visible
        if (data.conversationId === conversation._id && isWindowVisible) {
          setTimeout(() => {
            dispatch(markConversationAsRead(conversation._id));
            socketService.markMessagesRead(conversation._id);
          }, 1000); // 1 second delay to ensure user sees the message
        }

        scrollToBottom();
      };

      const handleUserTyping = (data) => {
        dispatch(setUserTyping(data));
      };

      const handleUserStopTyping = (data) => {
        dispatch(setUserStopTyping(data));
      };

      const handleMessagesRead = (data) => {
        dispatch(markMessagesAsRead(data));
      };

      socketService.onNewMessage(handleNewMessage);
      socketService.onUserTyping(handleUserTyping);
      socketService.onUserStopTyping(handleUserStopTyping);
      socketService.onMessagesRead(handleMessagesRead);

      return () => {
        // Clean up listeners
        socketService.off("new_message", handleNewMessage);
        socketService.off("user_typing", handleUserTyping);
        socketService.off("user_stop_typing", handleUserStopTyping);
        socketService.off("messages_read", handleMessagesRead);

        // Leave conversation room
        socketService.leaveConversation(conversation._id);
      };
    }
  }, [conversation, dispatch, messages, isWindowVisible]);

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (content) => {
    if (conversation?._id && content.trim()) {
      socketService.sendMessage(conversation._id, content.trim());
    }
  };

  const handleTyping = () => {
    if (conversation?._id) {
      socketService.startTyping(conversation._id);
    }
  };

  const handleStopTyping = () => {
    if (conversation?._id) {
      socketService.stopTyping(conversation._id);
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
          <p className="text-sm">Choose a conversation from the sidebar to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {otherParticipant?.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <OnlineIndicator isOnline={isOtherUserOnline} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{otherParticipant?.name || "Unknown User"}</h2>
            <p className="text-sm text-gray-500">{isOtherUserOnline ? "Online" : "Offline"}</p>
          </div>
        </div>

        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversationMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">👋</div>
            <p>Start your conversation with {otherParticipant?.name}</p>
          </div>
        ) : (
          conversationMessages.map((message, index) => {
            const isLastMessage = index === conversationMessages.length - 1;
            const prevMessage = index > 0 ? conversationMessages[index - 1] : null;
            const showDate =
              !prevMessage ||
              format(new Date(message.createdAt), "yyyy-MM-dd") !==
                format(new Date(prevMessage.createdAt), "yyyy-MM-dd");

            return (
              <div key={message._id}>
                {showDate && (
                  <div className="text-center my-4">
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                      {format(new Date(message.createdAt), "MMMM d, yyyy")}
                    </span>
                  </div>
                )}
                <MessageBubble
                  message={message}
                  isOwnMessage={message.sender._id === user.id}
                  showReadStatus={isLastMessage && message.sender._id === user.id}
                  readBy={message.readBy || []}
                />
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        <TypingIndicator typingUsers={isTyping} />

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        onStopTyping={handleStopTyping}
        disabled={!conversation}
      />
    </div>
  );
};

export default ChatWindow;
