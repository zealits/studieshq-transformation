import React from "react";
import { useSelector } from "react-redux";
import ProfileNotVerified from "./ProfileNotVerified";

const CompanyRouteGuard = ({ children, userType = "company" }) => {
  const { user } = useSelector((state) => state.auth);
  const { data: profileData } = useSelector((state) => state.profile);

  // If not a company user, render children normally
  if (user?.userType !== "company") {
    return children;
  }

  // Check if profile is complete
  const isProfileComplete = !!(
    user.company?.businessName &&
    user.company.businessName.trim().length > 0 &&
    user.company?.industry &&
    user.company.industry.trim().length > 0 &&
    user.company?.companySize &&
    user.company.companySize.trim().length > 0
  );

  // Check if verification documents are uploaded
  const hasVerificationDocs = !!(
    profileData?.data?.profile?.verificationDocuments?.addressProof?.documentUrl &&
    profileData?.data?.profile?.verificationDocuments?.identityProof?.documentUrl
  );

  // If profile is not complete or not verified, show locked page
  if (!isProfileComplete || !hasVerificationDocs) {
    return <ProfileNotVerified userType={userType} />;
  }

  // If everything is complete, render children
  return children;
};

export default CompanyRouteGuard;
