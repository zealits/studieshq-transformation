import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyProfile, updateProfile } from "../../redux/slices/profileSlice";
import { uploadProfileImage } from "../../redux/slices/uploadSlice";
import { toast } from "react-toastify";
import VerificationBadge from "../../components/VerificationBadge";

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { data, isLoading, error } = useSelector((state) => state.profile);
  const { loading: uploadLoading, error: uploadError, success: uploadSuccess } = useSelector((state) => state.upload);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showImageConfirm, setShowImageConfirm] = useState(false);

  // State for form data
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: {
      countryCode: "+91", // Default to India
      number: "",
    },
    location: "",
    companyName: "",
    companyWebsite: "",
    industry: "",
    companySize: "",
    itinEin: "",
    bio: "",
    verificationDocuments: {
      addressProof: {
        type: "",
        documentUrl: "",
        status: "pending",
        file: null,
      },
      identityProof: {
        type: "",
        documentUrl: "",
        status: "pending",
        file: null,
      },
    },
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
        phone: {
          countryCode: profile.phone?.countryCode || "+91",
          number: profile.phone?.number || "",
        },
        location: profile.location || "",
        companyName: profile.company || "",
        companyWebsite: profile.companyWebsite || "",
        industry: profile.industry || "",
        companySize: profile.companySize || "",
        itinEin: profile.itinEin || "",
        bio: profile.bio || "",
        verificationDocuments: {
          addressProof: {
            type: profile.verificationDocuments?.addressProof?.type || "",
            documentUrl: profile.verificationDocuments?.addressProof?.documentUrl || "",
            status: profile.verificationDocuments?.addressProof?.status || "pending",
            file: null,
          },
          identityProof: {
            type: profile.verificationDocuments?.identityProof?.type || "",
            documentUrl: profile.verificationDocuments?.identityProof?.documentUrl || "",
            status: profile.verificationDocuments?.identityProof?.status || "pending",
            file: null,
          },
        },
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

    // Handle phone number changes
    if (name === "phone.countryCode" || name === "phone.number") {
      setFormData({
        ...formData,
        phone: {
          ...formData.phone,
          [name.split(".")[1]]: value,
        },
      });
      return;
    }

    // Handle verification document type changes
    if (name.startsWith("verificationDocuments.")) {
      const [_, documentType, field] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        verificationDocuments: {
          ...prev.verificationDocuments,
          [documentType]: {
            ...prev.verificationDocuments[documentType],
            [field]: value,
          },
        },
      }));
      return;
    }

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

  // Handle document selection
  const handleDocumentSelect = (e, documentType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type (only JPG, PNG, JPEG)
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload only JPG, JPEG, or PNG files for verification documents");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    // Update form data with selected file
    setFormData((prev) => ({
      ...prev,
      verificationDocuments: {
        ...prev.verificationDocuments,
        [documentType]: {
          ...prev.verificationDocuments[documentType],
          file: file,
        },
      },
    }));
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    try {
      const result = await dispatch(uploadProfileImage(file)).unwrap();
      if (result.success) {
        toast.success("Profile image updated successfully");
        // Refresh profile data
        dispatch(fetchMyProfile());
      }
    } catch (err) {
      toast.error(err.message || "Failed to upload image");
    }
    setShowImageConfirm(false);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting client profile update:", formData);

    try {
      const result = await dispatch(
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
          itinEin: formData.itinEin,
          social: formData.socialLinks,
          verificationDocuments: formData.verificationDocuments,
          skills: ["Client"], // Adding default skills for the client to meet validation
        })
      ).unwrap();

      if (result.success) {
        setUpdateSuccess(true);
        setIsEditing(false);
        // Refresh profile data
        dispatch(fetchMyProfile());
      }
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
    }
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
      <div className="bg-background-light p-6 rounded-lg shadow-md mb-8 flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center">
          <div className="relative mb-4 md:mb-0 md:mr-6">
            <div className="w-32 h-32 bg-gray-300 rounded-full flex items-center justify-center text-4xl text-gray-600 overflow-hidden">
              {data?.data?.profile?.user?.avatar ? (
                <img
                  src={data.data.profile.user.avatar}
                  alt={formData.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                formData.fullName.charAt(0)
              )}
            </div>
            {data?.data?.profile?.isVerified && data?.data?.profile?.verificationStatus === "verified" && (
              <div className="absolute -top-2 -right-2">
                <VerificationBadge size="large" showText={false} />
              </div>
            )}
            {isEditing && (
              <label
                htmlFor="profile-image"
                className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600"
                onClick={(e) => {
                  e.preventDefault();
                  setShowImageConfirm(true);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </label>
            )}
            <input
              type="file"
              id="profile-image"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadLoading || !isEditing}
            />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{formData.fullName}</h2>
            <p className="text-gray-600 mb-1">{formData.location}</p>
            <p className="text-primary font-semibold">{formData.companyName}</p>
            {data?.data?.profile?.isVerified && data?.data?.profile?.verificationStatus === "verified" && (
              <div className="flex items-center mt-2">
                <VerificationBadge />
                {data?.data?.profile?.verificationDate && (
                  <span className="text-xs text-gray-500 ml-2">
                    (Verified on {new Date(data.data.profile.verificationDate).toLocaleDateString()})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="mt-4 md:mt-0 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
        >
          {isEditing ? "Cancel" : "Edit Profile"}
        </button>
      </div>

      {/* Image Upload Confirmation Modal */}
      {showImageConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Change Profile Image</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to change your profile image?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowImageConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <label
                htmlFor="profile-image"
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark cursor-pointer"
              >
                Change Image
              </label>
            </div>
          </div>
        </div>
      )}

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
          <li className="mr-2" onClick={() => setActiveTab("verification")}>
            <button
              className={`inline-block p-4 ${
                activeTab === "verification"
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Verification
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
                  disabled={!isEditing}
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
                  disabled={true}
                  className="w-full p-3 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2" htmlFor="phone">
                  Phone Number
                </label>
                <div className="flex">
                  <div className="relative">
                    <select
                      id="phone.countryCode"
                      name="phone.countryCode"
                      value={formData.phone.countryCode}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="appearance-none bg-white border border-gray-300 rounded-l-md px-3 py-3 pr-8 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                    >
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+61">🇦🇺 +61</option>
                      <option value="+33">🇫🇷 +33</option>
                      <option value="+49">🇩🇪 +49</option>
                      <option value="+81">🇯🇵 +81</option>
                      <option value="+86">🇨🇳 +86</option>
                      <option value="+7">🇷🇺 +7</option>
                      <option value="+55">🇧🇷 +55</option>
                      <option value="+34">🇪🇸 +34</option>
                      <option value="+39">🇮🇹 +39</option>
                      <option value="+31">🇳🇱 +31</option>
                      <option value="+46">🇸🇪 +46</option>
                      <option value="+47">🇳🇴 +47</option>
                      <option value="+45">🇩🇰 +45</option>
                      <option value="+358">🇫🇮 +358</option>
                      <option value="+41">🇨🇭 +41</option>
                      <option value="+43">🇦🇹 +43</option>
                      <option value="+32">🇧🇪 +32</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                  <input
                    type="tel"
                    id="phone.number"
                    name="phone.number"
                    value={formData.phone.number}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="flex-1 p-3 border border-gray-300 border-l-0 rounded-r-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100"
                    placeholder="Enter phone number"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Your business contact number for professional communication
                </p>
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
                  disabled={!isEditing}
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
                  disabled={!isEditing}
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
                    disabled={!isEditing}
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
                    disabled={!isEditing}
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
                    disabled={!isEditing}
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
                  disabled={!isEditing}
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
                  disabled={!isEditing}
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
                  disabled={!isEditing}
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
                  disabled={!isEditing}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select company size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="50-100">50-100 employees</option>
                  <option value="101-500">101-500 employees</option>
                  <option value="500+">500+ employees</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2" htmlFor="itinEin">
                  ITIN/EIN Number
                </label>
                <input
                  type="text"
                  id="itinEin"
                  name="itinEin"
                  value={formData.itinEin}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter your ITIN or EIN number"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Individual Taxpayer Identification Number (ITIN) or Employer Identification Number (EIN)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Verification Tab */}
        {activeTab === "verification" && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Verification Documents</h3>
            <p className="text-gray-600 mb-6">
              Please select document types and files. Only JPG, JPEG, and PNG files are allowed for verification
              documents.
            </p>

            <div className="space-y-8">
              {/* Address Proof Section */}
              <div className="border rounded-lg p-6">
                <h4 className="text-lg font-medium mb-4">Address Proof</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Document Type</label>
                    <select
                      name="verificationDocuments.addressProof.type"
                      value={formData.verificationDocuments.addressProof.type}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select document type</option>
                      <option value="electricity_bill">Electricity Bill</option>
                      <option value="gas_bill">Gas Bill</option>
                      <option value="water_bill">Water Bill</option>
                      <option value="bank_statement">Bank Statement</option>
                      <option value="rent_agreement">Rent Agreement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Upload Document</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={(e) => handleDocumentSelect(e, "addressProof")}
                        disabled={!isEditing || !formData.verificationDocuments.addressProof.type}
                        className="hidden"
                        id="address-proof-upload"
                      />
                      <label
                        htmlFor="address-proof-upload"
                        className={`px-4 py-2 rounded-md cursor-pointer ${
                          isEditing && formData.verificationDocuments.addressProof.type
                            ? "bg-primary text-white hover:bg-primary-dark"
                            : "bg-gray-200 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        Choose File
                      </label>
                      {formData.verificationDocuments.addressProof.file && (
                        <span className="text-sm text-gray-600">
                          {formData.verificationDocuments.addressProof.file.name}
                        </span>
                      )}
                      {formData.verificationDocuments.addressProof.documentUrl && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Document uploaded</span>
                          <a
                            href={formData.verificationDocuments.addressProof.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            View Document
                          </a>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Accepted formats: JPG, JPEG, PNG (max 5MB)</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status:</span>
                    <span
                      className={`text-sm ${
                        formData.verificationDocuments.addressProof.status === "approved"
                          ? "text-green-600"
                          : formData.verificationDocuments.addressProof.status === "rejected"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {formData.verificationDocuments.addressProof.status.charAt(0).toUpperCase() +
                        formData.verificationDocuments.addressProof.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Identity Proof Section */}
              <div className="border rounded-lg p-6">
                <h4 className="text-lg font-medium mb-4">Identity Proof</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Document Type</label>
                    <select
                      name="verificationDocuments.identityProof.type"
                      value={formData.verificationDocuments.identityProof.type}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select document type</option>
                      <option value="passport">Passport</option>
                      <option value="driving_license">Driving License</option>
                      <option value="national_id">National ID Card</option>
                      <option value="aadhar_card">Aadhar Card (India)</option>
                      <option value="pan_card">PAN Card (India)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Upload Document</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={(e) => handleDocumentSelect(e, "identityProof")}
                        disabled={!isEditing || !formData.verificationDocuments.identityProof.type}
                        className="hidden"
                        id="identity-proof-upload"
                      />
                      <label
                        htmlFor="identity-proof-upload"
                        className={`px-4 py-2 rounded-md cursor-pointer ${
                          isEditing && formData.verificationDocuments.identityProof.type
                            ? "bg-primary text-white hover:bg-primary-dark"
                            : "bg-gray-200 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        Choose File
                      </label>
                      {formData.verificationDocuments.identityProof.file && (
                        <span className="text-sm text-gray-600">
                          {formData.verificationDocuments.identityProof.file.name}
                        </span>
                      )}
                      {formData.verificationDocuments.identityProof.documentUrl && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Document uploaded</span>
                          <a
                            href={formData.verificationDocuments.identityProof.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            View Document
                          </a>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Accepted formats: JPG, JPEG, PNG (max 5MB)</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status:</span>
                    <span
                      className={`text-sm ${
                        formData.verificationDocuments.identityProof.status === "approved"
                          ? "text-green-600"
                          : formData.verificationDocuments.identityProof.status === "rejected"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {formData.verificationDocuments.identityProof.status.charAt(0).toUpperCase() +
                        formData.verificationDocuments.identityProof.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        {isEditing && (
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
