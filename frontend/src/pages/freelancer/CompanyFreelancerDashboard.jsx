import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchProjects } from "../../redux/slices/projectsSlice";
import { fetchProposals } from "../../redux/actions/proposalActions";
import { formatDate } from "../../utils/dateUtils";

const CompanyFreelancerDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { projects, loading: projectsLoading } = useSelector((state) => state.projects);
  const { proposals } = useSelector((state) => state.proposals);

  useEffect(() => {
    // Fetch all projects for freelancer (without status filter)
    dispatch(fetchProjects({}));
    dispatch(fetchProposals());
  }, [dispatch]);

  // Get all projects from Redux store (both in_progress and completed)
  const allProjects = projects || [];

  // Calculate stats from real data
  const activeProjectsCount = allProjects?.filter((p) => p.status === "in_progress")?.length || 0;
  const completedProjectsCount = allProjects?.filter((p) => p.status === "completed")?.length || 0;
  const proposalsCount = proposals?.length || 0;

  // Helper function to calculate project progress based on milestones
  const calculateProjectProgress = (project) => {
    if (project.milestones && project.milestones.length > 0) {
      return Math.round(
        project.milestones.filter((m) => m.status === "completed").reduce((sum, m) => sum + (m.percentage || 0), 0)
      );
    }
    return project.completionPercentage || 0;
  };

  // Calculate total earnings from completed milestones
  const totalEarnings =
    allProjects?.filter((p) => p.status === "completed")?.reduce((sum, project) => sum + (project.budget || 0), 0) || 0;

  // Calculate pending earnings from completed milestones in active projects
  const pendingEarnings =
    allProjects
      ?.filter((p) => p.status === "in_progress")
      ?.reduce((sum, project) => {
        const completedMilestones = project.milestones?.filter((m) => m.status === "completed") || [];
        return sum + completedMilestones.reduce((milestoneSum, milestone) => milestoneSum + (milestone.amount || 0), 0);
      }, 0) || 0;

  // Get recent projects (last 3)
  const recentProjects = [...allProjects].slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.name}!</h1>
            <p className="text-blue-100">
              You're part of <strong>{user?.companyFreelancer?.companyName}</strong> team
            </p>
            <div className="mt-2 flex items-center text-blue-100">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm">Profile Verified by Company</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{user?.companyFreelancer?.companyName}</div>
            <div className="text-blue-100 text-sm">Company Team Member</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-2xl font-semibold text-gray-900">{activeProjectsCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed Projects</p>
              <p className="text-2xl font-semibold text-gray-900">{completedProjectsCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Earnings</p>
              <p className="text-2xl font-semibold text-gray-900">${totalEarnings.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Earnings</p>
              <p className="text-2xl font-semibold text-gray-900">${pendingEarnings.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Company Information Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Company Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Your Company</h3>
            <p className="text-gray-600">{user?.companyFreelancer?.companyName}</p>
            <p className="text-sm text-gray-500 mt-1">
              Team Member since {formatDate(user?.companyFreelancer?.joinedAt)}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Your Role</h3>
            <p className="text-gray-600 capitalize">{user?.companyFreelancer?.role}</p>
            <div className="mt-2 flex items-center text-green-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-medium">Verified by Company</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      {recentProjects.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Projects</h2>
          <div className="space-y-4">
            {recentProjects.map((project) => (
              <div key={project._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{project.title}</h3>
                    <p className="text-gray-600">{project.description}</p>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span className="mr-4">Budget: ${project.budget?.toLocaleString()}</span>
                      <span className="mr-4">Status: {project.status}</span>
                      <span>Progress: {calculateProjectProgress(project)}%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        project.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : project.status === "in_progress"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-center">
              <svg className="w-8 h-8 mx-auto mb-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h3 className="font-medium text-gray-900">Find Projects</h3>
              <p className="text-sm text-gray-600">Browse available projects</p>
            </div>
          </button>

          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-center">
              <svg
                className="w-8 h-8 mx-auto mb-2 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="font-medium text-gray-900">My Projects</h3>
              <p className="text-sm text-gray-600">View your projects</p>
            </div>
          </button>

          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-center">
              <svg
                className="w-8 h-8 mx-auto mb-2 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <h3 className="font-medium text-gray-900">My Profile</h3>
              <p className="text-sm text-gray-600">Update your profile</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyFreelancerDashboard;















