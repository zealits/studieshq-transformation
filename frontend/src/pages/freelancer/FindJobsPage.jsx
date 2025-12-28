import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchJobs, filterJobs } from "../../redux/slices/jobsSlice";
import { fetchProposals } from "../../redux/actions/proposalActions";
import { fetchMyProfile } from "../../redux/slices/profileSlice";
import Spinner from "../../components/common/Spinner";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-hot-toast";
import ApplyJobModal from "../../components/freelancer/ApplyJobModal";

// AI Job Matching Loading Component
const AIJobMatchingLoader = () => {
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
    "Analyzing your profile and skills",
    "Matching jobs to your expertise",
    "Finding the best opportunities",
    "Filtering relevant projects"
  ];
  
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 bg-white rounded-lg shadow-md">
      <div className="relative mb-8">
        {/* Animated Job Search Icon */}
        <div className="relative w-28 h-28">
          <svg
            className="w-28 h-28 text-primary animate-pulse"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {/* Rotating search rings */}
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin opacity-20"></div>
          <div className="absolute inset-3 border-4 border-blue-400 border-t-transparent rounded-full animate-spin opacity-30" style={{ animationDirection: "reverse", animationDuration: "1.5s" }}></div>
          {/* Pulsing dots */}
          <div className="absolute top-0 right-0 w-3 h-3 bg-primary rounded-full animate-ping"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: "0.5s" }}></div>
        </div>
      </div>
      
      <div className="text-center max-w-md">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          {messages[currentMessageIndex]}{dots}
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          We're finding the best jobs that match your profile
        </p>
      </div>
      
      {/* Animated progress bar */}
      <div className="w-80 h-2 bg-gray-200 rounded-full mt-6 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary via-blue-400 to-primary rounded-full animate-pulse" style={{ width: "70%" }}></div>
      </div>
      
      {/* Animated job cards preview */}
      <div className="mt-8 flex gap-3 opacity-50">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-20 h-16 bg-gray-100 rounded-lg animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}></div>
        ))}
      </div>
    </div>
  );
};

const FindJobsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    budget: "",
    jobType: "",
    experience: "",
    sortBy: "newest",
  });
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isBestMatchLoading, setIsBestMatchLoading] = useState(false);
  const [isBestMatchActive, setIsBestMatchActive] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { filteredJobs, isLoading, categories } = useSelector((state) => state.jobs);
  const { proposals } = useSelector((state) => state.proposals);
  const { user } = useSelector((state) => state.auth);
  const { profile } = useSelector((state) => state.profile);

  useEffect(() => {
    dispatch(fetchJobs()); // Fetch jobs without AI matching by default
    dispatch(fetchProposals());
    dispatch(fetchMyProfile()); // Fetch profile to check verification status
  }, [dispatch]);

  // Apply filters when searchTerm or filters change
  useEffect(() => {
    dispatch(filterJobs({ query: searchTerm, filters }));
  }, [searchTerm, filters, dispatch]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const handleApplyClick = (job) => {
    // Check if verification is mandatory for this job
    if (job.verificationMandatory) {
      // Check if user is verified
      const isVerified =
        profile?.verificationStatus === "verified" ||
        (profile?.verificationDocuments?.addressProof?.status === "approved" &&
          profile?.verificationDocuments?.identityProof?.status === "approved");

      if (!isVerified) {
        toast.error("Verification is required to apply for this project. Please complete your verification documents first.");
        navigate("/freelancer/profile?tab=verification");
        return;
      }
    }

    setSelectedJob(job);
    setShowApplyModal(true);
  };

  const closeApplyModal = () => {
    setShowApplyModal(false);
    setSelectedJob(null);
  };

  const formatPostedDate = (date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const handleSort = (sortBy) => {
    setFilters((prev) => ({
      ...prev,
      sortBy,
    }));
  };

  // Check if a job has been applied to
  const hasAppliedToJob = (jobId) => {
    return proposals.some((proposal) => proposal.job?._id === jobId);
  };

  // Get proposal status for a job
  const getProposalStatus = (jobId) => {
    const proposal = proposals.find((proposal) => proposal.job?._id === jobId);
    return proposal ? proposal.status : null;
  };

  // Handle Find Best Match button click
  const handleFindBestMatch = async () => {
    setIsBestMatchLoading(true);
    setIsBestMatchActive(true);
    try {
      // Fetch jobs with bestMatch parameter
      await dispatch(fetchJobs({ bestMatch: true })).unwrap();
    } catch (error) {
      toast.error("Failed to find best matches");
      setIsBestMatchActive(false);
    } finally {
      setIsBestMatchLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Find Projects</h1>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              className="input pl-10 pr-4 py-2 w-full"
              placeholder="Search projects by title, description, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              name="category"
              className="input"
              value={filters.category}
              onChange={handleFilterChange}
            >
              <option value="">All Categories</option>
              {categories &&
                categories.map((category, index) => (
                  <option key={index} value={category}>
                    {category}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
              Budget Range
            </label>
            <select id="budget" name="budget" className="input" value={filters.budget} onChange={handleFilterChange}>
              <option value="">Any Budget</option>
              <option value="0-500">Under $500 USD</option>
              <option value="500-1000">$500 - $1,000 USD</option>
              <option value="1000-5000">$1,000 - $5,000 USD</option>
              <option value="5000-10000">$5,000 - $10,000 USD</option>
              <option value="10000+">Over $10,000 USD</option>
            </select>
          </div>

          <div>
            <label htmlFor="jobType" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Type
            </label>
            <select id="jobType" name="jobType" className="input" value={filters.jobType} onChange={handleFilterChange}>
              <option value="">All Types</option>
              <option value="milestone">Milestone Based</option>
              <option value="completion">After Completion</option>
            </select>
          </div>

          <div>
            <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
              Experience Level
            </label>
            <select
              id="experience"
              name="experience"
              className="input"
              value={filters.experience}
              onChange={handleFilterChange}
            >
              <option value="">All Levels</option>
              <option value="entry">Entry Level</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        </div>

        {/* Sort Options */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleSort("newest")}
                className={`px-3 py-1 text-sm rounded-md ${
                  filters.sortBy === "newest" ? "bg-primary text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Newest
              </button>
              <button
                onClick={() => handleSort("budget-high")}
                className={`px-3 py-1 text-sm rounded-md ${
                  filters.sortBy === "budget-high"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Budget: High to Low
              </button>
              <button
                onClick={() => handleSort("budget-low")}
                className={`px-3 py-1 text-sm rounded-md ${
                  filters.sortBy === "budget-low"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Budget: Low to High
              </button>
              <button
                onClick={() => handleSort("proposals")}
                className={`px-3 py-1 text-sm rounded-md ${
                  filters.sortBy === "proposals"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Most Proposals
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleFindBestMatch}
              disabled={isBestMatchLoading}
              className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isBestMatchActive
                  ? "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500"
                  : "bg-primary text-white hover:bg-primary-dark focus:ring-primary"
              } ${isBestMatchLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isBestMatchLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Finding Matches...
                </span>
              ) : isBestMatchActive ? (
                "✓ Best Matches Found"
              ) : (
                "Find Best Match"
              )}
            </button>
            <button
              onClick={() => {
                setSearchTerm("");
                setFilters({
                  category: "",
                  budget: "",
                  jobType: "",
                  experience: "",
                  sortBy: "newest",
                });
                setIsBestMatchActive(false);
                dispatch(fetchJobs()); // Reset to normal view
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      {isLoading || isBestMatchLoading ? (
        <AIJobMatchingLoader />
      ) : filteredJobs.length === 0 ? (
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
          <p className="text-xl font-medium text-gray-500 mb-2">No jobs found</p>
          <p className="text-gray-500 mb-6">
            {searchTerm || Object.values(filters).some((val) => val)
              ? "Try adjusting your search filters to find more results"
              : "There are currently no active jobs available. Check back later!"}
          </p>
          {(searchTerm || Object.values(filters).some((val) => val)) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setFilters({
                  category: "",
                  budget: "",
                  jobType: "",
                  experience: "",
                });
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredJobs.map((job) => {
            const hasApplied = hasAppliedToJob(job._id);
            const proposalStatus = getProposalStatus(job._id);

            return (
              <div key={job._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="text-xl font-semibold hover:text-primary">{job.title}</h2>
                      {/* Display tags */}
                      {job.tags && job.tags.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {job.tags.map((tag, index) => {
                            // Get color classes based on tag color
                            const colorClasses = {
                              green: "bg-green-100 text-green-800 border-green-200",
                              blue: "bg-blue-100 text-blue-800 border-blue-200",
                              red: "bg-red-100 text-red-800 border-red-200",
                              purple: "bg-purple-100 text-purple-800 border-purple-200",
                              gold: "bg-yellow-100 text-yellow-800 border-yellow-200",
                              yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
                            };
                            
                            return (
                              <span
                                key={index}
                                className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${colorClasses[tag.color] || "bg-gray-100 text-gray-800 border-gray-200"}`}
                              >
                                {tag.label}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <span>
                        ${job.budget.min} - ${job.budget.max} USD
                      </span>
                      <span className="mx-2">•</span>
                      <span>{job.budget.type === "milestone" ? "Milestone Based" : "After Completion"}</span>
                      <span className="mx-2">•</span>
                      <span>Posted {formatPostedDate(job.createdAt)}</span>
                      <span className="mx-2">•</span>
                      <span>{job.applicationCount || 0} proposals</span>
                    </div>
                  </div>
                  {hasApplied ? (
                    <div className="flex flex-col items-end ml-4">
                      <span
                        className={`px-3 py-1 text-sm font-medium rounded-full ${
                          proposalStatus === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : proposalStatus === "shortlisted"
                            ? "bg-blue-100 text-blue-800"
                            : proposalStatus === "accepted"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {proposalStatus.charAt(0).toUpperCase() + proposalStatus.slice(1)}
                      </span>
                      <span className="text-sm text-gray-500 mt-1">Already Applied</span>
                    </div>
                  ) : (
                    <button className="btn-primary ml-4" onClick={() => handleApplyClick(job)}>
                      Apply Now
                    </button>
                  )}
                </div>

                <p className="mt-4 text-gray-600 line-clamp-3" title={job.description}>
                  {job.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => (
                    <span key={index} className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      {skill}
                    </span>
                  ))}
                </div>

                {job.client && (
                  <div className="mt-4 pt-4 border-t flex items-center">
                    <div className="w-8 h-8 bg-primary-light rounded-full flex items-center justify-center text-white">
                      {(() => {
                        // Show company name initial if it's a project sponsor company
                        if (job.client.role === "project_sponsor_company" && (job.companyDetails?.name || job.client.company?.businessName)) {
                          return (job.companyDetails?.name || job.client.company?.businessName || "C").charAt(0).toUpperCase();
                        }
                        // Otherwise show client name initial
                        return job.client.name ? job.client.name.charAt(0) : "C";
                      })()}
                    </div>
                    <div className="ml-3">
                      {/* Show company name if it's a project sponsor company */}
                      {(job.client.role === "project_sponsor_company" && (job.companyDetails?.name || job.client.company?.businessName)) || job.companyDetails?.name ? (
                        <div>
                          <div className="font-medium">
                            {job.companyDetails?.name || job.client.company?.businessName || "Company"}
                          </div>
                          <div className="flex items-center text-sm">
                            {(job.companyDetails?.website || job.client.company?.website) && (
                              <a
                                href={
                                  (job.companyDetails?.website || job.client.company?.website).startsWith("http")
                                    ? (job.companyDetails?.website || job.client.company?.website)
                                    : `https://${job.companyDetails?.website || job.client.company?.website}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                Website
                              </a>
                            )}
                            {job.client.profile?.rating && (
                              <>
                                {(job.companyDetails?.website || job.client.company?.website) && <span className="mx-2">•</span>}
                                <div className="flex items-center">
                                  <svg
                                    className="w-4 h-4 text-yellow-400"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  <span className="ml-1">{job.client.profile.rating.toFixed(1)}</span>
                                </div>
                              </>
                            )}
                            {job.client.profile?.totalHires > 0 && (
                              <>
                                {(job.companyDetails?.website || job.client.company?.website || job.client.profile?.rating) && <span className="mx-2">•</span>}
                                <span className="text-gray-500">{job.client.profile.totalHires} hires</span>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium">{job.client.name || "Client"}</div>
                          <div className="flex items-center text-sm">
                            {job.client.profile?.rating && (
                              <>
                                <div className="flex items-center">
                                  <svg
                                    className="w-4 h-4 text-yellow-400"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  <span className="ml-1">{job.client.profile.rating.toFixed(1)}</span>
                                </div>
                              </>
                            )}
                            {job.client.profile?.totalHires > 0 && (
                              <>
                                {job.client.profile?.rating && <span className="mx-2">•</span>}
                                <span className="text-gray-500">{job.client.profile.totalHires} hires</span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Apply Job Modal */}
      {showApplyModal && selectedJob && <ApplyJobModal job={selectedJob} onClose={closeApplyModal} />}
    </div>
  );
};

export default FindJobsPage;
