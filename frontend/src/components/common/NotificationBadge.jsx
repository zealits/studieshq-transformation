import React from "react";
import { useSelector } from "react-redux";

const NotificationBadge = ({ className = "", size = "sm", count }) => {
  const { totalUnreadCount = 0 } = useSelector((state) => state.chat);

  // Use provided count or fallback to Redux state
  const displayCount = count !== undefined ? count : totalUnreadCount;

  if (displayCount === 0) {
    return null;
  }

  const sizeClasses = {
    xs: "text-xs px-1.5 py-0.5 min-w-[16px] h-4",
    sm: "text-xs px-2 py-1 min-w-[20px] h-5",
    md: "text-sm px-2.5 py-1 min-w-[24px] h-6",
    lg: "text-base px-3 py-1.5 min-w-[28px] h-7",
  };

  return (
    <div
      className={`
        bg-red-500 text-white rounded-full text-center font-medium
        flex items-center justify-center
        ${sizeClasses[size]}
        ${className}
      `}
      title={`${displayCount} unread message${displayCount === 1 ? "" : "s"}`}
    >
      {displayCount > 99 ? "99+" : displayCount}
    </div>
  );
};

export default NotificationBadge;
