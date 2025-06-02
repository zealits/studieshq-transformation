import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { dismissNotification } from "../../redux/chatSlice";

const NotificationToast = () => {
  const dispatch = useDispatch();
  const { notifications } = useSelector((state) => state.chat);
  const [visibleNotifications, setVisibleNotifications] = useState([]);

  useEffect(() => {
    // Add new notifications to visible list
    const newNotifications = notifications.filter(
      (notification) => !visibleNotifications.find((n) => n.id === notification.id)
    );

    if (newNotifications.length > 0) {
      setVisibleNotifications((prev) => [...prev, ...newNotifications]);

      // Auto dismiss after 5 seconds for each new notification
      newNotifications.forEach((notification) => {
        setTimeout(() => {
          handleDismiss(notification.id);
        }, 5000);
      });
    }
  }, [notifications, visibleNotifications]);

  const handleDismiss = (notificationId) => {
    setVisibleNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    dispatch(dismissNotification(notificationId));
  };

  const handleNotificationClick = (notification) => {
    // Navigate to chat if clicked
    if (notification.conversationId) {
      const chatUrl = `/chat?conversation=${notification.conversationId}`;
      window.open(chatUrl, "_blank");
    }
    handleDismiss(notification.id);
  };

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {visibleNotifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm animate-slide-in-right cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => handleNotificationClick(notification)}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" />
                </svg>
              </div>
            </div>

            <div className="ml-3 flex-1">
              <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
              <p className="text-xs text-blue-600 mt-1">Click to open chat</p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss(notification.id);
              }}
              className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;
