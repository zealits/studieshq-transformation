import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getWalletInfo, getTransactions } from "../../redux/slices/paymentSlice";
import AddFundsModal from "../../components/payments/AddFundsModal";

const PaymentsPage = () => {
  const [activeTab, setActiveTab] = useState("transactions");
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);

  const dispatch = useDispatch();
  const { wallet, transactions, loading } = useSelector((state) => state.payment);

  useEffect(() => {
    dispatch(getWalletInfo());
    dispatch(getTransactions());
  }, [dispatch]);

  // Format transaction data for display
  const formatTransactionType = (type) => {
    const typeMap = {
      deposit: "Deposit",
      withdrawal: "Withdrawal",
      payment: "Payment",
      milestone: "Milestone Payment",
      platform_fee: "Platform Fee",
      refund: "Refund",
    };
    return typeMap[type] || type;
  };

  const formatTransactionDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Mock data for invoices
  const invoices = [
    {
      id: "INV-2023-056",
      date: "May 1, 2023",
      dueDate: "May 15, 2023",
      amount: "$1,500.00",
      freelancer: "Alex Johnson",
      project: "Corporate Website Redesign",
      status: "Pending",
      milestone: "Design Implementation",
    },
    {
      id: "INV-2023-045",
      date: "April 15, 2023",
      dueDate: "April 30, 2023",
      amount: "$800.00",
      freelancer: "Emily Carter",
      project: "Brand Identity Design",
      status: "Paid",
      milestone: "Project Completion",
    },
    {
      id: "INV-2023-032",
      date: "March 20, 2023",
      dueDate: "April 4, 2023",
      amount: "$1,200.00",
      freelancer: "Daniel Rodriguez",
      project: "SEO Optimization",
      status: "Paid",
      milestone: "Project Completion",
    },
  ];

  // Mock data for payment methods
  const paymentMethods = [
    {
      id: 1,
      type: "Credit Card",
      name: "Visa",
      details: "XXXX-XXXX-XXXX-4321",
      isDefault: true,
      icon: "card",
    },
    {
      id: 2,
      type: "PayPal",
      name: "client@example.com",
      details: "Connected on Jan 15, 2023",
      isDefault: false,
      icon: "paypal",
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Payments</h1>
        <div className="flex items-center">
          <div className="mr-4">
            <span className="block text-sm text-gray-500">Account Balance</span>
            <span className="block text-xl font-bold">
              {loading ? "Loading..." : `$${wallet?.balance?.toFixed(2) || "0.00"}`}
            </span>
          </div>
          <button className="btn-primary" onClick={() => setShowAddFundsModal(true)}>
            Add Funds
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`pb-2 px-4 font-medium ${
            activeTab === "transactions"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("transactions")}
        >
          Transactions
        </button>
        <button
          className={`pb-2 px-4 font-medium ${
            activeTab === "invoices" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("invoices")}
        >
          Invoices
        </button>
        <button
          className={`pb-2 px-4 font-medium ${
            activeTab === "payment-methods"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("payment-methods")}
        >
          Payment Methods
        </button>
      </div>

      {/* Transactions Tab */}
      {activeTab === "transactions" && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
                  Description
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
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Type
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions && Array.isArray(transactions) && transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <tr key={transaction._id || transaction.transactionId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTransactionDate(transaction.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>{transaction.description}</div>
                      {transaction.relatedUser && (
                        <div className="text-xs text-gray-400">User: {transaction.relatedUser.name}</div>
                      )}
                      {transaction.project && (
                        <div className="text-xs text-gray-400">Project: {transaction.project.title}</div>
                      )}
                      {transaction.transactionId && (
                        <div className="text-xs text-gray-400">Ref: {transaction.transactionId}</div>
                      )}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        transaction.type === "payment" || transaction.type === "withdrawal"
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {transaction.type === "payment" || transaction.type === "withdrawal" ? "-" : "+"}$
                      {transaction.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : transaction.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : transaction.status === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTransactionType(transaction.type)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No transactions found. Add funds to see transaction history.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === "invoices" && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Invoice ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Freelancer & Project
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date / Due Date
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
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="font-medium">{invoice.freelancer}</div>
                    <div className="text-xs text-gray-400">{invoice.project}</div>
                    <div className="text-xs text-gray-400">Milestone: {invoice.milestone}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div>Issued: {invoice.date}</div>
                    <div>Due: {invoice.dueDate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        invoice.status === "Paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-primary hover:text-primary-dark mr-3">View</button>
                    <button className="text-gray-600 hover:text-gray-900">Download</button>
                    {invoice.status === "Pending" && (
                      <button className="ml-3 text-primary hover:text-primary-dark">Pay Now</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Methods Tab */}
      {activeTab === "payment-methods" && (
        <div>
          <div className="flex justify-end mb-4">
            <button className="btn-primary">Add Payment Method</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paymentMethods.map((method) => (
              <div key={method.id} className="bg-white rounded-lg shadow p-6 flex">
                <div className="mr-4">
                  {method.icon === "card" ? (
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-500">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        ></path>
                      </svg>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-500">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                        ></path>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h3 className="font-medium text-gray-900">{method.type}</h3>
                    {method.isDefault && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Default</span>
                    )}
                  </div>
                  <p className="text-gray-600 mt-1">{method.name}</p>
                  <p className="text-gray-500 text-sm mt-1">{method.details}</p>
                  <div className="mt-4 flex space-x-3 text-sm">
                    {!method.isDefault && (
                      <button className="text-primary hover:text-primary-dark">Set as Default</button>
                    )}
                    <button className="text-gray-600 hover:text-gray-900">Edit</button>
                    <button className="text-red-600 hover:text-red-800">Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Funds Modal */}
      <AddFundsModal
        isOpen={showAddFundsModal}
        onClose={() => setShowAddFundsModal(false)}
        onSuccess={(result) => {
          // Refresh wallet and transactions data
          dispatch(getWalletInfo());
          dispatch(getTransactions());
        }}
      />
    </div>
  );
};

export default PaymentsPage;
