import React, { useState } from "react";

const ProjectsPage = () => {
  const [activeTab, setActiveTab] = useState("active");

  // Mock data for projects
  const projects = {
    active: [
      {
        id: 1,
        title: "Corporate Website Redesign",
        freelancer: "Alex Johnson",
        startDate: "April 10, 2023",
        dueDate: "June 15, 2023",
        budget: "$4,500",
        status: "In Progress",
        completion: 65,
        description: "Redesigning the company website with modern UI/UX and mobile responsiveness.",
        nextMilestone: "Design Implementation",
        milestoneDate: "May 20, 2023",
        milestoneAmount: "$1,500",
      },
      {
        id: 2,
        title: "Marketing Campaign for Product Launch",
        freelancer: "Sarah Williams",
        startDate: "May 1, 2023",
        dueDate: "May 30, 2023",
        budget: "$2,800",
        status: "Planning",
        completion: 25,
        description:
          "Creating a full marketing campaign for our new product launch, including social media content and email campaigns.",
        nextMilestone: "Content Creation",
        milestoneDate: "May 15, 2023",
        milestoneAmount: "$1,000",
      },
      {
        id: 3,
        title: "Mobile App Development",
        freelancer: "Michael Chen",
        startDate: "March 5, 2023",
        dueDate: "August 30, 2023",
        budget: "$12,000",
        status: "Starting Soon",
        completion: 10,
        description:
          "Developing a custom mobile application for iOS and Android platforms with user authentication and data syncing.",
        nextMilestone: "UI/UX Design Approval",
        milestoneDate: "May 25, 2023",
        milestoneAmount: "$3,000",
      },
    ],
    completed: [
      {
        id: 4,
        title: "Brand Identity Design",
        freelancer: "Emily Carter",
        completedDate: "March 28, 2023",
        budget: "$1,800",
        rating: 5,
        feedback:
          "Emily delivered exceptional work. The new brand identity perfectly captures our vision and has received great feedback from our clients.",
        description:
          "Created a complete brand identity including logo, color palette, typography, and brand guidelines.",
      },
      {
        id: 5,
        title: "SEO Optimization",
        freelancer: "Daniel Rodriguez",
        completedDate: "February 15, 2023",
        budget: "$1,200",
        rating: 4,
        feedback:
          "Good work on optimizing our website. We've seen a noticeable increase in organic traffic since the project completion.",
        description:
          "Optimized website content and structure for better search engine rankings and improved site performance.",
      },
    ],
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <button className="btn-primary">Create New Project</button>
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
      </div>

      {/* Active Projects */}
      {activeTab === "active" && (
        <div className="space-y-6">
          {projects.active.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">{project.title}</h2>
                    <p className="text-gray-600">Freelancer: {project.freelancer}</p>
                  </div>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      project.status === "In Progress"
                        ? "bg-green-100 text-green-800"
                        : project.status === "Planning"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {project.status}
                  </span>
                </div>

                <p className="text-gray-600 mb-4">{project.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Start Date</p>
                    <p className="font-medium">{project.startDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Due Date</p>
                    <p className="font-medium">{project.dueDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Budget</p>
                    <p className="font-medium">{project.budget}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Completion</p>
                    <p className="font-medium">{project.completion}%</p>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                  <div className="bg-primary h-2.5 rounded-full" style={{ width: `${project.completion}%` }}></div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 border-t">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Next Milestone: {project.nextMilestone}</h3>
                    <p className="text-sm text-gray-500">
                      Due: {project.milestoneDate} • {project.milestoneAmount}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="btn-outline text-sm py-1">Message Freelancer</button>
                    <button className="btn-primary text-sm py-1">View Details</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed Projects */}
      {activeTab === "completed" && (
        <div className="space-y-6">
          {projects.completed.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{project.title}</h2>
                  <p className="text-gray-600">Freelancer: {project.freelancer}</p>
                </div>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-5 h-5 ${i < Math.floor(project.rating) ? "text-yellow-400" : "text-gray-300"}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="ml-1 text-sm text-gray-600">{project.rating}/5</span>
                </div>
              </div>

              <p className="text-gray-600 mb-4">{project.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Completed Date</p>
                  <p className="font-medium">{project.completedDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Budget</p>
                  <p className="font-medium">{project.budget}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium text-green-600">Completed</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 mb-4">
                <h3 className="font-medium mb-2">Your Feedback</h3>
                <p className="text-gray-600 italic">{project.feedback}</p>
              </div>

              <div className="flex justify-end space-x-2">
                <button className="btn-outline text-sm py-1">View Details</button>
                <button className="btn-primary text-sm py-1">Rehire Freelancer</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
