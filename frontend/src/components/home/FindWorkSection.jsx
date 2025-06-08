import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchJobCountsByCategory } from "../../redux/slices/jobsSlice";

const FindWorkSection = () => {
  const dispatch = useDispatch();
  const { jobCountsByCategory, isLoading } = useSelector((state) => state.jobs);

  useEffect(() => {
    dispatch(fetchJobCountsByCategory());
  }, [dispatch]);

  // Default categories with icons
  const categoryIcons = {
    "Web Development": (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
        />
      </svg>
    ),
    "Mobile Development": (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
    ),
    "UI/UX Design": (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
        />
      </svg>
    ),
    "Content Writing": (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 0L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    ),
    "Digital Marketing": (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
        />
      </svg>
    ),
    "Data Analysis": (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    )
  };

  // Default icon for categories not in the icon map
  const defaultIcon = (
    <svg
      className="w-8 h-8"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      />
    </svg>
  );

  // Prepare categories data - show top 6 categories
  const categories = jobCountsByCategory
    .slice(0, 6)
    .map(item => ({
      name: item.category,
      icon: categoryIcons[item.category] || defaultIcon,
      jobs: item.count
    }));

  return (
    <section className="py-20 bg-white">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[#3884b8]">Find Work in Top Categories</h2>
            <p className="text-lg text-gray-700 mb-8">
              Browse opportunities across in-demand skills and categories where businesses are actively hiring
            </p>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="flex items-center p-4 bg-gray-100 rounded-lg animate-pulse">
                    <div className="w-8 h-8 bg-gray-300 rounded mr-4"></div>
                    <div>
                      <div className="h-4 bg-gray-300 rounded mb-2 w-24"></div>
                      <div className="h-3 bg-gray-300 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
                {categories.length > 0 ? (
                  categories.map((category, index) => (
                    <Link
                      to="/freelancer/find-jobs"
                      key={index}
                      className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-[#3884b8] hover:text-white group transition-colors"
                    >
                      <div className="mr-4 text-[#0d81c8] group-hover:text-white">{category.icon}</div>
                      <div>
                        <h3 className="font-medium mb-1">{category.name}</h3>
                        <p className="text-sm text-gray-500 group-hover:text-white/80">
                          {category.jobs} open project{category.jobs !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    No job categories available at the moment.
                  </div>
                )}
              </div>
            )}

            <Link 
              to="/freelancer/find-jobs" 
              className="px-8 py-3 bg-[#3884b8] text-white rounded-lg hover:bg-[#0d81c8] transition-colors inline-block"
            >
              View All Categories
            </Link>
          </div>

          <div className="hidden lg:block">
            <img src="/images/find-work.svg" alt="Find freelance work" className="w-full rounded-lg shadow-xl" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default FindWorkSection;
