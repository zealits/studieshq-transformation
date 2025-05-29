import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyProfile, updateProfile } from "../../redux/slices/profileSlice";
import { uploadProfileImage } from "../../redux/slices/uploadSlice";
import { toast } from "react-toastify";
import axios from "axios";

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { data, isLoading, error } = useSelector((state) => state.profile);
  const { loading: uploadLoading, error: uploadError, success: uploadSuccess } = useSelector((state) => state.upload);
  const user = useSelector((state) => state.auth);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // State for form data
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: {
      countryCode: "+91", // Default to India
      number: "",
    },
    location: "",
    bio: "",
    hourlyRate: {
      min: 0,
      max: 0,
    },
    skills: [],
    education: [],
    experience: [],
    portfolioItems: [],
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
  });

  // State to track if document types are saved
  const [documentTypesSaved, setDocumentTypesSaved] = useState(false);

  // Fetch profile data when component mounts
  useEffect(() => {
    dispatch(fetchMyProfile());
  }, [dispatch]);

  // Update form data when profile is fetched
  useEffect(() => {
    if (data && data.success) {
      // Get the profile from the nested data structure
      const profile = data.data.profile || {};
      // console.log("Setting freelancer profile data:", profile);

      // Create deep copies of array objects to make them mutable
      const deepCopyEducation = profile.education ? profile.education.map((item) => ({ ...item })) : [];
      const deepCopyExperience = profile.experience ? profile.experience.map((item) => ({ ...item })) : [];
      const deepCopyPortfolioItems = profile.portfolioItems ? profile.portfolioItems.map((item) => ({ ...item })) : [];

      setFormData({
        fullName: profile.user?.name || "",
        email: profile.user?.email || "",
        phone: {
          countryCode: profile.phone?.countryCode || "+91",
          number: profile.phone?.number || "",
        },
        location: profile.location || "",
        bio: profile.bio || "",
        hourlyRate: {
          min: profile.hourlyRate?.min || 0,
          max: profile.hourlyRate?.max || 0,
        },
        skills: profile.skills || [],
        education: deepCopyEducation,
        experience: deepCopyExperience,
        portfolioItems: deepCopyPortfolioItems,
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

    // Handle hourly rate range
    if (name === "hourlyRate.min" || name === "hourlyRate.max") {
      const rate = Math.round(Number(value) / 10) * 10; // Round to nearest multiple of 10
      const isMin = name === "hourlyRate.min";

      // Validate min/max relationship
      if (isMin && rate > formData.hourlyRate.max) {
        toast.error("Minimum rate cannot be greater than maximum rate");
        return;
      }
      if (!isMin && rate < formData.hourlyRate.min) {
        toast.error("Maximum rate cannot be less than minimum rate");
        return;
      }

      setFormData({
        ...formData,
        hourlyRate: {
          ...formData.hourlyRate,
          [name.split(".")[1]]: rate,
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

    // Validate file type (PDF, JPG, PNG)
    const validTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF, JPG, or PNG file");
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

    try {
      // Send the profile update with document files
      const result = await dispatch(
        updateProfile({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          bio: formData.bio,
          location: formData.location,
          hourlyRate: formData.hourlyRate,
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
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
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
                <p className="text-gray-600 mb-2">{formData.location}</p>
                <div className="flex items-center">
                  <p className="text-primary font-semibold">
                    ${formData.hourlyRate.min} - ${formData.hourlyRate.max}/hr
                  </p>
                  {!isEditing && <span className="ml-2 text-sm text-gray-500">(Click Edit to modify)</span>}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="mt-4 md:mt-0 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>

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
                    <div className="flex gap-2">
                      <select
                        id="phone.countryCode"
                        name="phone.countryCode"
                        value={formData.phone.countryCode}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-24 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="+91">+91 (IN)</option>
                        <option value="+1">+1 (US)</option>
                        <option value="+44">+44 (UK)</option>
                        <option value="+61">+61 (AU)</option>
                        {/* Add more country codes as needed */}
                      </select>
                      <input
                        type="tel"
                        id="phone.number"
                        name="phone.number"
                        value={formData.phone.number}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Phone number"
                      />
                    </div>
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

                  <div className="col-span-2">
                    <label className="block text-gray-700 mb-2">Hourly Rate Range ($)</label>
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
                    <p className="text-sm text-gray-500 mt-1">Rates must be in multiples of 10</p>
                  </div>

                  {/* Social Links Section */}
                  <div className="col-span-2 mt-6">
                    <h3 className="text-lg font-semibold mb-4">Social Links</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-gray-700 mb-2" htmlFor="linkedin">
                          LinkedIn
                        </label>
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
                          disabled={!isEditing}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="https://linkedin.com/in/your-profile"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 mb-2" htmlFor="github">
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
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="https://github.com/your-username"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 mb-2" htmlFor="portfolio">
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
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="https://your-portfolio.com"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Skills Tab */}
            {activeTab === "skills" && (
              <div className="bg-white p-6 rounded-lg shadow-md">
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
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Work Experience</h3>

                {formData.experience.map((exp, index) => (
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

                {isEditing && (
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
              </div>
            )}

            {/* Portfolio Tab */}
            {activeTab === "portfolio" && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Portfolio Items</h3>

                {formData.portfolioItems.map((item, index) => (
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

                {isEditing && (
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
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Verification Documents</h3>
                <p className="text-gray-600 mb-6">
                  Please select document types and files, then click Save Changes to upload.
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
                            accept=".pdf,.jpg,.jpeg,.png"
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
                            accept=".pdf,.jpg,.jpeg,.png"
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
      </div>
    </div>
  );
};

export default ProfilePage;

// just checking
