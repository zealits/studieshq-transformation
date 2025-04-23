import React, { useState } from "react";

const FreelancersPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    skill: "",
    rate: "",
    experience: "",
  });

  // Mock data for freelancers
  const freelancers = [
    {
      id: 1,
      name: "Alex Johnson",
      avatar: "AJ",
      title: "Senior Web Developer",
      skills: ["React", "Node.js", "MongoDB", "Express", "JavaScript"],
      hourlyRate: "$45",
      rating: 4.9,
      reviews: 28,
      location: "New York, USA",
      description:
        "Full-stack developer with over 8 years of experience in building web applications. Specialized in React and Node.js development.",
    },
    {
      id: 2,
      name: "Sarah Williams",
      avatar: "SW",
      title: "UI/UX Designer",
      skills: ["UI Design", "UX Design", "Figma", "Adobe XD", "Sketch"],
      hourlyRate: "$55",
      rating: 4.8,
      reviews: 34,
      location: "London, UK",
      description:
        "Creative UI/UX designer with strong focus on user-centered design. Expert in creating intuitive and engaging interfaces.",
    },
    {
      id: 3,
      name: "Michael Chen",
      avatar: "MC",
      title: "WordPress Developer",
      skills: ["WordPress", "PHP", "MySQL", "JavaScript", "HTML/CSS"],
      hourlyRate: "$40",
      rating: 4.7,
      reviews: 19,
      location: "Toronto, Canada",
      description:
        "WordPress expert with experience in theme development, plugin customization, and e-commerce solutions.",
    },
    {
      id: 4,
      name: "Emily Carter",
      avatar: "EC",
      title: "Content Marketer",
      skills: ["Content Writing", "SEO", "Social Media", "Email Marketing", "Analytics"],
      hourlyRate: "$35",
      rating: 4.9,
      reviews: 22,
      location: "Chicago, USA",
      description:
        "Experienced content marketer who creates engaging, SEO-optimized content that drives traffic and conversions.",
    },
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
      <h1 className="text-2xl font-bold mb-6">Find Freelancers</h1>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              className="input pl-10 pr-4 py-2 w-full"
              placeholder="Search for skills or freelancers..."
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="skill" className="block text-sm font-medium text-gray-700 mb-1">
              Skill
            </label>
            <select id="skill" name="skill" className="input" value={filters.skill} onChange={handleFilterChange}>
              <option value="">All Skills</option>
              <option value="react">React</option>
              <option value="wordpress">WordPress</option>
              <option value="ui-design">UI Design</option>
              <option value="content-writing">Content Writing</option>
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
          <div key={freelancer.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col md:flex-row md:items-start">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center text-white text-xl font-semibold">
                  {freelancer.avatar}
                </div>
                <div className="ml-4 md:hidden">
                  <h2 className="text-xl font-semibold">{freelancer.name}</h2>
                  <p className="text-gray-600">{freelancer.title}</p>
                </div>
              </div>

              <div className="md:ml-6 flex-1">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                  <div className="hidden md:block">
                    <h2 className="text-xl font-semibold">{freelancer.name}</h2>
                    <p className="text-gray-600">{freelancer.title}</p>
                  </div>
                  <div className="flex items-center mt-2 md:mt-0">
                    <div className="flex items-center mr-4">
                      <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="ml-1 text-gray-700">
                        {freelancer.rating} ({freelancer.reviews} reviews)
                      </span>
                    </div>
                    <div className="text-primary font-semibold">{freelancer.hourlyRate}/hr</div>
                  </div>
                </div>

                <p className="mt-3 text-gray-600">{freelancer.description}</p>

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
