import React from "react";
import { useSelector } from "react-redux";

const DashboardPage = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Client Dashboard</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Welcome back, {user?.name || "Client"}!</h2>
        <p className="text-gray-600">
          Your client dashboard gives you an overview of your projects, freelancers, and pending tasks.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Active Projects</h3>
          <p className="text-3xl font-bold text-primary">4</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Open Jobs</h3>
          <p className="text-3xl font-bold text-primary">2</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Hired Freelancers</h3>
          <p className="text-3xl font-bold text-primary">7</p>
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
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Freelancer</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Due Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="font-medium">Corporate Website Redesign</div>
                  <div className="text-sm text-gray-500">5-page business website</div>
                </td>
                <td className="py-3 px-4">Alex Johnson</td>
                <td className="py-3 px-4">May 20, 2023</td>
                <td className="py-3 px-4">
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    In Progress
                  </span>
                </td>
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="font-medium">Marketing Campaign</div>
                  <div className="text-sm text-gray-500">Social media content</div>
                </td>
                <td className="py-3 px-4">Sarah Miller</td>
                <td className="py-3 px-4">June 15, 2023</td>
                <td className="py-3 px-4">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">Planning</span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="font-medium">Mobile App Development</div>
                  <div className="text-sm text-gray-500">iOS and Android</div>
                </td>
                <td className="py-3 px-4">Michael Chen</td>
                <td className="py-3 px-4">August 30, 2023</td>
                <td className="py-3 px-4">
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    Starting Soon
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Freelancers */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Your Top Freelancers</h2>

        <div className="space-y-4">
          <div className="flex items-center p-4 border rounded-lg hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center text-white font-medium">
              AJ
            </div>
            <div className="ml-4 flex-1">
              <div className="flex justify-between">
                <h3 className="font-medium">Alex Johnson</h3>
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="ml-1 text-sm">4.9</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">Web Developer • 3 projects completed</p>
            </div>
          </div>

          <div className="flex items-center p-4 border rounded-lg hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center text-white font-medium">
              SM
            </div>
            <div className="ml-4 flex-1">
              <div className="flex justify-between">
                <h3 className="font-medium">Sarah Miller</h3>
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="ml-1 text-sm">4.8</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">Content Marketer • 2 projects completed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
