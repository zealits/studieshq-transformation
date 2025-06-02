import React from "react";
import { format } from "date-fns";

const MessageBubble = ({ message, isOwnMessage, showReadStatus, readBy }) => {
  const isRead = readBy && readBy.length > 0;

  return (
    <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[70%] rounded-lg p-3 ${
          isOwnMessage ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs opacity-75">{format(new Date(message.createdAt), "h:mm a")}</p>
          {showReadStatus && isOwnMessage && (
            <div className="ml-2">
              {isRead ? (
                <svg className="w-4 h-4 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
