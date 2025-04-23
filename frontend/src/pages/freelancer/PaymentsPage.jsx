import React, { useState } from "react";

const PaymentsPage = () => {
  const [activeTab, setActiveTab] = useState("transactions");

  const transactions = [
    {
      id: 1,
      date: "May 2, 2023",
      amount: "$1,450.00",
      type: "Payment",
      description: "Project milestone: E-commerce Website Redesign",
      status: "Completed",
      client: "RetailSolutions Ltd.",
    },
    {
      id: 2,
      date: "April 28, 2023",
      amount: "$800.00",
      type: "Payment",
      description: "Project completion: Logo and Brand Identity",
      status: "Completed",
      client: "StartUp Ventures",
    },
    {
      id: 3,
      date: "April 15, 2023",
      amount: "$75.00",
      type: "Withdrawal",
      description: "Withdrawal to Bank Account",
      status: "Processed",
      reference: "WD78945612",
    },
    {
      id: 4,
      date: "April 10, 2023",
      amount: "$1,200.00",
      type: "Payment",
      description: "Project milestone: Mobile App Development",
      status: "Completed",
      client: "HealthTech Innovations",
    },
    {
      id: 5,
      date: "March 28, 2023",
      amount: "$2,000.00",
      type: "Withdrawal",
      description: "Withdrawal to PayPal",
      status: "Processed",
      reference: "WD78941234",
    },
  ];

  const invoices = [
    {
      id: "INV-2023-056",
      date: "May 1, 2023",
      dueDate: "May 15, 2023",
      amount: "$1,200.00",
      client: "HealthTech Innovations",
      project: "Mobile App Development",
      status: "Pending",
    },
    {
      id: "INV-2023-045",
      date: "April 15, 2023",
      dueDate: "April 30, 2023",
      amount: "$800.00",
      client: "StartUp Ventures",
      project: "Logo and Brand Identity",
      status: "Paid",
    },
    {
      id: "INV-2023-032",
      date: "March 20, 2023",
      dueDate: "April 4, 2023",
      amount: "$1,450.00",
      client: "RetailSolutions Ltd.",
      project: "E-commerce Website Redesign",
      status: "Paid",
    },
  ];

  const paymentMethods = [
    {
      id: 1,
      type: "Bank Account",
      name: "Chase Bank",
      details: "XXXX-XXXX-XXXX-4321",
      isDefault: true,
      icon: "bank",
    },
    {
      id: 2,
      type: "PayPal",
      name: "johndoe@email.com",
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
            <span className="block text-sm text-gray-500">Available Balance</span>
            <span className="block text-xl font-bold">$3,245.00</span>
          </div>
          <button className="btn-primary">Withdraw Funds</button>
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
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.date}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div>{transaction.description}</div>
                    {transaction.client && <div className="text-xs text-gray-400">{transaction.client}</div>}
                    {transaction.reference && <div className="text-xs text-gray-400">Ref: {transaction.reference}</div>}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      transaction.type === "Payment" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {transaction.type === "Payment" ? "+" : "-"}
                    {transaction.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.status === "Completed" || transaction.status === "Processed"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === "invoices" && (
        <div>
          <div className="flex justify-end mb-4">
            <button className="btn-primary">Create Invoice</button>
          </div>
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
                    Client & Project
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
                      <div className="font-medium">{invoice.client}</div>
                      <div className="text-xs text-gray-400">{invoice.project}</div>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                  {method.icon === "bank" ? (
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
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
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
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
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
    </div>
  );
};

export default PaymentsPage;
