import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { forgotPassword, clearError, clearForgotPasswordSuccess } from "../redux/slices/authSlice";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const dispatch = useDispatch();
  const { isLoading, error, forgotPasswordSuccess } = useSelector((state) => state.auth);

  useEffect(() => {
    // Clear any previous errors or success states when component mounts
    dispatch(clearError());
    dispatch(clearForgotPasswordSuccess());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      return;
    }

    await dispatch(forgotPassword(email));
  };

  const handleChange = (e) => {
    setEmail(e.target.value);

    // Clear error when user starts typing
    if (error) {
      dispatch(clearError());
    }
  };

  const handleResend = () => {
    dispatch(clearForgotPasswordSuccess());
    dispatch(forgotPassword(email));
  };

  return (
    <div className="container-custom flex justify-center items-center min-h-[calc(100vh-200px)]">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-center mb-2">Forgot Password</h1>
        <p className="text-gray-600 text-center mb-8">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        {forgotPasswordSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p className="mb-2">Password reset email has been sent!</p>
            <p className="text-sm">
              Please check your inbox for a link to reset your password. If you don't see it, check your spam folder.
            </p>
            <button onClick={handleResend} className="text-green-600 hover:underline mt-2 text-sm" disabled={isLoading}>
              {isLoading ? "Sending..." : "Resend email"}
            </button>
          </div>
        )}

        {!forgotPasswordSuccess && (
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter your email address"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark transition-colors"
              disabled={isLoading || !email}
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Remember your password?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
          <p className="mt-2">
            <Link to="/register" className="text-sm text-gray-500 hover:underline">
              Don't have an account? Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
