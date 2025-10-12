import React from "react";
import { Link } from "react-router-dom";

const ProfileNotVerified = ({ userType }) => {
  const profilePath = userType === "company" ? "/company/freelancer/profile" : "/profile";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        {/* Lock Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Verified</h2>

        {/* Message */}
        <p className="text-gray-600 mb-6">
          {userType === "company"
            ? "Please complete your company profile and verification to access all features."
            : "Please complete your profile and verification to access all features."}
        </p>

        {/* Action Button */}
        <Link
          to={profilePath}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          Complete Profile
        </Link>

        {/* Additional Info */}
        <div className="mt-6 text-sm text-gray-500">
          <p>You can access:</p>
          <ul className="mt-2 space-y-1">
            <li>• Dashboard</li>
            <li>• Profile Settings</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProfileNotVerified;
