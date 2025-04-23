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
      <header className="bg-white shadow-sm">
        <div className="container-custom py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <img 
              src="https://res.cloudinary.com/dzmn9lnk5/image/upload/v1720717646/agile/logos/STUDIES-HQ_qkotcf.png"
              alt="StudiesHQ Logo"
              className="h-12" 
            />
          </Link>

          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-600 hover:text-primary">
              Home
            </Link>
            <Link to="/about" className="text-gray-600 hover:text-primary">
              About
            </Link>
            <Link to="client/freelancers" className="text-gray-600 hover:text-primary">
              Find Freelancers
            </Link>
            <Link to="freelancer/find-jobs" className="text-gray-600 hover:text-primary">
              Find Jobs
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to={`/${user.role}`} className="text-primary hover:text-primary-dark">
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="btn-outline">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-primary hover:text-primary-dark">
                  Login
                </Link>
                <Link to="/register" className="btn-primary">
                  Join Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow bg-background-light">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="container-custom py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-bold text-lg mb-4">StudiesHQ</h4>
              <p className="text-gray-600">The platform connecting quality freelancers with great clients.</p>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">For Freelancers</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/freelancers/how-it-works" className="text-gray-600 hover:text-primary">
                    How it Works
                  </Link>
                </li>
                <li>
                  <Link to="/freelancer/find-jobs" className="text-gray-600 hover:text-primary">
                    Find Jobs
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="text-gray-600 hover:text-primary">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">For Clients</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/clients/how-it-works" className="text-gray-600 hover:text-primary">
                    How it Works
                  </Link>
                </li>
                <li>
                  <Link to="/client/freelancers" className="text-gray-600 hover:text-primary">
                    Find Freelancers
                  </Link>
                </li>
                <li>
                  <Link to="/clients/post-job" className="text-gray-600 hover:text-primary">
                    Post a Job
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/about" className="text-gray-600 hover:text-primary">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-gray-600 hover:text-primary">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="text-gray-600 hover:text-primary">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">&copy; 2025 StudiesHQ. All rights reserved.</p>
            <div className="mt-4 md:mt-0 flex gap-4">
              <Link to="/terms" className="text-gray-500 text-sm hover:text-primary">
                Terms
              </Link>
              <Link to="/privacy" className="text-gray-500 text-sm hover:text-primary">
                Privacy
              </Link>
              <Link to="/security" className="text-gray-500 text-sm hover:text-primary">
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
