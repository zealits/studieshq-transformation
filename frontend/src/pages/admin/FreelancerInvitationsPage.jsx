import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import freelancerInvitationService from "../../services/freelancerInvitationService";
import { formatDate } from "../../utils/dateUtils";

const FreelancerInvitationsPage = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeTab, setActiveTab] = useState("upload");
  const [filters, setFilters] = useState({
    status: "",
    search: "",
    page: 1,
    limit: 20,
  });
  const [statistics, setStatistics] = useState([]);
  const [pagination, setPagination] = useState({});

  // Fetch invitations
  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const response = await freelancerInvitationService.getAllInvitations(filters);
      setInvitations(response.data.invitations);
      setPagination(response.data.pagination);
      setStatistics(response.data.statistics);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      toast.error("Failed to load invitations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "invitations") {
      fetchInvitations();
    }
  }, [activeTab, filters]);

  // Download template
  const handleDownloadTemplate = async () => {
    try {
      await freelancerInvitationService.downloadTemplate();
      toast.success("Template downloaded successfully");
    } catch (error) {
      console.error("Error downloading template:", error);
      toast.error("Failed to download template");
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please upload a valid Excel file (.xlsx or .xls)");
        return;
      }
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  // Upload and process file
  const handleUploadFile = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    try {
      setUploading(true);
      const response = await freelancerInvitationService.uploadInvitations(selectedFile);

      setUploadResult(response.data);

      if (response.data.summary.successful > 0) {
        toast.success(response.message);
      } else {
        toast.error("No registrations were successful");
      }

      // Clear file input
      setSelectedFile(null);
      document.getElementById("fileInput").value = "";
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(error.response?.data?.message || "Failed to process invitations");
    } finally {
      setUploading(false);
    }
  };

  // Resend invitation
  const handleResendInvitation = async (id) => {
    try {
      await freelancerInvitationService.resendInvitation(id);
      toast.success("Invitation resent successfully");
      fetchInvitations();
    } catch (error) {
      console.error("Error resending invitation:", error);
      toast.error(error.response?.data?.message || "Failed to resend invitation");
    }
  };

  // Delete invitation
  const handleDeleteInvitation = async (id) => {
    if (!window.confirm("Are you sure you want to delete this invitation?")) {
      return;
    }

    try {
      await freelancerInvitationService.deleteInvitation(id);
      toast.success("Invitation deleted successfully");
      fetchInvitations();
    } catch (error) {
      console.error("Error deleting invitation:", error);
      toast.error(error.response?.data?.message || "Failed to delete invitation");
    }
  };

  // Render status badge
  const renderStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending" },
      sent: { bg: "bg-blue-100", text: "text-blue-800", label: "Sent" },
      registered: { bg: "bg-green-100", text: "text-green-800", label: "Registered" },
      failed: { bg: "bg-red-100", text: "text-red-800", label: "Failed" },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>{config.label}</span>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Bulk Freelancer Registration</h1>
        <p className="mt-2 text-gray-600">Register multiple freelancers at once with automatic account creation</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b mb-6">
        <button
          className={`pb-2 px-4 font-medium ${
            activeTab === "upload" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("upload")}
        >
          Register Freelancers
        </button>
        <button
          className={`pb-2 px-4 font-medium ${
            activeTab === "invitations" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("invitations")}
        >
          View Registrations
        </button>
      </div>

      {/* Upload Tab */}
      {activeTab === "upload" && (
        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">How to Register Freelancers</h2>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>Download the Excel template by clicking the button below</li>
              <li>Fill in the required details: Email, First Name, Last Name, Current Address, Skills Set</li>
              <li>Upload the completed Excel file</li>
              <li>
                System will automatically:
                <ul className="ml-6 mt-2 list-disc space-y-1">
                  <li>Create verified freelancer accounts</li>
                  <li>Generate temporary passwords</li>
                  <li>Send welcome emails with login credentials</li>
                  <li>Users must change password on first login</li>
                </ul>
              </li>
            </ol>
          </div>

          {/* Download Template */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Step 1: Download Template</h3>
            <button
              onClick={handleDownloadTemplate}
              className="bg-primary text-white px-6 py-3 rounded-md hover:bg-primary-dark transition-colors font-medium flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download Excel Template
            </button>
          </div>

          {/* Upload File */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Step 2: Upload Completed File</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  id="fileInput"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark cursor-pointer"
                />
              </div>

              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Selected: {selectedFile.name}</span>
                </div>
              )}

              <button
                onClick={handleUploadFile}
                disabled={!selectedFile || uploading}
                className={`px-6 py-3 rounded-md font-medium transition-colors ${
                  !selectedFile || uploading
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  "Upload and Register Freelancers"
                )}
              </button>
            </div>
          </div>

          {/* Upload Results */}
          {uploadResult && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Upload Results</h3>

              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Total Processed</p>
                  <p className="text-2xl font-bold text-blue-900">{uploadResult.summary.total}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Successfully Sent</p>
                  <p className="text-2xl font-bold text-green-900">{uploadResult.summary.successful}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">Failed</p>
                  <p className="text-2xl font-bold text-red-900">{uploadResult.summary.failed}</p>
                </div>
              </div>

              {/* Errors */}
              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-red-900 mb-2">Errors:</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="text-left text-sm font-medium text-red-900">
                          <th className="pb-2">Row</th>
                          <th className="pb-2">Email</th>
                          <th className="pb-2">Error</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm text-red-800">
                        {uploadResult.errors.map((error, index) => (
                          <tr key={index} className="border-t border-red-200">
                            <td className="py-2">{error.row}</td>
                            <td className="py-2">{error.email}</td>
                            <td className="py-2">{error.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Successful Registrations */}
              {uploadResult.registrations && uploadResult.registrations.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-green-900 mb-2">Successfully Registered Freelancers:</h4>
                  <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-3">
                    <p className="text-sm text-yellow-800 font-medium">
                      ⚠️ <strong>Important:</strong> Please save these temporary passwords securely. They will only be
                      shown once!
                    </p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="text-left text-sm font-medium text-green-900">
                          <th className="pb-2">Email</th>
                          <th className="pb-2">Name</th>
                          <th className="pb-2">Temporary Password</th>
                          <th className="pb-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm text-green-800">
                        {uploadResult.registrations.map((registration, index) => (
                          <tr key={index} className="border-t border-green-200">
                            <td className="py-2">{registration.email}</td>
                            <td className="py-2">
                              {registration.firstName} {registration.lastName}
                            </td>
                            <td className="py-2">
                              <code className="bg-white px-2 py-1 rounded border border-green-300 font-mono text-red-600">
                                {registration.temporaryPassword}
                              </code>
                            </td>
                            <td className="py-2">
                              {registration.status === "registered" ? (
                                <span className="text-green-700 font-medium">✓ Registered</span>
                              ) : (
                                <span className="text-yellow-700 font-medium">⚠ Email Failed</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Invitations List Tab */}
      {activeTab === "invitations" && (
        <div className="space-y-6">
          {/* Statistics */}
          {statistics && statistics.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {statistics.map((stat) => (
                <div key={stat._id} className="bg-white p-4 rounded-lg shadow-md">
                  <p className="text-sm text-gray-600 font-medium capitalize">{stat._id}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Search by email or name..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="sent">Sent</option>
                  <option value="registered">Registered</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Invitations Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center p-12">
                <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            ) : invitations.length === 0 ? (
              <div className="text-center p-12">
                <p className="text-gray-500">No invitations found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sent At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invitations.map((invitation) => (
                      <tr key={invitation._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invitation.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {invitation.firstName} {invitation.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{renderStatusBadge(invitation.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {invitation.sentAt ? formatDate(invitation.sentAt) : "Not sent"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {invitation.status !== "registered" && (
                            <button
                              onClick={() => handleResendInvitation(invitation._id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Resend
                            </button>
                          )}
                          {invitation.status !== "registered" && (
                            <button
                              onClick={() => handleDeleteInvitation(invitation._id)}
                              className="text-red-600 hover:text-red-900 ml-4"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    disabled={filters.page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={filters.page === pagination.pages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(filters.page - 1) * filters.limit + 1}</span> to{" "}
                      <span className="font-medium">{Math.min(filters.page * filters.limit, pagination.total)}</span> of{" "}
                      <span className="font-medium">{pagination.total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                        disabled={filters.page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                        disabled={filters.page === pagination.pages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FreelancerInvitationsPage;
