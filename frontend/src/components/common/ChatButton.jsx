import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createConversation } from '../../redux/chatSlice';

const ChatButton = ({ recipientId, recipientName, className = '', size = 'md' }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { loading } = useSelector((state) => state.chat);

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const handleStartChat = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (recipientId === user.id) {
      return; // Can't message yourself
    }

    try {
      await dispatch(createConversation(recipientId)).unwrap();
      navigate('/chat');
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  if (!recipientId || recipientId === user?.id) {
    return null;
  }

  return (
    <button
      onClick={handleStartChat}
      disabled={loading}
      className={`
        bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg
        transition-colors duration-200 flex items-center space-x-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]} ${className}
      `}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      <span>Message {recipientName ? recipientName.split(' ')[0] : 'User'}</span>
    </button>
  );
};

export default ChatButton; 