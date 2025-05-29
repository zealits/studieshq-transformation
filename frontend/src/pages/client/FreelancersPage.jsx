import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchFreelancers,
  setFilters,
  selectFilteredFreelancers,
  selectFreelancerLoading,
  selectFreelancerError,
  selectFreelancerFilters,
} from "../../redux/slices/freelancerSlice";

const FreelancersPage = () => {
  const dispatch = useDispatch();
  const freelancers = useSelector(selectFilteredFreelancers);
  const loading = useSelector(selectFreelancerLoading);
  const error = useSelector(selectFreelancerError);
  const filters = useSelector(selectFreelancerFilters);

  useEffect(() => {
    dispatch(fetchFreelancers());
  }, [dispatch]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    dispatch(setFilters({ [name]: value }));
  };

  const handleSearchChange = (e) => {
    dispatch(setFilters({ searchTerm: e.target.value }));
  };

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="skill" className="block text-sm font-medium text-gray-700 mb-1">
              Skill
            </label>
            <select id="skill" name="skill" className="input" value={filters.skill} onChange={handleFilterChange}>
              <option value="">All Skills</option>
              {Array.from(new Set(freelancers.flatMap((f) => f.skills))).map((skill) => (
                <option key={skill} value={skill}>
                  {skill}
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
              <option value="0-20">$0 - $20</option>
              <option value="20-40">$20 - $40</option>
              <option value="40-60">$40 - $60</option>
              <option value="60+">$60+</option>
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
                </div>
              </div>

              <div className="md:ml-6 flex-1">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                  <div className="hidden md:block">
                    <h2 className="text-xl font-semibold">{freelancer.user.name}</h2>
                    <p className="text-gray-600">{freelancer.title}</p>
                  </div>
                  <div className="flex items-center mt-2 md:mt-0">
                    <div className="text-primary font-semibold">
                      {typeof freelancer.hourlyRate === "object"
                        ? `$${freelancer.hourlyRate.min} - $${freelancer.hourlyRate.max}/hr`
                        : `$${freelancer.hourlyRate}/hr`}
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-gray-600">{freelancer.bio}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {freelancer.skills.map((skill, index) => (
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
                    {freelancer.location}
                  </div>
                  <div className="flex space-x-2">
                    <button className="btn-outline text-sm py-1">View Profile</button>
                    <button className="btn-primary text-sm py-1">Invite to Job</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FreelancersPage;
