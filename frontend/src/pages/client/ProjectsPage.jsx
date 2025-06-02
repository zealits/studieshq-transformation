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

const ProjectsPage = () => {
  const [activeTab, setActiveTab] = useState("active");
  const [selectedProject, setSelectedProject] = useState(null);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>{error}</p>
        <button
          onClick={() => dispatch(fetchProjects(activeTab === "active" ? "in_progress" : "completed"))}
          className="mt-2 text-primary hover:underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <button className="btn-primary">Create New Project</button>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`pb-2 px-4 font-medium ${
            activeTab === "active" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("active")}
        >
          Active Projects
        </button>
        <button
          className={`pb-2 px-4 font-medium ${
            activeTab === "completed" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("completed")}
        >
          Completed Projects
        </button>
      </div>

      {/* Active Projects */}
      {activeTab === "active" && (
        <div className="space-y-6">
          {projects && projects.length > 0 ? (
            projects.map((project) => (
              <div key={project._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-semibold">{project.title}</h2>
                      <p className="text-gray-600">Freelancer: {project.freelancer.name}</p>
                    </div>
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full ${
                        project.status === "in_progress"
                          ? "bg-green-100 text-green-800"
                          : project.status === "pending"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {project.status.replace("_", " ")}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-4">{project.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Start Date</p>
                      <p className="font-medium">{format(new Date(project.startDate), "MMM d, yyyy")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Due Date</p>
                      <p className="font-medium">{format(new Date(project.deadline), "MMM d, yyyy")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Budget</p>
                      <p className="font-medium">${project.budget}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Completion</p>
                      <p className="font-medium">{project.completionPercentage}%</p>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                    <div
                      className="bg-primary h-2.5 rounded-full"
                      style={{ width: `${project.completionPercentage}%` }}
                    ></div>
                  </div>

                  {/* Milestones Section */}
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium">Project Milestones</h3>
                      {user.role === "client" && (
                        <button
                          onClick={() => {
                            setSelectedProject(project);
                            setEditingMilestone(null);
                            setMilestoneForm({
                              title: "",
                              description: "",
                              percentage: "",
                              dueDate: "",
                            });
                            setShowMilestoneModal(true);
                          }}
                          className="btn-outline text-sm py-1"
                        >
                          Add Milestone
                        </button>
                      )}
                    </div>
                    <div className="space-y-4">
                      {project.milestones.map((milestone) => (
                        <div key={milestone._id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{milestone.title}</h4>
                              <p className="text-sm text-gray-600">{milestone.description}</p>
                            </div>
                            <div className="flex flex-col items-end">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  milestone.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : milestone.status === "in_progress"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {milestone.status.replace("_", " ")}
                              </span>
                              {user.role === "client" && (
                                <div className="mt-2 flex space-x-2">
                                  <button
                                    onClick={() => handleEditMilestone(milestone, project)}
                                    className="text-sm text-primary hover:underline"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMilestone(milestone._id)}
                                    className="text-sm text-red-600 hover:underline"
                                  >
                                    Delete
                                  </button>
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

                          {/* Milestone Approval Actions */}
                          {user.role === "client" && milestone.status === "pending_approval" && (
                            <div className="mt-4 flex space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedProject(project);
                                  handleApproveMilestone(milestone._id, "approved");
                                }}
                                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedProject(project);
                                  handleApproveMilestone(milestone._id, "rejected");
                                }}
                                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Next Milestone</h3>
                      <p className="text-sm text-gray-500">
                        {project.milestones.find((m) => m.status === "pending")?.title || "All milestones completed"}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <ChatButton
                        recipientId={project.freelancer._id}
                        recipientName={project.freelancer.name}
                        size="sm"
                        className="text-sm py-1"
                      />
                      <button className="btn-primary text-sm py-1">View Details</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>No active projects found.</p>
            </div>
          )}
        </div>
      )}

      {/* Completed Projects */}
      {activeTab === "completed" && (
        <div className="space-y-6">
          {projects && projects.length > 0 ? (
            projects.map((project) => (
              <div key={project._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">{project.title}</h2>
                    <p className="text-gray-600">Freelancer: {project.freelancer.name}</p>
                  </div>
                  {project.clientReview && (
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.floor(project.clientReview.rating) ? "text-yellow-400" : "text-gray-300"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-1 text-sm text-gray-600">{project.clientReview.rating}/5</span>
                    </div>
                  )}
                </div>

                <p className="text-gray-600 mb-4">{project.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Completed Date</p>
                    <p className="font-medium">{format(new Date(project.completedDate), "MMM d, yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Budget</p>
                    <p className="font-medium">${project.budget}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-medium text-green-600">Completed</p>
                  </div>
                </div>

                {project.clientReview && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 mb-4">
                    <h3 className="font-medium mb-2">Your Feedback</h3>
                    <p className="text-gray-600 italic">{project.clientReview.comment}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <ChatButton
                    recipientId={project.freelancer._id}
                    recipientName={project.freelancer.name}
                    size="sm"
                    className="text-sm py-1"
                  />
                  <button className="btn-primary text-sm py-1">Rehire Freelancer</button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>No completed projects found.</p>
            </div>
          )}
        </div>
      )}

      {/* Milestone Modal */}
      {showMilestoneModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">{editingMilestone ? "Edit Milestone" : "Create Milestone"}</h3>
              <button
                onClick={() => {
                  setShowMilestoneModal(false);
                  setEditingMilestone(null);
                  setSelectedProject(null);
                  setMilestoneForm({
                    title: "",
                    description: "",
                    percentage: "",
                    dueDate: "",
                  });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={editingMilestone ? handleUpdateMilestone : handleCreateMilestone}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={milestoneForm.title}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={milestoneForm.description}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows="3"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Percentage</label>
                <input
                  type="number"
                  min="1"
                  max={editingMilestone ? 100 : calculateRemainingPercentage()}
                  value={milestoneForm.percentage}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, percentage: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Amount: ${calculateMilestoneAmount(milestoneForm.percentage)}
                </p>
                {!editingMilestone && (
                  <p className="mt-1 text-sm text-gray-500">Remaining percentage: {calculateRemainingPercentage()}%</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                <input
                  type="date"
                  value={milestoneForm.dueDate}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowMilestoneModal(false);
                    setEditingMilestone(null);
                    setSelectedProject(null);
                    setMilestoneForm({
                      title: "",
                      description: "",
                      percentage: "",
                      dueDate: "",
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  {editingMilestone ? "Update" : "Create"} Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
