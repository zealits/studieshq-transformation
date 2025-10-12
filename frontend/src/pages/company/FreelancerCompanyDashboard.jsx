import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchProjects } from "../../redux/slices/projectsSlice";
import { fetchProposals } from "../../redux/actions/proposalActions";
import { formatDate } from "../../utils/dateUtils";

const FreelancerCompanyDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { projects, loading: projectsLoading } = useSelector((state) => state.projects);
  // Removed proposals selector as we're not fetching proposals for company dashboard

  useEffect(() => {
    // Fetch all projects for freelancer company
    dispatch(fetchProjects({}));
    // Note: Removed fetchProposals() as it's not needed for company dashboard
    // and was causing error notifications
  }, [dispatch]);

  // Get all projects from Redux store
  const allProjects = projects || [];

  // Calculate stats from real data
  const activeProjectsCount = allProjects?.filter((p) => p.status === "in_progress")?.length || 0;
  const completedProjectsCount = allProjects?.filter((p) => p.status === "completed")?.length || 0;
  // Removed proposalsCount as we're not fetching proposals for company dashboard

  // Calculate total earnings from completed projects
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
              .reduce((milestoneSum, m) => {
                const grossAmount = (m.percentage / 100) * (project.budget || 0);
                const netAmount = grossAmount - grossAmount * 0.1; // Subtract 10% platform fee
                return milestoneSum + netAmount;
              }, 0)
          );
        }
        return sum;
      }, 0) || 0;

  // Get recent projects
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
      {/* Company Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-2">
              Welcome back, {user?.company?.businessName || "Freelancer Company"}!
            </h2>
            <p className="text-gray-600">
              Your agency dashboard provides an overview of your projects, team performance, and business metrics.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Company Type</div>
            <div className="text-lg font-medium text-primary">Freelancer Agency</div>
          </div>
        </div>
      </div>

      {/* Company Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Active Projects</h3>
          <p className="text-3xl font-bold text-primary">{activeProjectsCount}</p>
          <p className="text-xs text-gray-500 mt-1">Currently in progress</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Revenue</h3>
          <p className="text-3xl font-bold text-primary">${totalEarnings.toLocaleString()} USD</p>
          <p className="text-xs text-gray-500 mt-1">From completed projects</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Pending Revenue</h3>
          <p className="text-3xl font-bold text-green-600">
            ${pendingEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          </p>
          <p className="text-xs text-gray-500 mt-1">From completed milestones</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Team Members</h3>
          <p className="text-3xl font-bold text-primary">0</p>
          <p className="text-xs text-gray-500 mt-1">Active team members</p>
        </div>
      </div>

      {/* Company Information */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Company Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Business Details</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Business Name:</span>
                <span className="ml-2 font-medium">{user?.company?.businessName || "N/A"}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Industry:</span>
                <span className="ml-2 font-medium">{user?.company?.industry || "N/A"}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Company Size:</span>
                <span className="ml-2 font-medium">{user?.company?.companySize || "N/A"}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Website:</span>
                <span className="ml-2 font-medium">
                  {user?.company?.website ? (
                    <a
                      href={user?.company?.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {user?.company?.website}
                    </a>
                  ) : (
                    "N/A"
                  )}
                </span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Contact Information</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Contact Person:</span>
                <span className="ml-2 font-medium">{user?.name || "N/A"}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Email:</span>
                <span className="ml-2 font-medium">{user?.email || "N/A"}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Phone:</span>
                <span className="ml-2 font-medium">{user?.company?.phoneNumber || "N/A"}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Location:</span>
                <span className="ml-2 font-medium">
                  {user?.company?.address?.city && user?.company?.address?.country
                    ? `${user?.company?.address?.city}, ${user?.company?.address?.country}`
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>
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
                    </td>
                    <td className="py-3 px-4">{project.client?.name || "Unknown Client"}</td>
                    <td className="py-3 px-4">{formatDate(project.deadline)}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${getStatusColor(project.status)}`}>
                        {formatStatus(project.status)}
                      </span>
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

      {/* Company Performance */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Company Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{completedProjectsCount}</div>
            <div className="text-sm text-gray-500">Projects Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {activeProjectsCount > 0
                ? Math.round((completedProjectsCount / (activeProjectsCount + completedProjectsCount)) * 100)
                : 0}
              %
            </div>
            <div className="text-sm text-gray-500">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              ${totalEarnings > 0 ? Math.round(totalEarnings / completedProjectsCount) : 0}
            </div>
            <div className="text-sm text-gray-500">Avg. Project Value</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreelancerCompanyDashboard;
