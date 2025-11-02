import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import api from "../../api/axios";

const TeamManagementPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedMember, setSelectedMember] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("applied"); // "applied" or "ongoing"
  const [projectsData, setProjectsData] = useState({
    appliedProjects: [],
    ongoingProjects: [],
    completedProjects: [],
  });
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    pendingMembers: 0,
    totalProjects: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/company/team-members");
      setTeamMembers(response.data.data.teamMembers);
      setStats(response.data.data.stats);
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Are you sure you want to remove this team member?")) {
      return;
    }

    try {
      await api.delete(`/api/company/team-members/${memberId}`);
      toast.success("Team member removed successfully");
      fetchTeamMembers();
    } catch (error) {
      console.error("Error removing team member:", error);
      toast.error("Failed to remove team member");
    }
  };

  const handleUpdateRole = async (memberId, newRole) => {
    try {
      await api.put(`/api/company/team-members/${memberId}/role`, { role: newRole });
      toast.success("Role updated successfully");
      fetchTeamMembers();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role");
    }
  };

  const fetchFreelancerProjects = async (memberId) => {
    try {
      setProjectsLoading(true);
      const response = await api.get(`/api/company/team-members/${memberId}/projects`);
      setProjectsData(response.data.data);
    } catch (error) {
      console.error("Error fetching freelancer projects:", error);
      toast.error("Failed to load projects");
      setProjectsData({
        appliedProjects: [],
        ongoingProjects: [],
        completedProjects: [],
      });
    } finally {
      setProjectsLoading(false);
    }
  };

  const handleViewMember = (member) => {
    setSelectedMember(member);
    setActiveTab("applied");
    setIsModalOpen(true);
    fetchFreelancerProjects(member._id);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Invalid Date";
    }
  };

  const formatBudget = (budget) => {
    if (!budget) return "N/A";
    // Handle budget as object with min/max
    if (typeof budget === "object" && budget.min !== undefined && budget.max !== undefined) {
      return `$${budget.min} - $${budget.max}`;
    }
    // Handle budget as number
    if (typeof budget === "number") {
      return `$${budget}`;
    }
    return "N/A";
  };

  const getProposalStatusColor = (status) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProjectStatusColor = (status) => {
    switch (status) {
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "on_hold":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredMembers = teamMembers.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || member.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const renderStatusBadge = (status) => {
    switch (status) {
      case "active":
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>;
      case "pending":
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
      case "suspended":
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Suspended</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const renderRoleBadge = (role) => {
    switch (role) {
      case "admin":
        return <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">Admin</span>;
      case "manager":
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Manager</span>;
      case "member":
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Member</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{role}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-1">Manage your company's freelancer team members</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalMembers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Members</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeMembers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingMembers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Projects</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalProjects}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">${stats.totalRevenue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search team members..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="md:w-48">
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Team Members Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Projects
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.map((member) => (
                <tr key={member._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full overflow-hidden mr-3">
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-primary text-white flex items-center justify-center">
                            {member.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{renderRoleBadge(member.role)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{renderStatusBadge(member.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.projectCount || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${member.totalRevenue || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewMember(member)}
                        className="text-primary hover:text-primary-dark"
                        title="View Details"
                      >
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
                      <button
                        onClick={() => handleRemoveMember(member._id)}
                        className="text-red-600 hover:text-red-800"
                        title="Remove Member"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
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

        {filteredMembers.length === 0 && (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No team members found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by inviting freelancers to join your team.</p>
          </div>
        )}
      </div>

      {/* Member Details Modal */}
      {isModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Team Member Details</h3>

                    <div className="flex flex-col items-center mb-6">
                      <div className="h-20 w-20 rounded-full overflow-hidden mb-2">
                        {selectedMember.avatar ? (
                          <img
                            src={selectedMember.avatar}
                            alt={selectedMember.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-primary text-white flex items-center justify-center text-2xl font-bold">
                            {selectedMember.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <h4 className="text-xl font-semibold">{selectedMember.name}</h4>
                      <p className="text-gray-500">{selectedMember.email}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <div className="flex items-center space-x-2">
                          {renderRoleBadge(selectedMember.role)}
                          <select
                            className="ml-2 px-2 py-1 text-xs border border-gray-300 rounded"
                            value={selectedMember.role}
                            onChange={(e) => handleUpdateRole(selectedMember._id, e.target.value)}
                          >
                            <option value="member">Member</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <div>{renderStatusBadge(selectedMember.status)}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Projects</label>
                        <p className="text-sm text-gray-600">{selectedMember.projectCount || 0}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Revenue</label>
                        <p className="text-sm text-gray-600">${selectedMember.totalRevenue || 0}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Joined Date</label>
                        <p className="text-sm text-gray-600">
                          {new Date(selectedMember.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Active</label>
                        <p className="text-sm text-gray-600">
                          {selectedMember.lastActive
                            ? new Date(selectedMember.lastActive).toLocaleDateString()
                            : "Never"}
                        </p>
                      </div>
                    </div>

                    {selectedMember.skills && selectedMember.skills.length > 0 && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedMember.skills.map((skill, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Projects Section */}
                    <div className="mt-6 border-t pt-4">
                      <h4 className="text-md font-semibold text-gray-900 mb-4">Projects</h4>
                      
                      {/* Tabs */}
                      <div className="border-b border-gray-200 mb-4">
                        <nav className="-mb-px flex space-x-8">
                          <button
                            onClick={() => setActiveTab("applied")}
                            className={`${
                              activeTab === "applied"
                                ? "border-primary text-primary"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
                          >
                            Applied Projects ({projectsData.appliedProjects?.length || 0})
                          </button>
                          <button
                            onClick={() => setActiveTab("ongoing")}
                            className={`${
                              activeTab === "ongoing"
                                ? "border-primary text-primary"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
                          >
                            Ongoing Projects ({projectsData.ongoingProjects?.length || 0})
                          </button>
                          <button
                            onClick={() => setActiveTab("completed")}
                            className={`${
                              activeTab === "completed"
                                ? "border-primary text-primary"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
                          >
                            Completed ({projectsData.completedProjects?.length || 0})
                          </button>
                        </nav>
                      </div>

                      {/* Tab Content */}
                      {projectsLoading ? (
                        <div className="flex justify-center items-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      ) : (
                        <div className="max-h-96 overflow-y-auto">
                          {/* Applied Projects Tab */}
                          {activeTab === "applied" && (
                            <div className="space-y-4">
                              {projectsData.appliedProjects && projectsData.appliedProjects.length > 0 ? (
                                projectsData.appliedProjects.map((applied) => (
                                  <div key={applied.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                                    <div className="flex justify-between items-start mb-2">
                                      <div className="flex-1">
                                        <h5 className="font-semibold text-gray-900">
                                          {applied.job?.title || "Untitled Job"}
                                        </h5>
                                        <p className="text-sm text-gray-600 mt-1">
                                          Client: {applied.job?.client?.name || "Unknown"}
                                        </p>
                                      </div>
                                      <span
                                        className={`px-2 py-1 text-xs rounded-full ${getProposalStatusColor(
                                          applied.proposalStatus
                                        )}`}
                                      >
                                        {applied.proposalStatus?.charAt(0).toUpperCase() +
                                          applied.proposalStatus?.slice(1) || "Pending"}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">
                                      {applied.job?.description || "No description available"}
                                    </p>
                                    <div className="flex justify-between items-center text-xs text-gray-500">
                                      <span>Applied: {formatDate(applied.appliedDate)}</span>
                                      {applied.job?.budget && (
                                        <span className="font-medium">Budget: {formatBudget(applied.job.budget)}</span>
                                      )}
                                    </div>
                                    {applied.job?.deadline && (
                                      <div className="mt-2 text-xs text-gray-500">
                                        Deadline: {formatDate(applied.job.deadline)}
                                      </div>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-8 text-gray-500">
                                  <p>No applied projects found</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Ongoing Projects Tab */}
                          {activeTab === "ongoing" && (
                            <div className="space-y-4">
                              {projectsData.ongoingProjects && projectsData.ongoingProjects.length > 0 ? (
                                projectsData.ongoingProjects.map((project) => (
                                  <div
                                    key={project._id}
                                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <div className="flex-1">
                                        <h5 className="font-semibold text-gray-900">{project.title}</h5>
                                        <p className="text-sm text-gray-600 mt-1">
                                          Client: {project.client?.name || "Unknown"}
                                        </p>
                                      </div>
                                      <span
                                        className={`px-2 py-1 text-xs rounded-full ${getProjectStatusColor(
                                          project.status
                                        )}`}
                                      >
                                        {project.status?.charAt(0).toUpperCase() + project.status?.slice(1) || "In Progress"}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">
                                      {project.description || "No description available"}
                                    </p>
                                    <div className="flex justify-between items-center text-xs text-gray-500">
                                      <span>Started: {formatDate(project.createdAt)}</span>
                                      {project.budget && (
                                        <span className="font-medium">Budget: {formatBudget(project.budget)}</span>
                                      )}
                                    </div>
                                    {project.deadline && (
                                      <div className="mt-2 text-xs text-gray-500">
                                        Deadline: {formatDate(project.deadline)}
                                      </div>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-8 text-gray-500">
                                  <p>No ongoing projects found</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Completed Projects Tab */}
                          {activeTab === "completed" && (
                            <div className="space-y-4">
                              {projectsData.completedProjects && projectsData.completedProjects.length > 0 ? (
                                projectsData.completedProjects.map((project) => (
                                  <div
                                    key={project._id}
                                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <div className="flex-1">
                                        <h5 className="font-semibold text-gray-900">{project.title}</h5>
                                        <p className="text-sm text-gray-600 mt-1">
                                          Client: {project.client?.name || "Unknown"}
                                        </p>
                                      </div>
                                      <span
                                        className={`px-2 py-1 text-xs rounded-full ${getProjectStatusColor(
                                          project.status
                                        )}`}
                                      >
                                        Completed
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">
                                      {project.description || "No description available"}
                                    </p>
                                    <div className="flex justify-between items-center text-xs text-gray-500">
                                      <span>Completed: {formatDate(project.updatedAt)}</span>
                                      {project.budget && (
                                        <span className="font-medium">Budget: {formatBudget(project.budget)}</span>
                                      )}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-8 text-gray-500">
                                  <p>No completed projects found</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => {
                    setIsModalOpen(false);
                    setProjectsData({
                      appliedProjects: [],
                      ongoingProjects: [],
                      completedProjects: [],
                    });
                  }}
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

export default TeamManagementPage;

