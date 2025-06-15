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

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container-custom py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <img
              src="https://res.cloudinary.com/dzmn9lnk5/image/upload/v1720717646/agile/logos/STUDIES-HQ_qkotcf.png"
              alt="StudiesHQ Logo"
              className="h-12"
            />
          </Link>

          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-600 hover:text-[#3884b8] transition-colors">
              Home
            </Link>
            <Link to="/about" className="text-gray-600 hover:text-[#3884b8] transition-colors">
              About
            </Link>
            <Link to="/contact" className="text-gray-600 hover:text-[#3884b8] transition-colors">
              Contact Us
            </Link>
            <Link to="client/freelancers" className="text-gray-600 hover:text-[#3884b8] transition-colors">
              Find Freelancers
            </Link>
            <Link to="freelancer/find-jobs" className="text-gray-600 hover:text-[#3884b8] transition-colors">
              Find Jobs
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to={`/${user.role}`} className="text-[#3884b8] hover:text-[#0d81c8] transition-colors">
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
                <Link to="/login" className="text-[#3884b8] hover:text-[#0d81c8] transition-colors">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-[#3884b8] text-white rounded-md hover:bg-[#0d81c8] transition-colors"
                >
                  Join Free
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
              <p className="text-gray-600">The platform connecting quality freelancers with great clients.</p>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4 text-[#3884b8]">For Freelancers</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/freelancers/how-it-works" className="text-gray-600 hover:text-[#3884b8] transition-colors">
                    How it Works
                  </Link>
                </li>
                <li>
                  <Link to="/freelancer/find-jobs" className="text-gray-600 hover:text-[#3884b8] transition-colors">
                    Find Jobs
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="text-gray-600 hover:text-[#3884b8] transition-colors">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4 text-[#3884b8]">For Clients</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/clients/how-it-works" className="text-gray-600 hover:text-[#3884b8] transition-colors">
                    How it Works
                  </Link>
                </li>
                <li>
                  <Link to="/client/freelancers" className="text-gray-600 hover:text-[#3884b8] transition-colors">
                    Find Freelancers
                  </Link>
                </li>
                <li>
                  <Link to="/clients/post-job" className="text-gray-600 hover:text-[#3884b8] transition-colors">
                    Post a Job
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
                <li>
                  <Link to="/blog" className="text-gray-600 hover:text-[#3884b8] transition-colors">
                    Blog
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
