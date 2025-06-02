import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createConversation } from "../../redux/chatSlice";

const CreateConversationButton = () => {
  const [recipientId, setRecipientId] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleCreate = async () => {
    if (!recipientId.trim()) {
      alert("Please enter a recipient ID");
      return;
    }

    if (recipientId === user.id) {
      alert("Cannot create conversation with yourself");
      return;
    }

    setLoading(true);
    try {
      await dispatch(createConversation(recipientId.trim())).unwrap();
      setRecipientId("");
      alert("Conversation created successfully!");
    } catch (error) {
      alert("Failed to create conversation: " + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border-b bg-gray-50">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Create Test Conversation</h3>
      <div className="flex space-x-2">
        <input
          type="text"
          value={recipientId}
          onChange={(e) => setRecipientId(e.target.value)}
          placeholder="Enter recipient User ID"
          className="flex-1 text-sm border rounded px-2 py-1"
        />
        <button
          onClick={handleCreate}
          disabled={loading}
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create"}
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-1">Current user ID: {user?.id}</p>
    </div>
  );
};

export default CreateConversationButton;
