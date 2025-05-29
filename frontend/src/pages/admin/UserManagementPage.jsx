import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers, updateUserVerification } from "../../redux/slices/userManagementSlice";

const UserManagementPage = () => {
  const dispatch = useDispatch();
  const { users, pagination, loading, error } = useSelector((state) => state.userManagement);

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(
      fetchUsers({
        page: currentPage,
        limit: 10,
        role: activeTab !== "all" ? activeTab : undefined,
        search: searchQuery,
      })
    );
  }, [dispatch, currentPage, activeTab, searchQuery]);

  // Handle user selection for details/editing
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  // Handle verification update
  const handleVerificationUpdate = async (userId, isVerified, verificationDocuments) => {
    try {
      await dispatch(updateUserVerification({ userId, isVerified, verificationDocuments })).unwrap();
      handleCloseModal();
    } catch (error) {
      console.error("Failed to update verification:", error);
    }
  };

  // Render status badge
  const renderStatusBadge = (status) => {
    switch (status) {
      case "active":
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>;
      case "suspended":
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Suspended</span>;
      case "pending":
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  // Render role badge
  const renderRoleBadge = (role) => {
    switch (role) {
      case "freelancer":
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Freelancer</span>;
      case "client":
        return <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">Client</span>;
      case "admin":
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-900 text-white">Admin</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{role}</span>;
    }
  };

  // Render verification badge
  const renderVerificationBadge = (isVerified) => {
    if (isVerified) {
      return (
        <span className="flex items-center px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          Verified
        </span>
      );
    }
    return (
      <span className="flex items-center px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Pending
      </span>
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">User Management</h1>

      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row justify-between mb-6 space-y-4 md:space-y-0">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* User Type Tabs */}
      <div className="flex border-b mb-6 overflow-x-auto">
        <button
          className={`pb-2 px-4 font-medium whitespace-nowrap ${
            activeTab === "all" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("all")}
        >
          All Users
        </button>
        <button
          className={`pb-2 px-4 font-medium whitespace-nowrap ${
            activeTab === "freelancer" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("freelancer")}
        >
          Freelancers
        </button>
        <button
          className={`pb-2 px-4 font-medium whitespace-nowrap ${
            activeTab === "client" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("client")}
        >
          Clients
        </button>
        <button
          className={`pb-2 px-4 font-medium whitespace-nowrap ${
            activeTab === "admin" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("admin")}
        >
          Admins
        </button>
        <button
          className={`pb-2 px-4 font-medium whitespace-nowrap ${
            activeTab === "suspended" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("suspended")}
        >
          Suspended
        </button>
        <button
          className={`pb-2 px-4 font-medium whitespace-nowrap ${
            activeTab === "pending" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("pending")}
        >
          Pending
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  User
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Role
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Verification
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Join Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Last Active
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
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center mr-3">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{renderRoleBadge(user.role)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{renderStatusBadge(user.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{renderVerificationBadge(user.isVerified)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button className="text-primary hover:text-primary-dark" onClick={() => handleUserSelect(user)}>
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{" "}
          <span className="font-medium">{Math.min(currentPage * 10, pagination.total)}</span> of{" "}
          <span className="font-medium">{pagination.total}</span> results
        </div>
        <nav className="flex space-x-1" aria-label="Pagination">
          <button
            className="relative inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <button className="relative inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-primary text-sm font-medium text-white">
            {currentPage}
          </button>
          <button
            className="relative inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.pages))}
            disabled={currentPage === pagination.pages}
          >
            Next
          </button>
        </nav>
      </div>

      {/* User Detail/Edit Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">User Details</h3>
                    <div className="mt-2 space-y-3 w-full">
                      <div className="flex flex-col items-center mb-4">
                        <div className="h-20 w-20 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mb-2">
                          {selectedUser.name.charAt(0)}
                        </div>
                        <h4 className="text-xl font-semibold">{selectedUser.name}</h4>
                        <p className="text-gray-500">{selectedUser.email}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                          <div>{renderRoleBadge(selectedUser.role)}</div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <div>{renderStatusBadge(selectedUser.status)}</div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Verification Status</label>
                          <div>{renderVerificationBadge(selectedUser.isVerified)}</div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Join Date</label>
                          <p className="text-sm text-gray-600">
                            {new Date(selectedUser.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Last Active</label>
                          <p className="text-sm text-gray-600">
                            {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleDateString() : "Never"}
                          </p>
                        </div>
                      </div>

                      <div className="border-t pt-4 mt-4">
                        <h4 className="font-medium mb-2">Verification Documents</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Identity Proof</label>
                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                              <div>
                                <p className="text-sm font-medium">
                                  {selectedUser.verificationDocuments?.identityProof?.type || "Not provided"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Uploaded:{" "}
                                  {selectedUser.verificationDocuments?.identityProof?.uploadDate
                                    ? new Date(
                                        selectedUser.verificationDocuments.identityProof.uploadDate
                                      ).toLocaleDateString()
                                    : "Not available"}
                                </p>
                              </div>
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  selectedUser.verificationDocuments?.identityProof?.status === "verified"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {selectedUser.verificationDocuments?.identityProof?.status || "pending"}
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address Proof</label>
                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                              <div>
                                <p className="text-sm font-medium">
                                  {selectedUser.verificationDocuments?.addressProof?.type || "Not provided"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Uploaded:{" "}
                                  {selectedUser.verificationDocuments?.addressProof?.uploadDate
                                    ? new Date(
                                        selectedUser.verificationDocuments.addressProof.uploadDate
                                      ).toLocaleDateString()
                                    : "Not available"}
                                </p>
                              </div>
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  selectedUser.verificationDocuments?.addressProof?.status === "verified"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {selectedUser.verificationDocuments?.addressProof?.status || "pending"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-4 mt-4">
                        <h4 className="font-medium mb-2">Actions</h4>
                        <div className="flex space-x-2">
                          {!selectedUser.isVerified && (
                            <button
                              className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded-md text-sm"
                              onClick={() =>
                                handleVerificationUpdate(selectedUser._id, true, selectedUser.verificationDocuments)
                              }
                            >
                              Verify Documents
                            </button>
                          )}
                          {selectedUser.status === "active" ? (
                            <button className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded-md text-sm">
                              Suspend User
                            </button>
                          ) : (
                            <button className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded-md text-sm">
                              Activate User
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleCloseModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
