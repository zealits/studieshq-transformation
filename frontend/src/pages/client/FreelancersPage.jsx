import React, { useEffect, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import {
  fetchFreelancers,
  fetchAllFreelancersForOptions,
  setFilters,
  selectFilteredFreelancers,
  selectFreelancerLoading,
  selectFreelancerError,
  selectFreelancerFilters,
  selectAllFreelancers,
} from "../../redux/slices/freelancerSlice";
import InviteFreelancerModal from "../../components/client/InviteFreelancerModal";

const FreelancersPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const freelancers = useSelector(selectFilteredFreelancers);
  const allFreelancers = useSelector(selectAllFreelancers);
  const loading = useSelector(selectFreelancerLoading);
  const error = useSelector(selectFreelancerError);
  const filters = useSelector(selectFreelancerFilters);
  
  // Modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedFreelancer, setSelectedFreelancer] = useState(null);

  // Fetch freelancers when component mounts
  useEffect(() => {
    dispatch(fetchFreelancers());
    dispatch(fetchAllFreelancersForOptions()); // Fetch all for dropdown options
  }, [dispatch]);

  // Re-fetch freelancers when location filter changes (for backend filtering)
  useEffect(() => {
    if (filters.location) {
      dispatch(fetchFreelancers({ location: filters.location }));
    } else {
      dispatch(fetchFreelancers());
    }
  }, [dispatch, filters.location]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    dispatch(setFilters({ [name]: value }));
  };

  const handleSearchChange = (e) => {
    dispatch(setFilters({ searchTerm: e.target.value }));
  };

  const handleInviteClick = (freelancer) => {
    setSelectedFreelancer(freelancer);
    setShowInviteModal(true);
  };

  const handleCloseModal = () => {
    setShowInviteModal(false);
    setSelectedFreelancer(null);
  };

  const handleInviteSuccess = () => {
    // Optionally refresh freelancers list or show success message
    console.log("Invitation sent successfully");
  };

  const handleViewProfile = (freelancer) => {
    // Check if we're on the company client route or regular client route
    const isCompanyClient = location.pathname.startsWith("/company/client");
    const basePath = isCompanyClient ? "/company/client" : "/client";
    navigate(`${basePath}/freelancers/${freelancer.user._id}`);
  };

  // Get unique locations from all freelancers for the dropdown
  const availableLocations = Array.from(
    new Set(
      allFreelancers.map((freelancer) => freelancer.location).filter((location) => location && location.trim() !== "")
    )
  ).sort();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 p-4">{error}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Find Freelancers</h1>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              className="input pl-10 pr-4 py-2 w-full"
              placeholder="Search for skills or freelancers..."
              value={filters.searchTerm}
              onChange={handleSearchChange}
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
            <label htmlFor="skill" className="block text-sm font-medium text-gray-700 mb-1">
              Skill
            </label>
            <select id="skill" name="skill" className="input" value={filters.skill} onChange={handleFilterChange}>
              <option value="">All Skills</option>
              {Array.from(new Set(allFreelancers.flatMap((f) => f.skills || []))).map((skill) => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <select
              id="location"
              name="location"
              className="input"
              value={filters.location}
              onChange={handleFilterChange}
            >
              <option value="">All Locations</option>
              {availableLocations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="rate" className="block text-sm font-medium text-gray-700 mb-1">
              Hourly Rate
            </label>
            <select id="rate" name="rate" className="input" value={filters.rate} onChange={handleFilterChange}>
              <option value="">Any Rate</option>
              <option value="0-20">$0 - $20 USD</option>
              <option value="20-40">$20 - $40 USD</option>
              <option value="40-60">$40 - $60 USD</option>
              <option value="60+">$60+ USD</option>
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

        {/* Reset Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              dispatch(
                setFilters({
                  searchTerm: "",
                  skill: "",
                  location: "",
                  rate: "",
                  experience: "",
                })
              );
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4">
        <p className="text-gray-600">
          {freelancers.length === 1 ? `1 freelancer found` : `${freelancers.length} freelancers found`}
          {filters.location && ` in ${filters.location}`}
        </p>
      </div>

      {/* Freelancers List */}
      <div className="space-y-6">
        {freelancers.map((freelancer) => (
          <div key={freelancer._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col md:flex-row md:items-start">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center text-white text-xl font-semibold overflow-hidden">
                  {freelancer.user.avatar ? (
                    <img
                      src={freelancer.user.avatar}
                      alt={freelancer.user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    freelancer.user.name.charAt(0)
                  )}
                </div>
                <div className="ml-4 md:hidden">
                  <h2 className="text-xl font-semibold">{freelancer.user.name}</h2>
                  <p className="text-gray-600">{freelancer.title}</p>
                  {(freelancer.user.companyFreelancer?.companyName || freelancer.user.companyFreelancerName) && (
                    <p className="text-sm text-primary font-medium mt-1">
                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {freelancer.user.companyFreelancer?.companyName || freelancer.user.companyFreelancerName}
                    </p>
                  )}
                </div>
              </div>

              <div className="md:ml-6 flex-1">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                  <div className="hidden md:block">
                    <h2 className="text-xl font-semibold">{freelancer.user.name}</h2>
                    <p className="text-gray-600">{freelancer.title}</p>
                    {(freelancer.user.companyFreelancer?.companyName || freelancer.user.companyFreelancerName) && (
                      <p className="text-sm text-primary font-medium mt-1">
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {freelancer.user.companyFreelancer?.companyName || freelancer.user.companyFreelancerName}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center mt-2 md:mt-0">
                    <div className="text-primary font-semibold">
                      {typeof freelancer.hourlyRate === "object"
                        ? `$${freelancer.hourlyRate.min} - $${freelancer.hourlyRate.max} USD/hr`
                        : `$${freelancer.hourlyRate} USD/hr`}
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-gray-600">{freelancer.bio}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(freelancer.skills || []).map((skill, index) => (
                    <span key={index} className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      ></path>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      ></path>
                    </svg>
                    {freelancer.location || "Location not specified"}
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleViewProfile(freelancer)}
                      className="btn-outline text-sm py-1"
                    >
                      View Profile
                    </button>
                    <button 
                      onClick={() => handleInviteClick(freelancer)}
                      className="btn-primary text-sm py-1"
                    >
                      Invite to Project
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No results message */}
      {freelancers.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-2">No freelancers found</div>
          <div className="text-gray-400 text-sm">
            Try adjusting your filters or search terms to find more freelancers.
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <InviteFreelancerModal
        isOpen={showInviteModal}
        onClose={handleCloseModal}
        freelancer={selectedFreelancer}
        onInviteSuccess={handleInviteSuccess}
      />
    </div>
  );
};

export default FreelancersPage;
