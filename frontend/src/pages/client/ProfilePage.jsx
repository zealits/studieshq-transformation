import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyProfile, updateProfile } from "../../redux/slices/profileSlice";
import { uploadProfileImage } from "../../redux/slices/uploadSlice";
import { toast } from "react-toastify";
import VerificationBadge from "../../components/VerificationBadge";
import OTPVerification from "../../components/OTPVerification";
import api from "../../api/axios";
import { Country, State, City } from "country-state-city";

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { data, isLoading, error } = useSelector((state) => state.profile);
  const { loading: uploadLoading, error: uploadError, success: uploadSuccess } = useSelector((state) => state.upload);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showImageConfirm, setShowImageConfirm] = useState(false);

  // OTP verification states
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [phoneVerificationStatus, setPhoneVerificationStatus] = useState({
    isVerified: false,
    verifiedAt: null,
  });

  // State for form data
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: {
      countryCode: "+91", // Default to India
      number: "",
    },
    address: {
      line1: "",
      line2: "",
      country: "",
      countryCode: "",
      city: "",
      state: "",
      stateCode: "",
      postalCode: "",
    },
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

  // State for address dropdowns
  const [availableStates, setAvailableStates] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);

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

      // Derive countryCode from country name if countryCode is missing
      let countryCode = profile.address?.countryCode || "";
      if (!countryCode && profile.address?.country) {
        const foundCountry = Country.getAllCountries().find(
          (c) => c.name.toLowerCase() === profile.address.country.toLowerCase()
        );
        if (foundCountry) {
          countryCode = foundCountry.isoCode;
        }
      }

      // Derive stateCode from state name if stateCode is missing
      let stateCode = profile.address?.stateCode || "";
      if (!stateCode && profile.address?.state && countryCode) {
        const states = State.getStatesOfCountry(countryCode);
        const foundState = states.find(
          (s) => s.name.toLowerCase() === profile.address.state.toLowerCase()
        );
        if (foundState) {
          stateCode = foundState.isoCode;
        }
      }

      setFormData({
        fullName: profile.user?.name || "",
        email: profile.user?.email || "",
        phone: {
          countryCode: profile.phone?.countryCode || "+91",
          number: profile.phone?.number || "",
          isVerified: profile.phone?.isVerified || false,
          verifiedAt: profile.phone?.verifiedAt || null,
        },
        address: {
          line1: profile.address?.line1 || "",
          line2: profile.address?.line2 || "",
          country: profile.address?.country || "",
          countryCode: countryCode,
          city: profile.address?.city || "",
          state: profile.address?.state || "",
          stateCode: stateCode,
          postalCode: profile.address?.postalCode || "",
        },
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

      // Load states and cities if address data exists
      if (countryCode) {
        const states = State.getStatesOfCountry(countryCode);
        setAvailableStates(states || []);
        
        if (stateCode) {
          const cities = City.getCitiesOfState(countryCode, stateCode);
          setAvailableCities(cities || []);
        }
      }

      // Update phone verification status
      setPhoneVerificationStatus({
        isVerified: profile.phone?.isVerified || false,
        verifiedAt: profile.phone?.verifiedAt || null,
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

  // Load states when country changes
  useEffect(() => {
    if (formData.address.countryCode) {
      const states = State.getStatesOfCountry(formData.address.countryCode);
      setAvailableStates(states || []);
      setAvailableCities([]); // Clear cities when country changes
    } else {
      setAvailableStates([]);
      setAvailableCities([]);
    }
  }, [formData.address.countryCode]);

  // Load cities when state changes
  useEffect(() => {
    if (formData.address.countryCode && formData.address.stateCode) {
      const cities = City.getCitiesOfState(formData.address.countryCode, formData.address.stateCode);
      setAvailableCities(cities || []);
    } else {
      setAvailableCities([]);
    }
  }, [formData.address.countryCode, formData.address.stateCode]);

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

    // Handle address field changes
    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setFormData((prev) => {
        const newAddress = {
          ...prev.address,
          [addressField]: value,
        };

        // When country code is selected, also set the country name
        if (addressField === "countryCode" && value) {
          const selectedCountry = Country.getCountryByCode(value);
          if (selectedCountry) {
            newAddress.country = selectedCountry.name;
          }
        }

        // When state code is selected, also set the state name
        if (addressField === "stateCode" && value && prev.address.countryCode) {
          const selectedState = State.getStateByCodeAndCountry(value, prev.address.countryCode);
          if (selectedState) {
            newAddress.state = selectedState.name;
          }
        }

        // Clear dependent fields when country changes
        if (addressField === "country" || addressField === "countryCode") {
          newAddress.state = "";
          newAddress.stateCode = "";
          newAddress.city = "";
          setAvailableStates([]);
          setAvailableCities([]);
        }

        // Clear city when state changes
        if (addressField === "state" || addressField === "stateCode") {
          newAddress.city = "";
          setAvailableCities([]);
        }

        return {
          ...prev,
          address: newAddress,
        };
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
          address: formData.address,
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

  // OTP verification handlers
  const handleVerifyPhone = () => {
    if (!formData.phone.countryCode || !formData.phone.number) {
      toast.error("Please enter a valid phone number first");
      return;
    }
    setShowOTPModal(true);
  };

  const handleOTPVerificationSuccess = async (data) => {
    try {
      // Update local state
      setPhoneVerificationStatus({
        isVerified: true,
        verifiedAt: data.data.verifiedAt,
      });

      // Update form data
      setFormData((prev) => ({
        ...prev,
        phone: {
          ...prev.phone,
          isVerified: true,
          verifiedAt: data.data.verifiedAt,
        },
      }));

      // Refresh profile data to get the updated verification status
      dispatch(fetchMyProfile());

      setShowOTPModal(false);
      toast.success("Phone number verified successfully!");
    } catch (error) {
      console.error("OTP verification success handler error:", error);
    }
  };

  const handleOTPCancel = () => {
    setShowOTPModal(false);
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
            {formData.address.city && formData.address.country && (
              <p className="text-gray-600 mb-1">{formData.address.city}, {formData.address.country}</p>
            )}
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

                {/* Phone verification status and button */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center">
                    {phoneVerificationStatus.isVerified ? (
                      <div className="flex items-center text-green-600">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-xs">Verified</span>
                        {phoneVerificationStatus.verifiedAt && (
                          <span className="text-xs text-gray-500 ml-1">
                            on {new Date(phoneVerificationStatus.verifiedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center text-yellow-600">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-xs">Not verified</span>
                      </div>
                    )}
                  </div>

                  {!phoneVerificationStatus.isVerified && formData.phone.number && (
                    <button
                      type="button"
                      onClick={handleVerifyPhone}
                      className="text-xs bg-primary text-white px-3 py-1 rounded-md hover:bg-primary-dark transition-colors"
                    >
                      Verify Phone
                    </button>
                  )}
                </div>

                <p className="text-xs text-gray-500 mt-1">
                  Your business contact number for professional communication
                </p>
              </div>

              {/* Address Fields */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-gray-700 mb-2">Address</label>
                <div className="space-y-4">
                  {/* Address Line 1 */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-1" htmlFor="address.line1">
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      id="address.line1"
                      name="address.line1"
                      value={formData.address.line1}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                      placeholder="Street address, P.O. box"
                    />
                  </div>

                  {/* Address Line 2 */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-1" htmlFor="address.line2">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      id="address.line2"
                      name="address.line2"
                      value={formData.address.line2}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                      placeholder="Apartment, suite, unit, building, floor, etc."
                    />
                  </div>

                  {/* Country, State, City Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Country */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-1" htmlFor="address.countryCode">
                        Country
                      </label>
                      <select
                        id="address.countryCode"
                        name="address.countryCode"
                        value={formData.address.countryCode}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                      >
                        <option value="">Select Country</option>
                        {Country.getAllCountries().map((country) => (
                          <option key={country.isoCode} value={country.isoCode}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* State/Province */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-1" htmlFor="address.stateCode">
                        State/Province
                      </label>
                      {availableStates.length > 0 ? (
                        <select
                          id="address.stateCode"
                          name="address.stateCode"
                          value={formData.address.stateCode}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                        >
                          <option value="">Select State</option>
                          {availableStates.map((state) => (
                            <option key={state.isoCode} value={state.isoCode}>
                              {state.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          id="address.state"
                          name="address.state"
                          value={formData.address.state}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                          placeholder="State/Province"
                        />
                      )}
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-1" htmlFor="address.city">
                        City
                      </label>
                      {availableCities.length > 0 ? (
                        <select
                          id="address.city"
                          name="address.city"
                          value={formData.address.city}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                        >
                          <option value="">Select City</option>
                          {availableCities.map((city) => (
                            <option key={city.name} value={city.name}>
                              {city.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          id="address.city"
                          name="address.city"
                          value={formData.address.city}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                          placeholder="City"
                        />
                      )}
                    </div>
                  </div>

                  {/* Postal Code */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-1" htmlFor="address.postalCode">
                      Postal/ZIP Code
                    </label>
                    <input
                      type="text"
                      id="address.postalCode"
                      name="address.postalCode"
                      value={formData.address.postalCode}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                      placeholder="Postal/ZIP Code"
                    />
                  </div>
                </div>
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

                  {/* Show rejection reason if document is rejected */}
                  {formData.verificationDocuments.addressProof.status === "rejected" &&
                    data?.data?.profile?.verificationDocuments?.addressProof?.rejectionReason && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-start">
                          <svg
                            className="w-5 h-5 text-red-400 mt-0.5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                            <p className="text-sm text-red-700 mt-1">
                              {data.data.profile.verificationDocuments.addressProof.rejectionReason}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
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

                  {/* Show rejection reason if document is rejected */}
                  {formData.verificationDocuments.identityProof.status === "rejected" &&
                    data?.data?.profile?.verificationDocuments?.identityProof?.rejectionReason && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-start">
                          <svg
                            className="w-5 h-5 text-red-400 mt-0.5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                            <p className="text-sm text-red-700 mt-1">
                              {data.data.profile.verificationDocuments.identityProof.rejectionReason}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
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

      {/* OTP Verification Modal */}
      <OTPVerification
        isOpen={showOTPModal}
        countryCode={formData.phone.countryCode}
        phoneNumber={formData.phone.number}
        onVerificationSuccess={handleOTPVerificationSuccess}
        onCancel={handleOTPCancel}
      />
    </div>
  );
};

export default ProfilePage;
