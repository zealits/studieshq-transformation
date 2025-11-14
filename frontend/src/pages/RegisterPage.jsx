import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { register, clearError, clearRegistrationSuccess } from "../redux/slices/authSlice";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "freelancer",
    userType: "individual",
    companyType: "",
    company: {
      businessName: "",
    },
    agreeToTerms: false,
  });

  const [passwordError, setPasswordError] = useState("");
  const [termsError, setTermsError] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, registrationSuccess, user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Clear registration success status when component unmounts
    return () => {
      dispatch(clearRegistrationSuccess());
    };
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle nested company fields
    if (name.startsWith("company.")) {
      const field = name.split(".")[1];
      setFormData({
        ...formData,
        company: {
          ...formData.company,
          [field]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });
    }

    if (error) {
      dispatch(clearError());
    }

    if (name === "password" || name === "confirmPassword") {
      setPasswordError("");
    }

    if (name === "agreeToTerms") {
      setTermsError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    if (!formData.agreeToTerms) {
      setTermsError("You must agree to the terms and conditions to proceed");
      return;
    }

    const { name, email, password, role, userType, companyType, company } = formData;

    // Prepare registration data based on user type
    const registrationData = {
      name,
      email,
      password,
      userType,
    };

    // Add role only for individual users
    if (userType === "individual") {
      registrationData.role = role;
    }

    // Add company-specific data if userType is company
    if (userType === "company") {
      registrationData.companyType = companyType;
      registrationData.company = company;
    }

    await dispatch(register(registrationData));
  };

  if (registrationSuccess) {
    return (
      <div className="container-custom py-12">
        <div className="w-full max-w-lg mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
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
            <h2 className="text-2xl font-bold text-green-600 mb-4">Registration Successful!</h2>
            <p className="text-gray-600 mb-6">
              We've sent a verification email to <strong>{formData.email}</strong>. Please check your inbox and verify
              your email address to activate your account.
            </p>
            <p className="text-gray-500 mb-8">If you don't see the email, please check your spam folder.</p>
            <Link
              to="/login"
              className="inline-block bg-primary text-white py-2 px-6 rounded-md hover:bg-primary-dark transition-colors"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-12">
      <div className="w-full max-w-lg mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-center mb-8">Create an Account</h1>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* User Type Selection */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-3">I want to register as:</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="userType"
                  value="individual"
                  checked={formData.userType === "individual"}
                  onChange={handleChange}
                  className="mr-2"
                />
                Individual
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="userType"
                  value="company"
                  checked={formData.userType === "company"}
                  onChange={handleChange}
                  className="mr-2"
                />
                Company
              </label>
            </div>
          </div>

          {/* Company Type Selection (only show if userType is company) */}
          {formData.userType === "company" && (
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-3">Company Type:</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="companyType"
                    value="freelancer_company"
                    checked={formData.companyType === "freelancer_company"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Freelancer Company (Agency)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="companyType"
                    value="project_sponsor_company"
                    checked={formData.companyType === "project_sponsor_company"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Project Sponsor Organization
                </label>
              </div>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
              {formData.userType === "company" ? "Contact Person Name" : "Full Name"}
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
              minLength={8}
            />
            <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
          </div>

          <div className="mb-4">
            <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                passwordError ? "border-red-500" : "border-gray-300"
              }`}
              required
            />
            {passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}
          </div>

          {/* Role Selection (only show for individual users) */}
          {formData.userType === "individual" && (
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">I am a:</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="freelancer"
                    checked={formData.role === "freelancer"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Freelancer
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="client"
                    checked={formData.role === "client"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Client
                </label>
              </div>
            </div>
          )}

          {/* Company Name Field (only show if userType is company) */}
          {formData.userType === "company" && (
            <div className="mb-6">
              <label htmlFor="company.businessName" className="block text-gray-700 font-medium mb-2">
                {formData.companyType === "freelancer_company"
                  ? "Company/Agency Name *"
                  : formData.companyType === "project_sponsor_company"
                  ? "Organization/Company Name *"
                  : "Company/Organization Name *"}
              </label>
              <input
                type="text"
                id="company.businessName"
                name="company.businessName"
                value={formData.company.businessName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
                placeholder={
                  formData.companyType === "freelancer_company"
                    ? "Enter your company or agency name"
                    : formData.companyType === "project_sponsor_company"
                    ? "Enter your organization or company name"
                    : "Enter company or organization name"
                }
              />
            </div>
          )}

          {/* Terms and Conditions Disclaimer */}
          <div className="mb-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Disclaimer & Liability Waiver</h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-3">
                StudiesHQ acts solely as a facilitator and is not responsible for the performance, quality, or outcome
                of any project between clients and freelancers. All agreements, deliverables, and payments are strictly
                between the respective parties.
              </p>
              <p className="text-xs text-gray-600 leading-relaxed">
                By agreeing to these terms, you indemnify StudiesHQ and AgileLabs.ai from any disputes, claims, or legal
                matters arising from transactions or interactions between users.
              </p>
            </div>

            <label className="flex items-start">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className={`mt-1 mr-3 ${termsError ? "border-red-500" : ""}`}
                required
              />
              <span className="text-sm text-gray-700 leading-relaxed">
                I acknowledge that I have read and agree to the{" "}
                <Link to="/terms" className="text-primary hover:underline" target="_blank">
                  Terms and Conditions
                </Link>
                ,{" "}
                <Link to="/privacy" className="text-primary hover:underline" target="_blank">
                  Privacy Policy
                </Link>
                , and the liability waiver stated above.
              </span>
            </label>
            {termsError && <p className="text-red-500 text-xs mt-2">{termsError}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark transition-colors"
            disabled={isLoading || !formData.agreeToTerms}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
