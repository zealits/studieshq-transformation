import React from "react";
import { Outlet } from "react-router-dom";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/slices/authSlice";

const MainLayout = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  // Handle navigation based on authentication status
  const handleNavigation = (path, requiresAuth = true) => {
    if (requiresAuth && !user) {
      return "/login";
    }
    if (user && requiresAuth) {
      // If user is logged in and path requires auth, redirect to dashboard
      if (user.userType === "company") {
        return "/company/freelancer";
      } else {
        return `/${user.role}`;
      }
    }
    return path;
  };

  // Handle how it works scroll
  const handleHowItWorksClick = (e) => {
    e.preventDefault();
    const howItWorksElement = document.getElementById("how-it-works");
    if (howItWorksElement) {
      howItWorksElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container-custom py-4 flex justify-between items-center">
          <a href="https://www.studieshq.com/" className="flex items-center">
            <img
              src="https://res.cloudinary.com/dzmn9lnk5/image/upload/v1762091880/agile/logos/studieshqwithagilelabs_dt6jbb_c_crop_w_2000_h_700_zfnepb.png"
              alt="StudiesHQ Logo"
              className="h-12"
            />
          </a>

          <nav className="hidden md:flex space-x-8">
            <a href="https://www.studieshq.com/" className="text-gray-600 hover:text-[#3884b8] transition-colors">
              Home
            </a>
            <a href="https://www.studieshq.com/" className="text-gray-600 hover:text-[#3884b8] transition-colors">
              About
            </a>
            <a href="https://www.studieshq.com/" className="text-gray-600 hover:text-[#3884b8] transition-colors">
              Contact Us
            </a>
            <a href="https://www.studieshq.com/" className="text-gray-600 hover:text-[#3884b8] transition-colors">
              Find Freelancers
            </a>
            <a href="https://www.studieshq.com/" className="text-gray-600 hover:text-[#3884b8] transition-colors">
              Find Projects
            </a>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link
                  to={user.userType === "company" ? "/company/freelancer" : `/${user.role}`}
                  className="text-[#3884b8] hover:text-[#0d81c8] transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 border-2 border-[#3884b8] text-[#3884b8] rounded-md hover:bg-[#3884b8] hover:text-white transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 bg-white border border-[#FF017C] text-[#FF017C] rounded-full hover:bg-[#FF017C] hover:text-white transition-colors"
                  style={{ borderColor: "#FF017C" }}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-white rounded-full transition-colors"
                  style={{
                    background: "linear-gradient(to right, #FF017C, #D67BFF)",
                  }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow bg-gray-50">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="container-custom py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-bold text-lg mb-4 text-[#3884b8]">StudiesHQ</h4>
              <p className="text-gray-600 mb-6">The platform connecting quality freelancers with great clients.</p>

              {/* Social Media Icons */}
              <div className="flex space-x-4">
                <a
                  href="https://www.facebook.com/profile.php?id=100093596988195"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-[#3884b8] hover:bg-[#0d81c8] text-white rounded-lg flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>

                <a
                  href="https://x.com/StudiesHQ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-[#3884b8] hover:bg-[#0d81c8] text-white rounded-lg flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>

                <a
                  href="https://www.linkedin.com/company/studies-hq/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-[#3884b8] hover:bg-[#0d81c8] text-white rounded-lg flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>

                <a
                  href="https://www.instagram.com/studies_hq/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-[#3884b8] hover:bg-[#0d81c8] text-white rounded-lg flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4 text-[#3884b8]">For Freelancers</h4>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={handleHowItWorksClick}
                    className="text-gray-600 hover:text-[#3884b8] transition-colors text-left"
                  >
                    How it Works
                  </button>
                </li>
                <li>
                  <Link
                    to={handleNavigation("/freelancer/find-jobs")}
                    className="text-gray-600 hover:text-[#3884b8] transition-colors"
                  >
                    Find Jobs
                  </Link>
                </li>
                {/* <li>
                  <Link to="/pricing" className="text-gray-600 hover:text-[#3884b8] transition-colors">
                    Pricing
                  </Link>
                </li> */}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4 text-[#3884b8]">For Clients</h4>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={handleHowItWorksClick}
                    className="text-gray-600 hover:text-[#3884b8] transition-colors text-left"
                  >
                    How it Works
                  </button>
                </li>
                <li>
                  <Link
                    to={handleNavigation("/client/freelancers")}
                    className="text-gray-600 hover:text-[#3884b8] transition-colors"
                  >
                    Find Freelancers
                  </Link>
                </li>
                <li>
                  <Link
                    to={handleNavigation("/client/jobs")}
                    className="text-gray-600 hover:text-[#3884b8] transition-colors"
                  >
                    Post a Project
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4 text-[#3884b8]">Company</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/about" className="text-gray-600 hover:text-[#3884b8] transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-gray-600 hover:text-[#3884b8] transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">&copy; 2025 StudiesHQ. All rights reserved.</p>
            <div className="mt-4 md:mt-0 flex gap-6">
              <Link to="/terms" className="text-gray-500 text-sm hover:text-[#3884b8] transition-colors">
                Terms
              </Link>
              <Link to="/privacy" className="text-gray-500 text-sm hover:text-[#3884b8] transition-colors">
                Privacy
              </Link>
              <Link to="/security" className="text-gray-500 text-sm hover:text-[#3884b8] transition-colors">
                Security
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
