import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { format } from "date-fns";
import ChatButton from "../../components/common/ChatButton";
import {
  fetchProjects,
  updateMilestone,
  createMilestone,
  approveMilestone,
  deleteMilestone,
} from "../../redux/slices/projectsSlice";
import MilestoneReviewModal from "../../components/milestone/MilestoneReviewModal";

const ProjectsPage = () => {
  const [activeTab, setActiveTab] = useState("active");
  const [selectedProject, setSelectedProject] = useState(null);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [reviewingMilestone, setReviewingMilestone] = useState(null);
  const [milestoneForm, setMilestoneForm] = useState({
    title: "",
    description: "",
    percentage: "",
    dueDate: "",
  });

  const dispatch = useDispatch();
  const { projects, loading, error } = useSelector((state) => state.projects);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchProjects({ status: activeTab === "active" ? "in_progress" : "completed" }));
  }, [dispatch, activeTab]);

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "submitted_for_review":
        return "bg-purple-100 text-purple-800";
      case "revision_requested":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status) => {
    switch (status) {
      case "submitted_for_review":
        return "Under Review";
      case "revision_requested":
        return "Revision Requested";
      case "in_progress":
        return "In Progress";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const handleReviewWork = (project, milestone) => {
    console.log("Opening review modal for:", { projectId: project._id, milestoneId: milestone._id });
    setSelectedProject(project);
    setReviewingMilestone(milestone);
    setShowReviewModal(true);
  };

  const handleReviewSuccess = () => {
    console.log("Review completed successfully");
    // Close modal first to prevent re-renders
    setShowReviewModal(false);
    setReviewingMilestone(null);
    setSelectedProject(null);

    // Then refresh projects after a small delay
    setTimeout(() => {
      dispatch(fetchProjects({ status: activeTab === "active" ? "in_progress" : "completed" }));
    }, 100);
  };

  const getMilestoneActions = (project, milestone) => {
    if (milestone.status === "submitted_for_review") {
      return (
        <button
          onClick={() => handleReviewWork(project, milestone)}
          className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
        >
          Review Work
        </button>
      );
    }

    if (user.role === "client" && ["pending", "in_progress", "revision_requested"].includes(milestone.status)) {
      return (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEditMilestone(milestone, project)}
            className="text-sm text-primary hover:underline"
          >
            Edit
          </button>
          <button onClick={() => handleDeleteMilestone(milestone._id)} className="text-sm text-red-600 hover:underline">
            Delete
          </button>
        </div>
      );
    }

    return null;
  };

  const getProgressPercentage = (status) => {
    switch (status) {
      case "pending":
        return 0;
      case "in_progress":
        return 33;
      case "submitted_for_review":
        return 66;
      case "revision_requested":
        return 50;
      case "completed":
        return 100;
      default:
        return 0;
    }
  };

  const getProgressColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "submitted_for_review":
        return "bg-purple-500";
      case "revision_requested":
        return "bg-orange-500";
      case "in_progress":
        return "bg-blue-500";
      default:
        return "bg-gray-300";
    }
  };

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;

    try {
      const percentage = Number(milestoneForm.percentage);
      const totalPercentage = calculateTotalPercentage() + percentage;

      if (totalPercentage > 100) {
        alert(
          `Cannot create milestone. Total percentage would exceed 100%. Current total: ${calculateTotalPercentage()}%, Remaining: ${
            100 - calculateTotalPercentage()
          }%`
        );
        return;
      }

      const milestoneData = {
        ...milestoneForm,
        percentage: percentage,
        amount: parseFloat(calculateMilestoneAmount(percentage)), // Add the calculated amount
      };

      const response = await dispatch(
        createMilestone({
          projectId: selectedProject._id,
          milestone: milestoneData,
        })
      ).unwrap();

      if (response.success) {
        setShowMilestoneModal(false);
        setMilestoneForm({
          title: "",
          description: "",
          percentage: "",
          dueDate: "",
        });
        // Refresh project data
        dispatch(fetchProjects({ status: activeTab === "active" ? "in_progress" : "completed" }));
      }
    } catch (error) {
      console.error("Error creating milestone:", error);
      alert(error.message || "Failed to create milestone. Please try again.");
    }
  };

  const handleUpdateMilestone = async (e) => {
    e.preventDefault();
    if (!selectedProject || !editingMilestone) return;

    try {
      const percentage = Number(milestoneForm.percentage);
      const totalPercentage = calculateTotalPercentage() + percentage;

      if (totalPercentage > 100) {
        alert(
          `Cannot update milestone. Total percentage would exceed 100%. Current total: ${calculateTotalPercentage()}%, Remaining: ${
            100 - calculateTotalPercentage()
          }%`
        );
        return;
      }

      const milestoneData = {
        ...milestoneForm,
        percentage: percentage,
        amount: parseFloat(calculateMilestoneAmount(percentage)), // Add the calculated amount
      };

      const response = await dispatch(
        updateMilestone({
          projectId: selectedProject._id,
          milestoneId: editingMilestone._id,
          milestone: milestoneData,
        })
      ).unwrap();

      if (response.success) {
        setShowMilestoneModal(false);
        setEditingMilestone(null);
        setMilestoneForm({
          title: "",
          description: "",
          percentage: "",
          dueDate: "",
        });
        // Refresh project data
        dispatch(fetchProjects({ status: activeTab === "active" ? "in_progress" : "completed" }));
      }
    } catch (error) {
      console.error("Error updating milestone:", error);
      alert(error.message || "Failed to update milestone. Please try again.");
    }
  };

  const handleDeleteMilestone = async (milestoneId) => {
    if (!selectedProject) return;

    if (window.confirm("Are you sure you want to delete this milestone?")) {
      try {
        const response = await dispatch(
          deleteMilestone({
            projectId: selectedProject._id,
            milestoneId,
          })
        ).unwrap();

        if (response.success) {
          // Refresh project data
          dispatch(fetchProjects({ status: activeTab === "active" ? "in_progress" : "completed" }));
        }
      } catch (error) {
        console.error("Error deleting milestone:", error);
        alert(error.message || "Failed to delete milestone. Please try again.");
      }
    }
  };

  const handleEditMilestone = (milestone, project) => {
    setSelectedProject(project);
    setEditingMilestone(milestone);
    setMilestoneForm({
      title: milestone.title,
      description: milestone.description,
      percentage: milestone.percentage.toString(),
      dueDate: milestone.dueDate.split("T")[0],
    });
    setShowMilestoneModal(true);
  };

  const handleApproveMilestone = async (milestoneId, approvalStatus) => {
    if (!selectedProject) return;

    try {
      const response = await dispatch(
        approveMilestone({
          projectId: selectedProject._id,
          milestoneId,
          approvalStatus,
          approvalComment: approvalStatus === "approved" ? "Milestone approved" : "Milestone rejected",
        })
      ).unwrap();

      if (response.success) {
        // Refresh project data
        dispatch(fetchProjects({ status: activeTab === "active" ? "in_progress" : "completed" }));
      }
    } catch (error) {
      console.error("Error approving milestone:", error);
    }
  };

  const calculateMilestoneAmount = (percentage) => {
    if (!selectedProject) return 0;
    const numPercentage = Number(percentage) || 0;
    return ((selectedProject.budget * numPercentage) / 100).toFixed(2);
  };

  const calculateTotalPercentage = () => {
    if (!selectedProject) return 0;
    return selectedProject.milestones.reduce((sum, m) => {
      if (m._id === editingMilestone?._id) return sum; // Exclude current milestone when editing
      return sum + Number(m.percentage);
    }, 0);
  };

  const calculateRemainingPercentage = () => {
    if (!selectedProject) return 0;
    const total = calculateTotalPercentage();
    const currentPercentage = editingMilestone ? Number(editingMilestone.percentage) : 0;
    return 100 - total + currentPercentage; // Add back the current milestone's percentage when editing
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            activeTab === "active" ? "bg-primary text-white" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          }`}
        >
          Active Projects
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            activeTab === "completed" ? "bg-primary text-white" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          }`}
        >
          Completed Projects
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-500">
            {activeTab === "active"
              ? "You don't have any active projects yet."
              : "You haven't completed any projects yet."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {projects.map((project) => (
            <div key={project._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.title}</h3>
                  <p className="text-gray-600 mb-2">{project.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Freelancer: {project.freelancer?.name}</span>
                    <span>•</span>
                    <span>Budget: ${project.budget?.toLocaleString()}</span>
                    <span>•</span>
                    <span>Due: {format(new Date(project.deadline), "MMM d, yyyy")}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      project.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : project.status === "in_progress"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {project.status === "completed" ? "🎉 Completed" : project.status.replace("_", " ")}
                  </span>
                  {project.status === "completed" && project.completedDate && (
                    <span className="text-xs text-gray-500">
                      Completed on {format(new Date(project.completedDate), "MMM d, yyyy")}
                    </span>
                  )}
                  <ChatButton recipientId={project.freelancer?._id} recipientName={project.freelancer?.name} />
                </div>
              </div>

              {/* Milestones Section */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Milestones</h4>
                  <div className="flex items-center space-x-4">
                    {project.milestones && project.milestones.length > 0 && (
                      <span className="text-sm text-gray-500">
                        {project.milestones.filter((m) => m.status === "completed").length} of{" "}
                        {project.milestones.length} completed
                      </span>
                    )}
                    {user.role === "client" && (
                      <button
                        onClick={() => {
                          setSelectedProject(project);
                          setShowMilestoneModal(true);
                        }}
                        className="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-primary-dark"
                      >
                        Add Milestone
                      </button>
                    )}
                  </div>
                </div>

                {project.milestones && project.milestones.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      {project.milestones.map((milestone) => (
                        <div key={milestone._id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{milestone.title}</h4>
                                <div className="flex items-center space-x-3">
                                  <span
                                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                      milestone.status
                                    )}`}
                                  >
                                    {formatStatus(milestone.status)}
                                  </span>
                                  {getMilestoneActions(project, milestone)}
                                </div>
                              </div>
                              <p className="text-sm text-gray-600">{milestone.description}</p>

                              {/* Show work submission details for review */}
                              {milestone.status === "submitted_for_review" && milestone.submissionDetails && (
                                <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded">
                                  <h5 className="font-medium text-purple-800 mb-1">Work Submitted for Review</h5>
                                  <p className="text-sm text-purple-700">
                                    {milestone.submissionDetails.length > 100
                                      ? `${milestone.submissionDetails.substring(0, 100)}...`
                                      : milestone.submissionDetails}
                                  </p>
                                  <p className="text-xs text-purple-600 mt-1">
                                    Submitted: {format(new Date(milestone.submissionDate), "MMM d, yyyy 'at' h:mm a")}
                                  </p>
                                </div>
                              )}

                              {/* Show revision feedback */}
                              {milestone.status === "revision_requested" && milestone.feedback && (
                                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
                                  <h5 className="font-medium text-orange-800 mb-1">Revision Requested</h5>
                                  <p className="text-sm text-orange-700">{milestone.feedback}</p>
                                  {milestone.revisionCount && (
                                    <p className="text-xs text-orange-600 mt-1">Revision #{milestone.revisionCount}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-2 grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">Due Date</p>
                              <p className="font-medium">{format(new Date(milestone.dueDate), "MMM d, yyyy")}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Percentage</p>
                              <p className="font-medium">{milestone.percentage}%</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Amount</p>
                              <p className="font-medium">
                                ${((project.budget * milestone.percentage) / 100).toFixed(2)}
                              </p>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Progress</span>
                              <span>{getProgressPercentage(milestone.status)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(
                                  milestone.status
                                )}`}
                                style={{ width: `${getProgressPercentage(milestone.status)}%` }}
                              />
                            </div>
                          </div>

                          {/* Milestone metadata */}
                          {(milestone.workStartedDate || milestone.submissionDate || milestone.completedAt) && (
                            <div className="mt-3 grid grid-cols-3 gap-4 text-xs text-gray-500">
                              {milestone.workStartedDate && (
                                <div>
                                  <span>Started: </span>
                                  <span>{format(new Date(milestone.workStartedDate), "MMM d")}</span>
                                </div>
                              )}
                              {milestone.submissionDate && (
                                <div>
                                  <span>Submitted: </span>
                                  <span>{format(new Date(milestone.submissionDate), "MMM d")}</span>
                                </div>
                              )}
                              {milestone.completedAt && (
                                <div>
                                  <span>Completed: </span>
                                  <span>{format(new Date(milestone.completedAt), "MMM d")}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Milestone Summary */}
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Total Milestones:</span>
                          <div className="font-medium">{project.milestones.length}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Completed:</span>
                          <div className="font-medium text-green-600">
                            {project.milestones.filter((m) => m.status === "completed").length}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Pending Review:</span>
                          <div className="font-medium text-purple-600">
                            {project.milestones.filter((m) => m.status === "submitted_for_review").length}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Total Paid:</span>
                          <div className="font-medium text-primary">
                            $
                            {project.milestones
                              .filter((m) => m.status === "completed")
                              .reduce((sum, m) => sum + (m.percentage / 100) * (project.budget || 0), 0)
                              .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No milestones created yet.</p>
                    <p className="text-sm mt-1">Click "Add Milestone" to create your first milestone.</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Milestone Creation/Edit Modal */}
      {showMilestoneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingMilestone ? "Edit Milestone" : "Create New Milestone"}
            </h3>
            <form onSubmit={editingMilestone ? handleUpdateMilestone : handleCreateMilestone}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Milestone Title</label>
                  <input
                    type="text"
                    value={milestoneForm.title}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 'Phase 1: Initial Design & Planning'"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Give this milestone a clear, descriptive name.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={milestoneForm.description}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                    rows="3"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe what will be delivered in this milestone (e.g., 'Complete homepage design with wireframes and mockups')"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Be specific about deliverables, requirements, and acceptance criteria for this milestone.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Percentage</label>
                  <input
                    type="number"
                    min="1"
                    max={calculateRemainingPercentage()}
                    step="0.1"
                    value={milestoneForm.percentage}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, percentage: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 25"
                    required
                  />
                  <div className="mt-1 space-y-1">
                    <p className="text-xs text-gray-500">
                      Remaining budget available: {calculateRemainingPercentage()}% ($
                      {(selectedProject
                        ? (selectedProject.budget * calculateRemainingPercentage()) / 100
                        : 0
                      ).toLocaleString()}
                      )
                    </p>
                    {milestoneForm.percentage && (
                      <p className="text-sm font-medium text-green-600">
                        💰 Milestone value: ${calculateMilestoneAmount(milestoneForm.percentage)}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Completion Date</label>
                  <input
                    type="date"
                    value={milestoneForm.dueDate}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">When should this milestone be completed?</p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowMilestoneModal(false);
                    setEditingMilestone(null);
                    setMilestoneForm({ title: "", description: "", percentage: "", dueDate: "" });
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
                  {editingMilestone ? "Update" : "Create"} Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Milestone Review Modal */}
      {showReviewModal && reviewingMilestone && selectedProject && (
        <MilestoneReviewModal
          key={`review-${selectedProject._id}-${reviewingMilestone._id}`}
          milestone={reviewingMilestone}
          projectId={selectedProject._id}
          onClose={() => {
            console.log("Closing review modal");
            setShowReviewModal(false);
            setReviewingMilestone(null);
            setSelectedProject(null);
          }}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
};

export default ProjectsPage;
