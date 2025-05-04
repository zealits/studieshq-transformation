import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyProfile, updateProfile } from "../../redux/slices/profileSlice";

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { data, isLoading, error } = useSelector((state) => state.profile);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // State for form data
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    companyName: "",
    companyWebsite: "",
    industry: "",
    companySize: "",
    bio: "",
    socialLinks: {
      linkedin: "",
      twitter: "",
      facebook: "",
    },
  });

  // State for active tab
  const [activeTab, setActiveTab] = useState("basic");

  // Fetch profile data when component mounts
  useEffect(() => {
    dispatch(fetchMyProfile());
  }, [dispatch]);

  // Update form data when profile is fetched
  useEffect(() => {
    if (data && data.success) {
      // Get the profile from the nested data structure
      const profile = data.data.profile || {};
      console.log("Setting client profile data:", profile);

      setFormData({
        fullName: profile.user?.name || "",
        email: profile.user?.email || "",
        phone: profile.phone || "",
        location: profile.location || "",
        companyName: profile.company || "",
        companyWebsite: profile.companyWebsite || "",
        industry: profile.industry || "",
        companySize: profile.companySize || "",
        bio: profile.bio || "",
        socialLinks: {
          linkedin: profile.social?.linkedin || "",
          twitter: profile.social?.twitter || "",
          facebook: profile.social?.facebook || "",
        },
      });

      // Show success message if this was an update operation
      if (updateSuccess) {
        // Reset success state
        setTimeout(() => {
          setUpdateSuccess(false);
        }, 3000);
      }
    }
  }, [data, updateSuccess]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle nested object changes (for social links)
  const handleNestedChange = (e, parent) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [parent]: {
        ...formData[parent],
        [name]: value,
      },
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting client profile update:", {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      bio: formData.bio,
      location: formData.location,
      company: formData.companyName,
      companyWebsite: formData.companyWebsite,
      industry: formData.industry,
      companySize: formData.companySize,
      social: formData.socialLinks,
      skills: ["Client"], // Adding default skills for the client to meet validation
    });

    dispatch(
      updateProfile({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        bio: formData.bio,
        location: formData.location,
        company: formData.companyName,
        companyWebsite: formData.companyWebsite,
        industry: formData.industry,
        companySize: formData.companySize,
        social: formData.socialLinks,
        skills: ["Client"], // Adding default skills for the client to meet validation
      })
    ).then(() => {
      setUpdateSuccess(true);
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-primary mb-8">Profile Settings</h1>

      {/* Success Message */}
      {updateSuccess && (
        <div
          className="fixed top-24 right-8 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md transition-all duration-500 animate-slideIn z-50"
          role="alert"
        >
          <div className="flex items-center">
            <svg
              className="w-6 h-6 mr-2 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <div>
              <p className="font-bold">Success</p>
              <p>Your profile has been successfully updated.</p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-background-light p-6 rounded-lg shadow-md mb-8 flex flex-col md:flex-row items-center">
        <div className="w-32 h-32 bg-gray-300 rounded-full mb-4 md:mb-0 md:mr-6 flex items-center justify-center text-4xl text-gray-600">
          {formData.fullName.charAt(0)}
        </div>
        <div>
          <h2 className="text-2xl font-semibold">{formData.fullName}</h2>
          <p className="text-gray-600 mb-1">{formData.location}</p>
          <p className="text-primary font-semibold">{formData.companyName}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2" onClick={() => setActiveTab("basic")}>
            <button
              className={`inline-block p-4 ${
                activeTab === "basic" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Basic Information
            </button>
          </li>
          <li className="mr-2" onClick={() => setActiveTab("company")}>
            <button
              className={`inline-block p-4 ${
                activeTab === "company" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Company Details
            </button>
          </li>
          <li className="mr-2" onClick={() => setActiveTab("security")}>
            <button
              className={`inline-block p-4 ${
                activeTab === "security"
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Security
            </button>
          </li>
        </ul>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit}>
        {/* Basic Information Tab */}
        {activeTab === "basic" && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="fullName">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2" htmlFor="phone">
                  Phone
                </label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2" htmlFor="location">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-gray-700 mb-2" htmlFor="bio">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="4"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Social Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="linkedin">
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    id="linkedin"
                    name="linkedin"
                    value={formData.socialLinks.linkedin}
                    onChange={(e) => handleNestedChange(e, "socialLinks")}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="twitter">
                    Twitter
                  </label>
                  <input
                    type="url"
                    id="twitter"
                    name="twitter"
                    value={formData.socialLinks.twitter}
                    onChange={(e) => handleNestedChange(e, "socialLinks")}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="facebook">
                    Facebook
                  </label>
                  <input
                    type="url"
                    id="facebook"
                    name="facebook"
                    value={formData.socialLinks.facebook}
                    onChange={(e) => handleNestedChange(e, "socialLinks")}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Company Details Tab */}
        {activeTab === "company" && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="companyName">
                  Company Name
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2" htmlFor="companyWebsite">
                  Company Website
                </label>
                <input
                  type="url"
                  id="companyWebsite"
                  name="companyWebsite"
                  value={formData.companyWebsite}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2" htmlFor="industry">
                  Industry
                </label>
                <select
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Technology">Technology</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                  <option value="Finance">Finance</option>
                  <option value="Retail">Retail</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2" htmlFor="companySize">
                  Company Size
                </label>
                <select
                  id="companySize"
                  name="companySize"
                  value={formData.companySize}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="50-100">50-100 employees</option>
                  <option value="101-500">101-500 employees</option>
                  <option value="500+">500+ employees</option>
                </select>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-gray-700 mb-2" htmlFor="companyLogo">
                  Company Logo
                </label>
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-md mr-4 flex items-center justify-center text-gray-400">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <button type="button" className="btn-outline">
                    Upload New Logo
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">Recommended size: 200x200px. Max file size: 2MB.</p>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Change Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="currentPassword">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="newPassword">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="confirmPassword">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <button type="button" className="btn-primary mt-2">
                  Update Password
                </button>
              </div>
            </div>

            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">Two-Factor Authentication</h3>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Protect your account with 2FA</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Add an extra layer of security to your account by requiring both your password and a verification
                    code from your mobile device.
                  </p>
                </div>
                <button type="button" className="btn-outline">
                  Enable 2FA
                </button>
              </div>
            </div>

            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4 text-red-600">Danger Zone</h3>
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <p className="font-medium text-red-700">Delete Account</p>
                  <p className="text-sm text-red-600 mt-1">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                </div>
                <button type="button" className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        {(activeTab === "basic" || activeTab === "company") && (
          <div className="mt-8">
            <button type="submit" className="btn-primary px-6 py-3 rounded-md">
              Save Changes
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ProfilePage;
