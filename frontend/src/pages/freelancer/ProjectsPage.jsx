import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProposals, withdrawProposal } from "../../redux/actions/proposalActions";
import { fetchProjects, startMilestone } from "../../redux/slices/projectsSlice";
import { formatDate } from "../../utils/dateUtils";
import ChatButton from "../../components/common/ChatButton";
import MilestoneWorkSubmission from "../../components/milestone/MilestoneWorkSubmission";
import { toast } from "react-toastify";

const ProjectsPage = () => {
  const [activeTab, setActiveTab] = useState("active");
  const [selectedProject, setSelectedProject] = useState(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [isResubmission, setIsResubmission] = useState(false);

  const dispatch = useDispatch();
  const { proposals, loading: proposalsLoading, error: proposalsError } = useSelector((state) => state.proposals);
  const { projects, loading: projectsLoading, error: projectsError } = useSelector((state) => state.projects);
  const { user } = useSelector((state) => state.auth);

  console.log(proposals);
  console.log(projects);

  useEffect(() => {
    if (activeTab === "applied") {
      dispatch(fetchProposals());
    } else if (activeTab === "active") {
      dispatch(fetchProjects({ status: "in_progress" }));
    } else if (activeTab === "completed") {
      dispatch(fetchProjects({ status: "completed" }));
    }
  }, [activeTab, dispatch]);

  const handleWithdrawProposal = (proposalId) => {
    if (window.confirm("Are you sure you want to withdraw this proposal?")) {
      dispatch(withdrawProposal(proposalId));
    }
  };

  // Filter projects based on status
  const activeProjects = projects?.filter((p) => p.status === "in_progress") || [];
  const completedProjects = projects?.filter((p) => p.status === "completed") || [];

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "shortlisted":
        return "bg-blue-100 text-blue-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
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
        return status?.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()) || "Unknown";
    }
  };

  const getProjectStatusColor = (status) => {
    switch (status) {
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "submitted_for_review":
        return "bg-purple-100 text-purple-800";
      case "revision_requested":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleStartMilestone = async (projectId, milestone) => {
    try {
      await dispatch(
        startMilestone({
          projectId,
          milestoneId: milestone._id,
          estimatedCompletionDate: milestone.dueDate, // Use due date as estimate for now
        })
      ).unwrap();

      toast.success("Milestone started successfully!");
      // Refresh projects
      dispatch(fetchProjects({ status: activeTab === "active" ? "in_progress" : "completed" }));
    } catch (error) {
      toast.error(error.message || "Failed to start milestone");
    }
  };

  const handleSubmitWork = (project, milestone, isResubmit = false) => {
    setSelectedProject(project);
    setSelectedMilestone(milestone);
    setIsResubmission(isResubmit);
    setShowSubmissionModal(true);
  };

  const handleSubmissionSuccess = () => {
    // Refresh projects after successful submission
    dispatch(fetchProjects({ status: activeTab === "active" ? "in_progress" : "completed" }));
  };

  const getMilestoneActions = (project, milestone) => {
    switch (milestone.status) {
      case "pending":
        return (
          <button
            onClick={() => handleStartMilestone(project._id, milestone)}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Start Work
          </button>
        );
      case "in_progress":
        return (
          <button
            onClick={() => handleSubmitWork(project, milestone)}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
          >
            Submit Work
          </button>
        );
      case "submitted_for_review":
        return <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded">Awaiting Review</span>;
      case "revision_requested":
        return (
          <button
            onClick={() => handleSubmitWork(project, milestone, true)}
            className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
          >
            Resubmit Work
          </button>
        );
      case "completed":
        return <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded">Completed</span>;
      default:
        return null;
    }
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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Projects</h1>

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
            activeTab === "applied" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("applied")}
        >
          Applied Projects
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
          {projectsLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : projectsError ? (
            <div className="text-center text-red-600 p-4">
              <p>Error: {projectsError}</p>
            </div>
          ) : activeProjects.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No active projects found</p>
            </div>
          ) : (
            activeProjects.map((project) => (
              <div key={project._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold">{project.title}</h2>
                      <p className="text-gray-600">Client: {project.client?.name || "Unknown Client"}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span
                        className={`px-3 py-1 text-sm font-medium rounded-full ${getProjectStatusColor(
                          project.status
                        )}`}
                      >
                        {project.status === "completed" ? "🎉 Completed" : formatStatus(project.status)}
                      </span>
                      {project.status === "completed" && project.completedDate && (
                        <span className="text-xs text-gray-500 mt-1">
                          Completed on {formatDate(project.completedDate)}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="mt-4 text-gray-600">{project.description}</p>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Start Date</p>
                      <p className="font-medium">{formatDate(project.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Due Date</p>
                      <p className="font-medium">{formatDate(project.deadline)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Budget</p>
                      <p className="font-medium">${project.budget?.toLocaleString() || "N/A"}</p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Project Progress</span>
                      <span>
                        {project.milestones && project.milestones.length > 0
                          ? Math.round(
                              project.milestones
                                .filter((m) => m.status === "completed")
                                .reduce((sum, m) => sum + (m.percentage || 0), 0)
                            )
                          : project.completionPercentage || 0}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{
                          width: `${
                            project.milestones && project.milestones.length > 0
                              ? Math.round(
                                  project.milestones
                                    .filter((m) => m.status === "completed")
                                    .reduce((sum, m) => sum + (m.percentage || 0), 0)
                                )
                              : project.completionPercentage || 0
                          }%`,
                        }}
                      ></div>
                    </div>

                    {/* Progress details */}
                    {project.milestones && project.milestones.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        {project.milestones.filter((m) => m.status === "completed").length} of{" "}
                        {project.milestones.length} milestones completed
                      </div>
                    )}
                  </div>

                  {/* Milestones */}
                  {project.milestones && project.milestones.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-medium mb-3">Milestones</h3>
                      <div className="space-y-3">
                        {project.milestones.map((milestone) => {
                          // Calculate amount based on percentage and project budget
                          const calculatedAmount = (milestone.percentage / 100) * (project.budget || 0);

                          return (
                            <div key={milestone._id} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-medium">{milestone.title}</h4>
                                    <div className="flex items-center space-x-3">
                                      <span
                                        className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                                          milestone.status
                                        )}`}
                                      >
                                        {formatStatus(milestone.status)}
                                      </span>
                                      {getMilestoneActions(project, milestone)}
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                                  <div className="flex items-center text-sm text-gray-500 mt-2">
                                    <span>Due: {formatDate(milestone.dueDate)}</span>
                                    <span className="mx-2">•</span>
                                    <span className="font-medium text-primary">{milestone.percentage}%</span>
                                    <span className="mx-2">•</span>
                                    <span className="font-medium text-green-600">
                                      $
                                      {calculatedAmount.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </span>
                                  </div>
                                  {/* Milestone progress bar */}
                                  <div className="mt-3">
                                    <div className="flex justify-between text-xs mb-1">
                                      <span>Progress</span>
                                      <span>
                                        {milestone.status === "completed"
                                          ? "100%"
                                          : milestone.status === "in_progress"
                                          ? "50%"
                                          : "0%"}
                                      </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                      <div
                                        className={`h-1.5 rounded-full ${
                                          milestone.status === "completed"
                                            ? "bg-green-500"
                                            : milestone.status === "in_progress"
                                            ? "bg-blue-500"
                                            : "bg-gray-300"
                                        }`}
                                        style={{
                                          width:
                                            milestone.status === "completed"
                                              ? "100%"
                                              : milestone.status === "in_progress"
                                              ? "50%"
                                              : "0%",
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                                <div className="ml-4 text-right">
                                  {milestone.status === "revision_requested" && milestone.feedback && (
                                    <div className="mt-1">
                                      <span
                                        className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                                          milestone.status
                                        )}`}
                                      >
                                        <strong>Revision needed:</strong> {milestone.feedback}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
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
                            <span className="text-gray-500">In Progress:</span>
                            <div className="font-medium text-blue-600">
                              {project.milestones.filter((m) => m.status === "in_progress").length}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Earnings Progress:</span>
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
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 px-6 py-4 border-t">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Skills Required</h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {project.skills?.map((skill, index) => (
                          <span key={index} className="bg-primary bg-opacity-10 text-primary text-xs px-2 py-1 rounded">
                            {skill}
                          </span>
                        )) || <span className="text-sm text-gray-500">No skills specified</span>}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="btn-outline text-sm py-1">View Details</button>
                      <ChatButton
                        recipientId={project.client?._id}
                        recipientName={project.client?.name}
                        size="sm"
                        className="text-sm py-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Applied Projects */}
      {activeTab === "applied" && (
        <div className="space-y-6">
          {proposalsLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : proposalsError ? (
            <div className="text-center text-red-600 p-4">
              <p>Error: {proposalsError}</p>
            </div>
          ) : proposals.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No proposals submitted yet</p>
            </div>
          ) : (
            proposals.map((proposal) => (
              <div key={proposal._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold">{proposal.job.title}</h2>
                    <p className="text-gray-600">Client: {proposal.job.client.name}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(proposal.status)}`}>
                      {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">Applied {formatDate(proposal.createdAt)}</p>
                  </div>
                </div>

                <p className="mt-4 text-gray-600">{proposal.job.description}</p>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Client's Budget</p>
                    <p className="font-medium">
                      ${proposal.job.budget.min} - ${proposal.job.budget.max}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Your Bid</p>
                    <p className="font-medium">${proposal.bidPrice}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-medium">{proposal.estimatedDuration}</p>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">Proposal Details</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Cover Letter</p>
                      <p className="text-gray-700 whitespace-pre-wrap">{proposal.coverLetter}</p>
                    </div>
                    {proposal.status === "shortlisted" && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-md">
                        <p className="text-sm text-blue-700">
                          <span className="font-medium">Note:</span> Your proposal has been shortlisted! The client is
                          reviewing your profile.
                        </p>
                      </div>
                    )}
                    {proposal.status === "rejected" && (
                      <div className="mt-3 p-3 bg-red-50 rounded-md">
                        <p className="text-sm text-red-700">
                          <span className="font-medium">Note:</span> This proposal was not selected for this project.
                        </p>
                      </div>
                    )}
                    {proposal.status === "accepted" && (
                      <div className="mt-3 p-3 bg-green-50 rounded-md">
                        <p className="text-sm text-green-700">
                          <span className="font-medium">Congratulations!</span> Your proposal has been accepted. This
                          project will appear in your Active Projects.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex justify-end space-x-2">
                  <button className="btn-outline text-sm py-1">View Job Details</button>
                  {proposal.status === "pending" && (
                    <button onClick={() => handleWithdrawProposal(proposal._id)} className="btn-danger text-sm py-1">
                      Withdraw Proposal
                    </button>
                  )}
                  {proposal.status === "shortlisted" && (
                    <ChatButton
                      recipientId={proposal.job.client._id}
                      recipientName={proposal.job.client.name}
                      size="sm"
                      className="text-sm py-1"
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Completed Projects */}
      {activeTab === "completed" && (
        <div className="space-y-6">
          {projectsLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : projectsError ? (
            <div className="text-center text-red-600 p-4">
              <p>Error: {projectsError}</p>
            </div>
          ) : completedProjects.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No completed projects found</p>
            </div>
          ) : (
            completedProjects.map((project) => (
              <div key={project._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold">{project.title}</h2>
                      <p className="text-gray-600">Client: {project.client?.name || "Unknown Client"}</p>
                    </div>
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full ${getProjectStatusColor(project.status)}`}
                    >
                      {formatStatus(project.status)}
                    </span>
                  </div>

                  <p className="mt-4 text-gray-600">{project.description}</p>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Completed Date</p>
                      <p className="font-medium">{formatDate(project.completedAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Final Budget</p>
                      <p className="font-medium">${project.budget?.toLocaleString() || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="font-medium">{project.duration || "N/A"}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 border-t">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Project Completed</h3>
                      <p className="text-sm text-gray-600">Thank you for your excellent work!</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="btn-outline text-sm py-1">View Details</button>
                      <ChatButton
                        recipientId={project.client?._id}
                        recipientName={project.client?.name}
                        size="sm"
                        className="text-sm py-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Work Submission Modal */}
      {showSubmissionModal && selectedMilestone && selectedProject && (
        <MilestoneWorkSubmission
          milestone={selectedMilestone}
          projectId={selectedProject._id}
          isResubmission={isResubmission}
          onClose={() => {
            setShowSubmissionModal(false);
            setSelectedMilestone(null);
            setSelectedProject(null);
            setIsResubmission(false);
          }}
          onSuccess={handleSubmissionSuccess}
        />
      )}
    </div>
  );
};

export default ProjectsPage;
