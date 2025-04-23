import { useState } from "react";
import { Link } from "react-router-dom";

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
    <section className="relative bg-background-light">
      <div className="absolute inset-0 bg-gradient-to-r from-primary-light/10 to-secondary-light/10"></div>

      <div className="container-custom relative py-20 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Connect with Top Freelancers & Find Quality 
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
                  className="input pr-12 py-4 text-lg"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary-dark">
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
                <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg">
                  <ul className="py-2">
                    {suggestions.map((suggestion, index) => (
                      <li key={index} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4">
              <Link to="/register" className="btn-primary text-center px-8 py-3 text-lg">
                Get Started
              </Link>
              <Link to="/how-it-works" className="btn-outline text-center px-8 py-3 text-lg">
                Learn More
              </Link>
            </div>
          </div>

          <div className="hidden lg:block">
            <img
              src="/images/hero-image.svg"
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
              <p className="text-3xl font-bold text-primary mb-1">10K+</p>
              <p className="text-gray-600">Freelancers</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary mb-1">5K+</p>
              <p className="text-gray-600">Clients</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary mb-1">25K+</p>
              <p className="text-gray-600">Projects Completed</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary mb-1">50+</p>
              <p className="text-gray-600">Categories</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
