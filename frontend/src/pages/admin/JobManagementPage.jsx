import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchAllJobsForAdmin } from "../../redux/slices/jobsSlice";
import { formatDate } from "../../utils/dateUtils";

const JobManagementPage = () => {
  const dispatch = useDispatch();
  const { adminJobs, categories, isLoading, error } = useSelector((state) => state.jobs);

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    // Fetch all jobs for admin when component mounts
    dispatch(fetchAllJobsForAdmin());
  }, [dispatch]);

  // Filter jobs based on active tab and search query
  const filteredJobs = adminJobs.filter((job) => {
    const matchesTab = activeTab === "all" || job.status === activeTab;
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.client?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || job.category === selectedCategory;
    return matchesTab && matchesSearch && matchesCategory;
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

  // Handle search
  const handleSearch = (value) => {
    setSearchQuery(value);
  };

  // Handle category filter
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  // Render status badge
  const renderStatusBadge = (status) => {
    const statusConfig = {
      open: { color: "bg-green-100 text-green-800", label: "Open" },
      draft: { color: "bg-gray-100 text-gray-800", label: "Draft" },
      in_progress: { color: "bg-blue-100 text-blue-800", label: "In Progress" },
      completed: { color: "bg-purple-100 text-purple-800", label: "Completed" },
      cancelled: { color: "bg-red-100 text-red-800", label: "Cancelled" },
    };

    const config = statusConfig[status] || { color: "bg-gray-100 text-gray-800", label: status };

    return <span className={`px-2 py-1 text-xs rounded-full ${config.color}`}>{config.label}</span>;
  };

  // Format budget display
  const formatBudget = (budget) => {
    if (!budget) return "N/A";
    return `$${budget.min} - $${budget.max}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Error loading jobs: {error}</p>
        <button onClick={() => dispatch(fetchAllJobsForAdmin())} className="mt-2 btn-primary">
          Retry
        </button>
      </div>
    );
  }

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
              onChange={(e) => handleSearch(e.target.value)}
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

          <select
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm text-gray-600">
          Total Jobs: {adminJobs.length} | Showing: {filteredJobs.length}
        </div>
      </div>

      {/* Job Status Tabs */}
      <div className="flex border-b mb-6 overflow-x-auto">
        {[
          { key: "all", label: "All Jobs", count: adminJobs.length },
          { key: "open", label: "Open", count: adminJobs.filter((j) => j.status === "open").length },
          { key: "draft", label: "Draft", count: adminJobs.filter((j) => j.status === "draft").length },
          {
            key: "in_progress",
            label: "In Progress",
            count: adminJobs.filter((j) => j.status === "in_progress").length,
          },
          { key: "completed", label: "Completed", count: adminJobs.filter((j) => j.status === "completed").length },
          { key: "cancelled", label: "Cancelled", count: adminJobs.filter((j) => j.status === "cancelled").length },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`pb-2 px-4 font-medium whitespace-nowrap ${
              activeTab === tab.key ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Posted Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applicants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    No jobs found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr key={job._id} className={`hover:bg-gray-50 ${job.featured ? "bg-yellow-50" : ""}`}>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {job.client?.name || "Unknown Client"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(job.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{renderStatusBadge(job.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatBudget(job.budget)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {job.applicationCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          className="text-primary hover:text-primary-dark"
                          onClick={() => handleJobSelect(job)}
                          title="View Details"
                        >
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
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Info */}
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredJobs.length}</span>{" "}
          of <span className="font-medium">{filteredJobs.length}</span> results
        </div>
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

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">{selectedJob.title}</h3>
                    <div className="mt-2 space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500">{selectedJob.client?.name || "Unknown Client"}</p>
                        <div>{renderStatusBadge(selectedJob.status)}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Category:</span> {selectedJob.category}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Budget:</span> {formatBudget(selectedJob.budget)}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Posted Date:</span>{" "}
                          {formatDate(selectedJob.createdAt)}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Deadline:</span>{" "}
                          {formatDate(selectedJob.deadline)}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Applicants:</span>{" "}
                          {selectedJob.applicationCount || 0}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Featured:</span>{" "}
                          {selectedJob.featured ? "Yes" : "No"}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-700 mb-1">Description:</h4>
                        <p className="text-sm text-gray-600 line-clamp-4" title={selectedJob.description}>
                          {selectedJob.description}
                        </p>
                      </div>

                      {selectedJob.skills && selectedJob.skills.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-700 mb-1">Required Skills:</h4>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {selectedJob.skills.map((skill, index) => (
                              <span
                                key={index}
                                className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
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
