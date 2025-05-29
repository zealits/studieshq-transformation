import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchJobs, filterJobs } from "../../redux/slices/jobsSlice";
import { fetchProposals } from "../../redux/actions/proposalActions";
import Spinner from "../../components/common/Spinner";
import { formatDistanceToNow } from "date-fns";
import ApplyJobModal from "../../components/freelancer/ApplyJobModal";

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

  const dispatch = useDispatch();
  const { filteredJobs, isLoading, categories } = useSelector((state) => state.jobs);
  const { proposals } = useSelector((state) => state.proposals);

  useEffect(() => {
    dispatch(fetchJobs());
    dispatch(fetchProposals());
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
    return proposals.some((proposal) => proposal.job._id === jobId);
  };

  // Get proposal status for a job
  const getProposalStatus = (jobId) => {
    const proposal = proposals.find((proposal) => proposal.job._id === jobId);
    return proposal ? proposal.status : null;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Find Jobs</h1>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              className="input pl-10 pr-4 py-2 w-full"
              placeholder="Search jobs by title, description, or skills..."
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
              <option value="0-500">Under $500</option>
              <option value="500-1000">$500 - $1,000</option>
              <option value="1000-5000">$1,000 - $5,000</option>
              <option value="5000-10000">$5,000 - $10,000</option>
              <option value="10000+">Over $10,000</option>
            </select>
          </div>

          <div>
            <label htmlFor="jobType" className="block text-sm font-medium text-gray-700 mb-1">
              Job Type
            </label>
            <select id="jobType" name="jobType" className="input" value={filters.jobType} onChange={handleFilterChange}>
              <option value="">All Types</option>
              <option value="fixed">Fixed Price</option>
              <option value="hourly">Hourly</option>
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
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Jobs List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner />
        </div>
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
                  <div>
                    <h2 className="text-xl font-semibold hover:text-primary">{job.title}</h2>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <span>
                        {job.budget.type === "fixed"
                          ? `$${job.budget.min} - $${job.budget.max}`
                          : `$${job.budget.min} - $${job.budget.max}/hr`}
                      </span>
                      <span className="mx-2">•</span>
                      <span>{job.budget.type === "fixed" ? "Fixed Price" : "Hourly"}</span>
                      <span className="mx-2">•</span>
                      <span>Posted {formatPostedDate(job.createdAt)}</span>
                      <span className="mx-2">•</span>
                      <span>{job.applicationCount || 0} proposals</span>
                    </div>
                  </div>
                  {hasApplied ? (
                    <div className="flex flex-col items-end">
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
                    <button className="btn-primary" onClick={() => handleApplyClick(job)}>
                      Apply Now
                    </button>
                  )}
                </div>

                <p className="mt-4 text-gray-600">{job.description}</p>

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
                      {job.client.name ? job.client.name.charAt(0) : "C"}
                    </div>
                    <div className="ml-3">
                      {job.companyDetails && job.companyDetails.name ? (
                        <div>
                          <div className="font-medium">{job.companyDetails.name}</div>
                          <div className="flex items-center text-sm">
                            <span className="text-gray-500">{job.companyDetails.location || job.location}</span>
                            {job.companyDetails.website && (
                              <>
                                <span className="mx-2">•</span>
                                <a
                                  href={
                                    job.companyDetails.website.startsWith("http")
                                      ? job.companyDetails.website
                                      : `https://${job.companyDetails.website}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  Website
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="font-medium">{job.client.name || "Client"}</div>
                      )}
                      <div className="flex items-center text-sm">
                        {!job.companyDetails?.name && (
                          <span className="text-gray-500">{job.client.profile?.location || "Unknown Location"}</span>
                        )}
                        {job.client.profile?.rating && (
                          <>
                            <span className="mx-2">•</span>
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
                            <span className="mx-2">•</span>
                            <span className="text-gray-500">{job.client.profile.totalHires} hires</span>
                          </>
                        )}
                      </div>
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
