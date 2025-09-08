import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchProjects } from "../../redux/slices/projectsSlice";
import { fetchClientJobs } from "../../redux/slices/jobsSlice";
import { formatDate } from "../../utils/dateUtils";

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { projects, loading: projectsLoading } = useSelector((state) => state.projects);
  const { clientJobs, isLoading: jobsLoading } = useSelector((state) => state.jobs);

  useEffect(() => {
    // Fetch client's projects and jobs
    dispatch(fetchProjects({})); // Fetch all projects for the client
    dispatch(fetchClientJobs());
  }, [dispatch]);

  // Calculate real-time statistics
  const activeProjects = projects?.filter((p) => p.status === "in_progress") || [];
  const completedProjects = projects?.filter((p) => p.status === "completed") || [];
  const allClientJobs = [...(clientJobs.active || []), ...(clientJobs.closed || []), ...(clientJobs.draft || [])];
  const openJobs = clientJobs.active?.filter((job) => job.status === "open") || [];

  // Get unique hired freelancers from active projects
  const hiredFreelancers = [...new Set(activeProjects.map((p) => p.freelancer?._id).filter(Boolean))];

  // Get recent projects (last 3)
  const recentProjects = [...activeProjects].slice(0, 3);

  // Get top freelancers (based on completed projects and ratings)
  const freelancerStats = completedProjects.reduce((acc, project) => {
    if (project.freelancer) {
      const freelancerId = project.freelancer._id;
      if (!acc[freelancerId]) {
        acc[freelancerId] = {
          ...project.freelancer,
          completedProjects: 0,
          totalEarnings: 0,
          avgRating: 0,
          ratings: [],
        };
      }
      acc[freelancerId].completedProjects += 1;
      acc[freelancerId].totalEarnings += project.budget || 0;
      if (project.clientReview?.rating) {
        acc[freelancerId].ratings.push(project.clientReview.rating);
      }
    }
    return acc;
  }, {});

  // Calculate average ratings and get top freelancers
  const topFreelancers = Object.values(freelancerStats)
    .map((freelancer) => ({
      ...freelancer,
      avgRating:
        freelancer.ratings.length > 0
          ? (freelancer.ratings.reduce((sum, rating) => sum + rating, 0) / freelancer.ratings.length).toFixed(1)
          : 0,
    }))
    .sort((a, b) => b.completedProjects - a.completedProjects)
    .slice(0, 2);

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

  const getInitials = (name) => {
    return (
      name
        ?.split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase() || "??"
    );
  };

  return (
    <div>
      {/* <h1 className="text-2xl font-bold mb-6">Client Dashboard</h1> */}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Welcome, {user?.name || "Client"}!</h2>
        <p className="text-gray-600">
          Your client dashboard gives you an overview of your projects, freelancers, and pending tasks.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Active Projects</h3>
          <p className="text-3xl font-bold text-primary">{activeProjects.length}</p>
          <p className="text-xs text-gray-500 mt-1">Currently in progress</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Open Projects</h3>
          <p className="text-3xl font-bold text-primary">{openJobs.length}</p>
          <p className="text-xs text-gray-500 mt-1">Accepting proposals</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Hired Freelancers</h3>
          <p className="text-3xl font-bold text-primary">{hiredFreelancers.length}</p>
          <p className="text-xs text-gray-500 mt-1">Working on projects</p>
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Freelancer</th>
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
                    <td className="py-3 px-4">{project.freelancer?.name || "Not assigned"}</td>
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
            <p>
              No active projects found.{" "}
              <a href="/client/jobs" className="text-primary hover:underline">
                Post a Project
              </a>{" "}
              to get started!
            </p>
          </div>
        )}
      </div>

      {/* Top Freelancers */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Your Top Freelancers</h2>

        {topFreelancers.length > 0 ? (
          <div className="space-y-4">
            {topFreelancers.map((freelancer) => (
              <div
                key={freelancer._id}
                className="flex items-center p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center text-white font-medium">
                  {freelancer.avatar ? (
                    <img
                      src={freelancer.avatar}
                      alt={freelancer.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(freelancer.name)
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex justify-between">
                    <h3 className="font-medium">{freelancer.name}</h3>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="ml-1 text-sm">{freelancer.avgRating || "N/A"}</span>
                    </div>
                  </div>
                  <p className="text-gray-600">
                    {freelancer.completedProjects} projects completed • ${freelancer.totalEarnings.toLocaleString()} USD{" "}
                    earned
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>No freelancer data available yet. Complete some projects to see your top performers!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
