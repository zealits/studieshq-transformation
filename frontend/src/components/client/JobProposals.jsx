import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { updateProposalStatus } from "../../redux/actions/jobActions";
import { formatDate } from "../../utils/dateUtils";

const JobProposals = () => {
  const { jobId } = useParams();
  const dispatch = useDispatch();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProposals();
  }, [jobId]);

  const fetchProposals = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/proposals`, {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch proposals");
      }

      const data = await response.json();
      setProposals(data.data.proposals);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      toast.error("Failed to load proposals");
    }
  };

  const handleStatusUpdate = async (proposalId, newStatus) => {
    try {
      const response = await dispatch(updateProposalStatus(jobId, proposalId, { status: newStatus }));

      if (response.success) {
        toast.success(`Proposal ${newStatus} successfully`);
        // Refresh proposals list
        fetchProposals();
      } else {
        toast.error(response.message || "Failed to update proposal status");
      }
    } catch (err) {
      toast.error("Failed to update proposal status");
    }
  };

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
      default:
        return "bg-gray-100 text-gray-800";
    }
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
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Proposals</h2>
        <span className="text-sm text-gray-500">
          {proposals.length} {proposals.length === 1 ? "proposal" : "proposals"}
        </span>
      </div>

      {proposals.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No proposals received yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => (
            <div key={proposal._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-4">
                  <img
                    src={proposal.freelancer.avatar || "/default-avatar.png"}
                    alt={proposal.freelancer.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{proposal.freelancer.name}</h3>
                    <p className="text-sm text-gray-500">Applied {formatDate(proposal.createdAt)}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(proposal.status)}`}>
                  {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                </span>
              </div>

              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Bid Price</p>
                    <p className="font-medium">${proposal.bidPrice}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Estimated Duration</p>
                    <p className="font-medium">{proposal.estimatedDuration}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Cover Letter</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{proposal.coverLetter}</p>
                </div>

                {proposal.status === "pending" && (
                  <div className="flex space-x-3 mt-4">
                    <button
                      onClick={() => handleStatusUpdate(proposal._id, "shortlisted")}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Shortlist
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(proposal._id, "accepted")}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(proposal._id, "rejected")}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {proposal.status === "shortlisted" && (
                  <div className="flex space-x-3 mt-4">
                    <button
                      onClick={() => handleStatusUpdate(proposal._id, "accepted")}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(proposal._id, "rejected")}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobProposals;
