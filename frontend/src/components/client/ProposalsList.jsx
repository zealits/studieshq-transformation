import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchJobProposals, updateProposalStatus } from "../../redux/slices/jobsSlice";
import Spinner from "../common/Spinner";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-hot-toast";
import jobService from "../../services/jobService";

// Progress Bar Component
const ProgressBar = ({ percentage, label, showPercentage = true }) => {
  const getColor = (percent) => {
    if (percent >= 80) return "bg-green-500";
    if (percent >= 60) return "bg-blue-500";
    if (percent >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getTextColor = (percent) => {
    if (percent >= 80) return "text-green-700";
    if (percent >= 60) return "text-blue-700";
    if (percent >= 40) return "text-yellow-700";
    return "text-red-700";
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-gray-700">{label}</span>
        {showPercentage && (
          <span className={`text-xs font-bold ${getTextColor(percentage)}`}>
            {percentage}%
          </span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full ${getColor(percentage)} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// AI Loading Component
const AILoadingAnimation = () => {
  const [dots, setDots] = useState("");
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);
    
    return () => clearInterval(interval);
  }, []);

  const messages = [
    "AI is analyzing profiles",
    "Matching skills and experience",
    "Evaluating best candidates",
    "Finding perfect matches"
  ];
  
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative mb-8">
        {/* Animated AI Brain Icon */}
        <div className="relative w-24 h-24">
          <svg
            className="w-24 h-24 text-primary animate-pulse"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          {/* Rotating rings */}
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin opacity-20"></div>
          <div className="absolute inset-2 border-4 border-blue-400 border-t-transparent rounded-full animate-spin opacity-30" style={{ animationDirection: "reverse", animationDuration: "1.5s" }}></div>
        </div>
      </div>
      
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          {messages[currentMessageIndex]}{dots}
        </h3>
        <p className="text-gray-600 text-sm">
          This may take a few moments
        </p>
      </div>
      
      {/* Animated progress bar */}
      <div className="w-64 h-1 bg-gray-200 rounded-full mt-6 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary via-blue-400 to-primary rounded-full animate-pulse" style={{ width: "60%" }}></div>
      </div>
    </div>
  );
};

const ProposalsList = ({ jobId, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
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
  const [rankedProposals, setRankedProposals] = useState([]);
  const [rankings, setRankings] = useState({});
  const [loadingRanked, setLoadingRanked] = useState(false);
  const [rankedError, setRankedError] = useState(null);

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

      // If accepting a proposal and no more slots are available, offer to close the modal
      if (status === "accepted") {
        if (remainingSlots <= 1) {
          toast.success("All freelancer slots have been filled! The job is now in progress.");
        }
        
        // Close the modal and switch to closed listings tab
        setTimeout(() => {
          // Pass true to onClose to indicate we should switch to the closed tab
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

  // Fetch ranked candidates when "bestmatch" tab is selected
  useEffect(() => {
    if (selectedTab === "bestmatch" && jobId && selectedJob?.project_id) {
      const fetchRankedCandidates = async () => {
        setLoadingRanked(true);
        setRankedError(null);
        try {
          const result = await jobService.getRankedCandidates(jobId);
          if (result?.success && result?.data) {
            setRankedProposals(result.data.matchedProposals || []);
            setRankings(result.data.rankings || {});
          } else {
            setRankedError("Failed to load ranked candidates");
            toast.error("Failed to load ranked candidates");
          }
        } catch (err) {
          console.error("Failed to load ranked candidates:", err);
          const errorMessage = err?.message || "Failed to load ranked candidates";
          setRankedError(errorMessage);
          toast.error(errorMessage);
        } finally {
          setLoadingRanked(false);
        }
      };

      fetchRankedCandidates();
    } else if (selectedTab === "bestmatch" && !selectedJob?.project_id) {
      setRankedError("This job does not have a project ID. Ranked candidates are only available for jobs with registered projects.");
      setRankedProposals([]);
      setRankings({});
    }
  }, [selectedTab, jobId, selectedJob?.project_id]);

  // Filter proposals based on selected tab
  const filteredProposals = selectedTab === "bestmatch" 
    ? rankedProposals 
    : localProposals.filter((proposal) => {
        if (selectedTab === "all") return true;
        return proposal.status === selectedTab;
      });

  // Handle viewing freelancer profile
  const handleViewProfile = (proposal) => {
    const freelancerId = proposal.freelancer?._id || proposal.freelancer;
    if (freelancerId) {
      // Check if we're on the company client route or regular client route
      const isCompanyClient = location.pathname.startsWith("/company/client");
      const basePath = isCompanyClient ? "/company/client" : "/client";
      navigate(`${basePath}/freelancers/${freelancerId}`);
    } else {
      toast.error("Unable to load freelancer profile");
    }
  };

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
          <button onClick={() => onClose(false)} className="text-gray-500 hover:text-gray-700 focus:outline-none" aria-label="Close">
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
          <button
            className={`pb-2 px-4 font-medium ${
              selectedTab === "bestmatch"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setSelectedTab("bestmatch")}
          >
            Best Match
          </button>
        </div>

        <div className="p-6">
          {selectedTab === "bestmatch" && loadingRanked ? (
            <AILoadingAnimation />
          ) : selectedTab === "bestmatch" && rankedError ? (
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
              <p className="text-lg font-medium text-gray-800 mb-1">Error Loading Best Matches</p>
              <p className="text-gray-600 mb-4">{rankedError}</p>
              <button
                onClick={() => setSelectedTab("bestmatch")}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
              >
                Try Again
              </button>
            </div>
          ) : selectedTab === "bestmatch" && filteredProposals.length === 0 ? (
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
              <p className="text-lg font-medium text-gray-800 mb-1">No matched candidates</p>
              <p className="text-gray-600">No proposals match the ranked candidates for this job.</p>
            </div>
          ) : isLoading && localProposals.length === 0 && !loadingError ? (
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
            <div className="space-y-6">
              {filteredProposals.map((proposal) => (
                <div key={proposal._id} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300 relative">
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

                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6 pb-6 border-b border-gray-200">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center text-white overflow-hidden shadow-md ring-2 ring-white">
                        {proposal.freelancerProfileSnapshot?.avatar ? (
                          <img
                            src={proposal.freelancerProfileSnapshot.avatar}
                            alt={proposal.freelancerProfileSnapshot.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl font-bold">
                            {proposal.freelancerProfileSnapshot?.name?.charAt(0) || "F"}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-xl text-gray-900 mb-1">
                              {proposal.freelancerProfileSnapshot?.name || "Freelancer"}
                            </h3>
                            <p className="text-gray-600 font-medium mb-2">{proposal.freelancerProfileSnapshot?.title || "Freelancer"}</p>
                            {(proposal.freelancerProfileSnapshot?.companyName || proposal.freelancer?.companyFreelancer?.companyName || proposal.freelancer?.companyFreelancerName) && (
                              <p className="text-sm text-primary font-semibold mb-3 inline-flex items-center">
                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                {proposal.freelancerProfileSnapshot?.companyName || proposal.freelancer?.companyFreelancer?.companyName || proposal.freelancer?.companyFreelancerName}
                              </p>
                            )}
                            <div className="flex items-center flex-wrap gap-2">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                  proposal.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                    : proposal.status === "shortlisted"
                                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                                    : proposal.status === "accepted"
                                    ? "bg-green-100 text-green-800 border border-green-200"
                                    : "bg-red-100 text-red-800 border border-red-200"
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
                              <span className="text-sm text-gray-500 font-medium">
                                Submitted {formatSubmittedDate(proposal.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row gap-4 items-start">
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm min-w-[120px]">
                        <p className="text-3xl font-bold text-gray-900 mb-1">${proposal.bidPrice}</p>
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Bid Amount</p>
                      </div>
                      {selectedTab === "bestmatch" && rankings[proposal._id] && (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 shadow-sm min-w-[140px]">
                          <p className="text-3xl font-bold text-blue-600 mb-1">
                            {Math.round(rankings[proposal._id].overallScore * 100)}%
                          </p>
                          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Match Score</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedTab === "bestmatch" && rankings[proposal._id] && (
                    <div className="mt-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-center mb-4">
                        <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <h4 className="font-bold text-blue-900 text-sm uppercase tracking-wide">Match Details</h4>
                      </div>
                      <div className="space-y-3 mb-4">
                        <ProgressBar
                          percentage={Math.round(rankings[proposal._id].overallScore * 100)}
                          label="Overall Score"
                        />
                        <ProgressBar
                          percentage={Math.round(rankings[proposal._id].professionalScore * 100)}
                          label="Professional"
                        />
                        <ProgressBar
                          percentage={Math.round(rankings[proposal._id].projectScore * 100)}
                          label="Project"
                        />
                        <ProgressBar
                          percentage={Math.round(rankings[proposal._id].skillsScore * 100)}
                          label="Skills"
                        />
                      </div>
                      {(rankings[proposal._id].seniorityLevel || rankings[proposal._id].highestEducation || rankings[proposal._id].hasLeadership) && (
                        <div className="pt-3 border-t border-blue-200">
                          <div className="flex flex-wrap gap-2">
                            {rankings[proposal._id].seniorityLevel && (
                              <span className="text-xs bg-white text-blue-800 px-2.5 py-1 rounded-full font-semibold border border-blue-200">
                                {rankings[proposal._id].seniorityLevel}
                              </span>
                            )}
                            {rankings[proposal._id].highestEducation && (
                              <span className="text-xs bg-white text-blue-800 px-2.5 py-1 rounded-full font-semibold border border-blue-200">
                                {rankings[proposal._id].highestEducation}
                              </span>
                            )}
                            {rankings[proposal._id].hasLeadership && (
                              <span className="text-xs bg-white text-blue-800 px-2.5 py-1 rounded-full font-semibold border border-blue-200">
                                Leadership
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200 shadow-sm">
                      <span className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Estimated Duration</span>
                      <span className="font-bold text-gray-900 text-lg">
                        {proposal.estimatedDuration === "less_than_1_month"
                          ? "Less than 1 month"
                          : proposal.estimatedDuration === "1_to_3_months"
                          ? "1 to 3 months"
                          : proposal.estimatedDuration === "3_to_6_months"
                          ? "3 to 6 months"
                          : "More than 6 months"}
                      </span>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200 shadow-sm">
                      <span className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Experience</span>
                      <span className="font-bold text-gray-900 text-lg">
                        {proposal.freelancerProfileSnapshot?.experience || "Not specified"}
                      </span>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200 shadow-sm">
                      <span className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Hourly Rate</span>
                      <span className="font-bold text-gray-900 text-lg">
                        {proposal.freelancerProfileSnapshot?.hourlyRate
                          ? `$${proposal.freelancerProfileSnapshot.hourlyRate.min} - $${proposal.freelancerProfileSnapshot.hourlyRate.max}/hr`
                          : "Not specified"}
                      </span>
                    </div>
                  </div>

                  {proposal.freelancerProfileSnapshot?.skills &&
                    proposal.freelancerProfileSnapshot.skills.length > 0 && (
                      <div className="mt-6">
                        <span className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Skills</span>
                        <div className="flex flex-wrap gap-2">
                          {proposal.freelancerProfileSnapshot.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="bg-white text-gray-800 text-sm font-semibold px-4 py-2 rounded-full border border-gray-300 shadow-sm hover:shadow-md transition-shadow"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  <div className="mt-6">
                    <h4 className="font-bold text-gray-900 mb-3 text-lg">Cover Letter</h4>
                    <div className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl border border-gray-200 text-gray-700 leading-relaxed shadow-sm">{proposal.coverLetter}</div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-200 flex flex-wrap gap-3">
                    {proposal.status === "pending" && (
                      <>
                        <button
                          className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleUpdateStatus(proposal._id, "shortlisted")}
                          disabled={updatingProposalId !== null}
                        >
                          Shortlist
                        </button>
                        <button
                          className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleUpdateStatus(proposal._id, "accepted")}
                          disabled={updatingProposalId !== null}
                        >
                          Accept Proposal
                        </button>
                        <button
                          className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                          className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleUpdateStatus(proposal._id, "accepted")}
                          disabled={updatingProposalId !== null}
                        >
                          Accept Proposal
                        </button>
                        <button
                          className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleUpdateStatus(proposal._id, "rejected")}
                          disabled={updatingProposalId !== null}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => handleViewProfile(proposal)}
                      className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                    >
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
