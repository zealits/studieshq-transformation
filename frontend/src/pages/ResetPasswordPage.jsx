import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { resetPassword, clearError, clearResetPasswordSuccess } from "../redux/slices/authSlice";

const ResetPasswordPage = () => {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [localError, setLocalError] = useState("");
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, resetPasswordSuccess } = useSelector((state) => state.auth);

  const token = searchParams.get("token");

  useEffect(() => {
    // Clear any previous errors or success states when component mounts
    dispatch(clearError());
    dispatch(clearResetPasswordSuccess());

    // If no token, redirect to forgot password page
    if (!token) {
      navigate("/forgot-password");
    }
  }, [dispatch, token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear any local errors
    setLocalError("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setLocalError("Password must be at least 6 characters long");
      return;
    }

    await dispatch(resetPassword({ token, password: formData.password }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear errors when user starts typing
    if (error) {
      dispatch(clearError());
    }
    if (localError) {
      setLocalError("");
    }
  };

  // Redirect to login after successful password reset
  useEffect(() => {
    if (resetPasswordSuccess) {
      const timer = setTimeout(() => {
        navigate("/login");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [resetPasswordSuccess, navigate]);

  return (
    <div className="container-custom flex justify-center items-center min-h-[calc(100vh-200px)]">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-center mb-2">Reset Password</h1>
        <p className="text-gray-600 text-center mb-8">Enter your new password below.</p>

        {(error || localError) && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error || localError}
          </div>
        )}

        {resetPasswordSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p className="mb-2">Password reset successful!</p>
            <p className="text-sm">
              Your password has been updated. You will be redirected to the login page in a few seconds...
            </p>
          </div>
        )}

        {!resetPasswordSuccess && (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
                New Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter your new password"
                required
                minLength={6}
              />
            </div>

            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Confirm your new password"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark transition-colors"
              disabled={isLoading || !formData.password || !formData.confirmPassword}
            >
              {isLoading ? "Resetting..." : "Reset Password"}
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
            <Link to="/forgot-password" className="text-sm text-gray-500 hover:underline">
              Need another reset link?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
