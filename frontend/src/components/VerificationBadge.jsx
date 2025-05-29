import React from "react";

const VerificationBadge = ({ size = "default", showText = true }) => {
  const sizeClasses = {
    small: "w-4 h-4",
    default: "w-5 h-5",
    large: "w-6 h-6",
  };

  const badgeClasses = {
    small: "p-0.5",
    default: "p-1",
    large: "p-1.5",
  };

  const textClasses = {
    small: "text-xs",
    default: "text-sm",
    large: "text-base",
  };

  return (
    <div className="flex items-center">
      <div className={`relative ${badgeClasses[size]}`}>
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500 rounded-full animate-pulse opacity-75"></div>

        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full animate-shimmer"></div>

        {/* Main badge */}
        <div
          className={`relative ${sizeClasses[size]} bg-white rounded-full flex items-center justify-center shadow-sm`}
        >
          <svg
            className={`${sizeClasses[size]} text-emerald-500`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      {showText && <span className={`ml-2 ${textClasses[size]} font-medium text-emerald-600`}>Verified</span>}
    </div>
  );
};

export default VerificationBadge;
