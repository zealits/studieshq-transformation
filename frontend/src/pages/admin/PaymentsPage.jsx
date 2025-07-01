import React, { useState, useEffect } from "react";
import adminService from "../../services/adminService";
import escrowService from "../../services/escrowService";
import { toast } from "react-hot-toast";

const PaymentsPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("all");
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [escrowData, setEscrowData] = useState(null);
  const [paymentAnalytics, setPaymentAnalytics] = useState(null);
  const [financialOverview, setFinancialOverview] = useState(null);
  const [userPaymentData, setUserPaymentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEscrow, setSelectedEscrow] = useState(null);
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailsModalOpen, setUserDetailsModalOpen] = useState(false);
  const [userDetails, setUserDetails] = useState(null);

  // Load real data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [dashboardData, revenueData, allEscrowData, analyticsData, financialData] = await Promise.all([
          adminService.getDashboardStats(),
          escrowService.getPlatformRevenue(),
          escrowService.getAllEscrowData({
            status: activeTab !== "all" && activeTab !== "overview" ? activeTab : undefined,
          }),
          adminService.getPaymentAnalytics(),
          adminService.getPlatformFinancialOverview(),
        ]);

        setStats(dashboardData.data);
        setRevenueData(revenueData.data);
        setEscrowData(allEscrowData.data);
        setPaymentAnalytics(analyticsData.data);
        setFinancialOverview(financialData.data);
        setUserPaymentData(analyticsData.data.usersWithWallets || []);
      } catch (error) {
        console.error("Error loading admin payment data:", error);
        toast.error("Failed to load payment data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [dateRange, activeTab]);

  const handleReleaseMilestone = async (projectId, milestoneId) => {
    try {
      await escrowService.releaseMilestonePayment(projectId, milestoneId);
      toast.success("Milestone payment released successfully");
      setReleaseModalOpen(false);
      // Reload data
      const allEscrowData = await escrowService.getAllEscrowData({
        status: activeTab !== "all" && activeTab !== "overview" ? activeTab : undefined,
      });
      setEscrowData(allEscrowData.data);
    } catch (error) {
      toast.error("Failed to release milestone payment");
    }
  };

  const handleUserClick = async (userId) => {
    try {
      setLoading(true);
      const userDetailsData = await adminService.getUserPaymentDetails(userId);
      setUserDetails(userDetailsData.data);
      setUserDetailsModalOpen(true);
    } catch (error) {
      console.error("Error loading user details:", error);
      toast.error("Failed to load user details");
    } finally {
      setLoading(false);
    }
  };

  // Utility functions - defined before use
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "partially_released":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "disputed":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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

  // Calculate display values from real data
  const getDisplayStats = () => {
    if (!stats || !revenueData || !escrowData || !financialOverview) {
      return {
        totalProcessed: "$0.00 USD",
        platformFees: "$0.00 USD",
        pendingPayouts: "$0.00 USD",
        monthlyRevenue: "$0.00 USD",
        escrowTotal: "$0.00 USD",
        totalRevenue: "$0.00 USD",
        totalSystemFunds: "$0.00 USD",
        activeEscrowAmount: "$0.00 USD",
      };
    }

    const escrowRevenue = revenueData.escrowRevenue || {};
    const feeTransactions = revenueData.feeTransactions || {};
    const escrowStats = escrowData.statistics || {};

    const totalEscrowAmount = Object.values(escrowStats).reduce((sum, stat) => sum + (stat.totalAmount || 0), 0);
    const totalEscrowRevenue = Object.values(escrowStats).reduce((sum, stat) => sum + (stat.totalRevenue || 0), 0);
    const pendingAmount = escrowStats.active?.totalAmount || 0;

    return {
      totalProcessed: `$${totalEscrowAmount.toLocaleString()} USD`,
      platformFees: `$${(feeTransactions.totalFees || 0).toLocaleString()} USD`,
      pendingPayouts: `$${pendingAmount.toLocaleString()} USD`,
      monthlyRevenue: `$${(escrowRevenue.totalRevenue || 0).toLocaleString()} USD`,
      escrowTotal: `$${totalEscrowAmount.toLocaleString()} USD`,
      totalRevenue: formatCurrency(
        financialOverview.platformRevenue.totalRevenue || financialOverview.platformRevenue.escrowRevenue
      ),
      totalSystemFunds: `$${(financialOverview.systemFunds?.totalBalance || 0).toLocaleString()} USD`,
      activeEscrowAmount: `$${(financialOverview.activeEscrow?.totalAmount || 0).toLocaleString()} USD`,
    };
  };

  const displayStats = getDisplayStats();

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading payment data...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Payment Management</h1>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Platform Revenue</h3>
            <span className="text-green-500 bg-green-100 p-1 rounded text-xs">Earned</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{displayStats.totalRevenue}</p>
          <p className="text-xs text-gray-500 mt-1">All fees collected</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Total System Funds</h3>
            <span className="text-blue-500 bg-blue-100 p-1 rounded text-xs">In Wallets</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{displayStats.totalSystemFunds}</p>
          <p className="text-xs text-gray-500 mt-1">User wallet balances</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Active Escrow</h3>
            <span className="text-orange-500 bg-orange-100 p-1 rounded text-xs">Secured</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{displayStats.activeEscrowAmount}</p>
          <p className="text-xs text-gray-500 mt-1">Funds in escrow</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Processed</h3>
            <span className="text-purple-500 bg-purple-100 p-1 rounded text-xs">Lifetime</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{displayStats.totalProcessed}</p>
          <p className="text-xs text-gray-500 mt-1">All transactions</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b mb-6">
        {[
          { id: "overview", label: "Overview" },
          { id: "users", label: "User Wallets" },
          { id: "transactions", label: "Transactions" },
          { id: "escrows", label: "Escrows" },
          { id: "revenue", label: "Revenue Analysis" },
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

      {/* Tab Content */}
      {activeTab === "overview" && financialOverview && (
        <div className="space-y-6">
          {/* Revenue Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Revenue Sources</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Escrow Revenue</span>
                  <span className="font-semibold">
                    {formatCurrency(financialOverview.platformRevenue.escrowRevenue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction Fees</span>
                  <span className="font-semibold">
                    {formatCurrency(financialOverview.platformRevenue.transactionFeeRevenue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">All Fees</span>
                  <span className="font-semibold">
                    {formatCurrency(financialOverview.platformRevenue.allFeesCollected)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">System Funds</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Balance</span>
                  <span className="font-semibold">{formatCurrency(financialOverview.systemFunds.totalBalance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Earned</span>
                  <span className="font-semibold">{formatCurrency(financialOverview.systemFunds.totalEarned)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Withdrawn</span>
                  <span className="font-semibold">{formatCurrency(financialOverview.systemFunds.totalWithdrawn)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Escrow Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Amount</span>
                  <span className="font-semibold">{formatCurrency(financialOverview.activeEscrow.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Remaining</span>
                  <span className="font-semibold">
                    {formatCurrency(financialOverview.activeEscrow.remainingAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Count</span>
                  <span className="font-semibold">{financialOverview.activeEscrow.count}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Volume Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Transaction Volume by Type</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Type</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Count</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Total Amount</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Total Fees</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {financialOverview.transactionVolumeByType?.map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-50">
                      <td className="py-3 text-sm font-medium capitalize">{transaction._id.replace("_", " ")}</td>
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

      {activeTab === "users" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">User Financial Overview</h3>
            <div className="flex items-center space-x-2">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
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
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {userPaymentData.slice(0, 50).map((user) => (
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
                    <td className="py-3 text-sm">
                      <button
                        onClick={() => handleUserClick(user._id)}
                        className="text-primary hover:text-primary-dark text-sm font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-gray-500">
                      No user data found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "transactions" && paymentAnalytics && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Recent Transactions</h3>
            <div className="flex items-center space-x-2">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
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
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paymentAnalytics.recentTransactions?.slice(0, 30).map((transaction) => (
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
                            : transaction.type === "milestone"
                            ? "bg-blue-100 text-blue-800"
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
                    <td className="py-3 text-sm text-gray-600 max-w-xs truncate">{transaction.description || "N/A"}</td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Existing Escrow Transactions Table for escrows tab */}
      {activeTab === "escrows" && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Escrow Transactions</h3>
              <div className="flex items-center space-x-2">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                      Escrow ID
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                      Project
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                      Client
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                      Freelancer
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                      Amount
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                      Platform Fee
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                      Status
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                      Created
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {escrowData?.escrows?.slice(0, 20).map((escrow) => (
                    <tr key={escrow._id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {escrow.escrowId}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {escrow.project?.title || "N/A"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {escrow.client?.name || "N/A"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {escrow.freelancer?.name || "N/A"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(escrow.totalAmount)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(escrow.platformRevenue)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            escrow.status
                          )}`}
                        >
                          {escrow.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(escrow.createdAt)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-primary hover:text-primary-dark">View</button>
                      </td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                        No escrow data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {userDetailsModalOpen && userDetails && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">User Payment Details</h3>
              <button onClick={() => setUserDetailsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* User Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">User Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium">{userDetails.user.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{userDetails.user.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Role:</span>
                    <span className="ml-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          userDetails.user.role === "client"
                            ? "bg-blue-100 text-blue-800"
                            : userDetails.user.role === "freelancer"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {userDetails.user.role}
                      </span>
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Joined:</span>
                    <span className="ml-2 font-medium">{formatDate(userDetails.user.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Wallet Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Wallet Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">Balance:</span>
                    <span className="ml-2 font-medium">{formatCurrency(userDetails.wallet.balance)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Earned:</span>
                    <span className="ml-2 font-medium">{formatCurrency(userDetails.wallet.totalEarned)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Spent:</span>
                    <span className="ml-2 font-medium">{formatCurrency(userDetails.wallet.totalSpent)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Withdrawn:</span>
                    <span className="ml-2 font-medium">{formatCurrency(userDetails.wallet.totalWithdrawn)}</span>
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div>
                <h4 className="font-semibold mb-2">Recent Transactions</h4>
                <div className="overflow-x-auto max-h-64">
                  <table className="min-w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">Type</th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">Amount</th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">Status</th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {userDetails.transactions?.slice(0, 10).map((transaction) => (
                        <tr key={transaction._id} className="text-sm">
                          <td className="py-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                transaction.type === "deposit"
                                  ? "bg-green-100 text-green-800"
                                  : transaction.type === "withdrawal"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {transaction.type}
                            </span>
                          </td>
                          <td className="py-2 font-medium">{formatCurrency(transaction.amount)}</td>
                          <td className="py-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                transaction.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : transaction.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {transaction.status}
                            </span>
                          </td>
                          <td className="py-2 text-gray-600">{formatDate(transaction.createdAt)}</td>
                        </tr>
                      )) || (
                        <tr>
                          <td colSpan="4" className="py-4 text-center text-gray-500">
                            No transactions found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
