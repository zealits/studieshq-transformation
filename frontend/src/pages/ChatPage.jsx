import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { clearChat } from "../redux/chatSlice";
import ChatList from "../components/chat/ChatList";
import ChatWindow from "../components/chat/ChatWindow";

const ChatPage = () => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { isConnected, isConnecting, connectionError } = useSelector((state) => state.chat);

  useEffect(() => {
    // Clean up on unmount
    return () => {
      dispatch(clearChat());
    };
  }, [dispatch]);

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
  };

  const handleCloseChat = () => {
    setSelectedConversation(null);
  };

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Please log in</h2>
          <p className="text-gray-600">You need to be logged in to access the chat.</p>
        </div>
      </div>
    );
  }

  const getConnectionStatus = () => {
    if (connectionError) {
      return {
        message: `Connection error: ${connectionError}`,
        color: "bg-red-500",
        showRetry: true,
      };
    }

    if (isConnecting) {
      return {
        message: "Connecting to chat server...",
        color: "bg-yellow-500",
        showRetry: false,
      };
    }

    if (!isConnected) {
      return {
        message: "Disconnected from chat server",
        color: "bg-red-500",
        showRetry: true,
      };
    }

    return null;
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Connection Status */}
      {connectionStatus && (
        <div
          className={`absolute top-0 left-0 right-0 ${connectionStatus.color} text-white text-center py-2 text-sm z-50 flex items-center justify-center space-x-2`}
        >
          <span>{connectionStatus.message}</span>
          {connectionStatus.showRetry && (
            <button onClick={() => window.location.reload()} className="underline hover:no-underline">
              Retry
            </button>
          )}
        </div>
      )}

      {/* Chat Content */}
      <div className={`flex w-full ${connectionStatus ? "mt-10" : ""}`}>
        {/* Chat List */}
        <ChatList onSelectConversation={handleSelectConversation} selectedConversation={selectedConversation} />

        {/* Chat Window */}
        <ChatWindow conversation={selectedConversation} onClose={handleCloseChat} />
      </div>
    </div>
  );
};

export default ChatPage;
