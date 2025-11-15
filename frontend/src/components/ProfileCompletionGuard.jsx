import React, { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const ProfileCompletionGuard = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const toastShownRef = useRef(false);

  // Paths that don't require profile completion
  const allowedPaths = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/admin", // Admin users don't need profile verification
  ];

  // For company users, only allow dashboard and profile pages until profile is complete
  const companyRestrictedPaths = [
    "/company/freelancer", // Dashboard
    "/company/freelancer/profile", // Profile page
    "/company/client", // Dashboard
    "/company/client/profile", // Profile page
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

      // Define what constitutes a "complete" profile based on userType and role
      let isProfileComplete = false;

      if (user.userType === "company") {
        // For company users, check if they have company info
        isProfileComplete = !!(
          user.company?.businessName &&
          user.company.businessName.trim().length > 0
          
        );

        // For company users, check company verification status instead of individual documents
        const isVerified = isProfileComplete && user.company?.verificationStatus === "verified";

        // For company users, restrict access to only dashboard and profile pages until profile is complete AND verified
        if (!isVerified) {
          const isCompanyRestrictedPath = companyRestrictedPaths.some((path) => location.pathname.startsWith(path));

          if (!isCompanyRestrictedPath) {
            // Don't show toast, let the locked page component handle the message
            navigate("/company/freelancer/profile");
            return;
          }
        }
      } else if (user.role === "freelancer") {
        // Check if freelancer is part of a company
        // if (user.companyFreelancer && user.companyFreelancer.companyId) {
        //   // Company freelancers are auto-verified and don't need profile completion
        //   isProfileComplete = true;
        // } else {
        //   // For individual freelancers, check if they have basic profile info
        //   isProfileComplete = !!(
        //     profile.skills &&
        //     profile.skills.length > 0 &&
        //     profile.location &&
        //     profile.location.trim().length > 0
        //   );
        // }

        if (profile.verificationStatus === "verified") {
          isProfileComplete = true;
        } else {
          isProfileComplete = false;
        }



      } else if (user.role === "client") {
        // For individual clients, check if they have company info

        if (profile.verificationStatus === "verified") {
          isProfileComplete = true;
        } else {
          isProfileComplete = false;
        }
      }

      // If profile is not complete, redirect to profile page (for non-company users)
      if (!isProfileComplete && user.userType !== "company") {
        if (!toastShownRef.current) {
          toast.info("Please complete your profile to access the platform", {
            autoClose: 10000,
            toastId: "profile-completion",
          });
          toastShownRef.current = true;
        }
        // navigate(`/${user.role}/profile`);
        return;
      }

      // Check if profile verification documents are uploaded
      const hasVerificationDocs = !!(
        profile.verificationDocuments?.addressProof?.documentUrl &&
        profile.verificationDocuments?.identityProof?.documentUrl
      );

      // If no verification documents, show a gentle reminder but don't force redirect
      // Skip this check for company freelancers as they are auto-verified
      if (
        !hasVerificationDocs &&
        !location.pathname.includes("/profile") &&
        user.userType !== "company" &&
        !(user.companyFreelancer && user.companyFreelancer.companyId)
      ) {
        if (!toastShownRef.current) {
          toast.info("Complete your profile verification to unlock all features", {
            autoClose: 10000,
            toastId: "verification-reminder",
          });
          toastShownRef.current = true;
        }
      }
    }
  }, [user, location.pathname, navigate, isAllowedPath]);

  // Reset toast flag when user changes
  useEffect(() => {
    toastShownRef.current = false;
  }, [user?.id]);

  // Cleanup toasts when component unmounts
  useEffect(() => {
    return () => {
      toast.dismiss("profile-completion");
      toast.dismiss("verification-reminder");
    };
  }, []);

  return <>{children}</>;
};

export default ProfileCompletionGuard;
