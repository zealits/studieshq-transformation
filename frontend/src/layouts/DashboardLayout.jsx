import React, { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout, getMe } from "../redux/slices/authSlice";
import { fetchMyProfile } from "../redux/slices/profileSlice";
import NotificationBadge from "../components/common/NotificationBadge";

const DashboardLayout = ({ role }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const { data: profileData } = useSelector((state) => state.profile);
  const { totalUnreadCount } = useSelector((state) => state.chat);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch profile data when component mounts
  useEffect(() => {
    dispatch(fetchMyProfile());
    // Also fetch fresh user data to ensure we have the latest company information
    dispatch(getMe());
  }, [dispatch]);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const getNavLinks = () => {
    // Handle company users
    if (user?.userType === "company") {
      // Check if company profile is complete and verified
      const isProfileComplete = !!(
        user.company?.businessName &&
        user.company.businessName.trim().length > 0 &&
        user.company?.industry &&
        user.company.industry.trim().length > 0 &&
        user.company?.companySize &&
        user.company.companySize.trim().length > 0
      );

      const hasVerificationDocs = !!(
        user?.company?.documents?.find((doc) => doc.type === "business_license" && doc.url) &&
        user?.company?.documents?.find((doc) => doc.type === "tax_certificate" && doc.url)
      );

      const isVerified = isProfileComplete && hasVerificationDocs;

      if (user?.companyType === "freelancer_company") {
        return [
          { path: "/company/freelancer", label: "Dashboard", icon: "home" },
          { path: "/company/freelancer/find-jobs", label: "Find Projects", icon: "search", locked: !isVerified },
          { path: "/company/freelancer/invitations", label: "Invitations", icon: "mail", locked: !isVerified },
          { path: "/company/freelancer/projects", label: "My Projects", icon: "folder", locked: !isVerified },
          {
            path: "/company/freelancer/messages",
            label: "Messages",
            icon: "chat",
            showUnreadBadge: true,
            locked: !isVerified,
          },
          { path: "/company/freelancer/payments", label: "Payments", icon: "dollar", locked: !isVerified },
          { path: "/company/freelancer/profile", label: "Company Profile", icon: "user" },
          { path: "/company/freelancer/support", label: "Support", icon: "help", locked: !isVerified },
          { path: "/company/freelancer/settings", label: "Settings", icon: "settings", locked: !isVerified },
        ];
      } else if (user?.companyType === "project_sponsor_company") {
        return [
          { path: "/company/client", label: "Dashboard", icon: "home" },
          { path: "/company/client/jobs", label: "Project listing", icon: "briefcase", locked: !isVerified },
          { path: "/company/client/freelancers", label: "Find Freelancers", icon: "search", locked: !isVerified },
          { path: "/company/client/projects", label: "Ongoing Work", icon: "folder", locked: !isVerified },
          {
            path: "/company/client/messages",
            label: "Messages",
            icon: "chat",
            showUnreadBadge: true,
            locked: !isVerified,
          },
          { path: "/company/client/payments", label: "Payments", icon: "dollar", locked: !isVerified },
          { path: "/company/client/profile", label: "Company Profile", icon: "user" },
          { path: "/company/client/support", label: "Support", icon: "help", locked: !isVerified },
          { path: "/company/client/settings", label: "Settings", icon: "settings", locked: !isVerified },
        ];
      }
    }

    // Handle individual users
    switch (role) {
      case "freelancer":
        // Check if individual freelancer profile is complete
        const freelancerProfileComplete = !!(
          profileData?.data?.profile?.bio &&
          profileData.data.profile.bio.trim().length > 0 &&
          profileData?.data?.profile?.skills &&
          profileData.data.profile.skills.length > 0 &&
          profileData?.data?.profile?.location &&
          profileData.data.profile.location.trim().length > 0
        );

        return [
          { path: "/freelancer", label: "Dashboard", icon: "home" , locked: !freelancerProfileComplete},
          { path: "/freelancer/find-jobs", label: "Find Projects", icon: "search", locked: !freelancerProfileComplete },
          { path: "/freelancer/invitations", label: "Invitations", icon: "mail", locked: !freelancerProfileComplete },
          { path: "/freelancer/projects", label: "My Projects", icon: "folder", locked: !freelancerProfileComplete },
          {
            path: "/freelancer/messages",
            label: "Messages",
            icon: "chat",
            showUnreadBadge: true,
            locked: !freelancerProfileComplete,
          },
          { path: "/freelancer/payments", label: "Payments", icon: "dollar", locked: !freelancerProfileComplete },
          { path: "/freelancer/profile", label: "My Profile", icon: "user" },
          { path: "/freelancer/support", label: "Support", icon: "help", locked: !freelancerProfileComplete },
          { path: "/freelancer/settings", label: "Settings", icon: "settings", locked: !freelancerProfileComplete },
        ];
      case "client":
        // Check if individual client profile is complete
        const clientProfileComplete = !!(
          profileData?.data?.profile?.companyName &&
          profileData.data.profile.companyName.trim().length > 0 &&
          profileData?.data?.profile?.industry &&
          profileData.data.profile.industry.trim().length > 0 &&
          profileData?.data?.profile?.companySize &&
          profileData.data.profile.companySize.trim().length > 0
        );

        return [
          { path: "/client", label: "Dashboard", icon: "home" },
          { path: "/client/jobs", label: "Project listing", icon: "briefcase", locked: !clientProfileComplete },
          { path: "/client/freelancers", label: "Find Freelancers", icon: "search", locked: !clientProfileComplete },
          { path: "/client/projects", label: "Ongoing Work", icon: "folder", locked: !clientProfileComplete },
          {
            path: "/client/messages",
            label: "Messages",
            icon: "chat",
            showUnreadBadge: true,
            locked: !clientProfileComplete,
          },
          { path: "/client/payments", label: "Payments", icon: "dollar", locked: !clientProfileComplete },
          { path: "/client/profile", label: "My Profile", icon: "user" },
          { path: "/client/support", label: "Support", icon: "help", locked: !clientProfileComplete },
          { path: "/client/settings", label: "Settings", icon: "settings", locked: !clientProfileComplete },
        ];
      case "admin":
        return [
          { path: "/admin", label: "Dashboard", icon: "home" },
          { path: "/admin/users", label: "User Management", icon: "users" },
          { path: "/admin/jobs", label: "Job Management", icon: "briefcase" },
          { path: "/admin/projects", label: "Projects", icon: "folder" },
          { path: "/admin/contacts", label: "Contact Management", icon: "mail" },
          { path: "/admin/reports", label: "Reports", icon: "chart" },
          { path: "/admin/payments", label: "Payments", icon: "dollar" },
          { path: "/admin/settings", label: "Settings", icon: "settings" },
          { path: "/admin/support", label: "Support", icon: "help" },
        ];
      default:
        return [];
    }
  };

  // Simple icon renderer based on icon name
  const renderIcon = (iconName) => {
    switch (iconName) {
      case "home":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        );
      case "search":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        );
      case "folder":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        );
      case "chat":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        );
      case "dollar":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "user":
        return (
          <svg
            className="w-5 h-5"
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
        );
      case "settings":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case "briefcase":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        );
      case "users":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        );
      case "chart":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        );
      case "help":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "mail":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        );
      case "user-add":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
        );
      case "lock":
        return (
          <svg
            className="w-4 h-4"
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
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } w-64 bg-white border-r border-gray-200 z-30 lg:z-0 transition duration-300 ease-in-out`}
      >
        {/* Logo section */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <Link to="/" className="flex items-center">
            <img
              src="https://res.cloudinary.com/dzmn9lnk5/image/upload/v1720717646/agile/logos/STUDIES-HQ_qkotcf.png"
              alt="StudiesHQ Logo"
              className="h-12"
            />
          </Link>

          <button className="lg:hidden text-gray-500 hover:text-gray-700" onClick={toggleSidebar}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User profile section */}
        <div className="flex flex-col items-center pt-6 pb-5 px-4 border-b border-gray-200">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-xl font-bold mb-2 overflow-hidden">
            {profileData?.data?.profile?.user?.avatar ? (
              <img
                src={profileData.data.profile.user.avatar}
                alt={user?.name || "User"}
                className="w-full h-full object-cover"
              />
            ) : user?.name ? (
              user.name.charAt(0)
            ) : (
              "U"
            )}
          </div>
          <h2 className="text-base font-semibold text-gray-800">{user?.name || "User"}</h2>
          <p className="text-sm text-gray-500 mt-1 capitalize">
            {user?.userType === "company"
              ? user?.companyType === "freelancer_company"
                ? "Freelancer Company"
                : "Project Sponsor Company"
              : role}
          </p>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-3 overflow-y-auto flex-grow" style={{ maxHeight: "calc(100vh - 13rem)" }}>
          <div className="mb-3 px-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Main Menu</h3>
          </div>
          <ul className="space-y-1">
            {getNavLinks().map((link) => {
              // Check if current path matches exactly or is a sub-path
              const isActive = (() => {
                // Exact match
                if (location.pathname === link.path) return true;

                // For company users, check if path starts with the link path
                if (user?.userType === "company") {
                  return (
                    location.pathname.startsWith(link.path) &&
                    link.path !== "/company/freelancer" &&
                    link.path !== "/company/client"
                  );
                }

                // For individual users, check if path starts with the link path but not the base role path
                return location.pathname.startsWith(link.path) && link.path !== `/${role}`;
              })();

              const isLocked = link.locked || false;

              return (
                <li key={link.path}>
                  {isLocked ? (
                    <div
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed"
                      title="Complete profile verification to unlock"
                    >
                      <div className="flex items-center">
                        <span className="mr-3 text-gray-300">{renderIcon(link.icon)}</span>
                        <span>{link.label}</span>
                      </div>
                      <span className="text-gray-300">{renderIcon("lock")}</span>
                    </div>
                  ) : (
                    <Link
                      to={link.path}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center">
                        <span className={`mr-3 ${isActive ? "text-white" : "text-gray-500"}`}>
                          {renderIcon(link.icon)}
                        </span>
                        <span>{link.label}</span>
                      </div>
                      {link.showUnreadBadge && totalUnreadCount > 0 && <NotificationBadge size="xs" />}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer actions */}
        <div className="border-t border-gray-200 p-4 mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-20"
          onClick={toggleSidebar}
          aria-hidden="true"
        ></div>
      )}

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center z-10">
          <div className="px-6 flex items-center justify-between w-full">
            <div className="flex items-center">
              <button className="lg:hidden text-gray-500 mr-3 hover:text-gray-700" onClick={toggleSidebar}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-lg font-semibold text-gray-800 capitalize">
                {user?.userType === "company"
                  ? user?.companyType === "freelancer_company"
                    ? "Freelancer Company Dashboard"
                    : "Project Sponsor Company Dashboard"
                  : `${role} Dashboard`}
              </h1>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
