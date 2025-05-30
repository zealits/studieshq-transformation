import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import api from "../../api/axios";
import { format } from "date-fns";

const MessageModal = ({ isOpen, onClose, recipientId, recipientName, projectId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isOpen && recipientId) {
      initializeConversation();
    }
  }, [isOpen, recipientId]);

  const initializeConversation = async () => {
    try {
      setLoading(true);
      // Create or get conversation
      const response = await api.post("/api/messages/conversations", {
        recipientId,
      });
      setConversation(response.data);
      // Get messages
      await fetchMessages(response.data._id);
    } catch (err) {
      setError("Failed to initialize conversation");
      console.error("Error initializing conversation:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const response = await api.get(`/api/messages/conversations/${conversationId}/messages`);
      setMessages(response.data.messages.reverse());
      scrollToBottom();
    } catch (err) {
      setError("Failed to fetch messages");
      console.error("Error fetching messages:", err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation) return;

    try {
      const response = await api.post(`/api/messages/conversations/${conversation._id}`, {
        content: newMessage,
      });
      setMessages([...messages, response.data]);
      setNewMessage("");
      scrollToBottom();
    } catch (err) {
      setError("Failed to send message");
      console.error("Error sending message:", err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Message {recipientName}</h2>
            {projectId && <p className="text-sm text-gray-500">Project ID: {projectId}</p>}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-600">{error}</div>
          ) : (
            messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${message.sender._id === user.id ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.sender._id === user.id ? "bg-primary text-white" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs mt-1 opacity-75">{format(new Date(message.createdAt), "MMM d, h:mm a")}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={sendMessage} className="p-4 border-t">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MessageModal;
