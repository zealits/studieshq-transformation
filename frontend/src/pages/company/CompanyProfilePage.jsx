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
import { Country, State, City } from "country-state-city";
import ConfirmModal from "../../components/common/ConfirmModal";
import OTPVerification from "../../components/OTPVerification";

const CompanyProfilePage = () => {
  const { user } = useSelector((state) => state.auth);
  const { companyProfile, isLoading, error, updateSuccess } = useSelector((state) => state.company);
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [hasChanges, setHasChanges] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [availableStates, setAvailableStates] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [countryFields, setCountryFields] = useState(null);
  const [countrySpecificData, setCountrySpecificData] = useState({});
  const [loadingCountryFields, setLoadingCountryFields] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState({});
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ isOpen: false, documentType: null });
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [phoneVerificationStatus, setPhoneVerificationStatus] = useState({
    isVerified: false,
    verifiedAt: null,
  });
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
      phone: {
        countryCode: "+91",
        number: "",
        isVerified: false,
        verifiedAt: null,
      },
      logo: "",
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

      // Extract phone data - support both old phoneNumber and new phone object
      // Handle case where phone might be null or undefined
      const phoneData = companyProfile.user?.company?.phone && typeof companyProfile.user.company.phone === 'object' 
        ? companyProfile.user.company.phone 
        : {};
      const phoneNumber = phoneData?.number || companyProfile.user?.company?.phoneNumber || "";
      
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
          phoneNumber: phoneNumber,
          phone: {
            countryCode: phoneData.countryCode || "+91",
            number: phoneData.number || phoneNumber || "",
            isVerified: phoneData.isVerified || false,
            verifiedAt: phoneData.verifiedAt || null,
          },
          logo: companyProfile.user?.company?.logo || "",
          address: (() => {
            const addressData = companyProfile.user?.company?.address || {};
            
            // Derive countryCode from country name if countryCode is missing
            let countryCode = addressData.countryCode || "";
            if (!countryCode && addressData.country) {
              const foundCountry = Country.getAllCountries().find(
                (c) => c.name.toLowerCase() === addressData.country.toLowerCase()
              );
              if (foundCountry) {
                countryCode = foundCountry.isoCode;
              }
            }

            // Derive stateCode from state name if stateCode is missing
            let stateCode = addressData.stateCode || "";
            if (!stateCode && addressData.state && countryCode) {
              const states = State.getStatesOfCountry(countryCode);
              const foundState = states.find(
                (s) => s.name.toLowerCase() === addressData.state.toLowerCase()
              );
              if (foundState) {
                stateCode = foundState.isoCode;
              }
            }

            return {
              line1: addressData.line1 || addressData.street || "",
              line2: addressData.line2 || "",
              country: addressData.country || "",
              countryCode: countryCode,
              city: addressData.city || "",
              state: addressData.state || "",
              stateCode: stateCode,
              postalCode: addressData.postalCode || addressData.zipCode || "",
            };
          })(),
          documents: {
            businessLicense: {
              type: "business_license",
              url: businessLicense?.url || "",
              status: businessLicense?.status || "pending",
              rejectionReason: businessLicense?.rejectionReason || null,
              file: null,
            },
            taxCertificate: {
              type: "tax_certificate",
              url: taxCertificate?.url || "",
              status: taxCertificate?.status || "pending",
              rejectionReason: taxCertificate?.rejectionReason || null,
              file: null,
            },
          },
          countrySpecificFields: companyProfile.user?.company?.countrySpecificFields || {          },
        },
      });

      // Set phone verification status - ensure boolean conversion
      // Handle various truthy values that might come from the backend
      const isPhoneVerified = phoneData.isVerified === true || 
                              phoneData.isVerified === 'true' || 
                              phoneData.isVerified === 1 ||
                              phoneData.isVerified === '1';
      setPhoneVerificationStatus({
        isVerified: Boolean(isPhoneVerified),
        verifiedAt: phoneData.verifiedAt || null,
      });
      
      // Log for debugging (remove in production)
      console.log('Phone verification status updated:', {
        isVerified: Boolean(isPhoneVerified),
        verifiedAt: phoneData.verifiedAt,
        phoneData: phoneData
      });

      // Load states and cities if address data exists
      const addressData = companyProfile.user?.company?.address;
      const countryCode = formData.company.address.countryCode;
      const stateCode = formData.company.address.stateCode;

      // Load country-specific fields if country is selected
      if (countryCode) {
        loadCountryFields(countryCode);
      }

      // Load country-specific data if exists (will be filtered when countryFields loads)
      if (companyProfile.user?.company?.countrySpecificFields) {
        const countryData = {};
        Object.keys(companyProfile.user.company.countrySpecificFields).forEach((key) => {
          countryData[key] = companyProfile.user.company.countrySpecificFields[key];
        });
        setCountrySpecificData(countryData);
      }
      
      if (countryCode) {
        const states = State.getStatesOfCountry(countryCode);
        setAvailableStates(states || []);
        
        if (stateCode) {
          const cities = City.getCitiesOfState(countryCode, stateCode);
          setAvailableCities(cities || []);
        }
      }
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
      // Don't show verification-related errors
      if (!error.includes("verification is complete") && !error.includes("cannot be changed")) {
        toast.error(error);
      }
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
    dispatch(clearError());
    toast.dismiss();
    toast.dismiss(); // Call twice to ensure all toasts are cleared

    // Then change the tab
    setActiveTab(tabId);

    // Ensure we're not in editing mode when changing tabs
    if (isEditing) {
      setIsEditing(false);
    }
  };

  // Load states when country changes
  useEffect(() => {
    if (formData.company.address.countryCode) {
      const states = State.getStatesOfCountry(formData.company.address.countryCode);
      setAvailableStates(states || []);
      setAvailableCities([]); // Clear cities when country changes
    } else {
      setAvailableStates([]);
      setAvailableCities([]);
    }
  }, [formData.company.address.countryCode]);

  // Load cities when state changes
  useEffect(() => {
    if (formData.company.address.countryCode && formData.company.address.stateCode) {
      const cities = City.getCitiesOfState(formData.company.address.countryCode, formData.company.address.stateCode);
      setAvailableCities(cities || []);
    } else {
      setAvailableCities([]);
    }
  }, [formData.company.address.countryCode, formData.company.address.stateCode]);

  // Load country-specific business fields
  const loadCountryFields = async (countryCode) => {
    if (!countryCode) return;

    setLoadingCountryFields(true);
    try {
      const response = await api.get(`/api/company/country-fields/${countryCode}`);
      if (response.data.success) {
        setCountryFields(response.data.data);
      } else {
        setCountryFields(null);
      }
    } catch (error) {
      console.error("Error loading country fields:", error);
      setCountryFields(null);
    } finally {
      setLoadingCountryFields(false);
    }
  };

  // Load country fields when country changes
  useEffect(() => {
    if (formData.company.address.countryCode) {
      loadCountryFields(formData.company.address.countryCode);
    } else {
      setCountryFields(null);
      setCountrySpecificData({});
    }
  }, [formData.company.address.countryCode]);

  // Filter country-specific data to only include fields for current country
  useEffect(() => {
    if (countryFields?.fields && countryFields.fields.length > 0 && Object.keys(countrySpecificData).length > 0) {
      const currentFieldNames = countryFields.fields.map(f => f.name);
      const filteredData = {};
      
      Object.keys(countrySpecificData).forEach((key) => {
        // Only keep fields that belong to the current country
        if (currentFieldNames.includes(key)) {
          filteredData[key] = countrySpecificData[key];
        }
      });
      
      // Only update if there are changes (to avoid infinite loops)
      const currentKeys = Object.keys(countrySpecificData).sort().join(',');
      const filteredKeys = Object.keys(filteredData).sort().join(',');
      if (currentKeys !== filteredKeys) {
        setCountrySpecificData(filteredData);
      }
    }
  }, [countryFields]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setHasChanges(true);

    if (name.startsWith("company.")) {
      const field = name.split(".")[1];
      if (name.includes("address.")) {
        const addressField = name.split(".")[2];
        setFormData((prev) => {
          const newAddress = {
            ...prev.company.address,
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
          if (addressField === "stateCode" && value && prev.company.address.countryCode) {
            const selectedState = State.getStateByCodeAndCountry(value, prev.company.address.countryCode);
            if (selectedState) {
              newAddress.state = selectedState.name;
            }
          }

          // Clear dependent fields when country changes
          if (addressField === "country" || addressField === "countryCode") {
            const oldCountryCode = prev.company.address?.countryCode;
            const countryChanged = oldCountryCode && value && oldCountryCode !== value;
            
            newAddress.state = "";
            newAddress.stateCode = "";
            newAddress.city = "";
            setAvailableStates([]);
            setAvailableCities([]);
            
            // If country changed, clear all country-specific data
            if (countryChanged) {
              setCountrySpecificData({});
            }
            
            // Load country-specific fields for new country
            if (value) {
              loadCountryFields(value);
            } else {
              setCountryFields(null);
              setCountrySpecificData({});
            }
            
            // Return updated form data with cleared documents if country changed
            return {
              ...prev,
              company: {
                ...prev.company,
                address: newAddress,
                // Clear documents when country changes
                ...(countryChanged ? { documents: {} } : {}),
              },
            };
          }

          // Clear city when state changes
          if (addressField === "state" || addressField === "stateCode") {
            newAddress.city = "";
            setAvailableCities([]);
          }

          return {
            ...prev,
            company: {
              ...prev.company,
              address: newAddress,
            },
          };
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

  const handleDeleteDocumentClick = (documentType, e) => {
    e.stopPropagation();
    setDeleteConfirmModal({ isOpen: true, documentType });
  };

  const handleDeleteDocument = async () => {
    const documentType = deleteConfirmModal.documentType;
    if (!documentType) return;

    try {
      const response = await api.delete(`/api/company/documents/${documentType}`);
      
      if (response.data.success) {
        toast.success("Document deleted successfully");
        
        // Update form data to remove the document
        setFormData((prev) => {
          const newDocuments = { ...prev.company.documents };
          // Find the document key
          const documentKey = Object.keys(newDocuments).find(
            (key) => newDocuments[key]?.type === documentType
          );
          if (documentKey) {
            delete newDocuments[documentKey];
          }
          return {
            ...prev,
            company: {
              ...prev.company,
              documents: newDocuments,
            },
          };
        });
        
        // Refresh company profile
        dispatch(getCompanyProfile());
      } else {
        toast.error("Failed to delete document");
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error(error.response?.data?.error || "Failed to delete document");
    } finally {
      setDeleteConfirmModal({ isOpen: false, documentType: null });
    }
  };

  const handleDocumentSelect = async (e, documentType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if company is verified - prevent document uploads silently
    if (isCompanyVerified) {
      e.target.value = ""; // Clear file input
      return;
    }

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

    // Get the document type from the country fields if available
    // The documentType parameter is the field name (e.g., "cin", "gstin"), we need to find the actual documentType enum
    let docType = documentType;
    if (countryFields && countryFields.fields) {
      // Find the field by name that has a documentType
      const field = countryFields.fields.find((f) => f.name === documentType && f.documentType);
      if (field) {
        docType = field.documentType;
      } else {
        // If not found by name, check if documentType is already a valid document type enum
        const validDocTypes = ["business_license", "tax_certificate", "incorporation_certificate", "other"];
        if (!validDocTypes.includes(documentType)) {
          // Try to find any field with this as documentType
          const fieldByDocType = countryFields.fields.find((f) => f.documentType === documentType);
          if (fieldByDocType) {
            docType = fieldByDocType.documentType;
          }
        }
      }
    }

    // Set uploading state
    setUploadingDocuments((prev) => ({ ...prev, [documentType]: true }));

    try {
      // Upload document immediately
      const formData = new FormData();
      formData.append("document", file);
      formData.append("documentType", docType);

      const uploadResponse = await api.post("/api/upload/verification-document", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (uploadResponse.data.success) {
        // Update form data with uploaded document URL
        setFormData((prev) => ({
          ...prev,
          company: {
            ...prev.company,
            documents: {
              ...prev.company.documents,
              [documentType]: {
                type: docType,
                file: null,
                url: uploadResponse.data.data.documentUrl,
                status: "pending",
              },
            },
          },
        }));

        // Update the document in the backend
        const updateResponse = await api.post("/api/company/documents", {
          type: docType,
          url: uploadResponse.data.data.documentUrl,
        });

        if (updateResponse.data.success) {
          toast.success(`${docType.replace(/_/g, " ")} uploaded successfully!`);
          
          // Refresh company profile to get updated documents
          dispatch(getCompanyProfile());
        } else {
          toast.error("Document uploaded but failed to save. Please try again.");
        }
      } else {
        toast.error("Failed to upload document. Please try again.");
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      // Don't show error if it's a verification-related error (user is verified)
      const errorMessage = error.response?.data?.error || error.response?.data?.message || "";
      if (!errorMessage.includes("verification is complete") && !errorMessage.includes("cannot be changed")) {
        toast.error(errorMessage || "Failed to upload document. Please try again.");
      }
    } finally {
      setUploadingDocuments((prev) => ({ ...prev, [documentType]: false }));
      // Reset file input
      e.target.value = "";
    }
  };

  // OTP verification handlers
  const handleVerifyPhone = () => {
    if (!formData.company.phone.countryCode || !formData.company.phone.number) {
      toast.error("Please enter a valid phone number first");
      return;
    }
    setShowOTPModal(true);
  };

  const handleOTPVerificationSuccess = async (data) => {
    try {
      const verifiedAt = data.data?.verifiedAt || new Date().toISOString();
      const phoneData = data.data?.phone || null;

      // Update local state immediately with verified status
      setPhoneVerificationStatus({
        isVerified: true,
        verifiedAt: verifiedAt,
      });

      // Update form data with verification status
      setFormData((prev) => ({
        ...prev,
        company: {
          ...prev.company,
          phone: {
            ...prev.company.phone,
            isVerified: true,
            verifiedAt: verifiedAt,
            // Use phone data from response if available, otherwise keep existing
            countryCode: phoneData?.countryCode || prev.company.phone.countryCode,
            number: phoneData?.number || prev.company.phone.number,
          },
        },
      }));

      setShowOTPModal(false);
      toast.success("Phone number verified successfully!");

      // Refresh company profile to get the latest data from server
      // Use a small delay to ensure backend has saved the data
      setTimeout(() => {
        dispatch(getCompanyProfile());
      }, 500);
    } catch (error) {
      console.error("OTP verification success handler error:", error);
      toast.error("Failed to update verification status. Please refresh the page.");
    }
  };

  const handleOTPCancel = () => {
    setShowOTPModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Prepare form data with country-specific fields
      const submitData = {
        ...formData,
        company: {
          ...formData.company,
          countrySpecificFields: countrySpecificData,
        },
      };

      // Only include phone if it has valid data (countryCode and number)
      if (formData.company.phone && formData.company.phone.countryCode && formData.company.phone.number) {
        submitData.company.phone = {
          countryCode: formData.company.phone.countryCode,
          number: formData.company.phone.number,
          // Don't send verification status from frontend - backend handles it
        };
      }

      // Handle logo upload if there's a new logo file
      if (logoFile) {
        // For now, we'll simulate uploading by creating a data URL
        // In a real app, you'd upload to a service like Cloudinary or AWS S3
        const logoUrl = logoPreview; // This would be the actual uploaded URL
        submitData.company.logo = logoUrl;
      }

      dispatch(updateCompanyProfile(submitData));
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

  // Check if company is verified - if so, disable country and document changes
  const isCompanyVerified = user?.company?.verificationStatus === "verified";

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
                <div className="flex">
                  <div className="relative">
                    <select
                      name="company.phone.countryCode"
                      value={formData.company.phone.countryCode}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          company: {
                            ...prev.company,
                            phone: {
                              ...prev.company.phone,
                              countryCode: e.target.value,
                            },
                          },
                        }));
                        setHasChanges(true);
                      }}
                      disabled={!isEditing}
                      className="appearance-none bg-white border border-gray-300 rounded-l-md px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
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
                    name="company.phone.number"
                    value={formData.company.phone.number}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        company: {
                          ...prev.company,
                          phone: {
                            ...prev.company.phone,
                            number: e.target.value,
                          },
                        },
                      }));
                      setHasChanges(true);
                    }}
                    disabled={!isEditing}
                    className="flex-1 p-2 border border-gray-300 border-l-0 rounded-r-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100"
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

                  {!phoneVerificationStatus.isVerified && formData.company.phone.number && (
                    <button
                      type="button"
                      onClick={handleVerifyPhone}
                      className="text-xs bg-primary text-white px-3 py-1 rounded-md hover:bg-primary-dark transition-colors"
                    >
                      Verify Phone
                    </button>
                  )}
                </div>
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
            {/* Country Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
              <select
                name="company.address.countryCode"
                value={formData.company.address.countryCode}
                onChange={handleChange}
                disabled={!isEditing || isCompanyVerified}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                required
              >
                <option value="">Select Country</option>
                {Country.getAllCountries()
                  .filter((c) => {
                    const supportedCountries = ["IN", "US", "CN", "DE", "GB", "FR", "CA", "AU", "AE"];
                    return supportedCountries.includes(c.isoCode);
                  })
                  .map((country) => (
                    <option key={country.isoCode} value={country.isoCode}>
                      {country.name}
                    </option>
                  ))}
              </select>
              {isCompanyVerified ? (
                <p className="text-xs text-yellow-600 mt-1">
                  Country cannot be changed after verification is complete. Please contact support if you need to update this.
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  Please select your country to see country-specific business information fields
                </p>
              )}
            </div>

            {loadingCountryFields && (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            )}

            {countryFields && countryFields.fields && countryFields.fields.length > 0 ? (
              <>
                {/* Common Fields */}
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

                {/* Country-Specific Fields */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    {countryFields.country} Specific Business Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {countryFields.fields.map((field) => (
                      <div key={field.name}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {field.label} {field.required && "*"}
                        </label>
                        {field.type === "select" ? (
                          <select
                            name={`countrySpecificFields.${field.name}`}
                            value={countrySpecificData[field.name] || ""}
                            onChange={(e) => {
                              setCountrySpecificData({
                                ...countrySpecificData,
                                [field.name]: e.target.value,
                              });
                              setHasChanges(true);
                            }}
                            disabled={!isEditing}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                            required={field.required}
                          >
                            <option value="">{field.placeholder || `Select ${field.label}`}</option>
                            {field.options?.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : field.type === "textarea" ? (
                          <textarea
                            name={`countrySpecificFields.${field.name}`}
                            value={countrySpecificData[field.name] || ""}
                            onChange={(e) => {
                              setCountrySpecificData({
                                ...countrySpecificData,
                                [field.name]: e.target.value,
                              });
                              setHasChanges(true);
                            }}
                            disabled={!isEditing}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                            placeholder={field.placeholder}
                            required={field.required}
                          />
                        ) : (
                          <input
                            type={field.type || "text"}
                            name={`countrySpecificFields.${field.name}`}
                            value={countrySpecificData[field.name] || ""}
                            onChange={(e) => {
                              setCountrySpecificData({
                                ...countrySpecificData,
                                [field.name]: e.target.value,
                              });
                              setHasChanges(true);
                            }}
                            disabled={!isEditing}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                            placeholder={field.placeholder}
                            required={field.required}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : formData.company.address.countryCode ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  Business information fields are not available for the selected country yet. Please contact support for
                  assistance.
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">Please select a country to see business information fields.</p>
              </div>
            )}
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

            {/* Address */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Address</h3>
              <div className="space-y-4">
                {/* Address Line 1 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1</label>
                  <input
                    type="text"
                    name="company.address.line1"
                    value={formData.company.address.line1}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                    placeholder="Street address, P.O. box"
                  />
                </div>

                {/* Address Line 2 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 2</label>
                  <input
                    type="text"
                    name="company.address.line2"
                    value={formData.company.address.line2}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                    placeholder="Apartment, suite, unit, building, floor, etc."
                  />
                </div>

                {/* Country, State, City Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Country */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <select
                      name="company.address.countryCode"
                      value={formData.company.address.countryCode}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">State/Province</label>
                    {availableStates.length > 0 ? (
                      <select
                        name="company.address.stateCode"
                        value={formData.company.address.stateCode}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
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
                        name="company.address.state"
                        value={formData.company.address.state}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                        placeholder="State/Province"
                      />
                    )}
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    {availableCities.length > 0 ? (
                      <select
                        name="company.address.city"
                        value={formData.company.address.city}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
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
                        name="company.address.city"
                        value={formData.company.address.city}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                        placeholder="City"
                      />
                    )}
                  </div>
                </div>

                {/* Postal Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Postal/ZIP Code</label>
                  <input
                    type="text"
                    name="company.address.postalCode"
                    value={formData.company.address.postalCode}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                    placeholder="Postal/ZIP Code"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case "verification":
        // Get unique document types from country fields
        const requiredDocuments = [];
        const requiredDocumentTypes = new Set(); // Track which document types are required for current country
        if (countryFields && countryFields.fields) {
          countryFields.fields.forEach((field) => {
            if (field.documentType && field.documentLabel) {
              const existingDoc = requiredDocuments.find((doc) => doc.type === field.documentType);
              if (!existingDoc) {
                requiredDocuments.push({
                  type: field.documentType,
                  label: field.documentLabel,
                  fieldName: field.name,
                });
                requiredDocumentTypes.add(field.documentType);
              }
            }
          });
        }

        // Get existing documents - filter to only show documents required for current country
        const allExistingDocuments = companyProfile?.user?.company?.documents || [];
        const existingDocuments = allExistingDocuments.filter((doc) => 
          requiredDocumentTypes.has(doc.type)
        );

        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Verification Documents</h3>
              {!countryFields || !formData.company.address.countryCode ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    Please select a country in the Business Information section to see required verification documents.
                  </p>
                </div>
              ) : requiredDocuments.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    No specific verification documents are required for {countryFields.country} at this time.
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-3">
                    Upload your business documents for verification ({countryFields.country}):
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requiredDocuments.map((doc) => {
                      // Use a consistent key for the document
                      // First try to find the field name, otherwise use document type
                      const field = countryFields.fields.find((f) => f.documentType === doc.type && f.documentLabel === doc.label);
                      const documentKey = field?.name || doc.type.replace(/_/g, "");
                      const existingDoc = existingDocuments.find((d) => d.type === doc.type);
                      const documentState = formData.company.documents[documentKey] || {
                        type: doc.type,
                        url: existingDoc?.url || "",
                        status: existingDoc?.status || "pending",
                        rejectionReason: existingDoc?.rejectionReason || null,
                        file: null,
                      };

                      return (
                        <div
                          key={doc.type}
                          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                            documentState.url
                              ? "border-green-300 bg-green-50"
                              : "border-gray-300 hover:border-primary"
                          }`}
                        >
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(e) => handleDocumentSelect(e, documentKey)}
                            disabled={uploadingDocuments[documentKey] || isCompanyVerified}
                            className="hidden"
                            id={`${doc.type}-upload`}
                          />
                          <label
                            htmlFor={`${doc.type}-upload`}
                            className={`${
                              uploadingDocuments[documentKey] || isCompanyVerified
                                ? "cursor-not-allowed opacity-50"
                                : "cursor-pointer hover:opacity-80"
                            }`}
                          >
                            {documentState.url ? (
                              <svg
                                className="w-8 h-8 mx-auto text-green-600 mb-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            ) : (
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
                            )}
                            <p className={`text-sm font-medium ${documentState.url ? "text-green-800" : "text-gray-700"}`}>
                              {doc.label}
                            </p>
                            {uploadingDocuments[documentKey] ? (
                              <>
                                <div className="flex items-center justify-center mt-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                                  <p className="text-xs text-blue-600">Uploading...</p>
                                </div>
                              </>
                            ) : (
                              <>
                                <p className="text-xs text-gray-500 mt-1">Click to upload {doc.label.toLowerCase()}</p>
                                {documentState.url && (
                                  <>
                                    <p className="text-xs text-green-600 mt-1">✓ Document uploaded</p>
                                    <div className="mt-2 flex flex-col items-center gap-2">
                                      <div className="flex items-center justify-center gap-2">
                                        <a
                                          href={
                                            documentState.url.startsWith("http")
                                              ? documentState.url
                                              : `${import.meta.env.VITE_API_URL || "http://localhost:2001"}${documentState.url}`
                                          }
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="text-xs text-primary hover:text-primary-dark font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                        >
                                          <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth="2"
                                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth="2"
                                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                            />
                                          </svg>
                                          View
                                        </a>
                                        <span className="text-gray-300">|</span>
                                        <a
                                          href={
                                            documentState.url.startsWith("http")
                                              ? documentState.url
                                              : `${import.meta.env.VITE_API_URL || "http://localhost:2001"}${documentState.url}`
                                          }
                                          download
                                          onClick={(e) => e.stopPropagation()}
                                          className="text-xs text-primary hover:text-primary-dark font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                        >
                                          <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth="2"
                                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                            />
                                          </svg>
                                          Download
                                        </a>
                                      </div>
                                      {isEditing && (
                                        <button
                                          type="button"
                                          onClick={(e) => handleDeleteDocumentClick(doc.type, e)}
                                          className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                        >
                                          <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth="2"
                                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            />
                                          </svg>
                                          Delete
                                        </button>
                                      )}
                                    </div>
                                  </>
                                )}
                                {documentState.status && documentState.status !== "pending" && (
                                  <>
                                    <p
                                      className={`text-xs mt-1 ${
                                        documentState.status === "approved"
                                          ? "text-green-600"
                                          : documentState.status === "rejected"
                                          ? "text-red-600"
                                          : "text-yellow-600"
                                      }`}
                                    >
                                      Status: {documentState.status}
                                    </p>
                                    {documentState.status === "rejected" && documentState.rejectionReason && (
                                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                                        <div className="flex items-start">
                                          <svg
                                            className="w-4 h-4 text-red-400 mt-0.5 mr-2 flex-shrink-0"
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
                                          <div className="flex-1">
                                            <p className="text-xs font-medium text-red-800 mb-1">Rejection Reason:</p>
                                            <p className="text-xs text-red-700">{documentState.rejectionReason}</p>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}
                              </>
                            )}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmModal.isOpen}
        onClose={() => setDeleteConfirmModal({ isOpen: false, documentType: null })}
        onConfirm={handleDeleteDocument}
        title="Delete Document"
        message="Are you sure you want to delete this document? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* OTP Verification Modal */}
      <OTPVerification
        isOpen={showOTPModal}
        countryCode={formData.company.phone.countryCode}
        phoneNumber={formData.company.phone.number}
        onVerificationSuccess={handleOTPVerificationSuccess}
        onCancel={handleOTPCancel}
      />
    </div>
  );
};

export default CompanyProfilePage;
