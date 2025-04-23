import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import api from "../api/axios";

const EmailVerificationPage = () => {
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get token from URL query parameters
        const params = new URLSearchParams(location.search);
        const token = params.get("token");

        if (!token) {
          setStatus("error");
          setMessage("Verification token is missing.");
          return;
        }

        // Call the API to verify the email
        const response = await api.get(`/api/auth/verify-email/${token}`);

        setStatus("success");
        setMessage(response.data.message || "Your email has been successfully verified. You can now log in.");
      } catch (error) {
        setStatus("error");
        setMessage(error.response?.data?.error || "Failed to verify your email. The token may be invalid or expired.");
      }
    };

    verifyEmail();
  }, [location]);

  return (
    <div className="container-custom py-12">
      <div className="w-full max-w-lg mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          {status === "verifying" && (
            <>
              <div className="flex justify-center mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
              <h2 className="text-2xl font-bold mb-4">Verifying Your Email</h2>
              <p className="text-gray-600">Please wait while we verify your email address...</p>
            </>
          )}

          {status === "success" && (
            <>
              <svg
                className="w-16 h-16 text-green-500 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-2xl font-bold text-green-600 mb-4">Email Verified!</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <Link
                to="/login"
                className="inline-block bg-primary text-white py-2 px-6 rounded-md hover:bg-primary-dark transition-colors"
              >
                Go to Login
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <svg
                className="w-16 h-16 text-red-500 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-2xl font-bold text-red-600 mb-4">Verification Failed</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center">
                <Link
                  to="/login"
                  className="inline-block bg-primary text-white py-2 px-6 rounded-md hover:bg-primary-dark transition-colors"
                >
                  Go to Login
                </Link>
                <Link
                  to="/register"
                  className="inline-block bg-gray-200 text-gray-800 py-2 px-6 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Register Again
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
