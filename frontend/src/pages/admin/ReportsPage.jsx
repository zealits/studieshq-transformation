import React, { useState } from "react";

const ReportsPage = () => {
  const [dateRange, setDateRange] = useState("month");
  const [reportType, setReportType] = useState("revenue");

  // Sample data for revenue chart
  const revenueData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Platform Revenue",
        data: [12500, 15000, 17800, 16500, 21000, 23500],
      },
    ],
  };

  // Sample data for user chart
  const userData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "New Users",
        data: [85, 102, 123, 94, 142, 159],
      },
    ],
  };

  // Sample data for project chart
  const projectData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "New Projects",
        data: [45, 62, 73, 58, 81, 93],
      },
    ],
  };

  // Mock report statistics
  const reportStats = {
    revenue: {
      total: "$107,300 USD",
      average: "$17,883 USD",
      highest: "$23,500 USD (Jun)",
      growth: "+12.8%",
    },
    users: {
      total: "705",
      average: "118",
      highest: "159 (Jun)",
      growth: "+11.9%",
    },
    projects: {
      total: "412",
      average: "69",
      highest: "93 (Jun)",
      growth: "+14.8%",
    },
  };

  // Top categories data
  const topCategories = [
    { name: "Web Development", value: 28, color: "bg-blue-500" },
    { name: "Design", value: 22, color: "bg-purple-500" },
    { name: "Marketing", value: 18, color: "bg-green-500" },
    { name: "Mobile Development", value: 15, color: "bg-yellow-500" },
    { name: "Writing", value: 10, color: "bg-red-500" },
    { name: "Other", value: 7, color: "bg-gray-500" },
  ];

  // Get current data based on selected report type
  const getCurrentData = () => {
    switch (reportType) {
      case "revenue":
        return revenueData;
      case "users":
        return userData;
      case "projects":
        return projectData;
      default:
        return revenueData;
    }
  };

  // Get current stats based on selected report type
  const getCurrentStats = () => {
    switch (reportType) {
      case "revenue":
        return reportStats.revenue;
      case "users":
        return reportStats.users;
      case "projects":
        return reportStats.projects;
      default:
        return reportStats.revenue;
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Analytics & Reports</h1>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center space-y-4 md:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div>
              <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-1">
                Report Type
              </label>
              <select
                id="reportType"
                className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="revenue">Revenue</option>
                <option value="users">Users</option>
                <option value="projects">Projects</option>
              </select>
            </div>

            <div>
              <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <select
                id="dateRange"
                className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          </div>

          <div>
            <button className="btn-primary">
              <svg
                className="w-4 h-4 mr-2 inline-block"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">
              {reportType === "revenue"
                ? "Revenue Overview"
                : reportType === "users"
                ? "User Growth"
                : "Project Creation"}
            </h2>
            <div className="h-80 w-full">
              {/* Chart would be rendered here in a real implementation */}
              {/* This is a simplified representation */}
              <div className="h-full flex items-end space-x-4 border-b border-l relative">
                {getCurrentData().labels.map((label, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div
                      className="w-full bg-primary rounded-t"
                      style={{
                        height: `${
                          (getCurrentData().datasets[0].data[index] / Math.max(...getCurrentData().datasets[0].data)) *
                          70
                        }%`,
                      }}
                    ></div>
                    <div className="text-xs mt-2">{label}</div>
                  </div>
                ))}
                <div className="absolute -left-6 bottom-12 transform -rotate-90 text-xs text-gray-500">
                  {reportType === "revenue" ? "Amount ($)" : reportType === "users" ? "Users" : "Projects"}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-5">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Total</h3>
              <p className="text-xl font-bold">{getCurrentStats().total}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-5">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Average</h3>
              <p className="text-xl font-bold">{getCurrentStats().average}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-5">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Highest</h3>
              <p className="text-xl font-bold">{getCurrentStats().highest}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-5">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Growth</h3>
              <p className="text-xl font-bold text-green-600">{getCurrentStats().growth}</p>
            </div>
          </div>
        </div>

        {/* Right Column - Additional Stats */}
        <div className="space-y-6">
          {/* Top Categories */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Top Categories</h2>
            <div className="space-y-4">
              {topCategories.map((category, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">{category.name}</span>
                    <span className="text-sm font-medium">{category.value}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`${category.color} h-2 rounded-full`} style={{ width: `${category.value}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Reports */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Recent Reports</h2>
              <a href="#" className="text-primary text-sm hover:underline">
                View All
              </a>
            </div>
            <div className="space-y-4">
              <div className="border rounded-lg p-3 hover:bg-gray-50">
                <h3 className="font-medium text-sm">Monthly Revenue Report</h3>
                <p className="text-xs text-gray-500 mt-1">Generated on June 1, 2023</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">PDF, 2.3 MB</span>
                  <button className="text-primary text-sm">Download</button>
                </div>
              </div>
              <div className="border rounded-lg p-3 hover:bg-gray-50">
                <h3 className="font-medium text-sm">User Growth Analysis</h3>
                <p className="text-xs text-gray-500 mt-1">Generated on May 15, 2023</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">PDF, 1.8 MB</span>
                  <button className="text-primary text-sm">Download</button>
                </div>
              </div>
              <div className="border rounded-lg p-3 hover:bg-gray-50">
                <h3 className="font-medium text-sm">Project Completion Stats</h3>
                <p className="text-xs text-gray-500 mt-1">Generated on May 5, 2023</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">PDF, 1.5 MB</span>
                  <button className="text-primary text-sm">Download</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Detailed Reports */}
      <div className="mt-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Detailed Reports</h2>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Report Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Type
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date Range
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Generated On
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Size
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Monthly Revenue Report
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Revenue</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Jun 1 - Jun 30, 2023</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Jul 1, 2023</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2.3 MB</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    User Growth Analysis
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Users</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">May 1 - May 31, 2023</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Jun 2, 2023</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1.8 MB</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Project Completion Stats
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Projects</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Apr 1 - Apr 30, 2023</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">May 5, 2023</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1.5 MB</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
