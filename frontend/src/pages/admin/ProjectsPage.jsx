import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchAllProjectsForAdmin } from "../../redux/slices/projectsSlice";
import { formatDate } from "../../utils/dateUtils";

const ProjectsPage = () => {
  const dispatch = useDispatch();
  const { adminProjects, loading, error } = useSelector((state) => state.projects);

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Fetch all projects for admin when component mounts
    dispatch(fetchAllProjectsForAdmin());
  }, [dispatch]);

  // Filter projects based on active tab and search query
  const filteredProjects = adminProjects.filter((project) => {
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && ["pending", "in_progress"].includes(project.status)) ||
      (activeTab === "completed" && project.status === "completed") ||
      (activeTab === "troubled" && ["delayed", "disputed", "cancelled"].includes(project.status));

    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.freelancer?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !selectedCategory || project.category === selectedCategory;
    return matchesTab && matchesSearch && matchesCategory;
  });

  // Handle project selection for details
  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  // Render status badge
  const renderStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
      in_progress: { color: "bg-blue-100 text-blue-800", label: "In Progress" },
      completed: { color: "bg-green-100 text-green-800", label: "Completed" },
      cancelled: { color: "bg-red-100 text-red-800", label: "Cancelled" },
      delayed: { color: "bg-orange-100 text-orange-800", label: "Delayed" },
      disputed: { color: "bg-red-100 text-red-800", label: "Disputed" },
    };

    const config = statusConfig[status] || { color: "bg-gray-100 text-gray-800", label: status };

    return <span className={`px-2 py-1 text-xs rounded-full font-medium ${config.color}`}>{config.label}</span>;
  };

  // Format budget display
  const formatBudget = (budget) => {
    if (!budget) return "N/A";
    return `$${budget.toLocaleString()}`;
  };

  // Calculate completion percentage
  const calculateCompletion = (project) => {
    if (project.status === "completed") return 100;
    if (project.milestones && project.milestones.length > 0) {
      const completedMilestones = project.milestones.filter((m) => m.status === "completed");
      return Math.round((completedMilestones.length / project.milestones.length) * 100);
    }
    return project.completionPercentage || 0;
  };

  // Get unique categories
  const categories = [...new Set(adminProjects.map((p) => p.category).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Error loading projects: {error}</p>
        <button onClick={() => dispatch(fetchAllProjectsForAdmin())} className="mt-2 btn-primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Project Management</h1>

      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search projects..."
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
          <select
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
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
          Total Projects: {adminProjects.length} | Showing: {filteredProjects.length}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        {[
          { key: "all", label: "All Projects", count: adminProjects.length },
          {
            key: "active",
            label: "Active Projects",
            count: adminProjects.filter((p) => ["pending", "in_progress"].includes(p.status)).length,
          },
          {
            key: "completed",
            label: "Completed Projects",
            count: adminProjects.filter((p) => p.status === "completed").length,
          },
          {
            key: "troubled",
            label: "Troubled Projects",
            count: adminProjects.filter((p) => ["delayed", "disputed", "cancelled"].includes(p.status)).length,
          },
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

      {/* Projects Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="py-3 px-4 text-left">Project Title</th>
              <th className="py-3 px-4 text-left">Client</th>
              <th className="py-3 px-4 text-left">Freelancer</th>
              <th className="py-3 px-4 text-left">Due Date</th>
              <th className="py-3 px-4 text-left">Budget</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Progress</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredProjects.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-8 text-center text-gray-500">
                  No projects found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredProjects.map((project) => (
                <tr key={project._id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{project.title}</td>
                  <td className="py-3 px-4">{project.client?.name || "Unknown Client"}</td>
                  <td className="py-3 px-4">{project.freelancer?.name || "Not assigned"}</td>
                  <td className="py-3 px-4">{formatDate(project.deadline)}</td>
                  <td className="py-3 px-4">{formatBudget(project.budget)}</td>
                  <td className="py-3 px-4">{renderStatusBadge(project.status)}</td>
                  <td className="py-3 px-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-primary h-2.5 rounded-full"
                        style={{ width: `${calculateCompletion(project)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">{calculateCompletion(project)}%</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button
                        className="text-primary hover:text-primary-dark"
                        onClick={() => handleProjectSelect(project)}
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

      <div className="mt-6 flex justify-between items-center">
        <div className="text-sm text-gray-500">Showing {filteredProjects.length} entries</div>
      </div>

      {/* Project Detail Modal */}
      {isModalOpen && selectedProject && (
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
                    <h3 className="text-lg leading-6 font-medium text-gray-900">{selectedProject.title}</h3>
                    <div className="mt-2 space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500">
                          Client: {selectedProject.client?.name || "Unknown Client"}
                        </p>
                        <div>{renderStatusBadge(selectedProject.status)}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Freelancer:</span>{" "}
                          {selectedProject.freelancer?.name || "Not assigned"}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Budget:</span>{" "}
                          {formatBudget(selectedProject.budget)}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Start Date:</span>{" "}
                          {formatDate(selectedProject.startDate)}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Deadline:</span>{" "}
                          {formatDate(selectedProject.deadline)}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Category:</span>{" "}
                          {selectedProject.category || "N/A"}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Completion:</span>{" "}
                          {calculateCompletion(selectedProject)}%
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-700 mb-1">Description:</h4>
                        <p className="text-sm text-gray-600">{selectedProject.description}</p>
                      </div>

                      {selectedProject.skills && selectedProject.skills.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-700 mb-1">Skills Required:</h4>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {selectedProject.skills.map((skill, index) => (
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

                      {selectedProject.milestones && selectedProject.milestones.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">Milestones:</h4>
                          <div className="space-y-2">
                            {selectedProject.milestones.map((milestone, index) => (
                              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span className="text-sm">{milestone.title}</span>
                                <span
                                  className={`px-2 py-1 text-xs rounded ${
                                    milestone.status === "completed"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {milestone.status}
                                </span>
                              </div>
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

export default ProjectsPage;
