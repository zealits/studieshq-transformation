import React from "react";

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "OK", cancelText = "Cancel", confirmButtonClass = "bg-green-600 hover:bg-green-700 text-white" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        <div className="p-6">
          {/* Title */}
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
          )}
          
          {/* Message */}
          <p className="text-gray-700 mb-6">{message}</p>
          
          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors font-medium"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2 ${confirmButtonClass} rounded-md transition-colors font-medium`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

