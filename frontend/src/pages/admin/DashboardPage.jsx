import React, { useState } from "react";

const DashboardPage = () => {
  const [timeRange, setTimeRange] = useState("month");

  // Mock statistics
  const stats = {
    totalUsers: 2548,
    totalProjects: 1842,
    totalRevenue: "$38,450",
    activeJobs: 386,
    pendingWithdrawals: 15,
    newUsers: 128,
    completionRate: 87,
    disputeRate: 2.4,
    userGrowth: 18.2,
    revenueGrowth: 12.4,
  };

  // Mock recent activities
  const recentActivities = [
    {
      id: 1,
      type: "user_joined",
      user: "John Miller",
      role: "freelancer",
      time: "2 hours ago",
    },
    {
      id: 2,
      type: "project_completed",
      client: "TechSolutions Inc.",
      freelancer: "Sarah Williams",
      project: "Marketing Campaign",
      time: "5 hours ago",
    },
    {
      id: 3,
      type: "payment_processed",
      amount: "$1,200",
      client: "Global Health",
      freelancer: "Michael Chen",
      time: "yesterday",
    },
    {
      id: 4,
      type: "dispute_opened",
      client: "Fashion Retail Ltd.",
      freelancer: "James Wilson",
      project: "E-commerce Platform Integration",
      time: "yesterday",
    },
    {
      id: 5,
      type: "user_joined",
      user: "Emily Brown",
      role: "client",
      time: "2 days ago",
    },
  ];

  // Mock top freelancers
  const topFreelancers = [
    {
      id: 1,
      name: "Alex Johnson",
      avatar: "AJ",
      category: "Web Development",
      completedProjects: 35,
      earnings: "$12,500",
      rating: 4.9,
    },
    {
      id: 2,
      name: "Sarah Williams",
      avatar: "SW",
      category: "Digital Marketing",
      completedProjects: 28,
      earnings: "$10,800",
      rating: 4.8,
    },
    {
      id: 3,
      name: "Michael Chen",
      avatar: "MC",
      category: "Mobile Development",
      completedProjects: 31,
      earnings: "$14,200",
      rating: 4.7,
    },
    {
      id: 4,
      name: "Emily Carter",
      avatar: "EC",
      category: "UI/UX Design",
      completedProjects: 26,
      earnings: "$9,500",
      rating: 4.9,
    },
  ];

  // Mock ongoing projects
  const ongoingProjects = [
    {
      id: 1,
      title: "Corporate Website Redesign",
      client: "TechSolutions Inc.",
      freelancer: "Alex Johnson",
      progress: 65,
      dueDate: "June 15, 2023",
    },
    {
      id: 2,
      title: "Marketing Campaign for Product Launch",
      client: "Global Health",
      freelancer: "Sarah Williams",
      progress: 25,
      dueDate: "May 30, 2023",
    },
    {
      id: 3,
      title: "Mobile App Development",
      client: "Startup Ventures",
      freelancer: "Michael Chen",
      progress: 10,
      dueDate: "August 30, 2023",
    },
  ];

  // Get activity icon based on type
  const getActivityIcon = (type) => {
    switch (type) {
      case "user_joined":
        return (
          <div className="rounded-full bg-green-100 p-2">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
        );
      case "project_completed":
        return (
          <div className="rounded-full bg-blue-100 p-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
        );
      case "payment_processed":
        return (
          <div className="rounded-full bg-purple-100 p-2">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
        );
      case "dispute_opened":
        return (
          <div className="rounded-full bg-red-100 p-2">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className="rounded-full bg-gray-100 p-2">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        );
    }
  };

  // Render activity description based on type
  const renderActivityDescription = (activity) => {
    switch (activity.type) {
      case "user_joined":
        return (
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-800">{activity.user}</span> joined as a {activity.role}
          </p>
        );
      case "project_completed":
        return (
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-800">{activity.freelancer}</span> completed{" "}
            <span className="font-medium text-gray-800">{activity.project}</span> for{" "}
            <span className="font-medium text-gray-800">{activity.client}</span>
          </p>
        );
      case "payment_processed":
        return (
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-800">{activity.amount}</span> payment processed from{" "}
            <span className="font-medium text-gray-800">{activity.client}</span> to{" "}
            <span className="font-medium text-gray-800">{activity.freelancer}</span>
          </p>
        );
      case "dispute_opened":
        return (
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-800">{activity.client}</span> opened a dispute with{" "}
            <span className="font-medium text-gray-800">{activity.freelancer}</span> on{" "}
            <span className="font-medium text-gray-800">{activity.project}</span>
          </p>
        );
      default:
        return <p className="text-sm text-gray-600">Unknown activity</p>;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
            <span className="text-green-500 bg-green-100 p-1 rounded text-xs">+{stats.userGrowth}%</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.totalUsers}</p>
          <p className="text-xs text-gray-500 mt-1">
            {stats.newUsers} new users this {timeRange}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Projects</h3>
            <span className="text-green-500 bg-green-100 p-1 rounded text-xs">+9.2%</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.totalProjects}</p>
          <p className="text-xs text-gray-500 mt-1">{stats.completionRate}% completion rate</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
            <span className="text-green-500 bg-green-100 p-1 rounded text-xs">+{stats.revenueGrowth}%</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.totalRevenue}</p>
          <p className="text-xs text-gray-500 mt-1">{stats.pendingWithdrawals} pending withdrawals</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Active Jobs</h3>
            <span className="text-green-500 bg-green-100 p-1 rounded text-xs">+5.3%</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.activeJobs}</p>
          <p className="text-xs text-gray-500 mt-1">{stats.disputeRate}% dispute rate</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ongoing Projects */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Ongoing Projects</h2>
              <a href="#" className="text-primary text-sm hover:underline">
                View All
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Project</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Client</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Freelancer</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Progress</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ongoingProjects.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="py-3 text-sm font-medium">{project.title}</td>
                      <td className="py-3 text-sm text-gray-600">{project.client}</td>
                      <td className="py-3 text-sm text-gray-600">{project.freelancer}</td>
                      <td className="py-3">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${project.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">{project.progress}%</span>
                        </div>
                      </td>
                      <td className="py-3 text-sm text-gray-600">{project.dueDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Freelancers */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Top Performing Freelancers</h2>
              <a href="#" className="text-primary text-sm hover:underline">
                View All
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Freelancer</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Category</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Projects</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Earnings</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {topFreelancers.map((freelancer) => (
                    <tr key={freelancer.id} className="hover:bg-gray-50">
                      <td className="py-3">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center mr-3 text-sm font-medium">
                            {freelancer.avatar}
                          </div>
                          <span className="font-medium">{freelancer.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-sm text-gray-600">{freelancer.category}</td>
                      <td className="py-3 text-sm text-gray-600">{freelancer.completedProjects}</td>
                      <td className="py-3 text-sm font-medium">{freelancer.earnings}</td>
                      <td className="py-3">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="ml-1 text-sm text-gray-600">
                            {freelancer.rating} ({freelancer.rating * 20}%)
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <a href="#" className="text-primary text-sm hover:underline">
                View All
              </a>
            </div>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start">
                  <div className="flex-shrink-0 mr-3">{getActivityIcon(activity.type)}</div>
                  <div>
                    {renderActivityDescription(activity)}
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">System Health</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Server Uptime</span>
                  <span className="text-sm font-medium">99.9%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: "99.9%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">API Response Time</span>
                  <span className="text-sm font-medium">250ms</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: "85%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Database Load</span>
                  <span className="text-sm font-medium">42%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "42%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Memory Usage</span>
                  <span className="text-sm font-medium">68%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: "68%" }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
