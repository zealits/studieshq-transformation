import React, { useState } from "react";

const ProjectsPage = () => {
  const [activeTab, setActiveTab] = useState("active");

  // Mock data for projects
  const projects = {
    active: [
      {
        id: 1,
        title: "Corporate Website Redesign",
        client: "TechSolutions Inc.",
        freelancer: "Alex Johnson",
        startDate: "April 10, 2023",
        dueDate: "June 15, 2023",
        budget: "$4,500",
        status: "In Progress",
        completion: 65,
      },
      {
        id: 2,
        title: "Marketing Campaign for Product Launch",
        client: "Global Health",
        freelancer: "Sarah Williams",
        startDate: "May 1, 2023",
        dueDate: "May 30, 2023",
        budget: "$2,800",
        status: "Planning",
        completion: 25,
      },
      {
        id: 3,
        title: "Mobile App Development",
        client: "Startup Ventures",
        freelancer: "Michael Chen",
        startDate: "March 5, 2023",
        dueDate: "August 30, 2023",
        budget: "$12,000",
        status: "Starting Soon",
        completion: 10,
      },
    ],
    completed: [
      {
        id: 4,
        title: "Brand Identity Design",
        client: "Innovate LLC",
        freelancer: "Emily Carter",
        completedDate: "March 28, 2023",
        budget: "$1,800",
        rating: 5,
      },
      {
        id: 5,
        title: "SEO Optimization",
        client: "Digital Marketing Co.",
        freelancer: "Daniel Rodriguez",
        completedDate: "February 15, 2023",
        budget: "$1,200",
        rating: 4,
      },
    ],
    troubled: [
      {
        id: 6,
        title: "E-commerce Platform Integration",
        client: "Fashion Retail Ltd.",
        freelancer: "James Wilson",
        startDate: "January 15, 2023",
        dueDate: "April 10, 2023",
        budget: "$5,500",
        status: "Delayed",
        completion: 40,
        issue: "Technical obstacles with payment gateway",
      },
      {
        id: 7,
        title: "Content Management System",
        client: "Media Publishing",
        freelancer: "Jennifer Lopez",
        startDate: "February 20, 2023",
        dueDate: "May 5, 2023",
        budget: "$3,200",
        status: "Disputed",
        completion: 70,
        issue: "Scope disagreement between client and freelancer",
      },
    ],
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Project Management</h1>

      <div className="flex justify-between items-center mb-6">
        <div className="flex">
          <div className="relative">
            <input
              type="text"
              placeholder="Search projects..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
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
          <select className="ml-3 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">All Categories</option>
            <option value="design">Design</option>
            <option value="development">Development</option>
            <option value="marketing">Marketing</option>
            <option value="writing">Writing</option>
          </select>
        </div>
        <button className="btn-primary">Export Report</button>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`pb-2 px-4 font-medium ${
            activeTab === "active" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("active")}
        >
          Active Projects
        </button>
        <button
          className={`pb-2 px-4 font-medium ${
            activeTab === "completed" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("completed")}
        >
          Completed Projects
        </button>
        <button
          className={`pb-2 px-4 font-medium ${
            activeTab === "troubled" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("troubled")}
        >
          Troubled Projects
        </button>
      </div>

      {/* Active Projects Tab */}
      {activeTab === "active" && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="py-3 px-4 text-left">Project Title</th>
                <th className="py-3 px-4 text-left">Client</th>
                <th className="py-3 px-4 text-left">Freelancer</th>
                <th className="py-3 px-4 text-left">Due Date</th>
                <th className="py-3 px-4 text-left">Budget</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Progress</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {projects.active.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{project.title}</td>
                  <td className="py-3 px-4">{project.client}</td>
                  <td className="py-3 px-4">{project.freelancer}</td>
                  <td className="py-3 px-4">{project.dueDate}</td>
                  <td className="py-3 px-4">{project.budget}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        project.status === "In Progress"
                          ? "bg-green-100 text-green-800"
                          : project.status === "Planning"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {project.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-primary h-2.5 rounded-full" style={{ width: `${project.completion}%` }}></div>
                    </div>
                    <span className="text-xs text-gray-500">{project.completion}%</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button className="text-primary hover:text-primary-dark">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                      <button className="text-blue-600 hover:text-blue-800">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Completed Projects Tab */}
      {activeTab === "completed" && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="py-3 px-4 text-left">Project Title</th>
                <th className="py-3 px-4 text-left">Client</th>
                <th className="py-3 px-4 text-left">Freelancer</th>
                <th className="py-3 px-4 text-left">Completed Date</th>
                <th className="py-3 px-4 text-left">Budget</th>
                <th className="py-3 px-4 text-left">Rating</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {projects.completed.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{project.title}</td>
                  <td className="py-3 px-4">{project.client}</td>
                  <td className="py-3 px-4">{project.freelancer}</td>
                  <td className="py-3 px-4">{project.completedDate}</td>
                  <td className="py-3 px-4">{project.budget}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${i < project.rating ? "text-yellow-400" : "text-gray-300"}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-1 text-sm text-gray-600">({project.rating}/5)</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button className="text-primary hover:text-primary-dark">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                      <button className="text-green-600 hover:text-green-800">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Troubled Projects Tab */}
      {activeTab === "troubled" && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="py-3 px-4 text-left">Project Title</th>
                <th className="py-3 px-4 text-left">Client</th>
                <th className="py-3 px-4 text-left">Freelancer</th>
                <th className="py-3 px-4 text-left">Due Date</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Issue</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {projects.troubled.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{project.title}</td>
                  <td className="py-3 px-4">{project.client}</td>
                  <td className="py-3 px-4">{project.freelancer}</td>
                  <td className="py-3 px-4">{project.dueDate}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                      {project.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-600">{project.issue}</p>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button className="text-primary hover:text-primary-dark">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                      <button className="text-red-600 hover:text-red-800">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                          />
                        </svg>
                      </button>
                      <button className="text-blue-600 hover:text-blue-800">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Showing{" "}
          {activeTab === "active"
            ? projects.active.length
            : activeTab === "completed"
            ? projects.completed.length
            : projects.troubled.length}{" "}
          entries
        </div>
        <div className="flex space-x-1">
          <button className="px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-500 hover:bg-gray-50">
            Previous
          </button>
          <button className="px-3 py-1 border border-gray-300 rounded-md bg-primary text-white">1</button>
          <button className="px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-500 hover:bg-gray-50">
            2
          </button>
          <button className="px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-500 hover:bg-gray-50">
            3
          </button>
          <button className="px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-500 hover:bg-gray-50">
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectsPage;
