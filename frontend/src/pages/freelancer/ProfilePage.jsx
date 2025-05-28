import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyProfile, updateProfile } from "../../redux/slices/profileSlice";
import { uploadProfileImage } from "../../redux/slices/uploadSlice";
import { toast } from "react-toastify";

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { data, isLoading, error } = useSelector((state) => state.profile);
  const { loading: uploadLoading, error: uploadError, success: uploadSuccess } = useSelector((state) => state.upload);
  const user = useSelector((state) => state.auth);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // State for form data
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    hourlyRate: 0,
    skills: [],
    education: [],
    experience: [],
    portfolioItems: [],
    socialLinks: {
      linkedin: "",
      github: "",
      portfolio: "",
    },
  });

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
        phone: profile.phone || "",
        location: profile.location || "",
        bio: profile.bio || "",
        hourlyRate: profile.hourlyRate || 0,
        skills: profile.skills || [],
        education: deepCopyEducation,
        experience: deepCopyExperience,
        portfolioItems: deepCopyPortfolioItems,
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
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting freelancer profile update:", {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      bio: formData.bio,
      location: formData.location,
      hourlyRate: formData.hourlyRate,
      skills: formData.skills.length > 0 ? formData.skills : ["JavaScript"], // Ensure skills is not empty
      education: formData.education,
      experience: formData.experience,
      portfolioItems: formData.portfolioItems,
      social: formData.socialLinks,
    });

    // Send update request
    dispatch(
      updateProfile({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        bio: formData.bio,
        location: formData.location,
        hourlyRate: formData.hourlyRate,
        skills: formData.skills.length > 0 ? formData.skills : ["JavaScript"], // Ensure skills is not empty
        education: formData.education,
        experience: formData.experience,
        portfolioItems: formData.portfolioItems,
        social: formData.socialLinks,
      })
    ).then(() => {
      setUpdateSuccess(true);
    });
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
          <div className="bg-background-light p-6 rounded-lg shadow-md mb-8 flex flex-col md:flex-row items-center">
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
              <input
                type="file"
                id="profile-image"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadLoading}
              />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">{formData.fullName}</h2>
              <p className="text-gray-600 mb-2">{formData.location}</p>
              <p className="text-primary font-semibold">${formData.hourlyRate}/hr</p>
            </div>
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

                  <div>
                    <label className="block text-gray-700 mb-2" htmlFor="hourlyRate">
                      Hourly Rate ($)
                    </label>
                    <input
                      type="number"
                      id="hourlyRate"
                      name="hourlyRate"
                      value={formData.hourlyRate}
                      onChange={handleChange}
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
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            socialLinks: { ...formData.socialLinks, linkedin: e.target.value },
                          })
                        }
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-2" htmlFor="github">
                        GitHub
                      </label>
                      <input
                        type="url"
                        id="github"
                        name="github"
                        value={formData.socialLinks.github}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            socialLinks: { ...formData.socialLinks, github: e.target.value },
                          })
                        }
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-2" htmlFor="portfolio">
                        Portfolio
                      </label>
                      <input
                        type="url"
                        id="portfolio"
                        name="portfolio"
                        value={formData.socialLinks.portfolio}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            socialLinks: { ...formData.socialLinks, portfolio: e.target.value },
                          })
                        }
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Skills Tab */}
            {activeTab === "skills" && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Skills & Expertise</h3>

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
              </div>
            )}

            {/* Experience Tab */}
            {activeTab === "experience" && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Work Experience</h3>

                {formData.experience.map((exp, index) => (
                  <div key={index} className="mb-6 pb-6 border-b border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-gray-700 mb-2">Job Title</label>
                        <input
                          type="text"
                          value={exp.title || ""}
                          onChange={(e) => {
                            // Create a deep copy of the experience array
                            const newExperience = JSON.parse(JSON.stringify(formData.experience));
                            // Modify the copy
                            newExperience[index].title = e.target.value;
                            // Set the state with the new copy
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
                            // Create a deep copy of the experience array
                            const newExperience = JSON.parse(JSON.stringify(formData.experience));
                            // Modify the copy
                            newExperience[index].company = e.target.value;
                            // Set the state with the new copy
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
                            // Create a deep copy of the experience array
                            const newExperience = JSON.parse(JSON.stringify(formData.experience));
                            // Modify the copy
                            newExperience[index].location = e.target.value;
                            // Set the state with the new copy
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
                            // Create a deep copy of the experience array
                            const newExperience = JSON.parse(JSON.stringify(formData.experience));
                            // Modify the copy
                            newExperience[index].from = e.target.value;
                            // Set the state with the new copy
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
                            // Create a deep copy of the experience array
                            const newExperience = JSON.parse(JSON.stringify(formData.experience));
                            // Modify the copy
                            newExperience[index].to = e.target.value;
                            // Set the state with the new copy
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
                            // Create a deep copy of the experience array
                            const newExperience = JSON.parse(JSON.stringify(formData.experience));
                            // Modify the copy
                            newExperience[index].current = e.target.checked;
                            // Set the state with the new copy
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
                            // Create a deep copy of the experience array
                            const newExperience = JSON.parse(JSON.stringify(formData.experience));
                            // Modify the copy
                            newExperience[index].description = e.target.value;
                            // Set the state with the new copy
                            setFormData({ ...formData, experience: newExperience });
                          }}
                          rows="3"
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          // Create a deep copy of the experience array
                          const newExperience = JSON.parse(JSON.stringify(formData.experience));
                          // Remove the item at the specified index
                          newExperience.splice(index, 1);
                          // Update state with the new copy
                          setFormData({ ...formData, experience: newExperience });
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      // Create a deep copy of experience array
                      const newExperience = JSON.parse(JSON.stringify(formData.experience || []));
                      // Add new empty experience item
                      newExperience.push({
                        title: "",
                        company: "",
                        location: "",
                        from: "",
                        to: "",
                        current: false,
                        description: "",
                      });
                      // Update state with new copy
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

                <h3 className="text-lg font-semibold mb-4 mt-8">Education</h3>

                {formData.education.map((edu, index) => (
                  <div key={index} className="mb-6 pb-6 border-b border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-gray-700 mb-2">Institution</label>
                        <input
                          type="text"
                          value={edu.institution || ""}
                          onChange={(e) => {
                            // Create a deep copy of the education array
                            const newEducation = JSON.parse(JSON.stringify(formData.education));
                            // Modify the copy
                            newEducation[index].institution = e.target.value;
                            // Set the state with the new copy
                            setFormData({ ...formData, education: newEducation });
                          }}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 mb-2">Degree</label>
                        <input
                          type="text"
                          value={edu.degree || ""}
                          onChange={(e) => {
                            // Create a deep copy of the education array
                            const newEducation = JSON.parse(JSON.stringify(formData.education));
                            // Modify the copy
                            newEducation[index].degree = e.target.value;
                            // Set the state with the new copy
                            setFormData({ ...formData, education: newEducation });
                          }}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 mb-2">Field of Study</label>
                        <input
                          type="text"
                          value={edu.fieldOfStudy || ""}
                          onChange={(e) => {
                            // Create a deep copy of the education array
                            const newEducation = JSON.parse(JSON.stringify(formData.education));
                            // Modify the copy
                            newEducation[index].fieldOfStudy = e.target.value;
                            // Set the state with the new copy
                            setFormData({ ...formData, education: newEducation });
                          }}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 mb-2">Start Date</label>
                        <input
                          type="date"
                          value={edu.from ? new Date(edu.from).toISOString().split("T")[0] : ""}
                          onChange={(e) => {
                            // Create a deep copy of the education array
                            const newEducation = JSON.parse(JSON.stringify(formData.education));
                            // Modify the copy
                            newEducation[index].from = e.target.value;
                            // Set the state with the new copy
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
                            // Create a deep copy of the education array
                            const newEducation = JSON.parse(JSON.stringify(formData.education));
                            // Modify the copy
                            newEducation[index].to = e.target.value;
                            // Set the state with the new copy
                            setFormData({ ...formData, education: newEducation });
                          }}
                          disabled={edu.current}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div className="flex items-center mt-2">
                        <input
                          type="checkbox"
                          id={`current-edu-${index}`}
                          checked={edu.current || false}
                          onChange={(e) => {
                            // Create a deep copy of the education array
                            const newEducation = JSON.parse(JSON.stringify(formData.education));
                            // Modify the copy
                            newEducation[index].current = e.target.checked;
                            // Set the state with the new copy
                            setFormData({ ...formData, education: newEducation });
                          }}
                          className="mr-2"
                        />
                        <label htmlFor={`current-edu-${index}`} className="text-gray-700">
                          I am currently studying here
                        </label>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-gray-700 mb-2">Description</label>
                        <textarea
                          value={edu.description || ""}
                          onChange={(e) => {
                            // Create a deep copy of the education array
                            const newEducation = JSON.parse(JSON.stringify(formData.education));
                            // Modify the copy
                            newEducation[index].description = e.target.value;
                            // Set the state with the new copy
                            setFormData({ ...formData, education: newEducation });
                          }}
                          rows="3"
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          // Create a deep copy of the education array
                          const newEducation = JSON.parse(JSON.stringify(formData.education));
                          // Remove the item at the specified index
                          newEducation.splice(index, 1);
                          // Update state with the new copy
                          setFormData({ ...formData, education: newEducation });
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      // Create a deep copy of education array
                      const newEducation = JSON.parse(JSON.stringify(formData.education || []));
                      // Add new empty education item
                      newEducation.push({
                        institution: "",
                        degree: "",
                        fieldOfStudy: "",
                        from: "",
                        to: "",
                        current: false,
                        description: "",
                      });
                      // Update state with new copy
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
              </div>
            )}

            {/* Portfolio Tab */}
            {activeTab === "portfolio" && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Portfolio Items</h3>

                {formData.portfolioItems &&
                  formData.portfolioItems.map((item, index) => (
                    <div key={index} className="mb-6 pb-6 border-b border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-gray-700 mb-2">Project Title</label>
                          <input
                            type="text"
                            value={item.title || ""}
                            onChange={(e) => {
                              // Create a deep copy of the portfolioItems array
                              const newPortfolioItems = JSON.parse(JSON.stringify(formData.portfolioItems || []));
                              // Modify the copy
                              newPortfolioItems[index].title = e.target.value;
                              // Set the state with the new copy
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
                              // Create a deep copy of the portfolioItems array
                              const newPortfolioItems = JSON.parse(JSON.stringify(formData.portfolioItems || []));
                              // Modify the copy
                              newPortfolioItems[index].projectUrl = e.target.value;
                              // Set the state with the new copy
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
                              // Create a deep copy of the portfolioItems array
                              const newPortfolioItems = JSON.parse(JSON.stringify(formData.portfolioItems || []));
                              // Modify the copy
                              newPortfolioItems[index].imageUrl = e.target.value;
                              // Set the state with the new copy
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
                              // Create a deep copy of the portfolioItems array
                              const newPortfolioItems = JSON.parse(JSON.stringify(formData.portfolioItems || []));
                              // Modify the copy
                              newPortfolioItems[index].description = e.target.value;
                              // Set the state with the new copy
                              setFormData({ ...formData, portfolioItems: newPortfolioItems });
                            }}
                            rows="3"
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>

                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            // Create a deep copy of the portfolioItems array
                            const newPortfolioItems = JSON.parse(JSON.stringify(formData.portfolioItems || []));
                            // Remove the item at the specified index
                            newPortfolioItems.splice(index, 1);
                            // Update state with the new copy
                            setFormData({ ...formData, portfolioItems: newPortfolioItems });
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      // Create a deep copy of portfolioItems array
                      const newPortfolioItems = JSON.parse(JSON.stringify(formData.portfolioItems || []));
                      // Add new empty item
                      newPortfolioItems.push({
                        title: "",
                        description: "",
                        imageUrl: "",
                        projectUrl: "",
                      });
                      // Update state with new copy
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
              </div>
            )}

            {/* Save Button */}
            <div className="mt-8">
              <button type="submit" className="btn-primary px-6 py-3 rounded-md">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

// just checking
