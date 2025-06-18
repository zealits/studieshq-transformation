import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { fetchJobById } from "../../redux/slices/jobsSlice";
import Spinner from "../../components/common/Spinner";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-hot-toast";
import ProposalsList from "../../components/client/ProposalsList";

const JobDetailPage = () => {
  const { jobId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { job, isLoading, error } = useSelector((state) => state.jobs);
  const { user } = useSelector((state) => state.auth);
  const [showProposals, setShowProposals] = useState(false);

  // Check if user is a client and verify job ownership
  const isClient = user?.role === "client";

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        // Attempt to fetch the job data
        await dispatch(fetchJobById(jobId)).unwrap();
      } catch (error) {
        // Handle authorization errors
        console.error("Error fetching job:", error);

        if (error === "You don't have permission to view this job") {
          toast.error("You don't have permission to view this job");
          // Redirect to jobs page
          navigate("/client/jobs");
        } else {
          toast.error(error || "Failed to load job details");
        }
      }
    };

    fetchJobDetails();
  }, [jobId, dispatch, navigate]);

  // Show error message and redirect if error occurs
  useEffect(() => {
    if (error) {
      toast.error(error);
      navigate("/client/jobs");
    }
  }, [error, navigate]);

  // Format dates for display
  const formatPostedDate = (date) => {
    if (!date) return "";
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  // Toggle proposals view
  const handleToggleProposals = () => {
    setShowProposals(!showProposals);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-xl font-medium text-gray-500 mb-2">Job not found</p>
        <button
          onClick={() => navigate("/client/jobs")}
          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary"
        >
          Back to Jobs
        </button>
      </div>
    );
  }

  // Verify the job belongs to the client
  const isOwner = isClient && (job.client._id === user.id || job.client === user.id);

  // If not owner and client, redirect back to jobs
  if (isClient && !isOwner) {
    // This is a backup check in case the backend authorization fails
    toast.error("You don't have permission to view this job");
    navigate("/client/jobs");
    return null;
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => navigate("/client/jobs")}
          className="text-primary hover:text-primary-dark flex items-center"
        >
          <svg
            className="w-5 h-5 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Jobs
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">{job.title}</h1>
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

        <p className="text-gray-600 mb-6">{job.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <span className="block text-sm text-gray-500">Budget</span>
            <div className="text-lg font-semibold text-primary">
              ${job.budget.min} - ${job.budget.max} USD
            </div>
          </div>
          <div>
            <span className="block text-sm text-gray-500">Payment Type</span>
            <span className="font-medium">
              {(job.budget.budgetType || job.budget.type) === "milestone" ? "Milestone Based" : "After Completion"}
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
          <div>
            <span className="block text-sm text-gray-500">Proposals</span>
            <span className="font-medium">{job.proposals ? job.proposals.length : 0}</span>
          </div>
        </div>

        <div className="mb-6">
          <span className="block text-sm text-gray-500 mb-1">Skills</span>
          <div className="flex flex-wrap gap-2">
            {job.skills &&
              job.skills.map((skill, index) => (
                <span key={index} className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  {skill}
                </span>
              ))}
          </div>
        </div>

        <div className="flex items-center text-sm text-gray-500 mb-6">
          <span>Posted {formatPostedDate(job.createdAt)}</span>
        </div>

        <div className="flex space-x-2">
          {job.status !== "draft" && (
            <button className="btn-primary" onClick={handleToggleProposals}>
              {showProposals ? "Hide Proposals" : `View Proposals (${job.proposals ? job.proposals.length : 0})`}
            </button>
          )}
          <button className="btn-outline" onClick={() => navigate(`/client/jobs`)}>
            Back to Jobs
          </button>
        </div>
      </div>

      {/* Show proposals if toggled on */}
      {showProposals && (
        <div className="mt-6">
          <ProposalsList jobId={jobId} onClose={handleToggleProposals} />
        </div>
      )}
    </div>
  );
};

export default JobDetailPage;
