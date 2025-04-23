import React, { useState } from "react";

const PaymentsPage = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  // Mock data for transactions
  const transactions = [
    {
      id: "TRX-1001",
      date: "Jun 15, 2023",
      client: "TechSolutions Inc.",
      freelancer: "Alex Johnson",
      amount: "$4,500.00",
      type: "Project Payment",
      status: "Completed",
      project: "Corporate Website Redesign",
    },
    {
      id: "TRX-1002",
      date: "Jun 10, 2023",
      client: "Global Health",
      freelancer: "Sarah Williams",
      amount: "$1,200.00",
      type: "Milestone Payment",
      status: "Completed",
      project: "Marketing Campaign",
    },
    {
      id: "TRX-1003",
      date: "Jun 05, 2023",
      client: "Startup Ventures",
      freelancer: "Michael Chen",
      amount: "$3,000.00",
      type: "Project Payment",
      status: "Processing",
      project: "Mobile App Development",
    },
    {
      id: "TRX-1004",
      date: "May 28, 2023",
      client: "Innovate LLC",
      freelancer: "Emily Carter",
      amount: "$1,800.00",
      type: "Project Payment",
      status: "Completed",
      project: "Brand Identity Design",
    },
    {
      id: "TRX-1005",
      date: "May 20, 2023",
      freelancer: "James Wilson",
      amount: "$150.00",
      type: "Withdrawal",
      status: "Completed",
      project: "-",
    },
    {
      id: "TRX-1006",
      date: "May 18, 2023",
      client: "Fashion Retail Ltd.",
      amount: "$500.00",
      type: "Platform Fee",
      status: "Completed",
      project: "E-commerce Platform Integration",
    },
    {
      id: "TRX-1007",
      date: "May 15, 2023",
      client: "Media Publishing",
      freelancer: "Jennifer Lopez",
      amount: "$1,500.00",
      type: "Disputed Payment",
      status: "On Hold",
      project: "Content Management System",
    },
  ];

  // Filter transactions based on active tab
  const filteredTransactions = transactions.filter((transaction) => {
    if (activeTab === "all") return true;
    if (activeTab === "completed") return transaction.status === "Completed";
    if (activeTab === "processing") return transaction.status === "Processing";
    if (activeTab === "disputed") return transaction.status === "On Hold";
    return true;
  });

  // Platform statistics
  const stats = {
    totalProcessed: "$12,650.00",
    platformFees: "$1,265.00",
    pendingPayouts: "$4,500.00",
    monthlyRevenue: "$3,800.00",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Payment Management</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Processed</h3>
            <span className="text-green-500 bg-green-100 p-1 rounded text-xs">+12.5%</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.totalProcessed}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Platform Fees</h3>
            <span className="text-green-500 bg-green-100 p-1 rounded text-xs">+8.2%</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.platformFees}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Pending Payouts</h3>
            <span className="text-yellow-500 bg-yellow-100 p-1 rounded text-xs">+3.1%</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.pendingPayouts}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Monthly Revenue</h3>
            <span className="text-green-500 bg-green-100 p-1 rounded text-xs">+15.3%</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.monthlyRevenue}</p>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
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
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
            </div>

            <div>
              <label htmlFor="transactionType" className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Type
              </label>
              <select
                id="transactionType"
                className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Types</option>
                <option value="payment">Project Payment</option>
                <option value="milestone">Milestone Payment</option>
                <option value="fee">Platform Fee</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="refund">Refund</option>
              </select>
            </div>
          </div>

          <div>
            <button className="btn-primary">Export Report</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`pb-2 px-4 font-medium ${
            activeTab === "all" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("all")}
        >
          All Transactions
        </button>
        <button
          className={`pb-2 px-4 font-medium ${
            activeTab === "completed" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("completed")}
        >
          Completed
        </button>
        <button
          className={`pb-2 px-4 font-medium ${
            activeTab === "processing" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("processing")}
        >
          Processing
        </button>
        <button
          className={`pb-2 px-4 font-medium ${
            activeTab === "disputed" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("disputed")}
        >
          Disputed
        </button>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Transaction ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Client
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Freelancer
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Amount
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
                  Status
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
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.client || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.freelancer || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {transaction.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        transaction.type === "Project Payment"
                          ? "bg-blue-100 text-blue-800"
                          : transaction.type === "Milestone Payment"
                          ? "bg-green-100 text-green-800"
                          : transaction.type === "Platform Fee"
                          ? "bg-purple-100 text-purple-800"
                          : transaction.type === "Withdrawal"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        transaction.status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : transaction.status === "Processing"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {transaction.status}
                    </span>
                  </td>
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
                      {transaction.status === "Processing" || transaction.status === "On Hold" ? (
                        <button className="text-green-600 hover:text-green-800">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      ) : null}
                      {transaction.status === "On Hold" && (
                        <button className="text-red-600 hover:text-red-800">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
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
          Showing <span className="font-medium">1</span> to{" "}
          <span className="font-medium">{filteredTransactions.length}</span> of{" "}
          <span className="font-medium">{filteredTransactions.length}</span> results
        </div>
        <nav className="flex space-x-1" aria-label="Pagination">
          <button className="relative inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
            Previous
          </button>
          <button className="relative inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-primary text-sm font-medium text-white">
            1
          </button>
          <button className="relative inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
            Next
          </button>
        </nav>
      </div>
    </div>
  );
};

export default PaymentsPage;
