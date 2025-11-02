import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const CompanyFreelancerRedirect = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  // If user is not a company freelancer, redirect them away
  if (user && (!user.companyFreelancer || !user.companyFreelancer.companyId)) {
    return <Navigate to="/freelancer" replace />;
  }

  return children;
};

export default CompanyFreelancerRedirect;
