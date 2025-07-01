import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers } from "../../redux/slices/userManagementSlice";
import { fetchAllProjectsForAdmin } from "../../redux/slices/projectsSlice";
import { fetchAllJobsForAdmin } from "../../redux/slices/jobsSlice";
import { formatDate } from "../../utils/dateUtils";
import adminService from "../../services/adminService";
import { toast } from "react-hot-toast";

const DashboardPage = () => {
  const [timeRange, setTimeRange] = useState("month");
  const [activeTab, setActiveTab] = useState("overview");
  const [paymentAnalytics, setPaymentAnalytics] = useState(null);
  const [financialOverview, setFinancialOverview] = useState(null);
  const [userPaymentData, setUserPaymentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  // Redux state
  const { users, loading: usersLoading } = useSelector((state) => state.userManagement);
  const { adminProjects, loading: projectsLoading } = useSelector((state) => state.projects);
  const { adminJobs, isLoading: jobsLoading } = useSelector((state) => state.jobs);

  useEffect(() => {
    // Fetch all data for admin dashboard
    dispatch(fetchUsers({ page: 1, limit: 100 }));
    dispatch(fetchAllProjectsForAdmin());
    dispatch(fetchAllJobsForAdmin());
    loadPaymentAnalytics();
  }, [dispatch, timeRange]);

  const loadPaymentAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsData, financialData] = await Promise.all([
        adminService.getPaymentAnalytics(),
        adminService.getPlatformFinancialOverview(),
      ]);

      setPaymentAnalytics(analyticsData.data);
      setFinancialOverview(financialData.data);
      setUserPaymentData(analyticsData.data.usersWithWallets || []);
    } catch (error) {
      console.error("Error loading payment analytics:", error);
      toast.error("Failed to load payment analytics");
    } finally {
      setLoading(false);
    }
  };

  // Calculate real statistics
  const totalUsers = users?.length || 0;
  const freelancers = users?.filter((user) => user.role === "freelancer") || [];
  const clients = users?.filter((user) => user.role === "client") || [];
  const activeUsers = users?.filter((user) => user.status === "active") || [];

  const totalProjects = adminProjects?.length || 0;
  const activeProjects = adminProjects?.filter((p) => p.status === "in_progress") || [];
  const completedProjects = adminProjects?.filter((p) => p.status === "completed") || [];
  const completionRate = totalProjects > 0 ? Math.round((completedProjects.length / totalProjects) * 100) : 0;

  const totalJobs = adminJobs?.length || 0;
  const activeJobs = adminJobs?.filter((job) => job.status === "open") || [];

  // Calculate total revenue from completed projects
  const totalRevenue = completedProjects.reduce((sum, project) => sum + (project.budget || 0), 0);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
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

  // Enhanced stats with payment data
  const enhancedStats = {
    totalUsers,
    totalProjects,
    totalRevenue: formatCurrency(totalRevenue),
    activeJobs: activeJobs.length,
    platformRevenue: financialOverview
      ? formatCurrency(
          financialOverview.platformRevenue.totalRevenue || financialOverview.platformRevenue.escrowRevenue
        )
      : formatCurrency(0),
    totalSystemFunds: financialOverview
      ? formatCurrency(financialOverview.systemFunds.totalBalance)
      : formatCurrency(0),
    activeEscrowAmount: financialOverview
      ? formatCurrency(financialOverview.activeEscrow.totalAmount)
      : formatCurrency(0),
    clientCount: clients.length,
    freelancerCount: freelancers.length,
  };

  if (loading && !paymentAnalytics) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex space-x-4">
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

      {/* Tab Navigation */}
      <div className="flex border-b mb-6">
        {[
          { id: "overview", label: "Overview" },
          { id: "payments", label: "Payment Analytics" },
          { id: "users", label: "User Wallets" },
          { id: "revenue", label: "Revenue Details" },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`pb-2 px-4 font-medium ${
              activeTab === tab.id ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Platform Revenue</h3>
            <span className="text-green-500 bg-green-100 p-1 rounded text-xs">Total Earned</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{enhancedStats.platformRevenue}</p>
          <p className="text-xs text-gray-500 mt-1">All fees collected</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Total System Funds</h3>
            <span className="text-blue-500 bg-blue-100 p-1 rounded text-xs">In Wallets</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{enhancedStats.totalSystemFunds}</p>
          <p className="text-xs text-gray-500 mt-1">User wallet balances</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Active Escrow</h3>
            <span className="text-orange-500 bg-orange-100 p-1 rounded text-xs">Secured</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{enhancedStats.activeEscrowAmount}</p>
          <p className="text-xs text-gray-500 mt-1">Funds in escrow</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
            <span className="text-green-500 bg-green-100 p-1 rounded text-xs">Active</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{enhancedStats.totalUsers}</p>
          <p className="text-xs text-gray-500 mt-1">
            {enhancedStats.clientCount} clients, {enhancedStats.freelancerCount} freelancers
          </p>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Statistics */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Project Overview</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Projects</span>
                <span className="font-semibold">{totalProjects}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Projects</span>
                <span className="font-semibold text-blue-600">{activeProjects.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Completed Projects</span>
                <span className="font-semibold text-green-600">{completedProjects.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Completion Rate</span>
                <span className="font-semibold">{completionRate}%</span>
              </div>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Revenue Breakdown</h2>
            {financialOverview && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Escrow Revenue</span>
                  <span className="font-semibold">
                    {formatCurrency(financialOverview.platformRevenue.escrowRevenue)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Transaction Fees</span>
                  <span className="font-semibold">
                    {formatCurrency(financialOverview.platformRevenue.transactionFeeRevenue)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">All Fees Collected</span>
                  <span className="font-semibold">
                    {formatCurrency(financialOverview.platformRevenue.allFeesCollected)}
                  </span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between items-center font-semibold">
                  <span>Total Platform Revenue</span>
                  <span className="text-green-600">
                    {formatCurrency(
                      financialOverview.platformRevenue.totalRevenue || financialOverview.platformRevenue.escrowRevenue
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "payments" && paymentAnalytics && (
        <div className="space-y-6">
          {/* Payment Analytics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2">Total Transactions</h3>
              <p className="text-3xl font-bold text-blue-600">{paymentAnalytics.recentTransactions?.length || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2">Platform Fees</h3>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(paymentAnalytics.platformRevenue?.totalFees || 0)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2">Escrow Revenue</h3>
              <p className="text-3xl font-bold text-purple-600">
                {formatCurrency(paymentAnalytics.escrowRevenue?.totalPlatformRevenue || 0)}
              </p>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">User</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Type</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Amount</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Fee</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Status</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paymentAnalytics.recentTransactions?.slice(0, 10).map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-50">
                      <td className="py-3">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center mr-3 text-sm font-medium">
                            {getInitials(transaction.user?.name)}
                          </div>
                          <div>
                            <div className="font-medium">{transaction.user?.name}</div>
                            <div className="text-xs text-gray-500">{transaction.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            transaction.type === "deposit"
                              ? "bg-green-100 text-green-800"
                              : transaction.type === "withdrawal"
                              ? "bg-red-100 text-red-800"
                              : transaction.type === "platform_fee"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {transaction.type}
                        </span>
                      </td>
                      <td className="py-3 text-sm font-medium">{formatCurrency(transaction.amount)}</td>
                      <td className="py-3 text-sm">{formatCurrency(transaction.fee || 0)}</td>
                      <td className="py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            transaction.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : transaction.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : transaction.status === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {transaction.status}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-gray-600">{formatDate(transaction.createdAt)}</td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-gray-500">
                        No transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">User Wallet Overview</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">User</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Role</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Balance</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Total Earned</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Total Spent</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Fees Paid</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Transactions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {userPaymentData.slice(0, 20).map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="py-3">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center mr-3 text-sm font-medium">
                          {getInitials(user.name)}
                        </div>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          user.role === "client"
                            ? "bg-blue-100 text-blue-800"
                            : user.role === "freelancer"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 text-sm font-medium">{formatCurrency(user.wallet?.balance || 0)}</td>
                    <td className="py-3 text-sm">{formatCurrency(user.wallet?.totalEarned || 0)}</td>
                    <td className="py-3 text-sm">{formatCurrency(user.wallet?.totalSpent || 0)}</td>
                    <td className="py-3 text-sm">{formatCurrency(user.totalFeesPaid || 0)}</td>
                    <td className="py-3 text-sm">{user.transactionCount || 0}</td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-gray-500">
                      No user data found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "revenue" && financialOverview && (
        <div className="space-y-6">
          {/* Revenue Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Escrow Revenue</h3>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(financialOverview.platformRevenue.escrowRevenue)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Transaction Fees</h3>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(financialOverview.platformRevenue.transactionFeeRevenue)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">All Fees</h3>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(financialOverview.platformRevenue.allFeesCollected)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h3>
              <p className="text-2xl font-bold text-indigo-600">
                {formatCurrency(
                  financialOverview.platformRevenue.escrowRevenue +
                    financialOverview.platformRevenue.transactionFeeRevenue +
                    financialOverview.platformRevenue.allFeesCollected
                )}
              </p>
            </div>
          </div>

          {/* Transaction Volume by Type */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Transaction Volume by Type</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Transaction Type</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Count</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Total Amount</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Total Fees</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {financialOverview.transactionVolumeByType?.map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-50">
                      <td className="py-3 text-sm font-medium">{transaction._id}</td>
                      <td className="py-3 text-sm">{transaction.count}</td>
                      <td className="py-3 text-sm">{formatCurrency(transaction.totalAmount)}</td>
                      <td className="py-3 text-sm">{formatCurrency(transaction.totalFees)}</td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-gray-500">
                        No transaction data found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
