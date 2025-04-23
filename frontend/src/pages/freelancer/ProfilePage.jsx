import React, { useState } from "react";

const ProfilePage = () => {
  // State for form data
  const [formData, setFormData] = useState({
    fullName: "Alex Johnson",
    email: "alex.johnson@example.com",
    phone: "+1 (555) 123-4567",
    location: "New York, USA",
    bio: "Experienced web developer with 5+ years of expertise in React, Node.js, and MongoDB.",
    hourlyRate: 50,
    skills: ["React", "JavaScript", "Node.js", "MongoDB", "CSS", "HTML"],
    education: [{ degree: "B.S. Computer Science", school: "NYU", year: "2018" }],
    experience: [
      {
        position: "Senior Frontend Developer",
        company: "Tech Innovations",
        period: "2019 - Present",
        description: "Developed and maintained multiple React applications.",
      },
      {
        position: "Web Developer",
        company: "Digital Solutions",
        period: "2017 - 2019",
        description: "Worked on various client projects using JavaScript and PHP.",
      },
    ],
    socialLinks: {
      linkedin: "https://linkedin.com/in/alexjohnson",
      github: "https://github.com/alexjohnson",
      portfolio: "https://alexjohnson.dev",
    },
  });

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
    // API call to update profile would go here
    alert("Profile updated successfully!");
  };

  // Add/remove skill
  const [newSkill, setNewSkill] = useState("");

  const addSkill = () => {
    if (newSkill && !formData.skills.includes(newSkill)) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill],
      });
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((skill) => skill !== skillToRemove),
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-primary mb-8">Profile Settings</h1>

      {/* Profile Header */}
      <div className="bg-background-light p-6 rounded-lg shadow-md mb-8 flex flex-col md:flex-row items-center">
        <div className="w-32 h-32 bg-gray-300 rounded-full mb-4 md:mb-0 md:mr-6 flex items-center justify-center text-4xl text-gray-600">
          {formData.fullName.charAt(0)}
        </div>
        <div>
          <h2 className="text-2xl font-semibold">{formData.fullName}</h2>
          <p className="text-gray-600 mb-2">{formData.location}</p>
          <p className="text-primary font-semibold">${formData.hourlyRate}/hr</p>
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
          <li className="mr-2" onClick={() => setActiveTab("skills")}>
            <button
              className={`inline-block p-4 ${
                activeTab === "skills" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
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
                    <label className="block text-gray-700 mb-2">Position</label>
                    <input
                      type="text"
                      value={exp.position}
                      onChange={(e) => {
                        const newExperience = [...formData.experience];
                        newExperience[index].position = e.target.value;
                        setFormData({ ...formData, experience: newExperience });
                      }}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Company</label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => {
                        const newExperience = [...formData.experience];
                        newExperience[index].company = e.target.value;
                        setFormData({ ...formData, experience: newExperience });
                      }}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Period</label>
                    <input
                      type="text"
                      value={exp.period}
                      onChange={(e) => {
                        const newExperience = [...formData.experience];
                        newExperience[index].period = e.target.value;
                        setFormData({ ...formData, experience: newExperience });
                      }}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-gray-700 mb-2">Description</label>
                    <textarea
                      value={exp.description}
                      onChange={(e) => {
                        const newExperience = [...formData.experience];
                        newExperience[index].description = e.target.value;
                        setFormData({ ...formData, experience: newExperience });
                      }}
                      rows="2"
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            ))}

            <h3 className="text-lg font-semibold mb-4 mt-8">Education</h3>

            {formData.education.map((edu, index) => (
              <div key={index} className="mb-6 pb-6 border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-gray-700 mb-2">Degree</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => {
                        const newEducation = [...formData.education];
                        newEducation[index].degree = e.target.value;
                        setFormData({ ...formData, education: newEducation });
                      }}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">School</label>
                    <input
                      type="text"
                      value={edu.school}
                      onChange={(e) => {
                        const newEducation = [...formData.education];
                        newEducation[index].school = e.target.value;
                        setFormData({ ...formData, education: newEducation });
                      }}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Year</label>
                    <input
                      type="text"
                      value={edu.year}
                      onChange={(e) => {
                        const newEducation = [...formData.education];
                        newEducation[index].year = e.target.value;
                        setFormData({ ...formData, education: newEducation });
                      }}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            ))}
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
  );
};

export default ProfilePage;
