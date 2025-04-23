import React from "react";
import { useSelector } from "react-redux";

const DashboardPage = () => {
  const { user } = useSelector((state) => state.auth);

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Active Projects</h3>
          <p className="text-3xl font-bold text-primary">3</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Available Balance</h3>
          <p className="text-3xl font-bold text-primary">$1,250</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Proposals Sent</h3>
          <p className="text-3xl font-bold text-primary">12</p>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Recent Projects</h2>

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
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="font-medium">Website Redesign</div>
                  <div className="text-sm text-gray-500">E-commerce website</div>
                </td>
                <td className="py-3 px-4">Tech Solutions Inc.</td>
                <td className="py-3 px-4">May 15, 2023</td>
                <td className="py-3 px-4">
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    In Progress
                  </span>
                </td>
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="font-medium">Mobile App Development</div>
                  <div className="text-sm text-gray-500">iOS and Android</div>
                </td>
                <td className="py-3 px-4">Global Health</td>
                <td className="py-3 px-4">June 30, 2023</td>
                <td className="py-3 px-4">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">In Review</span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="font-medium">Logo Design</div>
                  <div className="text-sm text-gray-500">Brand identity</div>
                </td>
                <td className="py-3 px-4">Startup Ventures</td>
                <td className="py-3 px-4">April 28, 2023</td>
                <td className="py-3 px-4">
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    Revision
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommended Jobs */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Recommended Jobs</h2>

        <div className="space-y-4">
          <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <h3 className="font-medium">Senior React Developer</h3>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <span>$50-70/hr</span>
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
              <span>$3,000-5,000</span>
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
