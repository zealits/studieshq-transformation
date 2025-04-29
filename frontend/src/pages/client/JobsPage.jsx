import React, { useState } from "react";
import PostJobForm from "./PostJobForm";

const JobsPage = () => {
  const [activeTab, setActiveTab] = useState("active");
  const [showPostJobForm, setShowPostJobForm] = useState(false);

  // Mock data for jobs
  const jobs = {
    active: [
      {
        id: 1,
        title: "UX/UI Designer for E-commerce Website",
        description:
          "Looking for an experienced UX/UI designer to improve our e-commerce website's customer journey and design modern, intuitive interfaces.",
        budget: "$2,000 - $3,000",
        type: "Fixed Price",
        duration: "3-4 weeks",
        skills: ["UI Design", "UX Design", "Figma", "Adobe XD", "E-commerce"],
        proposals: 14,
        posted: "3 days ago",
        status: "Active",
      },
      {
        id: 2,
        title: "Full Stack Developer for Web Application",
        description:
          "We need a skilled full stack developer to build a custom web application for our business. The project involves user authentication, data visualization, and API integration.",
        budget: "$50 - $60 / hr",
        type: "Hourly",
        duration: "2-3 months",
        skills: ["React", "Node.js", "MongoDB", "Express", "Redux"],
        proposals: 8,
        posted: "1 week ago",
        status: "Active",
      },
    ],
    closed: [
      {
        id: 3,
        title: "Social Media Marketing Specialist",
        description:
          "Created effective social media marketing strategies for our product launch across multiple platforms.",
        budget: "$1,500",
        type: "Fixed Price",
        duration: "Completed",
        skills: ["Social Media Marketing", "Content Creation", "Analytics"],
        hired: "Jessica Thompson",
        posted: "2 months ago",
        status: "Completed",
      },
      {
        id: 4,
        title: "WordPress Website Development",
        description: "Needed a custom WordPress website with e-commerce functionality and responsive design.",
        budget: "$2,500",
        type: "Fixed Price",
        duration: "Completed",
        skills: ["WordPress", "PHP", "WooCommerce", "Responsive Design"],
        hired: "Michael Chen",
        posted: "3 months ago",
        status: "Completed",
      },
    ],
    draft: [
      {
        id: 5,
        title: "Content Writer for Blog Articles",
        description:
          "Looking for a content writer to create engaging blog articles about technology and business trends.",
        budget: "$30 - $40 / hr",
        type: "Hourly",
        duration: "Ongoing",
        skills: ["Content Writing", "SEO", "Research", "Editing"],
        status: "Draft",
      },
    ],
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Jobs</h1>
        <button 
          className="btn-primary"
          onClick={() => setShowPostJobForm(true)}
        >
          Post a New Job
        </button>
      </div>

      {showPostJobForm ? (
        <PostJobForm onClose={() => setShowPostJobForm(false)} />
      ) : (
        <>
          {/* Tabs */}
          <div className="flex border-b mb-6">
            <button
              className={`pb-2 px-4 font-medium ${
                activeTab === "active" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("active")}
            >
              Active Jobs
            </button>
            <button
              className={`pb-2 px-4 font-medium ${
                activeTab === "closed" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("closed")}
            >
              Closed Jobs
            </button>
            <button
              className={`pb-2 px-4 font-medium ${
                activeTab === "draft" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("draft")}
            >
              Draft Jobs
            </button>
          </div>

          {/* Active Jobs */}
          {activeTab === "active" && (
            <div className="space-y-6">
              {jobs.active.map((job) => (
                <div key={job.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">{job.title}</h2>
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full ${
                        job.status === "Active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-4">{job.description}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <span className="block text-sm text-gray-500">Budget</span>
                      <span className="font-medium">{job.budget}</span>
                    </div>
                    <div>
                      <span className="block text-sm text-gray-500">Type</span>
                      <span className="font-medium">{job.type}</span>
                    </div>
                    <div>
                      <span className="block text-sm text-gray-500">Duration</span>
                      <span className="font-medium">{job.duration}</span>
                    </div>
                    <div>
                      <span className="block text-sm text-gray-500">Proposals</span>
                      <span className="font-medium">{job.proposals}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="block text-sm text-gray-500 mb-1">Skills</span>
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((skill, index) => (
                        <span key={index} className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-gray-500">
                    <span>Posted {job.posted}</span>
                  </div>

                  <div className="mt-4 flex space-x-2">
                    <button className="btn-outline text-sm py-1">View Proposals ({job.proposals})</button>
                    <button className="btn-outline text-sm py-1">Edit Job</button>
                    <button className="text-red-600 hover:text-red-800 text-sm py-1 px-3">Close Job</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Closed Jobs */}
          {activeTab === "closed" && (
            <div className="space-y-6">
              {jobs.closed.map((job) => (
                <div key={job.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">{job.title}</h2>
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800">
                      {job.status}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-4">{job.description}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <span className="block text-sm text-gray-500">Budget</span>
                      <span className="font-medium">{job.budget}</span>
                    </div>
                    <div>
                      <span className="block text-sm text-gray-500">Type</span>
                      <span className="font-medium">{job.type}</span>
                    </div>
                    <div>
                      <span className="block text-sm text-gray-500">Duration</span>
                      <span className="font-medium">{job.duration}</span>
                    </div>
                    <div>
                      <span className="block text-sm text-gray-500">Hired</span>
                      <span className="font-medium">{job.hired}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="block text-sm text-gray-500 mb-1">Skills</span>
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((skill, index) => (
                        <span key={index} className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-gray-500">
                    <span>Posted {job.posted}</span>
                  </div>

                  <div className="mt-4 flex space-x-2">
                    <button className="btn-outline text-sm py-1">View Job</button>
                    <button className="btn-primary text-sm py-1">Reuse Job</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Draft Jobs */}
          {activeTab === "draft" && (
            <div className="space-y-6">
              {jobs.draft.map((job) => (
                <div key={job.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">{job.title}</h2>
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800">
                      {job.status}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-4">{job.description}</p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <span className="block text-sm text-gray-500">Budget</span>
                      <span className="font-medium">{job.budget}</span>
                    </div>
                    <div>
                      <span className="block text-sm text-gray-500">Type</span>
                      <span className="font-medium">{job.type}</span>
                    </div>
                    <div>
                      <span className="block text-sm text-gray-500">Duration</span>
                      <span className="font-medium">{job.duration}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="block text-sm text-gray-500 mb-1">Skills</span>
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((skill, index) => (
                        <span key={index} className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex space-x-2">
                    <button className="btn-primary text-sm py-1">Complete & Post</button>
                    <button className="btn-outline text-sm py-1">Edit Draft</button>
                    <button className="text-red-600 hover:text-red-800 text-sm py-1 px-3">Delete Draft</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default JobsPage;
