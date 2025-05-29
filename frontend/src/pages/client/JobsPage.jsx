import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchClientJobs, publishDraftJob } from "../../redux/slices/jobsSlice";
import PostJobForm from "./PostJobForm";
import Spinner from "../../components/common/Spinner";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-hot-toast";
import ProposalsList from "../../components/client/ProposalsList";
import { useNavigate } from "react-router-dom";

const JobsPage = () => {
  const [activeTab, setActiveTab] = useState("active");
  const [showPostJobForm, setShowPostJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [showProposals, setShowProposals] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { clientJobs, isLoading, error } = useSelector((state) => state.jobs);

  useEffect(() => {
    const fetchJobs = async () => {
      // Check for token first
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No authentication token found. Redirecting to login.");
        toast.error("Authentication required. Please log in again.");
        navigate("/login");
        return;
      }

      try {
        const result = await dispatch(fetchClientJobs()).unwrap();
        console.log(`Loaded ${result?.data?.jobs?.length || 0} jobs for the client`);

        // Log each job's client ID to verify ownership
        if (result?.data?.jobs?.length > 0) {
          console.log("Verifying job ownership:");
          result.data.jobs.forEach((job) => {
            console.log(`Job ID: ${job._id}, Client ID: ${job.client._id || job.client}`);
          });
        }
      } catch (error) {
        console.error("Error fetching client jobs:", error);
        // Show error toast if there's an issue fetching jobs
        toast.error(error || "Failed to load jobs. Please try again.");
        // If there's an authentication or authorization error, redirect to login
        if (
          error === "Not authorized" ||
          error === "Authorization required" ||
          error === "Client ID not found. Please re-login." ||
          error === "Authentication token missing. Please re-login." ||
          error.includes("Authentication required")
        ) {
          navigate("/login");
        }
      }
    };

    fetchJobs();
  }, [dispatch, navigate]);

  // Show error toast if there's an issue with the redux state
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const formatPostedDate = (date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const handlePublishJob = async (jobId) => {
    // Check if the client owns this job before publishing
    const jobExists = clientJobs.draft.some((job) => job._id === jobId);

    if (!jobExists) {
      toast.error("You don't have permission to publish this job");
      return;
    }

    try {
      await dispatch(publishDraftJob(jobId)).unwrap();
      toast.success("Job published successfully!");
    } catch (err) {
      toast.error(err || "Failed to publish job");
    }
  };

  const handleEditJob = (job) => {
    // Check if the client owns this job before allowing edits
    const jobExists = [...clientJobs.active, ...clientJobs.closed, ...clientJobs.draft].some((j) => j._id === job._id);

    if (!jobExists) {
      toast.error("You don't have permission to edit this job");
      return;
    }

    setEditingJob(job);
    setShowPostJobForm(true);
  };

  const handleViewProposals = (jobId) => {
    // Check if the client owns this job before showing proposals
    const jobExists = [...clientJobs.active, ...clientJobs.closed, ...clientJobs.draft].some(
      (job) => job._id === jobId
    );

    if (!jobExists) {
      toast.error("You don't have permission to view proposals for this job");
      return;
    }

    // Set state to show the proposals modal
    setSelectedJobId(jobId);
    setShowProposals(true);
  };

  const closeProposalsModal = () => {
    setShowProposals(false);
    setSelectedJobId(null);

    // Refresh jobs list when modal closes as a proposal might have been accepted
    dispatch(fetchClientJobs());
  };

  const renderJobsForTab = (jobs) => {
    if (!jobs || jobs.length === 0) {
      const messages = {
        active: {
          title: "No active jobs found",
          description: "Start posting your first job to find talented freelancers",
        },
        closed: {
          title: "No closed jobs yet",
          description: "You don't have any completed or cancelled jobs",
        },
        draft: {
          title: "No draft jobs",
          description: "Save jobs as drafts to complete them later",
        },
      };

      const currentTab = messages[activeTab] || messages.active;

      return (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <svg
            className="w-24 h-24 mx-auto text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <p className="text-xl font-medium text-gray-500 mb-2">{currentTab.title}</p>
          <p className="text-gray-500 mb-6">{currentTab.description}</p>
          <button
            onClick={() => setShowPostJobForm(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Post a Job
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {jobs.map((job) => (
          <div key={job._id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">{job.title}</h2>
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${
                  job.status === "open"
                    ? "bg-green-100 text-green-800"
                    : job.status === "in_progress"
                    ? "bg-blue-100 text-blue-800"
                    : job.status === "draft"
                    ? "bg-gray-100 text-gray-800"
                    : job.status === "completed"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {job.status === "open"
                  ? "Active"
                  : job.status === "in_progress"
                  ? "In Progress"
                  : job.status === "draft"
                  ? "Draft"
                  : job.status === "completed"
                  ? "Completed"
                  : "Cancelled"}
              </span>
            </div>

            <p className="text-gray-600 mb-4">{job.description}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <span className="block text-sm text-gray-500">Budget</span>
                <span className="font-medium">
                  {(job.budget.budgetType || job.budget.type) === "fixed"
                    ? `$${job.budget.min} - $${job.budget.max}`
                    : `$${job.budget.min} - $${job.budget.max}/hr`}
                </span>
              </div>
              <div>
                <span className="block text-sm text-gray-500">Type</span>
                <span className="font-medium">
                  {(job.budget.budgetType || job.budget.type) === "fixed" ? "Fixed Price" : "Hourly"}
                </span>
              </div>
              <div>
                <span className="block text-sm text-gray-500">Duration</span>
                <span className="font-medium">
                  {job.duration === "less_than_1_month"
                    ? "Less than 1 month"
                    : job.duration === "1_to_3_months"
                    ? "1 to 3 months"
                    : job.duration === "3_to_6_months"
                    ? "3 to 6 months"
                    : "More than 6 months"}
                </span>
              </div>
              {/* <div>
                <span className="block text-sm text-gray-500">Proposals</span>
                <span className="font-medium">{job.applicationCount || 0}</span>
              </div> */}
              <div>
                <span className="block text-sm text-gray-500">Freelancers Needed</span>
                <span className="font-medium">{job.freelancersNeeded || 1}</span>
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
              <span>Posted {formatPostedDate(job.createdAt)}</span>
            </div>

            <div className="mt-4 flex space-x-2">
              {job.status !== "draft" && (
                <button className="btn-outline text-sm py-1" onClick={() => handleViewProposals(job._id)}>
                  View Proposals ({job.applicationCount || 0})
                </button>
              )}
              <button className="btn-outline text-sm py-1" onClick={() => handleEditJob(job)}>
                Edit Job
              </button>
              {job.status === "draft" ? (
                <button className="btn-primary text-sm py-1" onClick={() => handlePublishJob(job._id)}>
                  Publish Job
                </button>
              ) : job.status === "open" ? (
                <button className="text-red-600 hover:text-red-800 text-sm py-1 px-3">Close Job</button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading && !showPostJobForm) {
    return (
      <div className="h-screen flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Jobs</h1>
          <button
            className="btn-primary"
            onClick={() => {
              setEditingJob(null);
              setShowPostJobForm(true);
            }}
          >
            Post a New Job
          </button>
        </div>
        <div className="flex-grow flex justify-center items-center">
          <Spinner size="large" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Jobs</h1>
        <button
          className="btn-primary"
          onClick={() => {
            setEditingJob(null);
            setShowPostJobForm(true);
          }}
        >
          Post a New Job
        </button>
      </div>

      {showPostJobForm ? (
        <PostJobForm
          onClose={() => {
            setShowPostJobForm(false);
            setEditingJob(null);
          }}
          jobToEdit={editingJob}
        />
      ) : showProposals && selectedJobId ? (
        <ProposalsList jobId={selectedJobId} onClose={closeProposalsModal} />
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
          {activeTab === "active" && renderJobsForTab(clientJobs.active)}

          {/* Closed Jobs */}
          {activeTab === "closed" && renderJobsForTab(clientJobs.closed)}

          {/* Draft Jobs */}
          {activeTab === "draft" && renderJobsForTab(clientJobs.draft)}
        </>
      )}
    </div>
  );
};

export default JobsPage;
