import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import api from "../../api/axios";
import {
  getCompanyProfile,
  updateCompanyProfile,
  clearError,
  clearUpdateSuccess,
  clearAllMessages,
} from "../../redux/slices/companySlice";

const CompanyProfilePage = () => {
  const { user } = useSelector((state) => state.auth);
  const { companyProfile, isLoading, error, updateSuccess } = useSelector((state) => state.company);
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [hasChanges, setHasChanges] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    company: {
      businessName: "",
      registrationNumber: "",
      businessType: "",
      industry: "",
      companySize: "",
      foundedYear: "",
      description: "",
      website: "",
      phoneNumber: "",
      logo: "",
      address: {
        street: "",
        city: "",
        state: "",
        country: "",
        zipCode: "",
      },
      documents: {
        businessLicense: {
          type: "business_license",
          url: "",
          status: "pending",
          file: null,
        },
        taxCertificate: {
          type: "tax_certificate",
          url: "",
          status: "pending",
          file: null,
        },
      },
    },
  });

  useEffect(() => {
    // Clear any existing messages immediately when component mounts
    dispatch(clearAllMessages());
    toast.dismiss();

    // Load company profile when component mounts
    if (user?.userType === "company") {
      dispatch(getCompanyProfile());
    }
  }, [dispatch, user]);

  useEffect(() => {
    // Update form data when company profile is loaded
    if (companyProfile) {
      // Extract existing documents
      const existingDocuments = companyProfile.user?.company?.documents || [];
      const businessLicense = existingDocuments.find((doc) => doc.type === "business_license");
      const taxCertificate = existingDocuments.find((doc) => doc.type === "tax_certificate");

      setFormData({
        name: companyProfile.user?.name || "",
        company: {
          businessName: companyProfile.user?.company?.businessName || "",
          registrationNumber: companyProfile.user?.company?.registrationNumber || "",
          businessType: companyProfile.user?.company?.businessType || "",
          industry: companyProfile.user?.company?.industry || "",
          companySize: companyProfile.user?.company?.companySize || "",
          foundedYear: companyProfile.user?.company?.foundedYear || "",
          description: companyProfile.user?.company?.description || "",
          website: companyProfile.user?.company?.website || "",
          phoneNumber: companyProfile.user?.company?.phoneNumber || "",
          logo: companyProfile.user?.company?.logo || "",
          address: {
            street: companyProfile.user?.company?.address?.street || "",
            city: companyProfile.user?.company?.address?.city || "",
            state: companyProfile.user?.company?.address?.state || "",
            country: companyProfile.user?.company?.address?.country || "",
            zipCode: companyProfile.user?.company?.address?.zipCode || "",
          },
          documents: {
            businessLicense: {
              type: "business_license",
              url: businessLicense?.url || "",
              status: businessLicense?.status || "pending",
              file: null,
            },
            taxCertificate: {
              type: "tax_certificate",
              url: taxCertificate?.url || "",
              status: taxCertificate?.status || "pending",
              file: null,
            },
          },
        },
      });
    }
  }, [companyProfile]);

  useEffect(() => {
    // Only show success message if we're actually editing and just saved
    if (updateSuccess && isEditing && hasChanges) {
      toast.success("Company profile updated successfully!");
      dispatch(clearUpdateSuccess());
      setIsEditing(false);
      setHasChanges(false);
    } else if (updateSuccess && !isEditing) {
      // If success is true but we're not editing, clear it immediately
      dispatch(clearUpdateSuccess());
    }
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [updateSuccess, error, dispatch, isEditing, hasChanges]);

  // Cleanup effect to clear messages when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearAllMessages());
      toast.dismiss();
    };
  }, [dispatch]);

  // Clear messages when changing tabs
  const handleTabChange = (tabId) => {
    // Clear all messages and toasts first
    dispatch(clearAllMessages());
    toast.dismiss();

    // Then change the tab
    setActiveTab(tabId);

    // Ensure we're not in editing mode when changing tabs
    if (isEditing) {
      setIsEditing(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setHasChanges(true);

    if (name.startsWith("company.")) {
      const field = name.split(".")[1];
      if (name.includes("address.")) {
        const addressField = name.split(".")[2];
        setFormData({
          ...formData,
          company: {
            ...formData.company,
            address: {
              ...formData.company.address,
              [addressField]: value,
            },
          },
        });
      } else {
        setFormData({
          ...formData,
          company: {
            ...formData.company,
            [field]: value,
          },
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setHasChanges(true);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentSelect = (e, documentType) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please upload a valid file (JPG, PNG, or PDF)");
        return;
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error("File size must be less than 5MB");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        company: {
          ...prev.company,
          documents: {
            ...prev.company.documents,
            [documentType]: {
              ...prev.company.documents[documentType],
              file: file,
            },
          },
        },
      }));
      setHasChanges(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Handle logo upload if there's a new logo file
      if (logoFile) {
        // For now, we'll simulate uploading by creating a data URL
        // In a real app, you'd upload to a service like Cloudinary or AWS S3
        const logoUrl = logoPreview; // This would be the actual uploaded URL
        const updatedFormData = {
          ...formData,
          company: {
            ...formData.company,
            logo: logoUrl,
          },
        };
        dispatch(updateCompanyProfile(updatedFormData));
      } else {
        // Send the profile update (documents will be handled in the Redux slice)
        dispatch(updateCompanyProfile(formData));
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload documents");
    }
  };

  const getVerificationStatusColor = (status) => {
    switch (status) {
      case "verified":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "rejected":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getVerificationStatusText = (status) => {
    switch (status) {
      case "verified":
        return "Verified";
      case "pending":
        return "Pending Review";
      case "rejected":
        return "Rejected";
      default:
        return "Not Submitted";
    }
  };

  if (isLoading && !companyProfile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "basic", label: "Basic Information" },
    { id: "business", label: "Business Information" },
    { id: "overview", label: "Company Overview" },
    { id: "verification", label: "Verification" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "basic":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="company.phoneNumber"
                  value={formData.company.phoneNumber}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                <input
                  type="url"
                  name="company.website"
                  value={formData.company.website}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                  placeholder="https://www.yourcompany.com"
                />
              </div>
            </div>
          </div>
        );

      case "business":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Legal Business Name *</label>
                <input
                  type="text"
                  name="company.businessName"
                  value={formData.company.businessName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Registration Number *</label>
                <input
                  type="text"
                  name="company.registrationNumber"
                  value={formData.company.registrationNumber}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                  placeholder="EIN, Tax ID, etc."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Type *</label>
                <select
                  name="company.businessType"
                  value={formData.company.businessType}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                  required
                >
                  <option value="">Select Business Type</option>
                  <option value="LLC">LLC (Limited Liability Company)</option>
                  <option value="Corporation">Corporation</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Sole Proprietorship">Sole Proprietorship</option>
                  <option value="Non-Profit">Non-Profit</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Industry *</label>
                <input
                  type="text"
                  name="company.industry"
                  value={formData.company.industry}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                  placeholder="e.g., Technology, Healthcare, Finance"
                  required
                />
              </div>
            </div>

            {/* Compliance Status */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Compliance Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Business License</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getVerificationStatusColor("pending")}`}
                  >
                    Pending
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Insurance Status</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getVerificationStatusColor("pending")}`}
                  >
                    Pending
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case "overview":
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Description *</label>
              <textarea
                name="company.description"
                value={formData.company.description}
                onChange={handleChange}
                disabled={!isEditing}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                placeholder="Describe what your company does, your mission, and values..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Size *</label>
                <select
                  name="company.companySize"
                  value={formData.company.companySize}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                  required
                >
                  <option value="">Select Company Size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="500+">500+ employees</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Founded Year</label>
                <input
                  type="number"
                  name="company.foundedYear"
                  value={formData.company.foundedYear}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                  placeholder="e.g., 2020"
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Location</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                  <input
                    type="text"
                    name="company.address.street"
                    value={formData.company.address.street}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                    placeholder="123 Main Street"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    name="company.address.city"
                    value={formData.company.address.city}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                    placeholder="New York"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State/Province</label>
                  <input
                    type="text"
                    name="company.address.state"
                    value={formData.company.address.state}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                    placeholder="NY"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <input
                    type="text"
                    name="company.address.country"
                    value={formData.company.address.country}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                    placeholder="United States"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ZIP/Postal Code</label>
                  <input
                    type="text"
                    name="company.address.zipCode"
                    value={formData.company.address.zipCode}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                    placeholder="10001"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case "verification":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Verification Documents</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-3">Upload your business documents for verification:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Business License Upload */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary transition-colors">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => handleDocumentSelect(e, "businessLicense")}
                      disabled={!isEditing}
                      className="hidden"
                      id="business-license-upload"
                    />
                    <label
                      htmlFor="business-license-upload"
                      className={`cursor-pointer ${!isEditing ? "cursor-not-allowed" : ""}`}
                    >
                      <svg
                        className="w-8 h-8 mx-auto text-gray-400 mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="text-sm text-gray-600">Business License</p>
                      <p className="text-xs text-gray-500">Upload business license document</p>
                      {formData.company.documents.businessLicense.file && (
                        <p className="text-xs text-green-600 mt-1">
                          Selected: {formData.company.documents.businessLicense.file.name}
                        </p>
                      )}
                      {formData.company.documents.businessLicense.url &&
                        !formData.company.documents.businessLicense.file && (
                          <p className="text-xs text-green-600 mt-1">✓ Document uploaded</p>
                        )}
                    </label>
                  </div>

                  {/* Tax Certificate Upload */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary transition-colors">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => handleDocumentSelect(e, "taxCertificate")}
                      disabled={!isEditing}
                      className="hidden"
                      id="tax-certificate-upload"
                    />
                    <label
                      htmlFor="tax-certificate-upload"
                      className={`cursor-pointer ${!isEditing ? "cursor-not-allowed" : ""}`}
                    >
                      <svg
                        className="w-8 h-8 mx-auto text-gray-400 mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="text-sm text-gray-600">Tax Certificate</p>
                      <p className="text-xs text-gray-500">Upload tax registration certificate</p>
                      {formData.company.documents.taxCertificate.file && (
                        <p className="text-xs text-green-600 mt-1">
                          Selected: {formData.company.documents.taxCertificate.file.name}
                        </p>
                      )}
                      {formData.company.documents.taxCertificate.url &&
                        !formData.company.documents.taxCertificate.file && (
                          <p className="text-xs text-green-600 mt-1">✓ Document uploaded</p>
                        )}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Verification Status</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-800">Verification Process</p>
                    <p className="text-sm text-blue-600">
                      Your documents are under review. This process typically takes 1-3 business days.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* Company Logo Section */}
            <div className="relative">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} alt="Company Logo" className="w-full h-full object-cover" />
                ) : user?.company?.logo ? (
                  <img src={user.company.logo} alt="Company Logo" className="w-full h-full object-cover" />
                ) : (
                  user?.company?.businessName?.charAt(0) || user?.name?.charAt(0) || "C"
                )}
              </div>

              {/* Logo Upload Button (only in edit mode) - Camera icon like freelancer profile */}
              {isEditing && (
                <div className="absolute -bottom-0.5 -right-0.5">
                  <label className="bg-blue-500 text-white rounded-full p-1.5 cursor-pointer hover:bg-blue-600 transition-colors shadow-md border-2 border-white flex items-center justify-center w-7 h-7">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                  </label>
                </div>
              )}
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {user?.company?.businessName || formData.company.businessName || "Company Profile"}
              </h1>
              <p className="text-gray-600">
                {user?.companyType === "freelancer_company" ? "Freelancer Company" : "Project Sponsor Organization"}
              </p>
              <div className="flex items-center mt-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getVerificationStatusColor(
                    user?.company?.verificationStatus
                  )}`}
                >
                  {getVerificationStatusText(user?.company?.verificationStatus)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              if (!isEditing) {
                setHasChanges(false);
                setLogoFile(null);
                setLogoPreview(null);
              }
              setIsEditing(!isEditing);
            }}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors"
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">{renderTabContent()}</div>
        </div>

        {/* Save Button */}
        {isEditing && (
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default CompanyProfilePage;
