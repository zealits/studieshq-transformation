import React, { useState } from "react";

const JobManagementPage = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock jobs data
  const jobs = [
    {
      id: 1,
      title: "Senior React Developer Needed for E-commerce Platform",
      company: "TechSolutions Inc.",
      budget: "$3,000 - $5,000",
      postedDate: "Jun 5, 2023",
      deadline: "Jun 25, 2023",
      status: "active",
      category: "Web Development",
      applicants: 12,
      featured: true,
      description:
        "We're looking for an experienced React developer to help build our new e-commerce platform. The ideal candidate should have 5+ years of experience with React and Redux...",
    },
    {
      id: 2,
      title: "Logo and Brand Identity Design for Startup",
      company: "Innovate LLC",
      budget: "$500 - $1,000",
      postedDate: "Jun 3, 2023",
      deadline: "Jun 15, 2023",
      status: "active",
      category: "Design",
      applicants: 18,
      featured: false,
      description:
        "Our startup is looking for a talented designer to create a memorable logo and brand identity that reflects our innovative approach to fintech...",
    },
    {
      id: 3,
      title: "Content Writer for Health and Wellness Blog",
      company: "Global Health",
      budget: "$200 - $400",
      postedDate: "May 28, 2023",
      deadline: "Jun 10, 2023",
      status: "active",
      category: "Writing",
      applicants: 7,
      featured: true,
      description:
        "We need a content writer with experience in the health and wellness industry to create engaging blog posts on topics like nutrition, fitness, and mental health...",
    },
    {
      id: 4,
      title: "Mobile App Developer for iOS and Android",
      company: "Startup Ventures",
      budget: "$4,000 - $6,000",
      postedDate: "May 25, 2023",
      deadline: "Jun 15, 2023",
      status: "active",
      category: "Mobile Development",
      applicants: 5,
      featured: true,
      description:
        "We're seeking a mobile app developer who can build a cross-platform app for both iOS and Android using React Native or Flutter. The app will be a social platform for fitness enthusiasts...",
    },
    {
      id: 5,
      title: "Backend Developer for API Development",
      company: "Digital Solutions",
      budget: "$2,500 - $3,500",
      postedDate: "May 22, 2023",
      deadline: "Jun 5, 2023",
      status: "expired",
      category: "Web Development",
      applicants: 9,
      featured: false,
      description:
        "Looking for a backend developer proficient in Node.js and Express to develop RESTful APIs for our SaaS platform. Experience with MongoDB is required...",
    },
    {
      id: 6,
      title: "SEO Specialist for E-commerce Website",
      company: "Fashion Retail Ltd.",
      budget: "$1,000 - $1,500",
      postedDate: "May 20, 2023",
      deadline: "Jun 3, 2023",
      status: "filled",
      category: "Marketing",
      applicants: 14,
      featured: false,
      description:
        "We need an SEO specialist to optimize our e-commerce website and improve our search engine rankings. The ideal candidate should have experience with e-commerce SEO...",
    },
    {
      id: 7,
      title: "Video Editor for Corporate Training Videos",
      company: "Media Publishing",
      budget: "$1,500 - $2,000",
      postedDate: "May 18, 2023",
      deadline: "Jun 1, 2023",
      status: "draft",
      category: "Video & Animation",
      applicants: 0,
      featured: false,
      description:
        "We're looking for a video editor to help create professional training videos for corporate clients. Experience with After Effects and Premiere Pro is required...",
    },
  ];

  // Filter jobs based on active tab and search query
  const filteredJobs = jobs.filter((job) => {
    const matchesTab = activeTab === "all" || job.status === activeTab;
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Handle job selection for details/editing
  const handleJobSelect = (job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedJob(null);
  };

  // Render status badge
  const renderStatusBadge = (status) => {
    switch (status) {
      case "active":
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>;
      case "expired":
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Expired</span>;
      case "filled":
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Filled</span>;
      case "draft":
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Draft</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Job Management</h1>

      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row justify-between mb-6 space-y-4 md:space-y-0">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search jobs..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
            </div>
          </div>

          <select className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">All Categories</option>
            <option value="Web Development">Web Development</option>
            <option value="Mobile Development">Mobile Development</option>
            <option value="Design">Design</option>
            <option value="Writing">Writing</option>
            <option value="Marketing">Marketing</option>
            <option value="Video & Animation">Video & Animation</option>
          </select>
        </div>

        <button className="btn-primary py-2 px-4">Add New Job</button>
      </div>

      {/* Job Status Tabs */}
      <div className="flex border-b mb-6 overflow-x-auto">
        <button
          className={`pb-2 px-4 font-medium whitespace-nowrap ${
            activeTab === "all" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("all")}
        >
          All Jobs
        </button>
        <button
          className={`pb-2 px-4 font-medium whitespace-nowrap ${
            activeTab === "active" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("active")}
        >
          Active
        </button>
        <button
          className={`pb-2 px-4 font-medium whitespace-nowrap ${
            activeTab === "expired" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("expired")}
        >
          Expired
        </button>
        <button
          className={`pb-2 px-4 font-medium whitespace-nowrap ${
            activeTab === "filled" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("filled")}
        >
          Filled
        </button>
        <button
          className={`pb-2 px-4 font-medium whitespace-nowrap ${
            activeTab === "draft" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("draft")}
        >
          Drafts
        </button>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Job Title
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Company
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Category
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Posted Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Budget
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Applicants
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredJobs.map((job) => (
                <tr key={job.id} className={`hover:bg-gray-50 ${job.featured ? "bg-yellow-50" : ""}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          {job.title}
                          {job.featured && (
                            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job.company}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job.postedDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{renderStatusBadge(job.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job.budget}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{job.applicants}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button className="text-primary hover:text-primary-dark" onClick={() => handleJobSelect(job)}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      </button>
                      <button className="text-blue-600 hover:text-blue-800">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      {job.status !== "filled" && job.status !== "expired" ? (
                        <button className="text-red-600 hover:text-red-800">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredJobs.length}</span>{" "}
          of <span className="font-medium">{filteredJobs.length}</span> results
        </div>
        <nav className="flex space-x-1" aria-label="Pagination">
          <button className="relative inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
            Previous
          </button>
          <button className="relative inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-primary text-sm font-medium text-white">
            1
          </button>
          <button className="relative inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
            Next
          </button>
        </nav>
      </div>

      {/* Job Detail Modal */}
      {isModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">{selectedJob.title}</h3>
                    <div className="mt-2 space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500">{selectedJob.company}</p>
                        <div>{renderStatusBadge(selectedJob.status)}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Category:</span> {selectedJob.category}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Budget:</span> {selectedJob.budget}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Posted Date:</span> {selectedJob.postedDate}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Deadline:</span> {selectedJob.deadline}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Applicants:</span> {selectedJob.applicants}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Featured:</span>{" "}
                          {selectedJob.featured ? "Yes" : "No"}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-700 mb-1">Description:</h4>
                        <p className="text-sm text-gray-600">{selectedJob.description}</p>
                      </div>

                      <div className="border-t pt-4 mt-4">
                        <h4 className="font-medium mb-2">Actions</h4>
                        <div className="flex space-x-2">
                          <button className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-md text-sm">
                            Edit Job
                          </button>
                          {selectedJob.status === "active" && (
                            <button className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded-md text-sm">
                              View Applicants ({selectedJob.applicants})
                            </button>
                          )}
                          {selectedJob.featured ? (
                            <button className="bg-yellow-600 hover:bg-yellow-700 text-white py-1 px-3 rounded-md text-sm">
                              Remove Featured
                            </button>
                          ) : (
                            <button className="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded-md text-sm">
                              Make Featured
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleCloseModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobManagementPage;
