import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchProjects } from "../../redux/slices/projectsSlice";
import { fetchProposals } from "../../redux/actions/proposalActions";
import { formatDate } from "../../utils/dateUtils";

const DashboardPage = () => {
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
        if (project.milestones && project.milestones.length > 0) {
          return (
            sum +
            project.milestones
              .filter((m) => m.status === "completed")
              .reduce((milestoneSum, m) => milestoneSum + (m.percentage / 100) * (project.budget || 0), 0)
          );
        }
        return sum;
      }, 0) || 0;

  // Get recent projects (last 3 projects from all statuses)
  const recentProjects = allProjects?.slice(0, 3) || [];

  const getStatusColor = (status) => {
    switch (status) {
      case "in_progress":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status) => {
    return status?.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()) || "Unknown";
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Freelancer Dashboard</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Welcome back, {user?.name || "Freelancer"}!</h2>
        <p className="text-gray-600">
          Your freelancer dashboard gives you an overview of your projects, earnings, and upcoming deadlines.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Active Projects</h3>
          <p className="text-3xl font-bold text-primary">{activeProjectsCount}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Earnings</h3>
          <p className="text-3xl font-bold text-primary">${totalEarnings.toLocaleString()} USD</p>
          <p className="text-xs text-gray-500 mt-1">From completed projects</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Pending Earnings</h3>
          <p className="text-3xl font-bold text-green-600">
            ${pendingEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          </p>
          <p className="text-xs text-gray-500 mt-1">From completed milestones</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Proposals Sent</h3>
          <p className="text-3xl font-bold text-primary">{proposalsCount}</p>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Recent Projects</h2>

        {projectsLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : recentProjects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Project</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Client</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Due Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentProjects.map((project) => (
                  <tr key={project._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium">{project.title}</div>
                      <div className="text-sm text-gray-500">{project.category}</div>
                      {/* Show next milestone if available */}
                      {project.milestones && project.milestones.length > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          Next:{" "}
                          {project.milestones.find((m) => m.status === "pending")?.title || "All milestones completed"}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">{project.client?.name || "Unknown Client"}</td>
                    <td className="py-3 px-4">{formatDate(project.deadline)}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${getStatusColor(project.status)}`}>
                        {formatStatus(project.status)}
                      </span>
                      {/* Show completion percentage */}
                      <div className="text-xs text-gray-500 mt-1">{calculateProjectProgress(project)}% complete</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>No projects found. Start by applying to jobs!</p>
          </div>
        )}
      </div>

      {/* Recommended Jobs */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Recommended Projects</h2>

        <div className="space-y-4">
          <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <h3 className="font-medium">Senior React Developer</h3>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <span>$50-70 USD/hr</span>
              <span className="mx-2">•</span>
              <span>Remote</span>
              <span className="mx-2">•</span>
              <span>Posted 2 days ago</span>
            </div>
            <p className="mt-2 text-gray-600">
              Looking for an experienced React developer to build a modern web application with Redux and TypeScript.
            </p>
            <button className="mt-3 text-primary hover:underline">View Details</button>
          </div>

          <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <h3 className="font-medium">UI/UX Designer for E-commerce Project</h3>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <span>$3,000-5,000 USD</span>
              <span className="mx-2">•</span>
              <span>Fixed Price</span>
              <span className="mx-2">•</span>
              <span>Posted 1 week ago</span>
            </div>
            <p className="mt-2 text-gray-600">
              Need an experienced designer to create a modern and user-friendly interface for our e-commerce platform.
            </p>
            <button className="mt-3 text-primary hover:underline">View Details</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
