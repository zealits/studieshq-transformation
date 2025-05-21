import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProposals, withdrawProposal } from "../../redux/actions/proposalActions";
import { formatDate } from "../../utils/dateUtils";

const ProjectsPage = () => {
  const [activeTab, setActiveTab] = useState("active");
  const dispatch = useDispatch();
  const { proposals, loading, error } = useSelector((state) => state.proposals);
  console.log(proposals);
  useEffect(() => {
    if (activeTab === "applied") {
      dispatch(fetchProposals());
    }
  }, [activeTab, dispatch]);

  const handleWithdrawProposal = (proposalId) => {
    if (window.confirm("Are you sure you want to withdraw this proposal?")) {
      dispatch(withdrawProposal(proposalId));
    }
  };

  const projects = {
    active: [
      {
        id: 1,
        title: "E-commerce Website Redesign",
        client: "RetailSolutions Ltd.",
        startDate: "April 10, 2023",
        dueDate: "June 15, 2023",
        budget: "$4,500",
        status: "In Progress",
        completion: 65,
        description: "Redesigning the user interface and improving the UX of an existing e-commerce platform.",
        nextMilestone: "Responsive Design Implementation",
        milestoneDate: "May 20, 2023",
        milestoneAmount: "$1,200",
      },
      {
        id: 2,
        title: "Mobile App Development",
        client: "HealthTech Innovations",
        startDate: "March 5, 2023",
        dueDate: "July 30, 2023",
        budget: "$12,000",
        status: "On Track",
        completion: 40,
        description: "Building a health tracking mobile application for iOS and Android platforms.",
        nextMilestone: "User Authentication Module",
        milestoneDate: "May 15, 2023",
        milestoneAmount: "$2,800",
      },
      {
        id: 3,
        title: "Content Writing for Blog Series",
        client: "Digital Marketing Pro",
        startDate: "May 1, 2023",
        dueDate: "May 30, 2023",
        budget: "$1,800",
        status: "Needs Attention",
        completion: 25,
        description: "Creating a series of 12 blog posts about digital marketing strategies.",
        nextMilestone: "First Draft of 4 Articles",
        milestoneDate: "May 12, 2023",
        milestoneAmount: "$600",
      },
    ],
    completed: [
      {
        id: 4,
        title: "Logo and Brand Identity",
        client: "StartUp Ventures",
        completedDate: "April 28, 2023",
        budget: "$1,200",
        rating: 5,
        feedback: "Exceptional work! The designer captured our vision perfectly and was very responsive to feedback.",
        description: "Created logo, color palette, typography, and brand guidelines for a new tech startup.",
      },
      {
        id: 5,
        title: "WordPress Website Development",
        client: "Local Business Services",
        completedDate: "March 15, 2023",
        budget: "$2,500",
        rating: 4.5,
        feedback: "Great job on our website. It looks professional and works perfectly on all devices.",
        description: "Developed a custom WordPress website with booking functionality for a local service business.",
      },
    ],
    applied: [
      {
        id: 6,
        title: "Social Media Marketing Campaign",
        client: "Growth Marketing Co.",
        appliedDate: "May 5, 2023",
        budget: "$3,000",
        status: "shortlisted",
        description: "Running a comprehensive social media marketing campaign across multiple platforms.",
        proposalDetails: {
          bidPrice: "$2,800",
          estimatedDuration: "2 months",
          coverLetter: "I have extensive experience in social media marketing...",
        },
      },
      {
        id: 7,
        title: "UI/UX Design for Mobile App",
        client: "TechStart Inc.",
        appliedDate: "May 3, 2023",
        budget: "$5,000",
        status: "pending",
        description: "Designing the user interface and experience for a new mobile application.",
        proposalDetails: {
          bidPrice: "$4,500",
          estimatedDuration: "3 weeks",
          coverLetter: "As a UI/UX designer with 5 years of experience...",
        },
      },
      {
        id: 8,
        title: "Backend Development",
        client: "Enterprise Solutions",
        appliedDate: "May 1, 2023",
        budget: "$8,000",
        status: "rejected",
        description: "Developing a robust backend system for an enterprise application.",
        proposalDetails: {
          bidPrice: "$7,500",
          estimatedDuration: "3 months",
          coverLetter: "I specialize in scalable backend solutions...",
        },
      },
    ],
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "shortlisted":
        return "bg-blue-100 text-blue-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Projects</h1>

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
            activeTab === "applied" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("applied")}
        >
          Applied Projects
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
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold">{project.title}</h2>
                    <p className="text-gray-600">Client: {project.client}</p>
                  </div>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      project.status === "In Progress"
                        ? "bg-blue-100 text-blue-800"
                        : project.status === "On Track"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {project.status}
                  </span>
                </div>

                <p className="mt-4 text-gray-600">{project.description}</p>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                </div>

                <div className="mt-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Completion</span>
                    <span className="text-sm font-medium text-gray-700">{project.completion}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${project.completion}%` }}></div>
                  </div>
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
                    <button className="btn-outline text-sm py-1">Message Client</button>
                    <button className="btn-primary text-sm py-1">Submit Work</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Applied Projects */}
      {activeTab === "applied" && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 p-4">
              <p>Error: {error}</p>
            </div>
          ) : proposals.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No proposals submitted yet</p>
            </div>
          ) : (
            proposals.map((proposal) => (
              <div key={proposal._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold">{proposal.job.title}</h2>
                    <p className="text-gray-600">Client: {proposal.job.client.name}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(proposal.status)}`}>
                      {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">Applied {formatDate(proposal.createdAt)}</p>
                  </div>
                </div>

                <p className="mt-4 text-gray-600">{proposal.job.description}</p>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Client's Budget</p>
                    <p className="font-medium">
                      ${proposal.job.budget.min} - ${proposal.job.budget.max}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Your Bid</p>
                    <p className="font-medium">${proposal.bidPrice}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-medium">{proposal.estimatedDuration}</p>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">Proposal Details</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Cover Letter</p>
                      <p className="text-gray-700 whitespace-pre-wrap">{proposal.coverLetter}</p>
                    </div>
                    {proposal.status === "shortlisted" && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-md">
                        <p className="text-sm text-blue-700">
                          <span className="font-medium">Note:</span> Your proposal has been shortlisted! The client is
                          reviewing your profile.
                        </p>
                      </div>
                    )}
                    {proposal.status === "rejected" && (
                      <div className="mt-3 p-3 bg-red-50 rounded-md">
                        <p className="text-sm text-red-700">
                          <span className="font-medium">Note:</span> This proposal was not selected for this project.
                        </p>
                      </div>
                    )}
                    {proposal.status === "accepted" && (
                      <div className="mt-3 p-3 bg-green-50 rounded-md">
                        <p className="text-sm text-green-700">
                          <span className="font-medium">Congratulations!</span> Your proposal has been accepted. This
                          project will appear in your Active Projects.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex justify-end space-x-2">
                  <button className="btn-outline text-sm py-1">View Job Details</button>
                  {proposal.status === "pending" && (
                    <button onClick={() => handleWithdrawProposal(proposal._id)} className="btn-danger text-sm py-1">
                      Withdraw Proposal
                    </button>
                  )}
                  {proposal.status === "shortlisted" && (
                    <button className="btn-primary text-sm py-1">Contact Client</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Completed Projects */}
      {activeTab === "completed" && (
        <div className="space-y-6">
          {projects.completed.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold">{project.title}</h2>
                  <p className="text-gray-600">Client: {project.client}</p>
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

              <p className="mt-4 text-gray-600">{project.description}</p>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <h3 className="font-medium mb-2">Client Feedback</h3>
                <p className="text-gray-600 italic">{project.feedback}</p>
              </div>

              <div className="mt-4 flex justify-end space-x-2">
                <button className="btn-outline text-sm py-1">View Details</button>
                <button className="btn-primary text-sm py-1">Request Testimonial</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
