import React, { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams, useNavigate } from "react-router-dom";
import { fetchMyProfile, updateProfile } from "../../redux/slices/profileSlice";
import { uploadProfileImage } from "../../redux/slices/uploadSlice";
import { toast } from "react-toastify";
import axios from "axios";
import VerificationBadge from "../../components/VerificationBadge";
import OTPVerification from "../../components/OTPVerification";
import ConfirmationModal from "../../components/ConfirmationModal";
import api from "../../api/axios";
import { Country, State, City } from "country-state-city";

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { data, isLoading, error } = useSelector((state) => state.profile);
  const { loading: uploadLoading, error: uploadError, success: uploadSuccess } = useSelector((state) => state.upload);
  const user = useSelector((state) => state.auth);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showImageConfirm, setShowImageConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [triggerFileInput, setTriggerFileInput] = useState(false);
  const fileInputRef = useRef(null);

  // OTP verification states
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [phoneVerificationStatus, setPhoneVerificationStatus] = useState({
    isVerified: false,
    verifiedAt: null,
  });

  // LinkedIn verification states
  const [linkedinStatus, setLinkedinStatus] = useState({
    isVerified: false,
    linkedinId: null,
    linkedinUrl: null,
    verifiedAt: null,
    profileData: null,
  });
  const [linkedinLoading, setLinkedinLoading] = useState(false);
  const [showLinkedInDisconnectModal, setShowLinkedInDisconnectModal] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

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
    bio: "",
    hourlyRate: {
      min: 0,
      max: 0,
    },
    skills: [],
    education: [],
    experience: [],
    portfolioItems: [],
    resume: {
      filename: "",
      originalname: "",
      mimetype: "",
      size: 0,
      uploadedAt: null,
    },
    // parsedResumeData: null,
    // resumeParsedAt: null,
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
      github: "",
      portfolio: "",
    },
    githubAnalysis: null,
  });

  // State to track if document types are saved
  const [documentTypesSaved, setDocumentTypesSaved] = useState(false);

  // Fetch profile data when component mounts
  useEffect(() => {
    dispatch(fetchMyProfile());
    fetchLinkedInStatus();
  }, [dispatch]);

  // Handle LinkedIn OAuth callback
  useEffect(() => {
    const linkedinVerified = searchParams.get("linkedin_verified");
    const linkedinError = searchParams.get("linkedin_error");

    if (linkedinVerified === "true") {
      toast.success("LinkedIn account verified successfully!");
      // Remove query params
      setSearchParams({});
      // Refresh profile data
      dispatch(fetchMyProfile());
      fetchLinkedInStatus();
    } else if (linkedinError) {
      toast.error(`LinkedIn verification failed: ${decodeURIComponent(linkedinError)}`);
      setSearchParams({});
    }
  }, [searchParams, dispatch, setSearchParams]);

  // Fetch LinkedIn verification status
  const fetchLinkedInStatus = async () => {
    try {
      const response = await api.get("/api/linkedin/status");
      if (response.data.success) {
        setLinkedinStatus(response.data.data);
        // Update formData with verified LinkedIn URL if available
        if (response.data.data.linkedinUrl) {
          setFormData((prev) => ({
            ...prev,
            socialLinks: {
              ...prev.socialLinks,
              linkedin: response.data.data.linkedinUrl,
            },
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching LinkedIn status:", error);
    }
  };

  // Initiate LinkedIn OAuth flow
  const handleLinkedInAuth = async () => {
    try {
      setLinkedinLoading(true);

      const response = await api.get("/api/linkedin/auth");

      if (response.data.success) {
        // Redirect to LinkedIn authorization page
        window.location.href = response.data.authUrl;
      } else {
        console.error("🔴 [Frontend] API returned success:false", response.data);
        toast.error(`Failed to initiate LinkedIn authentication: ${response.data.message || "Unknown error"}`);
        setLinkedinLoading(false);
      }
    } catch (error) {
      console.error("🔴 [Frontend] Error initiating LinkedIn auth:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        },
        fullError: error,
      });

      const errorMessage = error.response?.data?.message || error.message || "Unknown error";
      toast.error(`Failed to initiate LinkedIn authentication: ${errorMessage}`);
      setLinkedinLoading(false);
    }
  };

  // Disconnect LinkedIn account
  const handleDisconnectLinkedIn = async () => {
    try {
      const response = await api.delete("/api/linkedin/disconnect");
      if (response.data.success) {
        toast.success("LinkedIn account disconnected");
        fetchLinkedInStatus();
        dispatch(fetchMyProfile());
      }
    } catch (error) {
      console.error("Error disconnecting LinkedIn:", error);
      toast.error("Failed to disconnect LinkedIn account");
    }
  };

  // Update form data when profile is fetched
  useEffect(() => {
    if (data && data.success) {
      // Get the profile from the nested data structure
      const profile = data.data.profile || {};
      // Create deep copies of array objects to make them mutable
      const deepCopyEducation = profile.education ? profile.education.map((item) => ({ ...item })) : [];
      const deepCopyExperience = profile.experience ? profile.experience.map((item) => ({ ...item })) : [];
      const deepCopyPortfolioItems = profile.portfolioItems ? profile.portfolioItems.map((item) => ({ ...item })) : [];

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
        const foundState = states.find((s) => s.name.toLowerCase() === profile.address.state.toLowerCase());
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
        bio: profile.bio || "",
        hourlyRate: {
          min: profile.hourlyRate?.min || 0,
          max: profile.hourlyRate?.max || 0,
        },
        skills: profile.skills || [],
        education: deepCopyEducation,
        experience: deepCopyExperience,
        portfolioItems: deepCopyPortfolioItems,
        resume: {
          filename: profile.user?.resume?.filename || "",
          originalname: profile.user?.resume?.originalname || "",
          mimetype: profile.user?.resume?.mimetype || "",
          size: profile.user?.resume?.size || 0,
          uploadedAt: profile.user?.resume?.uploadedAt || null,
        },
        // parsedResumeData: profile.user?.parsedResumeData || null,
        // resumeParsedAt: profile.user?.resumeParsedAt || null,
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
          github: profile.social?.github || "",
          portfolio: profile.website || "",
        },
        githubAnalysis: profile.githubAnalysis || null,
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

      // Update LinkedIn verification status
      if (profile.linkedinVerification) {
        setLinkedinStatus({
          isVerified: profile.linkedinVerification.isVerified || false,
          linkedinId: profile.linkedinVerification.linkedinId || null,
          linkedinUrl: profile.social?.linkedin || null,
          verifiedAt: profile.linkedinVerification.verifiedAt || null,
          profileData: profile.linkedinVerification.profileData || null,
        });
      } else {
        setLinkedinStatus({
          isVerified: false,
          linkedinId: null,
          linkedinUrl: profile.social?.linkedin || null,
          verifiedAt: null,
          profileData: null,
        });
      }

      // Update phone verification status
      setPhoneVerificationStatus({
        isVerified: profile.phone?.isVerified || false,
        verifiedAt: profile.phone?.verifiedAt || null,
      });

      // Show success message if this was an update operation
      if (updateSuccess) {
        // Reset success state after 3 seconds
        setTimeout(() => {
          setUpdateSuccess(false);
        }, 3000);
      }
    }
  }, [data, updateSuccess]);

  // State for active tab
  const [activeTab, setActiveTab] = useState("basic");

  // State for address dropdowns
  const [availableStates, setAvailableStates] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);

  const githubAnalysis = formData.githubAnalysis;
  const githubProfileInfo = githubAnalysis?.profileInfo;
  const githubRepoSummary = githubAnalysis?.repositoriesSummary;

  const githubLanguages = useMemo(() => {
    if (!githubRepoSummary?.languageOverview) return [];

    if (Array.isArray(githubRepoSummary.languageOverview)) {
      return githubRepoSummary.languageOverview
        .filter((entry) => entry && entry.language)
        .map((entry) => ({
          language: entry.language,
          percentage:
            typeof entry.percentage === "number" ? entry.percentage : Number.parseFloat(entry.percentage) || 0,
        }))
        .sort((a, b) => b.percentage - a.percentage);
    }

    return Object.entries(githubRepoSummary.languageOverview)
      .map(([language, value]) => ({
        language,
        percentage: typeof value === "number" ? value : Number.parseFloat(value) || 0,
      }))
      .filter((entry) => entry.language)
      .sort((a, b) => b.percentage - a.percentage);
  }, [githubRepoSummary]);

  const githubAnalyzedAtLabel = useMemo(() => {
    if (!githubAnalysis?.analyzedAt) return null;
    const parsed = new Date(githubAnalysis.analyzedAt);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toLocaleString();
  }, [githubAnalysis?.analyzedAt]);

  const formatLanguagePercentage = (value) => {
    if (typeof value !== "number" || Number.isNaN(value)) return null;
    const rounded = Math.round(value * 10) / 10;
    return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
  };

  // Trigger file input when edit mode is enabled via avatar click
  useEffect(() => {
    if (triggerFileInput && isEditing && fileInputRef.current) {
      fileInputRef.current.click();
      setTriggerFileInput(false);
    }
  }, [triggerFileInput, isEditing]);

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

    // Handle hourly rate range - no validation or rounding during typing, just update state
    if (name === "hourlyRate.min" || name === "hourlyRate.max") {
      const inputValue = value === "" ? 0 : Number(value);

      setFormData({
        ...formData,
        hourlyRate: {
          ...formData.hourlyRate,
          [name.split(".")[1]]: inputValue,
        },
      });
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Round hourly rates to multiples of 10 before validation and submission
    const roundedMin =
      formData.hourlyRate.min > 0 ? Math.round(formData.hourlyRate.min / 10) * 10 : formData.hourlyRate.min;
    const roundedMax =
      formData.hourlyRate.max > 0 ? Math.round(formData.hourlyRate.max / 10) * 10 : formData.hourlyRate.max;

    // Validate hourly rate range before submission
    if (roundedMin > 0 && roundedMax > 0 && roundedMin > roundedMax) {
      toast.error("Minimum rate cannot be greater than maximum rate");
      return;
    }

    // Show message if values were rounded
    if (formData.hourlyRate.min > 0 && roundedMin !== formData.hourlyRate.min) {
      toast.info(`Minimum rate rounded to ${roundedMin} (must be a multiple of 10)`);
    }
    if (formData.hourlyRate.max > 0 && roundedMax !== formData.hourlyRate.max) {
      toast.info(`Maximum rate rounded to ${roundedMax} (must be a multiple of 10)`);
    }

    try {
      // Send the profile update with document files (using rounded values)
      const result = await dispatch(
        updateProfile({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          bio: formData.bio,
          address: formData.address,
          hourlyRate: {
            min: roundedMin,
            max: roundedMax,
          },
          skills: formData.skills.length > 0 ? formData.skills : ["JavaScript"],
          education: formData.education,
          experience: formData.experience,
          portfolioItems: formData.portfolioItems,
          social: formData.socialLinks,
          verificationDocuments: formData.verificationDocuments,
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

  // Add/remove skill
  const [newSkill, setNewSkill] = useState("");

  const addSkill = () => {
    if (newSkill && !formData.skills.includes(newSkill)) {
      const newSkills = [...formData.skills, newSkill];
      setFormData({
        ...formData,
        skills: newSkills,
      });
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove) => {
    const newSkills = formData.skills.filter((skill) => skill !== skillToRemove);
    setFormData({
      ...formData,
      skills: newSkills,
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Auto-enable edit mode if not already enabled (for avatar click in view mode)
    if (!isEditing) {
      setIsEditing(true);
    }

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

  // Handle resume upload
  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload only PDF, DOC, DOCX, or TXT files for resume");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Resume file size should be less than 10MB");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const response = await api.post("/api/upload/resume", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        toast.success("Resume uploaded successfully");
        console.log("Resume upload response:", response.data);
        // Update form data with resume info
        setFormData((prev) => ({
          ...prev,
          resume: {
            filename: response.data.data.resume.filename,
            originalname: response.data.data.resume.originalname,
            mimetype: response.data.data.resume.mimetype,
            size: response.data.data.resume.size,
            uploadedAt: response.data.data.resume.uploadedAt,
          },
          // parsedResumeData: response.data.data.parsedData,
        }));

        // Show message about background parsing
        // if (!response.data.data.parsedData) {
        //   toast("Resume is being parsed in the background. Parsed data will appear shortly.");

        //   // Poll for parsed data updates every 5 seconds for up to 2 minutes
        //   let pollCount = 0;
        //   const maxPolls = 24; // 2 minutes / 5 seconds

        //   const pollForParsedData = setInterval(async () => {
        //     pollCount++;
        //     try {
        //       const profileResponse = await dispatch(fetchMyProfile());
        //       const profile = profileResponse.payload?.data?.profile;

        //       if (profile?.user?.parsedResumeData) {
        //         clearInterval(pollForParsedData);
        //         toast.success("Resume parsed successfully!");
        //         console.log("Parsed resume data:", profile.user.parsedResumeData);

        //         // Update form data with parsed data
        //         setFormData((prev) => ({
        //           ...prev,
        //           parsedResumeData: profile.user.parsedResumeData,
        //           resumeParsedAt: profile.user.resumeParsedAt,
        //         }));
        //       } else if (pollCount >= maxPolls) {
        //         clearInterval(pollForParsedData);
        //         toast.warning("Resume parsing is taking longer than expected. Please refresh the page later.");
        //       }
        //     } catch (error) {
        //       console.error("Error polling for parsed data:", error);
        //       if (pollCount >= maxPolls) {
        //         clearInterval(pollForParsedData);
        //       }
        //     }
        //   }, 5000);
        // } else {
        //   toast.success("Resume parsed successfully! Check console for details.");
        //   console.log("Parsed resume data:", response.data.data.parsedData);
        // }

        // Refresh profile data
        dispatch(fetchMyProfile());
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload resume");
    }
  };

  // Handle resume deletion
  const handleResumeDelete = async () => {
    try {
      const response = await api.delete("/api/upload/resume");

      if (response.data.success) {
        toast.success("Resume deleted successfully");
        // Clear resume data from form
        setFormData((prev) => ({
          ...prev,
          resume: {
            filename: "",
            originalname: "",
            mimetype: "",
            size: 0,
            uploadedAt: null,
          },
          // parsedResumeData: null,
          // resumeParsedAt: null,
        }));
        // Refresh profile data
        dispatch(fetchMyProfile());
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete resume");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {/* Profile Header */}
          <div className="bg-background-light p-6 rounded-lg shadow-md mb-8 flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center">
              <div className="relative mb-4 md:mb-0 md:mr-6">
                <div
                  className={`w-32 h-32 rounded-full flex items-center justify-center overflow-hidden relative group cursor-pointer transition-all ${
                    !isEditing && !data?.data?.profile?.user?.avatar && !linkedinStatus.profileData?.picture
                      ? "bg-gray-100 border-2 border-dashed border-gray-400 hover:border-primary"
                      : "bg-gray-300"
                  }`}
                >
                  {data?.data?.profile?.user?.avatar ? (
                    <img
                      src={data.data.profile.user.avatar}
                      alt={formData.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : linkedinStatus.profileData?.picture ? (
                    <img
                      src={linkedinStatus.profileData.picture}
                      alt={linkedinStatus.profileData.name || formData.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-10 w-10 text-gray-400 mb-2"
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
                      {!isEditing && (
                        <span className="text-xs text-gray-600 font-medium text-center">
                          Click to add
                          <br />
                          profile photo
                        </span>
                      )}
                    </div>
                  )}
                  {/* Overlay on hover in view mode */}
                  {!isEditing && (
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-full transition-all duration-200" />
                  )}
                  {/* Click handler for view mode */}
                  {!isEditing && (
                    <div
                      className="absolute inset-0 cursor-pointer z-10"
                      onClick={() => {
                        setTriggerFileInput(true);
                        setIsEditing(true);
                      }}
                      title="Click to add or change profile photo"
                    />
                  )}
                </div>
                {/* Always visible camera icon badge outside avatar when avatar exists and in view mode */}
                {!isEditing && data?.data?.profile?.user?.avatar && (
                  <div className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg z-20">
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
                  </div>
                )}
                {isEditing && (
                  <label
                    htmlFor="profile-image"
                    className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 shadow-lg z-10"
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
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadLoading}
                />
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-semibold">{formData.fullName}</h2>
                  {/* Skills Assessment Stars */}
                  {data?.data?.profile?.testScore?.score !== null &&
                    data?.data?.profile?.testScore?.score !== undefined &&
                    data?.data?.profile?.testScore?.maxScore > 0 && (
                      <div className="flex items-center gap-1">
                        {(() => {
                          const percentage =
                            (data.data.profile.testScore.score / data.data.profile.testScore.maxScore) * 100;
                          const filledStars = Math.round((percentage / 100) * 5);
                          return Array.from({ length: 5 }).map((_, index) => {
                            const isFilled = index < filledStars;
                            return (
                              <svg
                                key={index}
                                className={`w-6 h-6 ${isFilled ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            );
                          });
                        })()}
                        <span className="ml-2 text-sm font-medium text-gray-600">
                          ({data.data.profile.testScore.score}/{data.data.profile.testScore.maxScore})
                        </span>
                      </div>
                    )}
                </div>
                {(data?.data?.profile?.user?.companyFreelancer?.companyName ||
                  data?.data?.profile?.user?.companyFreelancerName) && (
                  <p className="text-sm text-primary font-medium mt-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    Company:{" "}
                    {data.data.profile.user.companyFreelancer?.companyName ||
                      data.data.profile.user.companyFreelancerName}
                  </p>
                )}
                {formData.address.city && formData.address.country && (
                  <p className="text-gray-600 mb-1">
                    {formData.address.city}, {formData.address.country}
                  </p>
                )}
                <p className="text-primary font-semibold">{formData.title}</p>
                {/* Skills Summary */}
                {formData.skills && formData.skills.length > 0 && (
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs text-gray-500 font-medium">Skills:</span>
                    <div className="flex flex-wrap gap-1">
                      {formData.skills.slice(0, 5).map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {typeof skill === "string" ? skill : skill.name || skill}
                        </span>
                      ))}
                      {formData.skills.length > 5 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          +{formData.skills.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
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

          {/* Resume Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4 text-red-600">Delete Resume</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete your resume? This action cannot be undone.
                  {/* and will also remove all parsed resume data. */}
                </p>
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      handleResumeDelete();
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete Resume
                  </button>
                </div>
              </div>
            </div>
          )}

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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="font-bold">Success</p>
                  <p>Your profile has been successfully updated.</p>
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
                    activeTab === "basic"
                      ? "border-b-2 border-primary text-primary"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Basic Information
                </button>
              </li>
              <li className="mr-2" onClick={() => setActiveTab("skills")}>
                <button
                  className={`inline-block p-4 ${
                    activeTab === "skills"
                      ? "border-b-2 border-primary text-primary"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Skills & Expertise
                </button>
              </li>
              <li className="mr-2" onClick={() => setActiveTab("experience")}>
                <button
                  className={`inline-block p-4 ${
                    activeTab === "experience"
                      ? "border-b-2 border-primary text-primary"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Experience & Education
                </button>
              </li>
              <li className="mr-2" onClick={() => setActiveTab("portfolio")}>
                <button
                  className={`inline-block p-4 ${
                    activeTab === "portfolio"
                      ? "border-b-2 border-primary text-primary"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Portfolio
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
              <li className="mr-2" onClick={() => setActiveTab("test")}>
                <button
                  className={`inline-block p-4 ${
                    activeTab === "test"
                      ? "border-b-2 border-primary text-primary"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Test Results
                </button>
              </li>
            </ul>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit}>
            {/* Basic Information Tab */}
            {activeTab === "basic" && (
              <div className="bg-white p-6 rounded-lg">
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

                    <p className="text-xs text-gray-500 mt-1">Your contact number for professional communication</p>
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

                  <div className="col-span-2">
                    <label className="block text-gray-700 mb-2">Hourly Rate Range (USD)</label>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <input
                          type="number"
                          id="hourlyRate.min"
                          name="hourlyRate.min"
                          value={formData.hourlyRate.min}
                          onChange={handleChange}
                          disabled={!isEditing}
                          min="0"
                          step="10"
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Minimum rate"
                        />
                      </div>
                      <span className="text-gray-500">to</span>
                      <div className="flex-1">
                        <input
                          type="number"
                          id="hourlyRate.max"
                          name="hourlyRate.max"
                          value={formData.hourlyRate.max}
                          onChange={handleChange}
                          disabled={!isEditing}
                          min="0"
                          step="10"
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Maximum rate"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Rates must be in multiples of 10 (USD)</p>
                  </div>

                  {/* Resume Upload Section */}
                  <div className="col-span-2 mt-6">
                    <h3 className="text-lg font-semibold mb-4">Resume</h3>
                    <div className="border border-gray-300 rounded-lg p-4">
                      {formData.resume.filename ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <svg
                                className="w-8 h-8 text-gray-400"
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
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{formData.resume.originalname}</p>
                              <p className="text-xs text-gray-500">
                                {(formData.resume.size / 1024 / 1024).toFixed(2)} MB •
                                {formData.resume.uploadedAt &&
                                  ` Uploaded ${new Date(formData.resume.uploadedAt).toLocaleDateString()}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <a
                              href={`${
                                import.meta.env.VITE_API_URL || "http://localhost:2001"
                              }/api/upload/files/resumes/${formData.resume.filename}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary-dark text-sm font-medium"
                            >
                              View
                            </a>
                            <span className="text-gray-300">|</span>
                            <a
                              href={`${
                                import.meta.env.VITE_API_URL || "http://localhost:2001"
                              }/api/upload/files/resumes/${formData.resume.filename}`}
                              download={formData.resume.originalname}
                              className="text-primary hover:text-primary-dark text-sm font-medium"
                            >
                              Download
                            </a>
                            {isEditing && (
                              <>
                                <span className="text-gray-300">|</span>
                                <label
                                  htmlFor="resume-upload"
                                  className="text-primary hover:text-primary-dark text-sm font-medium cursor-pointer"
                                >
                                  Replace
                                </label>
                                <span className="text-gray-300">|</span>
                                <button
                                  onClick={() => setShowDeleteConfirm(true)}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
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
                          <p className="mt-2 text-sm text-gray-600">No resume uploaded</p>
                          <p className="text-xs text-gray-500">Upload your resume to showcase your experience</p>
                          {isEditing && (
                            <label
                              htmlFor="resume-upload"
                              className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark cursor-pointer"
                            >
                              Upload Resume
                            </label>
                          )}
                        </div>
                      )}
                      <input
                        type="file"
                        id="resume-upload"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleResumeUpload}
                        disabled={!isEditing}
                      />
                      <p className="text-xs text-gray-500 mt-2">Accepted formats: PDF, DOC, DOCX, TXT (max 10MB)</p>
                    </div>
                  </div>

                  {/* Parsed Resume Data Section */}
                  {/* {formData.parsedResumeData && (
                    <div className="col-span-2 mt-6">
                      <h3 className="text-lg font-semibold mb-4">Parsed Resume Data</h3>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">Personal Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {formData.parsedResumeData.name && (
                              <div>
                                <span className="font-medium">Name:</span> {formData.parsedResumeData.name}
                              </div>
                            )}
                            {formData.parsedResumeData.phone && (
                              <div>
                                <span className="font-medium">Phone:</span> {formData.parsedResumeData.phone}
                              </div>
                            )}
                            {formData.parsedResumeData.mail && (
                              <div>
                                <span className="font-medium">Email:</span> {formData.parsedResumeData.mail}
                              </div>
                            )}
                            {formData.parsedResumeData.location && (
                              <div>
                                <span className="font-medium">Location:</span> {formData.parsedResumeData.location}
                              </div>
                            )}
                            {formData.parsedResumeData.total_experience_years && (
                              <div>
                                <span className="font-medium">Experience:</span>{" "}
                                {formData.parsedResumeData.total_experience_years} years
                              </div>
                            )}
                          </div>
                        </div>

                        {formData.parsedResumeData.skills && formData.parsedResumeData.skills.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 mb-2">Skills</h4>
                            <div className="flex flex-wrap gap-2">
                              {formData.parsedResumeData.skills.map((skill, index) => (
                                <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {formData.parsedResumeData.education && formData.parsedResumeData.education.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 mb-2">Education</h4>
                            {formData.parsedResumeData.education.map((edu, index) => (
                              <div key={index} className="text-sm mb-2">
                                <div className="font-medium">{edu.name}</div>
                                <div className="text-gray-600">{edu.qualification}</div>
                              </div>
                            ))}
                          </div>
                        )}

                        {formData.parsedResumeData.experience && formData.parsedResumeData.experience.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 mb-2">Experience</h4>
                            {formData.parsedResumeData.experience.map((exp, index) => (
                              <div key={index} className="text-sm mb-2">
                                <div className="font-medium">
                                  {exp.designation} at {exp.company_name}
                                </div>
                                <div className="text-gray-600">{exp.description}</div>
                                {exp.location && (
                                  <div className="text-gray-500">
                                    <span className="font-medium">Location:</span> {exp.location}
                                  </div>
                                )}
                                <div className="text-gray-500">
                                  {exp.start} - {exp.end}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {formData.parsedResumeData.projects && formData.parsedResumeData.projects.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 mb-2">Projects</h4>
                            {formData.parsedResumeData.projects.map((project, index) => (
                              <div key={index} className="text-sm mb-2">
                                <div className="font-medium">{project.title}</div>
                                <div className="text-gray-600">{project.description}</div>
                                {project.project_link && (
                                  <div className="text-blue-600 mt-1">
                                    <a
                                      href={project.project_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:underline"
                                    >
                                      View Project →
                                    </a>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="text-xs text-gray-500 mt-2">
                          Parsed on: {formData.resumeParsedAt && new Date(formData.resumeParsedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )} */}

                  {/* Social Links Section */}
                  <div className="col-span-2 mt-8">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Social Links</h3>
                      <p className="text-sm text-gray-500">
                        Connect your professional profiles to showcase your expertise
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* LinkedIn Card */}
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                        <div className="p-5">
                          <div className="flex items-center justify-between mb-4">
                            <label
                              className="flex items-center gap-2 text-sm font-semibold text-gray-900"
                              htmlFor="linkedin"
                            >
                              <svg className="w-5 h-5 text-[#0077b5]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                              </svg>
                              LinkedIn
                              {linkedinStatus.isVerified && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Verified
                                </span>
                              )}
                            </label>
                            {isEditing && linkedinStatus.isVerified && (
                              <button
                                type="button"
                                onClick={() => setShowLinkedInDisconnectModal(true)}
                                className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50"
                                title="Disconnect LinkedIn"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>

                          {linkedinStatus.isVerified ? (
                            <div className="space-y-3">
                              <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                                {linkedinStatus.profileData?.picture && (
                                  <div className="flex-shrink-0">
                                    <img
                                      src={linkedinStatus.profileData.picture}
                                      alt={linkedinStatus.profileData?.name || "LinkedIn profile"}
                                      className="w-14 h-14 rounded-full object-cover border-2 border-green-300 shadow-sm"
                                    />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  {linkedinStatus.profileData?.name && (
                                    <p className="text-sm font-bold text-gray-900 mb-1 truncate">
                                      {linkedinStatus.profileData.name}
                                    </p>
                                  )}
                                  <p className="text-xs font-medium text-green-700 mb-1">Account verified</p>
                                  {linkedinStatus.verifiedAt && (
                                    <p className="text-xs text-gray-500">
                                      Verified on {new Date(linkedinStatus.verifiedAt).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {isEditing && (
                                <input
                                  type="url"
                                  id="linkedin"
                                  name="socialLinks.linkedin"
                                  value={formData.socialLinks.linkedin}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      socialLinks: { ...formData.socialLinks, linkedin: e.target.value },
                                    })
                                  }
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0077b5] focus:border-transparent bg-white"
                                  placeholder="https://linkedin.com/in/your-profile"
                                />
                              )}
                              {!isEditing && formData.socialLinks.linkedin && (
                                <a
                                  href={formData.socialLinks.linkedin}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block text-sm text-[#0077b5] hover:underline font-medium truncate"
                                >
                                  {formData.socialLinks.linkedin}
                                </a>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={handleLinkedInAuth}
                                    disabled={linkedinLoading}
                                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                                      linkedinLoading
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "bg-[#0077b5] text-white hover:bg-[#005885] shadow-sm hover:shadow-md"
                                    }`}
                                  >
                                    {linkedinLoading ? (
                                      <>
                                        <svg
                                          className="animate-spin h-5 w-5"
                                          xmlns="http://www.w3.org/2000/svg"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                        >
                                          <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                          ></circle>
                                          <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                          ></path>
                                        </svg>
                                        <span>Connecting...</span>
                                      </>
                                    ) : (
                                      <>
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                        </svg>
                                        <span>Verify LinkedIn Account</span>
                                      </>
                                    )}
                                  </button>
                                  <p className="text-xs text-gray-500 leading-relaxed">
                                    Verify your LinkedIn account by signing in. This ensures your profile is authentic.
                                  </p>
                                </>
                              ) : (
                                <div className="text-center py-4 px-3 bg-gray-50 rounded-lg border border-gray-200">
                                  <p className="text-sm text-gray-600">
                                    Click "Edit Profile" to verify your LinkedIn account
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* GitHub Card */}
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                        <div className="p-5">
                          <label
                            className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-4"
                            htmlFor="github"
                          >
                            <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                              <path
                                fillRule="evenodd"
                                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                                clipRule="evenodd"
                              />
                            </svg>
                            GitHub
                          </label>
                          <input
                            type="url"
                            id="github"
                            name="socialLinks.github"
                            value={formData.socialLinks.github}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                socialLinks: { ...formData.socialLinks, github: e.target.value },
                              })
                            }
                            disabled={!isEditing}
                            className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-white disabled:bg-gray-50 disabled:text-gray-500"
                            placeholder="https://github.com/your-username"
                          />
                        </div>
                      </div>

                      {/* Portfolio Website Card */}
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                        <div className="p-5">
                          <label
                            className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-4"
                            htmlFor="portfolio"
                          >
                            <svg
                              className="w-5 h-5 text-gray-700"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                              />
                            </svg>
                            Portfolio Website
                          </label>
                          <input
                            type="url"
                            id="portfolio"
                            name="socialLinks.portfolio"
                            value={formData.socialLinks.portfolio}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                socialLinks: { ...formData.socialLinks, portfolio: e.target.value },
                              })
                            }
                            disabled={!isEditing}
                            className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white disabled:bg-gray-50 disabled:text-gray-500"
                            placeholder="https://your-portfolio.com"
                          />
                        </div>
                      </div>
                    </div>
                    {githubAnalysis && (
                      <div className="mt-8">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                          {/* Header Section */}
                          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                              <div className="flex items-center gap-4">
                                {githubProfileInfo?.avatarUrl && (
                                  <img
                                    src={githubProfileInfo.avatarUrl}
                                    alt={githubProfileInfo?.username || "GitHub avatar"}
                                    className="h-16 w-16 rounded-full border-2 border-white shadow-md object-cover"
                                  />
                                )}
                                <div>
                                  <div className="flex items-center gap-3 flex-wrap">
                                    {githubProfileInfo?.username && (
                                      <a
                                        href={githubProfileInfo.profileUrl || githubAnalysis.profileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-lg font-bold text-gray-900 hover:text-gray-700 transition-colors"
                                      >
                                        <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                                          <path
                                            fillRule="evenodd"
                                            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                        @{githubProfileInfo.username}
                                      </a>
                                    )}
                                    {githubProfileInfo?.name && (
                                      <span className="text-sm text-gray-600 font-medium">
                                        {githubProfileInfo.name}
                                      </span>
                                    )}
                                  </div>
                                  {githubProfileInfo?.bio && (
                                    <p className="mt-1 text-sm text-gray-600 max-w-2xl">{githubProfileInfo.bio}</p>
                                  )}
                                  {githubProfileInfo?.profileUrl && (
                                    <a
                                      href={githubProfileInfo.profileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                                    >
                                      View GitHub profile
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                        />
                                      </svg>
                                    </a>
                                  )}
                                </div>
                              </div>
                              {githubAnalyzedAtLabel && (
                                <div className="flex items-center gap-2 text-xs text-gray-500 bg-white px-3 py-1.5 rounded-full border border-gray-200">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  Last analyzed: {githubAnalyzedAtLabel}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Stats Section */}
                          <div className="px-6 py-5">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                              {githubProfileInfo?.publicRepos !== undefined &&
                                githubProfileInfo?.publicRepos !== null && (
                                  <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                                      PUBLIC REPOS
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900">{githubProfileInfo.publicRepos}</p>
                                  </div>
                                )}
                              {githubProfileInfo?.followers !== undefined && githubProfileInfo?.followers !== null && (
                                <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                                    FOLLOWERS
                                  </p>
                                  <p className="text-2xl font-bold text-gray-900">{githubProfileInfo.followers}</p>
                                </div>
                              )}
                              {githubProfileInfo?.following !== undefined && githubProfileInfo?.following !== null && (
                                <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                                    FOLLOWING
                                  </p>
                                  <p className="text-2xl font-bold text-gray-900">{githubProfileInfo.following}</p>
                                </div>
                              )}
                              {githubRepoSummary?.primaryLanguage && (
                                <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                                    PRIMARY LANGUAGE
                                  </p>
                                  <p className="text-xl font-bold text-gray-900">{githubRepoSummary.primaryLanguage}</p>
                                </div>
                              )}
                            </div>

                            {/* Languages Section */}
                            {githubLanguages.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                  <svg
                                    className="w-4 h-4 text-gray-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  TOP LANGUAGES
                                </h4>
                                <div className="flex flex-wrap gap-2.5">
                                  {githubLanguages.slice(0, 6).map((language) => {
                                    const percentageLabel = formatLanguagePercentage(language.percentage);
                                    return (
                                      <span
                                        key={language.language}
                                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm"
                                      >
                                        <span className="font-bold">{language.language}</span>
                                        {percentageLabel && (
                                          <span className="text-xs text-gray-600 bg-white px-2 py-0.5 rounded-full">
                                            {percentageLabel}
                                          </span>
                                        )}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Skills Tab */}
            {activeTab === "skills" && (
              <div className="bg-white p-6 rounded-lg ">
                <h3 className="text-lg font-semibold mb-4">Skills & Expertise</h3>

                {isEditing ? (
                  <div className="mb-6">
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Add a skill"
                        className="flex-grow p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button type="button" onClick={addSkill} className="btn-primary px-4 py-2 rounded-md">
                        Add
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((skill, index) => (
                        <div key={index} className="bg-background-light px-3 py-2 rounded-md flex items-center">
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="ml-2 text-gray-500 hover:text-red-500"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, index) => (
                      <div key={index} className="bg-background-light px-3 py-2 rounded-md">
                        {skill}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Experience Tab */}
            {activeTab === "experience" && (
              <div className="bg-white p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Work Experience</h3>

                {/* Empty State - Show when no experience and not editing */}
                {!isEditing && formData.experience.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <svg
                      className="mx-auto h-16 w-16 text-gray-400 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No work experience added yet</h4>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      Showcase your professional experience to help clients understand your background and expertise.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(true);
                        // Automatically add a new empty experience entry when entering edit mode
                        const newExperience = JSON.parse(JSON.stringify(formData.experience || []));
                        newExperience.push({
                          title: "",
                          company: "",
                          location: "",
                          from: "",
                          to: "",
                          current: false,
                          description: "",
                        });
                        setFormData({
                          ...formData,
                          experience: newExperience,
                        });
                      }}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Add Work Experience
                    </button>
                  </div>
                )}

                {/* Show existing experiences */}
                {formData.experience.length > 0 &&
                  formData.experience.map((exp, index) => (
                    <div key={index} className="mb-6 pb-6 border-b border-gray-200">
                      {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-gray-700 mb-2">Job Title</label>
                            <input
                              type="text"
                              value={exp.title || ""}
                              onChange={(e) => {
                                const newExperience = JSON.parse(JSON.stringify(formData.experience));
                                newExperience[index].title = e.target.value;
                                setFormData({ ...formData, experience: newExperience });
                              }}
                              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>

                          <div>
                            <label className="block text-gray-700 mb-2">Company</label>
                            <input
                              type="text"
                              value={exp.company || ""}
                              onChange={(e) => {
                                const newExperience = JSON.parse(JSON.stringify(formData.experience));
                                newExperience[index].company = e.target.value;
                                setFormData({ ...formData, experience: newExperience });
                              }}
                              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>

                          <div>
                            <label className="block text-gray-700 mb-2">Location</label>
                            <input
                              type="text"
                              value={exp.location || ""}
                              onChange={(e) => {
                                const newExperience = JSON.parse(JSON.stringify(formData.experience));
                                newExperience[index].location = e.target.value;
                                setFormData({ ...formData, experience: newExperience });
                              }}
                              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>

                          <div>
                            <label className="block text-gray-700 mb-2">Start Date</label>
                            <input
                              type="date"
                              value={exp.from ? new Date(exp.from).toISOString().split("T")[0] : ""}
                              onChange={(e) => {
                                const newExperience = JSON.parse(JSON.stringify(formData.experience));
                                newExperience[index].from = e.target.value;
                                setFormData({ ...formData, experience: newExperience });
                              }}
                              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>

                          <div>
                            <label className="block text-gray-700 mb-2">End Date</label>
                            <input
                              type="date"
                              value={exp.to ? new Date(exp.to).toISOString().split("T")[0] : ""}
                              onChange={(e) => {
                                const newExperience = JSON.parse(JSON.stringify(formData.experience));
                                newExperience[index].to = e.target.value;
                                setFormData({ ...formData, experience: newExperience });
                              }}
                              disabled={exp.current}
                              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>

                          <div className="flex items-center mt-2">
                            <input
                              type="checkbox"
                              id={`current-job-${index}`}
                              checked={exp.current || false}
                              onChange={(e) => {
                                const newExperience = JSON.parse(JSON.stringify(formData.experience));
                                newExperience[index].current = e.target.checked;
                                setFormData({ ...formData, experience: newExperience });
                              }}
                              className="mr-2"
                            />
                            <label htmlFor={`current-job-${index}`} className="text-gray-700">
                              I currently work here
                            </label>
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-gray-700 mb-2">Description</label>
                            <textarea
                              value={exp.description || ""}
                              onChange={(e) => {
                                const newExperience = JSON.parse(JSON.stringify(formData.experience));
                                newExperience[index].description = e.target.value;
                                setFormData({ ...formData, experience: newExperience });
                              }}
                              rows="3"
                              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>

                          <div className="mt-3 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                const newExperience = JSON.parse(JSON.stringify(formData.experience));
                                newExperience.splice(index, 1);
                                setFormData({ ...formData, experience: newExperience });
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-lg font-medium">{exp.title}</h4>
                          <p className="text-gray-600">{exp.company}</p>
                          <p className="text-gray-500">
                            {new Date(exp.from).toLocaleDateString()} -{" "}
                            {exp.current ? "Present" : new Date(exp.to).toLocaleDateString()}
                          </p>
                          <p className="mt-2">{exp.description}</p>
                        </div>
                      )}
                    </div>
                  ))}

                {/* Add button when editing and there are existing experiences */}
                {isEditing && formData.experience.length > 0 && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        const newExperience = JSON.parse(JSON.stringify(formData.experience || []));
                        newExperience.push({
                          title: "",
                          company: "",
                          location: "",
                          from: "",
                          to: "",
                          current: false,
                          description: "",
                        });
                        setFormData({
                          ...formData,
                          experience: newExperience,
                        });
                      }}
                      className="btn-outline"
                    >
                      + Add Work Experience
                    </button>
                  </div>
                )}

                {/* Education Section */}
                <div className="mt-12">
                  <h3 className="text-lg font-semibold mb-4">Education</h3>

                  {/* Empty State - Show when no education and not editing */}
                  {!isEditing && formData.education.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                      <svg
                        className="mx-auto h-16 w-16 text-gray-400 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 14l9-5-9-5-9 5 9 5z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                        />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14v7m-4-4h8" />
                      </svg>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No education added yet</h4>
                      <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        Add your educational background to showcase your qualifications and academic achievements.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(true);
                          // Automatically add a new empty education entry when entering edit mode
                          const newEducation = JSON.parse(JSON.stringify(formData.education || []));
                          newEducation.push({
                            institution: "",
                            degree: "",
                            fieldOfStudy: "",
                            from: "",
                            to: "",
                            current: false,
                            description: "",
                          });
                          setFormData({
                            ...formData,
                            education: newEducation,
                          });
                        }}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Education
                      </button>
                    </div>
                  )}

                  {/* Show existing education entries */}
                  {formData.education.length > 0 &&
                    formData.education.map((edu, index) => (
                      <div key={index} className="mb-6 pb-6 border-b border-gray-200">
                        {isEditing ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-gray-700 mb-2">Institution *</label>
                              <input
                                type="text"
                                value={edu.institution || ""}
                                onChange={(e) => {
                                  const newEducation = JSON.parse(JSON.stringify(formData.education));
                                  newEducation[index].institution = e.target.value;
                                  setFormData({ ...formData, education: newEducation });
                                }}
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="University/School name"
                              />
                            </div>

                            <div>
                              <label className="block text-gray-700 mb-2">Degree *</label>
                              <input
                                type="text"
                                value={edu.degree || ""}
                                onChange={(e) => {
                                  const newEducation = JSON.parse(JSON.stringify(formData.education));
                                  newEducation[index].degree = e.target.value;
                                  setFormData({ ...formData, education: newEducation });
                                }}
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="e.g., Bachelor's, Master's, PhD"
                              />
                            </div>

                            <div>
                              <label className="block text-gray-700 mb-2">Field of Study *</label>
                              <input
                                type="text"
                                value={edu.fieldOfStudy || ""}
                                onChange={(e) => {
                                  const newEducation = JSON.parse(JSON.stringify(formData.education));
                                  newEducation[index].fieldOfStudy = e.target.value;
                                  setFormData({ ...formData, education: newEducation });
                                }}
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="e.g., Computer Science, Business Administration"
                              />
                            </div>

                            <div>
                              <label className="block text-gray-700 mb-2">Start Date *</label>
                              <input
                                type="date"
                                value={edu.from ? new Date(edu.from).toISOString().split("T")[0] : ""}
                                onChange={(e) => {
                                  const newEducation = JSON.parse(JSON.stringify(formData.education));
                                  newEducation[index].from = e.target.value;
                                  setFormData({ ...formData, education: newEducation });
                                }}
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            </div>

                            <div>
                              <label className="block text-gray-700 mb-2">End Date</label>
                              <input
                                type="date"
                                value={edu.to ? new Date(edu.to).toISOString().split("T")[0] : ""}
                                onChange={(e) => {
                                  const newEducation = JSON.parse(JSON.stringify(formData.education));
                                  newEducation[index].to = e.target.value;
                                  setFormData({ ...formData, education: newEducation });
                                }}
                                disabled={edu.current}
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            </div>

                            <div className="flex items-center mt-2">
                              <input
                                type="checkbox"
                                id={`current-education-${index}`}
                                checked={edu.current || false}
                                onChange={(e) => {
                                  const newEducation = JSON.parse(JSON.stringify(formData.education));
                                  newEducation[index].current = e.target.checked;
                                  setFormData({ ...formData, education: newEducation });
                                }}
                                className="mr-2"
                              />
                              <label htmlFor={`current-education-${index}`} className="text-gray-700">
                                I am currently studying here
                              </label>
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-gray-700 mb-2">Description</label>
                              <textarea
                                value={edu.description || ""}
                                onChange={(e) => {
                                  const newEducation = JSON.parse(JSON.stringify(formData.education));
                                  newEducation[index].description = e.target.value;
                                  setFormData({ ...formData, education: newEducation });
                                }}
                                rows="3"
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Additional details about your education (e.g., honors, achievements, relevant coursework)"
                              />
                            </div>

                            <div className="mt-3 flex justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  const newEducation = JSON.parse(JSON.stringify(formData.education));
                                  newEducation.splice(index, 1);
                                  setFormData({ ...formData, education: newEducation });
                                }}
                                className="text-red-500 hover:text-red-700"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <h4 className="text-lg font-medium">
                              {edu.degree && edu.fieldOfStudy
                                ? `${edu.degree} in ${edu.fieldOfStudy}`
                                : edu.degree || edu.fieldOfStudy || "Education"}
                            </h4>
                            {edu.institution && <p className="text-gray-600">{edu.institution}</p>}
                            <p className="text-gray-500">
                              {edu.from ? new Date(edu.from).toLocaleDateString() : ""}
                              {edu.from && (edu.current || edu.to) ? " - " : ""}
                              {edu.current ? "Present" : edu.to ? new Date(edu.to).toLocaleDateString() : ""}
                            </p>
                            {edu.description && <p className="mt-2">{edu.description}</p>}
                          </div>
                        )}
                      </div>
                    ))}

                  {/* Add button when editing and there are existing education entries */}
                  {isEditing && formData.education.length > 0 && (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          const newEducation = JSON.parse(JSON.stringify(formData.education || []));
                          newEducation.push({
                            institution: "",
                            degree: "",
                            fieldOfStudy: "",
                            from: "",
                            to: "",
                            current: false,
                            description: "",
                          });
                          setFormData({
                            ...formData,
                            education: newEducation,
                          });
                        }}
                        className="btn-outline"
                      >
                        + Add Education
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Portfolio Tab */}
            {activeTab === "portfolio" && (
              <div className="bg-white p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Portfolio Items</h3>

                {/* Empty State - Show when no portfolio items and not editing */}
                {!isEditing && formData.portfolioItems.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <svg
                      className="mx-auto h-16 w-16 text-gray-400 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No portfolio items added yet</h4>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      Showcase your best work and projects to demonstrate your skills and attract potential clients.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(true);
                        // Automatically add a new empty portfolio item when entering edit mode
                        const newPortfolioItems = JSON.parse(JSON.stringify(formData.portfolioItems || []));
                        newPortfolioItems.push({
                          title: "",
                          description: "",
                          imageUrl: "",
                          projectUrl: "",
                        });
                        setFormData({
                          ...formData,
                          portfolioItems: newPortfolioItems,
                        });
                      }}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Add Portfolio Item
                    </button>
                  </div>
                )}

                {/* Show existing portfolio items */}
                {formData.portfolioItems.length > 0 &&
                  formData.portfolioItems.map((item, index) => (
                    <div key={index} className="mb-6 pb-6 border-b border-gray-200">
                      {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-gray-700 mb-2">Project Title</label>
                            <input
                              type="text"
                              value={item.title || ""}
                              onChange={(e) => {
                                const newPortfolioItems = JSON.parse(JSON.stringify(formData.portfolioItems));
                                newPortfolioItems[index].title = e.target.value;
                                setFormData({ ...formData, portfolioItems: newPortfolioItems });
                              }}
                              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>

                          <div>
                            <label className="block text-gray-700 mb-2">Project URL</label>
                            <input
                              type="url"
                              value={item.projectUrl || ""}
                              onChange={(e) => {
                                const newPortfolioItems = JSON.parse(JSON.stringify(formData.portfolioItems));
                                newPortfolioItems[index].projectUrl = e.target.value;
                                setFormData({ ...formData, portfolioItems: newPortfolioItems });
                              }}
                              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>

                          <div>
                            <label className="block text-gray-700 mb-2">Image URL</label>
                            <input
                              type="url"
                              value={item.imageUrl || ""}
                              onChange={(e) => {
                                const newPortfolioItems = JSON.parse(JSON.stringify(formData.portfolioItems));
                                newPortfolioItems[index].imageUrl = e.target.value;
                                setFormData({ ...formData, portfolioItems: newPortfolioItems });
                              }}
                              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-gray-700 mb-2">Description</label>
                            <textarea
                              value={item.description || ""}
                              onChange={(e) => {
                                const newPortfolioItems = JSON.parse(JSON.stringify(formData.portfolioItems));
                                newPortfolioItems[index].description = e.target.value;
                                setFormData({ ...formData, portfolioItems: newPortfolioItems });
                              }}
                              rows="3"
                              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>

                          <div className="mt-3 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                const newPortfolioItems = JSON.parse(JSON.stringify(formData.portfolioItems));
                                newPortfolioItems.splice(index, 1);
                                setFormData({ ...formData, portfolioItems: newPortfolioItems });
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-lg font-medium">{item.title}</h4>
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-full h-48 object-cover rounded-lg mt-2"
                            />
                          )}
                          <p className="mt-2">{item.description}</p>
                          {item.projectUrl && (
                            <a
                              href={item.projectUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline mt-2 inline-block"
                            >
                              View Project
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                {/* Add button when editing and there are existing portfolio items */}
                {isEditing && formData.portfolioItems.length > 0 && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        const newPortfolioItems = JSON.parse(JSON.stringify(formData.portfolioItems || []));
                        newPortfolioItems.push({
                          title: "",
                          description: "",
                          imageUrl: "",
                          projectUrl: "",
                        });
                        setFormData({
                          ...formData,
                          portfolioItems: newPortfolioItems,
                        });
                      }}
                      className="btn-outline"
                    >
                      + Add Portfolio Item
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Verification Tab */}
            {activeTab === "verification" && (
              <div className="bg-white p-6 rounded-lg">
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

            {/* Test Results Tab */}
            {activeTab === "test" && (
              <div className="bg-white p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-6">Skills Assessment Test</h3>
                <p className="text-gray-600 mb-6">
                  Your test results based on your profile skills. This assessment helps verify your expertise level.
                </p>

                {data?.data?.profile?.testScore?.score !== null &&
                data?.data?.profile?.testScore?.score !== undefined ? (
                  <div className="space-y-6">
                    {/* Overall Score Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-8 shadow-lg">
                      <div className="text-center mb-6">
                        <h4 className="text-xl font-semibold text-gray-800 mb-2">Overall Score</h4>
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <span className="text-5xl font-bold text-blue-600">{data.data.profile.testScore.score}</span>
                          <span className="text-3xl text-gray-500">/</span>
                          <span className="text-5xl font-bold text-gray-600">
                            {data.data.profile.testScore.maxScore}
                          </span>
                        </div>
                        <div className="text-2xl font-semibold text-blue-700 mb-4">
                          {data.data.profile.testScore.maxScore > 0
                            ? `${Math.round(
                                (data.data.profile.testScore.score / data.data.profile.testScore.maxScore) * 100
                              )}%`
                            : "0%"}
                        </div>

                        {/* Star Rating */}
                        <div className="flex justify-center items-center gap-1 mb-4">
                          {(() => {
                            const percentage =
                              data.data.profile.testScore.maxScore > 0
                                ? (data.data.profile.testScore.score / data.data.profile.testScore.maxScore) * 100
                                : 0;
                            const filledStars = Math.round((percentage / 100) * 5);
                            return Array.from({ length: 5 }).map((_, index) => {
                              const isFilled = index < filledStars;
                              return (
                                <svg
                                  key={index}
                                  className={`w-10 h-10 ${isFilled ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                >
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                              );
                            });
                          })()}
                        </div>

                        {/* Performance Level */}
                        <div className="inline-block px-4 py-2 rounded-full bg-blue-100">
                          <span className="text-sm font-semibold text-blue-800">
                            {(() => {
                              const percentage =
                                data.data.profile.testScore.maxScore > 0
                                  ? (data.data.profile.testScore.score / data.data.profile.testScore.maxScore) * 100
                                  : 0;
                              if (percentage >= 90) return "⭐ Excellent";
                              if (percentage >= 75) return "✨ Very Good";
                              if (percentage >= 60) return "👍 Good";
                              if (percentage >= 50) return "📚 Average";
                              return "📖 Needs Improvement";
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* MCQ Score */}
                      <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-md">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="text-lg font-semibold text-gray-800">Multiple Choice Questions</h5>
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xl font-bold text-blue-600">
                              {data.data.profile.testScore.breakdown?.mcq || 0}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                          <div
                            className="bg-blue-500 h-3 rounded-full transition-all"
                            style={{
                              width: `${
                                data.data.profile.testScore.score > 0 && data.data.profile.testScore.maxScore > 0
                                  ? ((data.data.profile.testScore.breakdown?.mcq || 0) /
                                      data.data.profile.testScore.score) *
                                    100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-600">
                          {data.data.profile.testScore.breakdown?.mcq || 0} points from MCQ section
                          {data.data.profile.testScore.score > 0 && (
                            <span className="text-blue-600 font-semibold ml-1">
                              (
                              {Math.round(
                                ((data.data.profile.testScore.breakdown?.mcq || 0) /
                                  data.data.profile.testScore.score) *
                                  100
                              )}
                              % of total score)
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Theory Score */}
                      <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-md">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="text-lg font-semibold text-gray-800">Theory & Coding</h5>
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-xl font-bold text-green-600">
                              {data.data.profile.testScore.breakdown?.theory || 0}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                          <div
                            className="bg-green-500 h-3 rounded-full transition-all"
                            style={{
                              width: `${
                                data.data.profile.testScore.score > 0 && data.data.profile.testScore.maxScore > 0
                                  ? ((data.data.profile.testScore.breakdown?.theory || 0) /
                                      data.data.profile.testScore.score) *
                                    100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-600">
                          {data.data.profile.testScore.breakdown?.theory || 0} points from Theory section
                          {data.data.profile.testScore.score > 0 && (
                            <span className="text-green-600 font-semibold ml-1">
                              (
                              {Math.round(
                                ((data.data.profile.testScore.breakdown?.theory || 0) /
                                  data.data.profile.testScore.score) *
                                  100
                              )}
                              % of total score)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Test Date */}
                    {data.data.profile.testScore.evaluatedAt && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span className="text-sm">
                            Test completed on{" "}
                            {new Date(data.data.profile.testScore.evaluatedAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="flex justify-center">
                      <button
                        onClick={() => navigate("/freelancer/test")}
                        className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors shadow-md"
                      >
                        Retake Test
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <div className="mb-4">
                      <svg
                        className="w-16 h-16 mx-auto text-gray-400"
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
                    </div>
                    <h4 className="text-xl font-semibold text-gray-700 mb-2">Skills Assessment Pending</h4>
                    <p className="text-gray-600 mb-2">
                      Take the skills assessment test to validate your expertise and showcase your proficiency level to
                      potential clients.
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                      The test is based on your profile skills and helps verify how accurately your listed skills match
                      your actual knowledge.
                    </p>
                    <button
                      onClick={() => navigate("/freelancer/test")}
                      className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors shadow-md"
                    >
                      Start Assessment Test
                    </button>
                  </div>
                )}
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
      </div>

      {/* OTP Verification Modal */}
      <OTPVerification
        isOpen={showOTPModal}
        countryCode={formData.phone.countryCode}
        phoneNumber={formData.phone.number}
        onVerificationSuccess={handleOTPVerificationSuccess}
        onCancel={handleOTPCancel}
      />

      {/* LinkedIn Disconnect Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLinkedInDisconnectModal}
        onClose={() => setShowLinkedInDisconnectModal(false)}
        onConfirm={handleDisconnectLinkedIn}
        title="Disconnect LinkedIn Account"
        message="Are you sure you want to disconnect your LinkedIn account?"
        confirmText="Disconnect"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
      />
    </div>
  );
};

export default ProfilePage;

// just checking
