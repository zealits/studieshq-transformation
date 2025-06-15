import { useState } from "react";
import { Link } from "react-router-dom";
import HeroImage from "../../assets/images/HeroImage.jpg";

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  // Mock suggestions based on user input
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.length > 2) {
      // In a real app, this would be an API call
      const mockSuggestions = [
        "Web Development",
        "Mobile App Development",
        "UI/UX Design",
        "Content Writing",
        "Digital Marketing",
        "Data Analysis",
      ].filter((item) => item.toLowerCase().includes(value.toLowerCase()));

      setSuggestions(mockSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  return (
    <section className="relative bg-gray-50">
      <div className="absolute inset-0 bg-gradient-to-r from-[#3884b8]/10 to-[#0d81c8]/10"></div>

      <div className="container-custom relative py-20 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#3884b8] mb-6 leading-tight">
              Connect with Top Freelancers & Find Quality Projects
            </h1>

            <p className="text-xl text-gray-700 mb-8">
              A trusted platform where freelancers and employers collaborate on projects. Find talent or work that
              matches your skills and requirements.
            </p>

            <div className="relative mb-8">
              <div className="flex">
                <input
                  type="text"
                  placeholder="Search for skills, jobs, or services..."
                  className="w-full px-4 py-4 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3884b8] focus:border-transparent"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3884b8] hover:text-[#0d81c8] transition-colors">
                  <svg
                    className="w-6 h-6"
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
                    />
                  </svg>
                </button>
              </div>

              {/* Search Suggestions */}
              {suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg">
                  <ul className="py-2">
                    {suggestions.map((suggestion, index) => (
                      <li key={index} className="px-4 py-2 hover:bg-[#3884b8]/5 cursor-pointer transition-colors">
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                to="/register"
                className="px-8 py-3 text-lg bg-[#3884b8] text-white rounded-lg hover:bg-[#0d81c8] transition-colors"
              >
                Get Started
              </Link>
              <Link
                to="/how-it-works"
                className="px-8 py-3 text-lg border-2 border-[#3884b8] text-[#3884b8] rounded-lg hover:bg-[#3884b8] hover:text-white transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>

          <div className="hidden lg:block">
            <img
              src={HeroImage}
              alt="StudiesHQ Freelancing Platform"
              className="w-full h-auto max-w-lg mx-auto"
            />
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white py-8 shadow-md">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-[#3884b8] mb-1">10K+</p>
              <p className="text-gray-600">Freelancers</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#3884b8] mb-1">5K+</p>
              <p className="text-gray-600">Clients</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#3884b8] mb-1">25K+</p>
              <p className="text-gray-600">Projects Completed</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#3884b8] mb-1">50+</p>
              <p className="text-gray-600">Categories</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
