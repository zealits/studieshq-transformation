import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";

const ProfileCompletionGuard = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  // Paths that don't require profile completion
  const allowedPaths = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/admin", // Admin users don't need profile verification
  ];

  // Check if current path is allowed
  const isAllowedPath = allowedPaths.some((path) => location.pathname.startsWith(path));

  useEffect(() => {
    // Skip check if user is not logged in or path is allowed
    if (!user || isAllowedPath) {
      return;
    }

    // Skip check if user needs to change password (handled by login flow)
    if (user.requirePasswordChange) {
      return;
    }

    // Check if user is verified but profile is not complete
    if (user.isVerified && user.profile) {
      const profile = user.profile;

      // Define what constitutes a "complete" profile based on role
      let isProfileComplete = false;

      if (user.role === "freelancer") {
        // For freelancers, check if they have basic profile info
        isProfileComplete = !!(
          profile.bio &&
          profile.bio.trim().length > 0 &&
          profile.skills &&
          profile.skills.length > 0 &&
          profile.location &&
          profile.location.trim().length > 0
        );
      } else if (user.role === "client") {
        // For clients, check if they have company info
        isProfileComplete = !!(
          profile.companyName &&
          profile.companyName.trim().length > 0 &&
          profile.industry &&
          profile.industry.trim().length > 0 &&
          profile.companySize &&
          profile.companySize.trim().length > 0
        );
      }

      // If profile is not complete, redirect to profile page
      if (!isProfileComplete) {
        toast.info("Please complete your profile to access the platform");
        navigate(`/${user.role}/profile`);
        return;
      }

      // Check if profile verification documents are uploaded
      const hasVerificationDocs = !!(
        profile.verificationDocuments?.addressProof?.documentUrl &&
        profile.verificationDocuments?.identityProof?.documentUrl
      );

      // If no verification documents, show a gentle reminder but don't force redirect
      if (!hasVerificationDocs && !location.pathname.includes("/profile")) {
        toast.info("Complete your profile verification to unlock all features", {
          duration: 5000,
        });
      }
    }
  }, [user, location.pathname, navigate, isAllowedPath]);

  return <>{children}</>;
};

export default ProfileCompletionGuard;
