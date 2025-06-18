import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchJobProposals, updateProposalStatus } from "../../redux/slices/jobsSlice";
import Spinner from "../common/Spinner";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-hot-toast";

const ProposalsList = ({ jobId, onClose }) => {
  const dispatch = useDispatch();
  const { clientJobs, proposals, isLoading, error } = useSelector((state) => state.jobs);
  const [confirmingProposal, setConfirmingProposal] = useState(null);

  // Find the selected job from active jobs
  const selectedJob =
    clientJobs.active.find((job) => job._id === jobId) ||
    clientJobs.closed.find((job) => job._id === jobId) ||
    clientJobs.draft.find((job) => job._id === jobId);

  // Get proposals from the selected job
  const jobProposals = selectedJob?.proposals || [];

  // Count accepted proposals
  const acceptedProposalsCount = jobProposals.filter((p) => p.status === "accepted").length;
  const remainingSlots = (selectedJob?.freelancersNeeded || 1) - acceptedProposalsCount;

  const [selectedTab, setSelectedTab] = useState("all");
  const [loadingError, setLoadingError] = useState(null);
  const [updatingProposalId, setUpdatingProposalId] = useState(null);
  const [localProposals, setLocalProposals] = useState([]);

  useEffect(() => {
    // If we already have proposals in the selected job, use them
    if (selectedJob?.proposals && selectedJob.proposals.length > 0) {
      setLocalProposals(selectedJob.proposals);
      setLoadingError(null);
    } else if (selectedJob?.applicationCount === 0) {
      // If we know there are zero proposals, don't make the API call
      setLocalProposals([]);
      setLoadingError(null);
    } else {
      // Otherwise fetch them from API
      const loadProposals = async () => {
        if (jobId) {
          try {
            setLoadingError(null);
            const result = await dispatch(fetchJobProposals(jobId)).unwrap();
            if (result?.data?.proposals) {
              setLocalProposals(result.data.proposals);
            } else {
              // Ensure we set an empty array if no proposals are returned
              setLocalProposals([]);
            }
          } catch (err) {
            console.error("Failed to load proposals:", err);
            setLoadingError(err || "Failed to load proposals");
            toast.error(err || "Failed to load proposals");
          }
        }
      };

      loadProposals();
    }
  }, [jobId, dispatch, selectedJob]);

  const formatSubmittedDate = (date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  // Handle updating proposal status
  const handleUpdateStatus = async (proposalId, status) => {
    // Add confirmation for accepting a proposal
    if (status === "accepted") {
      // Check if there are remaining slots
      if (remainingSlots <= 0) {
        toast.error("No more freelancer slots available for this job");
        return;
      }

      // Set the proposal being confirmed
      setConfirmingProposal(proposalId);
      return;
    }

    await updateProposal(proposalId, status);
  };

  const updateProposal = async (proposalId, status) => {
    setUpdatingProposalId(proposalId);
    try {
      await dispatch(
        updateProposalStatus({
          jobId,
          proposalId,
          status,
        })
      ).unwrap();

      // Update local state
      setLocalProposals((prev) =>
        prev.map((proposal) => (proposal._id === proposalId ? { ...proposal, status } : proposal))
      );

      toast.success(
        `Proposal ${status === "accepted" ? "accepted" : status === "rejected" ? "rejected" : "updated"} successfully`
      );

      // If accepting a proposal
      if (status === "accepted") {
        // Calculate the new count of accepted proposals after this acceptance
        const newAcceptedCount = localProposals.filter(
          (p) => p.status === "accepted" || (p._id === proposalId && status === "accepted")
        ).length;

        // Check if we've reached the required number of freelancers
        const allFreelancersHired = newAcceptedCount >= (selectedJob?.freelancersNeeded || 1);

        if (allFreelancersHired) {
          toast.success("All freelancer slots have been filled! The job is now in progress.");
        }

        // Close the modal and switch to closed listings tab
        setTimeout(() => {
          // Pass true to onClose to indicate we should switch to the closed tab
          // We always switch to closed tab when a proposal is accepted
          onClose(true);
        }, 2000);
      }
    } catch (err) {
      toast.error(err || `Failed to ${status} proposal`);
    } finally {
      setUpdatingProposalId(null);
      setConfirmingProposal(null);
    }
  };

  // Filter proposals based on selected tab
  const filteredProposals = localProposals.filter((proposal) => {
    if (selectedTab === "all") return true;
    return proposal.status === selectedTab;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b z-10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Proposals ({localProposals.length})</h2>
            <p className="text-sm text-gray-600 mt-1">
              {remainingSlots} freelancer{remainingSlots === 1 ? "" : "s"} needed
            </p>
          </div>
          <button
            onClick={() => onClose(false)}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-4 flex border-b">
          <button
            className={`pb-2 px-4 font-medium ${
              selectedTab === "all" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setSelectedTab("all")}
          >
            All
          </button>
          <button
            className={`pb-2 px-4 font-medium ${
              selectedTab === "pending" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setSelectedTab("pending")}
          >
            Pending
          </button>
          <button
            className={`pb-2 px-4 font-medium ${
              selectedTab === "shortlisted"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setSelectedTab("shortlisted")}
          >
            Shortlisted
          </button>
          <button
            className={`pb-2 px-4 font-medium ${
              selectedTab === "accepted"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setSelectedTab("accepted")}
          >
            Accepted
          </button>
          <button
            className={`pb-2 px-4 font-medium ${
              selectedTab === "rejected"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setSelectedTab("rejected")}
          >
            Rejected
          </button>
        </div>

        <div className="p-6">
          {isLoading && localProposals.length === 0 && !loadingError ? (
            <div className="flex justify-center items-center py-12">
              <Spinner size="large" />
            </div>
          ) : loadingError ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 mx-auto text-red-300 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <p className="text-lg font-medium text-gray-800 mb-1">Error Loading Proposals</p>
              <p className="text-gray-600 mb-4">{loadingError}</p>
              <button
                onClick={() => dispatch(fetchJobProposals(jobId))}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
              >
                Try Again
              </button>
            </div>
          ) : filteredProposals.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 mx-auto text-gray-300 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
              {selectedTab === "all" ? (
                <>
                  <p className="text-lg font-medium text-gray-800 mb-1">No proposals yet</p>
                  <p className="text-gray-600">You'll be notified when freelancers submit proposals for this job.</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium text-gray-800 mb-1">No {selectedTab} proposals</p>
                  <p className="text-gray-600">There are no proposals with {selectedTab} status.</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {filteredProposals.map((proposal) => (
                <div key={proposal._id} className="border rounded-lg p-6 hover:shadow-md transition-shadow relative">
                  {updatingProposalId === proposal._id && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                      <Spinner size="medium" />
                    </div>
                  )}

                  {/* Confirmation Overlay */}
                  {confirmingProposal === proposal._id && (
                    <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-20 rounded-lg p-6">
                      <div className="text-center max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Confirm Hiring</h3>
                        <p className="text-gray-600 mb-6">
                          Accepting this proposal will hire this freelancer. {remainingSlots - 1} more freelancer
                          {remainingSlots - 1 === 1 ? "" : "s"} can be hired for this job.
                        </p>
                        <div className="flex justify-center space-x-4">
                          <button
                            onClick={() => setConfirmingProposal(null)}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => updateProposal(proposal._id, "accepted")}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                          >
                            Confirm Hire
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="flex items-start">
                      <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center text-white overflow-hidden">
                        {proposal.freelancerProfileSnapshot?.avatar ? (
                          <img
                            src={proposal.freelancerProfileSnapshot.avatar}
                            alt={proposal.freelancerProfileSnapshot.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-semibold">
                            {proposal.freelancerProfileSnapshot?.name?.charAt(0) || "F"}
                          </span>
                        )}
                      </div>
                      <div className="ml-4">
                        <h3 className="font-semibold text-lg">
                          {proposal.freelancerProfileSnapshot?.name || "Freelancer"}
                        </h3>
                        <p className="text-gray-600">{proposal.freelancerProfileSnapshot?.title || "Freelancer"}</p>
                        <div className="mt-1 flex items-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              proposal.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : proposal.status === "shortlisted"
                                ? "bg-blue-100 text-blue-800"
                                : proposal.status === "accepted"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {proposal.status === "pending"
                              ? "Pending"
                              : proposal.status === "shortlisted"
                              ? "Shortlisted"
                              : proposal.status === "accepted"
                              ? "Accepted"
                              : "Rejected"}
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            Submitted {formatSubmittedDate(proposal.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="md:text-right">
                      <div className="bg-gray-50 rounded-lg p-3 inline-block">
                        <p className="text-2xl font-bold text-primary">${proposal.bidPrice} USD</p>
                        <p className="text-sm text-gray-500">Bid Amount</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="block text-sm text-gray-500 mb-1">Estimated Duration</span>
                      <span className="font-medium">
                        {proposal.estimatedDuration === "less_than_1_month"
                          ? "Less than 1 month"
                          : proposal.estimatedDuration === "1_to_3_months"
                          ? "1 to 3 months"
                          : proposal.estimatedDuration === "3_to_6_months"
                          ? "3 to 6 months"
                          : "More than 6 months"}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="block text-sm text-gray-500 mb-1">Experience</span>
                      <span className="font-medium">
                        {proposal.freelancerProfileSnapshot?.experience || "Not specified"}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="block text-sm text-gray-500 mb-1">Hourly Rate</span>
                      <span className="font-medium">
                        {proposal.freelancerProfileSnapshot?.hourlyRate
                          ? `$${proposal.freelancerProfileSnapshot.hourlyRate.min} - $${proposal.freelancerProfileSnapshot.hourlyRate.max} USD/hr`
                          : "Not specified"}
                      </span>
                    </div>
                  </div>

                  {proposal.freelancerProfileSnapshot?.skills &&
                    proposal.freelancerProfileSnapshot.skills.length > 0 && (
                      <div className="mt-4">
                        <span className="block text-sm text-gray-500 mb-2">Skills</span>
                        <div className="flex flex-wrap gap-2">
                          {proposal.freelancerProfileSnapshot.skills.map((skill, index) => (
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

                  <div className="mt-5">
                    <h4 className="font-medium mb-2">Cover Letter</h4>
                    <div className="bg-gray-50 p-4 rounded-lg text-gray-700">{proposal.coverLetter}</div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {proposal.status === "pending" && (
                      <>
                        <button
                          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                          onClick={() => handleUpdateStatus(proposal._id, "shortlisted")}
                          disabled={updatingProposalId !== null}
                        >
                          Shortlist
                        </button>
                        <button
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                          onClick={() => handleUpdateStatus(proposal._id, "accepted")}
                          disabled={updatingProposalId !== null}
                        >
                          Accept Proposal
                        </button>
                        <button
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                          onClick={() => handleUpdateStatus(proposal._id, "rejected")}
                          disabled={updatingProposalId !== null}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {proposal.status === "shortlisted" && (
                      <>
                        <button
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                          onClick={() => handleUpdateStatus(proposal._id, "accepted")}
                          disabled={updatingProposalId !== null}
                        >
                          Accept Proposal
                        </button>
                        <button
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                          onClick={() => handleUpdateStatus(proposal._id, "rejected")}
                          disabled={updatingProposalId !== null}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                      Message Freelancer
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProposalsList;
