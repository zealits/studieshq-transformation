import React, { useState } from "react";

const FindJobsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    budget: "",
    jobType: "",
    experience: "",
  });

  const jobs = [
    {
      id: 1,
      title: "Full Stack Developer for SaaS Platform",
      description:
        "Looking for a full stack developer to help build a modern SaaS platform with React, Node.js, and MongoDB.",
      budget: "$3,000 - $5,000",
      type: "Fixed Price",
      category: "Web Development",
      skills: ["React", "Node.js", "MongoDB", "Express"],
      posted: "2 days ago",
      proposals: 12,
      client: {
        name: "Tech Innovations Inc.",
        rating: 4.8,
        location: "United States",
        hires: 25,
      },
    },
    {
      id: 2,
      title: "UI/UX Designer for Mobile App",
      description: "Need a talented UI/UX designer to create modern interfaces for a health and fitness mobile app.",
      budget: "$40 - $60 / hr",
      type: "Hourly",
      category: "UI/UX Design",
      skills: ["UI Design", "UX Design", "Figma", "Mobile Apps"],
      posted: "5 days ago",
      proposals: 18,
      client: {
        name: "HealthFit Labs",
        rating: 4.5,
        location: "Canada",
        hires: 13,
      },
    },
    {
      id: 3,
      title: "WordPress Website Development",
      description:
        "Looking for a WordPress developer to build a corporate website with custom features and e-commerce functionality.",
      budget: "$1,500 - $3,000",
      type: "Fixed Price",
      category: "Web Development",
      skills: ["WordPress", "PHP", "WooCommerce", "CSS"],
      posted: "1 week ago",
      proposals: 24,
      client: {
        name: "Global Business Solutions",
        rating: 4.2,
        location: "Australia",
        hires: 8,
      },
    },
    {
      id: 4,
      title: "Content Writer for Tech Blog",
      description:
        "Seeking an experienced content writer to create engaging blog posts about the latest technology trends and software development.",
      budget: "$25 - $35 / hr",
      type: "Hourly",
      category: "Content Writing",
      skills: ["Content Writing", "Tech Knowledge", "SEO", "Editing"],
      posted: "3 days ago",
      proposals: 30,
      client: {
        name: "Tech Insight Media",
        rating: 4.9,
        location: "United Kingdom",
        hires: 42,
      },
    },
  ];

  const categories = [
    "All Categories",
    "Web Development",
    "Mobile Development",
    "UI/UX Design",
    "Graphic Design",
    "Content Writing",
    "Digital Marketing",
    "Data Analysis",
  ];

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
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
              placeholder="Search jobs..."
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
              {categories.map((category, index) => (
                <option key={index} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
              Budget
            </label>
            <select id="budget" name="budget" className="input" value={filters.budget} onChange={handleFilterChange}>
              <option value="">Any Budget</option>
              <option value="under-500">Under $500</option>
              <option value="500-1000">$500 - $1,000</option>
              <option value="1000-5000">$1,000 - $5,000</option>
              <option value="over-5000">Over $5,000</option>
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
      </div>

      {/* Jobs List */}
      <div className="space-y-6">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold hover:text-primary">{job.title}</h2>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <span>{job.budget}</span>
                  <span className="mx-2">•</span>
                  <span>{job.type}</span>
                  <span className="mx-2">•</span>
                  <span>Posted {job.posted}</span>
                  <span className="mx-2">•</span>
                  <span>{job.proposals} proposals</span>
                </div>
              </div>
              <button className="btn-primary">Apply Now</button>
            </div>

            <p className="mt-4 text-gray-600">{job.description}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {job.skills.map((skill, index) => (
                <span key={index} className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  {skill}
                </span>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t flex items-center">
              <div className="w-8 h-8 bg-primary-light rounded-full flex items-center justify-center text-white">
                {job.client.name.charAt(0)}
              </div>
              <div className="ml-3">
                <div className="font-medium">{job.client.name}</div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-500">{job.client.location}</span>
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
                    <span className="ml-1">{job.client.rating}/5</span>
                  </div>
                  <span className="mx-2">•</span>
                  <span>{job.client.hires} hires</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FindJobsPage;
