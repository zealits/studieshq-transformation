import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { resendVerification } from "../redux/slices/authSlice";
import api from "../api/axios";

const EmailVerificationPage = () => {
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get token and email from URL query parameters
        const params = new URLSearchParams(location.search);
        const token = params.get("token");
        const emailParam = params.get("email");

        // If we have a logged-in user but no email param, use their email
        if (user && !emailParam) {
          setEmail(user.email);
        } else if (emailParam) {
          setEmail(emailParam);
        }

        if (token) {
          // Call the API to verify the email
          try {
            await api.get(`/api/auth/verify-email/${token}`);
            // After successful verification, check the status
            const verificationResponse = await api.get(`/api/auth/check-verification/${emailParam || user?.email}`);
            if (verificationResponse.data.isVerified) {
              setStatus("success");
              setMessage("Your email has been successfully verified. You can now log in to your account.");
              return;
            }
          } catch (error) {
            console.error("Error verifying email with token:", error);
          }
        }

        // If we have an email but no token, check verification status
        if (email) {
          try {
            const verificationResponse = await api.get(`/api/auth/check-verification/${email}`);
            if (verificationResponse.data.isVerified) {
              setStatus("success");
              setMessage("Your email has been successfully verified. You can now log in to your account.");
              return;
            }
          } catch (error) {
            console.error("Error checking verification status:", error);
          }
        }

        // If we reach here, either we don't have an email or verification check failed
        setStatus("error");
        setMessage("Please verify your email to access the dashboard. You can request a new verification email below.");
      } catch (error) {
        setStatus("error");
        setMessage(error.response?.data?.error || "Failed to verify your email. Please try again.");
      }
    };

    verifyEmail();
  }, [location, user]);

  const handleResendVerification = async () => {
    if (!email) return;

    setIsResending(true);
    try {
      await dispatch(resendVerification(email));
      setMessage("A new verification email has been sent. Please check your inbox.");
    } catch (error) {
      setMessage("Failed to resend verification email. Please try again.");
    }
    setIsResending(false);
  };

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
              <p className="text-gray-600 mb-6">
                Your email has been successfully verified. You can now log in to your account.
              </p>
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
                className="w-16 h-16 text-yellow-500 mx-auto mb-4"
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
              <h2 className="text-2xl font-bold text-yellow-600 mb-4">Email Verification Required</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center">
                <button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="inline-block bg-primary text-white py-2 px-6 rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {isResending ? "Sending..." : "Resend Verification Email"}
                </button>
                <Link
                  to="/login"
                  className="inline-block bg-gray-200 text-gray-800 py-2 px-6 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Back to Login
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
