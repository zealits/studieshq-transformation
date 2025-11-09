import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const UserTypeRedirect = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // Redirect based on user type and company type
      if (user.userType === "company") {
        if (user.companyType === "freelancer_company") {
          navigate("/company/freelancer", { replace: true });
        } else if (user.companyType === "project_sponsor_company") {
          navigate("/company/client", { replace: true });
        }
      } else {
        // Individual users
        if (user.role === "freelancer") {
          // Check if freelancer is part of a company
          if (user.companyFreelancer && user.companyFreelancer.companyId) {
            navigate("/freelancer", { replace: true });
          } else {
            navigate("/freelancer", { replace: true });
          }
        } else if (user.role === "client") {
          navigate("/client", { replace: true });
        } else if (user.role === "admin") {
          navigate("/admin", { replace: true });
        }
      }
    }
  }, [user, navigate]);

  return null; // This component doesn't render anything
};

export default UserTypeRedirect;
