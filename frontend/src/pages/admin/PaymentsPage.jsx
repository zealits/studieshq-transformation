import React, { useState, useEffect } from "react";
import adminService from "../../services/adminService";
import escrowService from "../../services/escrowService";
import { toast } from "react-hot-toast";

const PaymentsPage = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [escrowData, setEscrowData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEscrow, setSelectedEscrow] = useState(null);
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);

  // Load real data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [dashboardData, revenueData, allEscrowData] = await Promise.all([
          adminService.getDashboardStats(),
          escrowService.getPlatformRevenue(),
          escrowService.getAllEscrowData({ status: activeTab !== "all" ? activeTab : undefined }),
        ]);

        setStats(dashboardData.data);
        setRevenueData(revenueData.data);
        setEscrowData(allEscrowData.data);
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
        status: activeTab !== "all" ? activeTab : undefined,
      });
      setEscrowData(allEscrowData.data);
    } catch (error) {
      toast.error("Failed to release milestone payment");
    }
  };

  // Calculate display values from real data
  const getDisplayStats = () => {
    if (!stats || !revenueData || !escrowData) {
      return {
        totalProcessed: "$0.00",
        platformFees: "$0.00",
        pendingPayouts: "$0.00",
        monthlyRevenue: "$0.00",
        escrowTotal: "$0.00",
        totalRevenue: "$0.00",
      };
    }

    const escrowRevenue = revenueData.escrowRevenue || {};
    const feeTransactions = revenueData.feeTransactions || {};
    const escrowStats = escrowData.statistics || {};

    const totalEscrowAmount = Object.values(escrowStats).reduce((sum, stat) => sum + (stat.totalAmount || 0), 0);
    const totalEscrowRevenue = Object.values(escrowStats).reduce((sum, stat) => sum + (stat.totalRevenue || 0), 0);
    const pendingAmount = escrowStats.active?.totalAmount || 0;

    return {
      totalProcessed: `$${totalEscrowAmount.toLocaleString()}`,
      platformFees: `$${(feeTransactions.totalFees || 0).toLocaleString()}`,
      pendingPayouts: `$${pendingAmount.toLocaleString()}`,
      monthlyRevenue: `$${(escrowRevenue.totalRevenue || 0).toLocaleString()}`,
      escrowTotal: `$${totalEscrowAmount.toLocaleString()}`,
      totalRevenue: `$${(
        (escrowRevenue.totalRevenue || 0) +
        (feeTransactions.totalFees || 0) +
        totalEscrowRevenue
      ).toLocaleString()}`,
    };
  };

  const displayStats = getDisplayStats();

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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Processed</h3>
            <span className="text-green-500 bg-green-100 p-1 rounded text-xs">Active</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{displayStats.totalProcessed}</p>
          <p className="text-xs text-gray-500 mt-1">All escrow transactions</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Escrow Holdings</h3>
            <span className="text-blue-500 bg-blue-100 p-1 rounded text-xs">Secured</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{displayStats.escrowTotal}</p>
          <p className="text-xs text-gray-500 mt-1">Total funds in escrow</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Platform Revenue</h3>
            <span className="text-green-500 bg-green-100 p-1 rounded text-xs">Earned</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{displayStats.totalRevenue}</p>
          <p className="text-xs text-gray-500 mt-1">Total platform fees collected</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b mb-6">
        {["all", "active", "partially_released", "completed", "disputed"].map((status) => (
          <button
            key={status}
            className={`pb-2 px-4 font-medium ${
              activeTab === status ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab(status)}
          >
            {status === "all" ? "All Escrows" : status.replace("_", " ").toUpperCase()}
          </button>
        ))}
      </div>

      {/* Escrow Transactions Table */}
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
                <option value="quarter">This Quarter</option>
              </select>
            </div>
          </div>

          {escrowData?.escrows?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Escrow ID</th>
                    <th className="text-left py-3 px-4">Project</th>
                    <th className="text-left py-3 px-4">Client</th>
                    <th className="text-left py-3 px-4">Freelancer</th>
                    <th className="text-left py-3 px-4">Total Amount</th>
                    <th className="text-left py-3 px-4">Released</th>
                    <th className="text-left py-3 px-4">Platform Revenue</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {escrowData.escrows.map((escrow) => (
                    <tr key={escrow.escrowId} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium">{escrow.escrowId}</td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-sm">{escrow.project?.title}</p>
                          <p className="text-xs text-gray-500">
                            {escrow.completedMilestones}/{escrow.milestonesCount} milestones
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-sm">{escrow.client?.name}</p>
                          <p className="text-xs text-gray-500">{escrow.client?.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-sm">{escrow.freelancer?.name}</p>
                          <p className="text-xs text-gray-500">{escrow.freelancer?.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium">{formatCurrency(escrow.totalAmount)}</td>
                      <td className="py-3 px-4 text-green-600 font-medium">{formatCurrency(escrow.releasedAmount)}</td>
                      <td className="py-3 px-4 text-blue-600 font-medium">{formatCurrency(escrow.platformRevenue)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(escrow.status)}`}>
                          {escrow.status.replace("_", " ").toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedEscrow(escrow)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            View Details
                          </button>
                          {escrow.status === "active" || escrow.status === "partially_released" ? (
                            <button
                              onClick={() => {
                                setSelectedEscrow(escrow);
                                setReleaseModalOpen(true);
                              }}
                              className="text-green-600 hover:text-green-800 text-sm"
                            >
                              Release Payment
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No escrow transactions found</p>
            </div>
          )}

          {/* Pagination */}
          {escrowData?.pagination && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-500">
                Showing {escrowData.escrows.length} of {escrowData.pagination.totalCount} transactions
              </div>
              <div className="flex space-x-2">
                <button
                  disabled={!escrowData.pagination.hasPrev}
                  className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1">
                  Page {escrowData.pagination.currentPage} of {escrowData.pagination.totalPages}
                </span>
                <button
                  disabled={!escrowData.pagination.hasNext}
                  className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Release Payment Modal */}
      {releaseModalOpen && selectedEscrow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Release Milestone Payment</h3>
            <div className="mb-4">
              <h4 className="font-medium">Project: {selectedEscrow.project?.title}</h4>
              <p className="text-sm text-gray-500">Escrow ID: {selectedEscrow.escrowId}</p>
              <p className="text-sm text-gray-500">
                Client: {selectedEscrow.client?.name} | Freelancer: {selectedEscrow.freelancer?.name}
              </p>
            </div>
            <div className="mb-6">
              <h5 className="font-medium mb-2">Pending Milestones:</h5>
              <div className="text-center py-4">
                <p className="text-gray-500">Milestone selection interface would be implemented here</p>
                <p className="text-sm text-gray-400">This requires integration with project milestone data</p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setReleaseModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReleaseMilestone(selectedEscrow.project._id, "milestone-id")}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Release Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Escrow Details Modal */}
      {selectedEscrow && !releaseModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Escrow Details</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h4 className="font-medium text-gray-700">Escrow Information</h4>
                <p className="text-sm">ID: {selectedEscrow.escrowId}</p>
                <p className="text-sm">
                  Status:{" "}
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(selectedEscrow.status)}`}>
                    {selectedEscrow.status.replace("_", " ").toUpperCase()}
                  </span>
                </p>
                <p className="text-sm">Created: {formatDate(selectedEscrow.createdAt)}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700">Financial Details</h4>
                <p className="text-sm">Total Amount: {formatCurrency(selectedEscrow.totalAmount)}</p>
                <p className="text-sm">Released: {formatCurrency(selectedEscrow.releasedAmount)}</p>
                <p className="text-sm">Remaining: {formatCurrency(selectedEscrow.remainingAmount)}</p>
                <p className="text-sm">Platform Revenue: {formatCurrency(selectedEscrow.platformRevenue)}</p>
              </div>
            </div>
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Project Details</h4>
              <p className="text-sm">Title: {selectedEscrow.project?.title}</p>
              <p className="text-sm">
                Client: {selectedEscrow.client?.name} ({selectedEscrow.client?.email})
              </p>
              <p className="text-sm">
                Freelancer: {selectedEscrow.freelancer?.name} ({selectedEscrow.freelancer?.email})
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedEscrow(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
