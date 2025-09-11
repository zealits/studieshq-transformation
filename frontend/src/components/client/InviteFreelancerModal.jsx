import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { fetchClientJobs } from "../../redux/slices/jobsSlice";

const InviteFreelancerModal = ({ isOpen, onClose, freelancer, onInviteSuccess }) => {
  const [message, setMessage] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { clientJobs } = useSelector((state) => state.jobs);

  // Fetch client jobs when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoadingJobs(true);
      dispatch(fetchClientJobs())
        .unwrap()
        .finally(() => setLoadingJobs(false));
    }
  }, [isOpen, dispatch]);

  // Get all open jobs for selection
  const openJobs = clientJobs.active?.filter(job => job.status === "open") || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!freelancer) return;

    // Validate job selection
    if (!selectedJobId) {
      toast.error("Please select a project to invite the freelancer to");
      return;
    }

    setIsLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:2001";
      
      // Find the selected job
      const selectedJob = openJobs.find(job => job._id === selectedJobId);
      
      if (!selectedJob) {
        toast.error("Selected project not found. Please try again.");
        setIsLoading(false);
        return;
      }

      console.log("Selected job for invitation:", selectedJob);

      const requestBody = {
        freelancerId: freelancer.user._id,
        message: message.trim() || "",
      };

      console.log("Freelancer data:", {
        freelancer,
        freelancerId: freelancer.user._id,
        freelancerRole: freelancer.user.role,
        freelancerName: freelancer.user.name
      });

      console.log("Sending invitation request:", {
        url: `${API_URL}/api/jobs/${selectedJob._id}/invite`,
        body: requestBody,
        token: localStorage.getItem("token") ? "Present" : "Missing"
      });

      const response = await fetch(`${API_URL}/api/jobs/${selectedJob._id}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": localStorage.getItem("token"),
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error response:", response.status, errorText);
        toast.error(`Server error: ${response.status}. Please check if you're logged in and try again.`);
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      if (data.success) {
        toast.success(`Invitation sent successfully for project: ${selectedJob.title}`);
        onInviteSuccess && onInviteSuccess();
        setSelectedJobId("");
        setMessage("");
        onClose();
      } else {
        toast.error(data.message || "Failed to send invitation");
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      if (error.message.includes("JSON")) {
        toast.error("Server returned invalid response. Please check if you're logged in and try again.");
      } else {
        toast.error("Failed to send invitation. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !freelancer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Invite to Project</h3>
          <button
            onClick={() => {
              setSelectedJobId("");
              setMessage("");
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              {freelancer.user?.name?.charAt(0) || "F"}
            </div>
            <div>
              <h4 className="font-medium">{freelancer.user?.name}</h4>
              <p className="text-sm text-gray-500">
                {freelancer.skills?.slice(0, 2).join(", ") || "No skills specified"}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-2">
              Select Project *
            </label>
            {loadingJobs ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Loading projects...
              </div>
            ) : openJobs.length === 0 ? (
              <div className="w-full px-3 py-2 border border-red-300 rounded-md bg-red-50 text-red-600">
                No open projects available. Please create a project first.
              </div>
            ) : (
              <select
                id="project"
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Choose a project...</option>
                {openJobs.map((job) => (
                  <option key={job._id} value={job._id}>
                    {job.title} - ${job.budget?.min || 0} - ${job.budget?.max || 0} {job.budget?.type === 'hourly' ? '/hr' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Invitation Message (Optional)
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message to your invitation..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{message.length}/500 characters</p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedJobId || openJobs.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Sending..." : "Send Invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteFreelancerModal;
