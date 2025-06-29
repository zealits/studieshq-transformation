import React, { useState, useEffect } from "react";
import escrowService from "../../services/escrowService";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import AddFundsModal from "../../components/payments/AddFundsModal";

const PaymentsPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [escrowData, setEscrowData] = useState(null);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const { user } = useSelector((state) => state.auth);

  // Load real escrow and transaction data
  const loadData = async () => {
    try {
      console.log("🖥️ CLIENT PAYMENTS PAGE: Loading data for user:", user?.id);
      setLoading(true);
      const response = await escrowService.getClientEscrowData();
      console.log("🖥️ CLIENT PAYMENTS PAGE: Data loaded successfully:", response.data);
      setEscrowData(response.data);
    } catch (error) {
      console.error("🖥️ CLIENT PAYMENTS PAGE: Error loading payment data:", error);
      toast.error("❌ Failed to load payment data", {
        duration: 4000,
      });
      // Set default empty data on error
      setEscrowData({
        availableBalance: 0,
        totalSpent: 0,
        inEscrow: 0,
        platformFeesPaid: 0,
        activeProjects: 0,
        activeEscrows: [],
        recentTransactions: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Auto-refresh payment data every 30 seconds to catch updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && !loading) {
        console.log("🔄 CLIENT PAYMENTS: Auto-refreshing payment data...");
        loadData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user, loading]);

  const handleAddFundsSuccess = async (result) => {
    try {
      toast.success("💰 Funds added successfully via PayPal!", {
        duration: 4000,
        icon: "🎉",
      });
      // Reload data after adding funds
      const response = await escrowService.getClientEscrowData();
      setEscrowData(response.data);
    } catch (error) {
      console.error("Error reloading data after fund addition:", error);
      toast.error("⚠️ Funds added but failed to refresh data", {
        duration: 4000,
      });
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
    });
  };

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case "deposit":
        return "text-green-600 bg-green-100";
      case "escrow_completion":
        return "text-blue-600 bg-blue-100";
      case "refund":
        return "text-orange-600 bg-orange-100";
      case "platform_fee":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "failed":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Payments & Billing</h1>
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <span className="block text-sm text-gray-500">Available Balance</span>
            <span className="block text-xl font-bold">{formatCurrency(escrowData?.availableBalance)}</span>
          </div>
          <div className="text-right">
            <span className="block text-sm text-gray-500">In Escrow</span>
            <span className="block text-xl font-bold text-blue-600">{formatCurrency(escrowData?.inEscrow)}</span>
          </div>
          <div className="flex space-x-3">
            <button
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              onClick={() => loadData()}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "🔄 Refresh"}
            </button>
            <button className="btn-primary" onClick={() => setShowAddFundsModal(true)}>
              Add Funds
            </button>
          </div>
        </div>
      </div>

      {/* Client Spending Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Spent</h3>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(escrowData?.totalSpent)}</p>
          <p className="text-xs text-gray-500 mt-1">On completed projects</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">In Escrow</h3>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(escrowData?.inEscrow)}</p>
          <p className="text-xs text-gray-500 mt-1">Secured for active projects</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Platform Fees Paid</h3>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(escrowData?.platformFeesPaid)}</p>
          <p className="text-xs text-gray-500 mt-1">Total fees paid</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Active Projects</h3>
          <p className="text-2xl font-bold text-green-600">{escrowData?.activeProjects || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Projects in progress</p>
        </div>
      </div>

      {/* Active Escrows Section */}
      {escrowData?.activeEscrows?.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Active Escrows</h3>
          <div className="space-y-4">
            {escrowData.activeEscrows.map((escrow, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{escrow.projectTitle}</h4>
                    <p className="text-sm text-gray-500">Escrow ID: {escrow.escrowId}</p>
                    <p className="text-sm text-gray-500">Freelancer: {escrow.freelancerName}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      escrow.status === "active"
                        ? "bg-green-100 text-green-800"
                        : escrow.status === "partially_released"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {escrow.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Total Secured:</span>
                    <p className="font-medium">{formatCurrency(escrow.totalAmount)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Released:</span>
                    <p className="font-medium text-green-600">{formatCurrency(escrow.releasedAmount)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Pending:</span>
                    <p className="font-medium text-blue-600">{formatCurrency(escrow.pendingAmount)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`pb-2 px-4 font-medium ${
            activeTab === "overview" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("overview")}
        >
          Transaction History
        </button>
        <button
          className={`pb-2 px-4 font-medium ${
            activeTab === "billing" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("billing")}
        >
          Billing Information
        </button>
        <button
          className={`pb-2 px-4 font-medium ${
            activeTab === "invoices" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("invoices")}
        >
          Invoices & Receipts
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === "overview" && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
            {escrowData?.recentTransactions?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Description</th>
                      <th className="text-left py-3 px-4">Type</th>
                      <th className="text-left py-3 px-4">Amount</th>
                      <th className="text-left py-3 px-4">Fee</th>
                      <th className="text-left py-3 px-4">Net Amount</th>
                      <th className="text-left py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {escrowData.recentTransactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm">{formatDate(transaction.date)}</td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-sm">{transaction.description}</p>
                            {transaction.projectTitle && (
                              <p className="text-xs text-gray-500">Project: {transaction.projectTitle}</p>
                            )}
                            {transaction.relatedUser && (
                              <p className="text-xs text-gray-500">Freelancer: {transaction.relatedUser}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(
                              transaction.type
                            )}`}
                          >
                            {transaction.type.replace("_", " ").toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium">{formatCurrency(transaction.amount)}</td>
                        <td className="py-3 px-4 text-red-600">{formatCurrency(transaction.fee)}</td>
                        <td className="py-3 px-4 font-medium">{formatCurrency(transaction.netAmount)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              transaction.status
                            )}`}
                          >
                            {transaction.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No transactions found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "billing" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Billing Information</h3>
          <div className="text-center py-8">
            <p className="text-gray-500">Billing information management coming soon</p>
          </div>
        </div>
      )}

      {activeTab === "invoices" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Invoices & Receipts</h3>
          <div className="text-center py-8">
            <p className="text-gray-500">Invoice and receipt management coming soon</p>
          </div>
        </div>
      )}

      {/* Add Funds Modal with PayPal Integration */}
      <AddFundsModal
        isOpen={showAddFundsModal}
        onClose={() => setShowAddFundsModal(false)}
        onSuccess={handleAddFundsSuccess}
      />
    </div>
  );
};

export default PaymentsPage;
