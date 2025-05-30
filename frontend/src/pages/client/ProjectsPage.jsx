import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { format } from "date-fns";
import MessageModal from "../../components/Messaging/MessageModal";
import { fetchProjects, updateMilestone } from "../../redux/slices/projectsSlice";

const ProjectsPage = () => {
  const [activeTab, setActiveTab] = useState("active");
  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    recipientId: null,
    recipientName: "",
    projectId: null,
  });

  const dispatch = useDispatch();
  const { active, completed, loading, error } = useSelector((state) => state.projects);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchProjects({ status: activeTab === "active" ? "in_progress" : "completed" }));
  }, [dispatch, activeTab]);

  const handleMilestoneUpdate = async (projectId, milestoneId, updates) => {
    try {
      await dispatch(updateMilestone({ projectId, milestoneId, updates })).unwrap();
      // Refresh projects after milestone update
      dispatch(fetchProjects({ status: activeTab === "active" ? "in_progress,pending" : "completed" }));
    } catch (err) {
      console.error("Error updating milestone:", err);
    }
  };

  const handleMessageFreelancer = (project) => {
    setMessageModal({
      isOpen: true,
      recipientId: project.freelancer._id,
      recipientName: project.freelancer.name,
      projectId: project._id,
    });
  };

  const closeMessageModal = () => {
    setMessageModal({
      isOpen: false,
      recipientId: null,
      recipientName: "",
      projectId: null,
    });
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
          onClick={() =>
            dispatch(fetchProjects({ status: activeTab === "active" ? "in_progress,pending" : "completed" }))
          }
          className="mt-2 text-primary hover:underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  const projects = activeTab === "active" ? active : completed;

  return (
    <div>
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
          {projects.map((project) => (
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
                  <h3 className="font-medium mb-4">Project Milestones</h3>
                  <div className="space-y-4">
                    {project.milestones.map((milestone) => (
                      <div key={milestone._id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{milestone.title}</h4>
                            <p className="text-sm text-gray-600">{milestone.description}</p>
                          </div>
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
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Due Date</p>
                            <p className="font-medium">{format(new Date(milestone.dueDate), "MMM d, yyyy")}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Amount</p>
                            <p className="font-medium">${milestone.amount}</p>
                          </div>
                        </div>
                        {milestone.status === "pending" && (
                          <div className="mt-4 flex justify-end space-x-2">
                            <button
                              onClick={() =>
                                handleMilestoneUpdate(project._id, milestone._id, { status: "in_progress" })
                              }
                              className="btn-outline text-sm py-1"
                            >
                              Start Milestone
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 border-t">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Next Milestone</h3>
                    <p className="text-sm text-gray-500">
                      {project.milestones.find((m) => m.status === "pending")?.title || "All milestones completed"}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => handleMessageFreelancer(project)} className="btn-outline text-sm py-1">
                      Message Freelancer
                    </button>
                    <button className="btn-primary text-sm py-1">View Details</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed Projects */}
      {activeTab === "completed" && (
        <div className="space-y-6">
          {projects.map((project) => (
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
                <button onClick={() => handleMessageFreelancer(project)} className="btn-outline text-sm py-1">
                  Message Freelancer
                </button>
                <button className="btn-primary text-sm py-1">Rehire Freelancer</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Message Modal */}
      <MessageModal
        isOpen={messageModal.isOpen}
        onClose={closeMessageModal}
        recipientId={messageModal.recipientId}
        recipientName={messageModal.recipientName}
        projectId={messageModal.projectId}
      />
    </div>
  );
};

export default ProjectsPage;
