import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchJobProposals } from "../../redux/slices/jobsSlice";
import Spinner from "../common/Spinner";
import { formatDistanceToNow } from "date-fns";

const ProposalsList = ({ jobId, onClose }) => {
  const dispatch = useDispatch();
  const { proposals, isLoading } = useSelector((state) => state.jobs);

  useEffect(() => {
    if (jobId) {
      dispatch(fetchJobProposals(jobId));
    }
  }, [jobId, dispatch]);

  const formatSubmittedDate = (date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Proposals ({proposals.length})</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      {proposals.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <p className="text-lg font-medium text-gray-500 mb-1">No proposals yet</p>
          <p className="text-gray-500">You'll be notified when freelancers submit proposals for this job.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {proposals.map((proposal) => (
            <div key={proposal._id} className="border-b pb-6 last:border-b-0 last:pb-0">
              <div className="flex justify-between items-start">
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-white">
                    {proposal.freelancerProfileSnapshot?.avatar ? (
                      <img 
                        src={proposal.freelancerProfileSnapshot.avatar} 
                        alt={proposal.freelancerProfileSnapshot.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      proposal.freelancerProfileSnapshot?.name?.charAt(0) || "F"
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium">{proposal.freelancerProfileSnapshot?.name || "Freelancer"}</h3>
                    <p className="text-sm text-gray-500">{proposal.freelancerProfileSnapshot?.title || "Freelancer"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">${proposal.bidPrice}</p>
                  <p className="text-sm text-gray-500">
                    Submitted {formatSubmittedDate(proposal.createdAt)}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="block text-sm text-gray-500 mb-1">Duration</span>
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
                <div>
                  <span className="block text-sm text-gray-500 mb-1">Experience</span>
                  <span className="font-medium">
                    {proposal.freelancerProfileSnapshot?.experience || "Not specified"}
                  </span>
                </div>
                <div>
                  <span className="block text-sm text-gray-500 mb-1">Hourly Rate</span>
                  <span className="font-medium">
                    ${proposal.freelancerProfileSnapshot?.hourlyRate || "Not specified"}
                  </span>
                </div>
              </div>

              {proposal.freelancerProfileSnapshot?.skills && proposal.freelancerProfileSnapshot.skills.length > 0 && (
                <div className="mt-3">
                  <span className="block text-sm text-gray-500 mb-1">Skills</span>
                  <div className="flex flex-wrap gap-2">
                    {proposal.freelancerProfileSnapshot.skills.map((skill, index) => (
                      <span key={index} className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4">
                <span className="block text-sm text-gray-500 mb-1">Cover Letter</span>
                <p className="text-gray-700">{proposal.coverLetter}</p>
              </div>

              <div className="mt-6 flex space-x-3">
                <button className="btn-primary text-sm py-1">Message</button>
                <button className="btn-outline text-sm py-1">View Profile</button>
                <button className="btn-success text-sm py-1">Hire Freelancer</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProposalsList; 