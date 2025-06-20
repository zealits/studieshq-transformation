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

  // Log connection status to console instead of showing in UI
  useEffect(() => {
    if (connectionError) {
      console.error("Chat connection error:", connectionError);
    }
    if (isConnecting) {
      console.log("Connecting to chat server...");
    }
    if (!isConnected && !isConnecting && !connectionError) {
      console.warn("Disconnected from chat server");
    }
    if (isConnected) {
      console.log("Connected to chat server");
    }
  }, [isConnected, isConnecting, connectionError]);

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

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Chat Content */}
      <div className="flex w-full">
        {/* Chat List */}
        <ChatList onSelectConversation={handleSelectConversation} selectedConversation={selectedConversation} />

        {/* Chat Window */}
        <ChatWindow conversation={selectedConversation} onClose={handleCloseChat} />
      </div>
    </div>
  );
};

export default ChatPage;
