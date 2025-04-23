import React, { useState } from "react";

const SupportPage = () => {
  const [activeTab, setActiveTab] = useState("open");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState("");

  // Mock support tickets data
  const tickets = {
    open: [
      {
        id: 1,
        subject: "Payment not received for completed project",
        user: {
          name: "Alex Johnson",
          email: "alex.johnson@example.com",
          role: "freelancer",
          avatar: "AJ",
        },
        category: "Payment",
        priority: "high",
        status: "open",
        createdAt: "2 hours ago",
        lastUpdated: "2 hours ago",
        messages: [
          {
            sender: "user",
            content:
              "I completed a project for TechSolutions Inc. two weeks ago, and the payment is still pending. The client has confirmed that they released the payment, but I haven't received it in my account. Can you help resolve this issue?",
            timestamp: "2 hours ago",
          },
        ],
      },
      {
        id: 2,
        subject: "Unable to upload portfolio images",
        user: {
          name: "Emily Carter",
          email: "emily.carter@example.com",
          role: "freelancer",
          avatar: "EC",
        },
        category: "Technical",
        priority: "medium",
        status: "open",
        createdAt: "5 hours ago",
        lastUpdated: "3 hours ago",
        messages: [
          {
            sender: "user",
            content:
              "I'm trying to upload images to my portfolio, but I keep getting an error message saying 'File upload failed'. I've tried different file formats (JPG, PNG) and sizes, but the issue persists.",
            timestamp: "5 hours ago",
          },
          {
            sender: "support",
            content:
              "Thank you for reporting this issue. Could you please provide more details about the error message? Also, what browser and device are you using?",
            timestamp: "4 hours ago",
          },
          {
            sender: "user",
            content:
              "I'm using Chrome on a Windows laptop. The full error message is 'File upload failed: Server responded with 500 error'. I've attached a screenshot of the error.",
            timestamp: "3 hours ago",
          },
        ],
      },
      {
        id: 3,
        subject: "Request to delete my account",
        user: {
          name: "Michael Chen",
          email: "michael.chen@example.com",
          role: "client",
          avatar: "MC",
        },
        category: "Account",
        priority: "low",
        status: "open",
        createdAt: "1 day ago",
        lastUpdated: "6 hours ago",
        messages: [
          {
            sender: "user",
            content:
              "I would like to delete my account from your platform. I've completed all my projects and have no ongoing contracts. Please guide me on how to proceed with account deletion.",
            timestamp: "1 day ago",
          },
          {
            sender: "support",
            content:
              "Hello Michael, we're sorry to see you go. Before we process your account deletion, could you please confirm if you have any pending payments or active contracts on your account?",
            timestamp: "18 hours ago",
          },
          {
            sender: "user",
            content:
              "I've checked and there are no pending payments or active contracts. All my projects have been completed and all payments have been processed.",
            timestamp: "6 hours ago",
          },
        ],
      },
    ],
    inProgress: [
      {
        id: 4,
        subject: "Dispute with freelancer over project deliverables",
        user: {
          name: "TechSolutions Inc.",
          email: "contact@techsolutions.com",
          role: "client",
          avatar: "TS",
        },
        category: "Dispute",
        priority: "high",
        status: "in-progress",
        createdAt: "2 days ago",
        lastUpdated: "4 hours ago",
        messages: [
          {
            sender: "user",
            content:
              "We're having an issue with a freelancer who hasn't delivered the project according to our specifications. We've tried to communicate with them, but they insist that they've met all requirements. We need mediation.",
            timestamp: "2 days ago",
          },
          {
            sender: "support",
            content:
              "Thank you for bringing this to our attention. I'll be handling your case. Could you please provide the project ID and specific details of the requirements that haven't been met?",
            timestamp: "1 day ago",
          },
          {
            sender: "user",
            content:
              "The project ID is #P-2578. The main issues are: 1) The mobile responsiveness is not working as required, 2) The payment gateway integration is incomplete, and 3) There are several UI bugs that weren't fixed.",
            timestamp: "1 day ago",
          },
          {
            sender: "support",
            content:
              "Thank you for providing the details. I've reviewed the project requirements and communications. I'll now reach out to the freelancer to get their perspective. I'll update you once I have more information.",
            timestamp: "4 hours ago",
          },
        ],
        assignedTo: "Daniel Rodriguez",
      },
    ],
    resolved: [
      {
        id: 5,
        subject: "Need help with contract terms",
        user: {
          name: "Sarah Williams",
          email: "sarah.williams@example.com",
          role: "freelancer",
          avatar: "SW",
        },
        category: "Legal",
        priority: "medium",
        status: "resolved",
        createdAt: "5 days ago",
        lastUpdated: "2 days ago",
        messages: [
          {
            sender: "user",
            content:
              "I'm about to sign a contract with a new client, but there are some terms I don't fully understand. Can someone help clarify the intellectual property rights section and the payment terms?",
            timestamp: "5 days ago",
          },
          {
            sender: "support",
            content:
              "Hello Sarah, I'd be happy to help. The intellectual property rights section typically outlines who owns the work once it's completed. The payment terms section details when and how you'll be paid. Could you share the specific clauses you're confused about?",
            timestamp: "4 days ago",
          },
          {
            sender: "user",
            content:
              "Thank you for the explanation. I'm particularly concerned about clause 8.2, which states that the client owns all 'derivative works'. Does this mean I can't use similar designs for other clients?",
            timestamp: "4 days ago",
          },
          {
            sender: "support",
            content:
              "Regarding clause 8.2, 'derivative works' typically refers to works that are based on or derived from the original work you create for this client. You should be cautious about reusing very similar designs for other clients, as this could potentially violate the agreement. However, you can still use your general skills and knowledge. I'd recommend discussing this specific concern with the client to reach a clear understanding.",
            timestamp: "3 days ago",
          },
          {
            sender: "user",
            content:
              "That makes sense. I'll discuss this with the client to ensure we both have the same understanding. Thank you for your help!",
            timestamp: "3 days ago",
          },
          {
            sender: "support",
            content:
              "You're welcome, Sarah! I'm glad I could help clarify the contract terms. If you have any other questions or concerns, don't hesitate to reach out. Good luck with your new project!",
            timestamp: "2 days ago",
          },
        ],
        resolvedBy: "Emily Brown",
        resolution: "Explained contract terms and advised client communication",
      },
    ],
  };

  // Filter tickets based on active tab and search query
  const getFilteredTickets = () => {
    const ticketsToFilter = tickets[activeTab] || [];
    return ticketsToFilter.filter(
      (ticket) =>
        ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Handle ticket selection
  const handleTicketSelect = (ticket) => {
    setSelectedTicket(ticket);
    setReplyText("");
  };

  // Handle reply submission
  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    // In a real application, this would update the backend
    // For now, we'll just log to console
    console.log(`Reply to ticket #${selectedTicket.id}: ${replyText}`);
    setReplyText("");
  };

  // Render priority badge
  const renderPriorityBadge = (priority) => {
    switch (priority) {
      case "high":
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">High</span>;
      case "medium":
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Medium</span>;
      case "low":
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Low</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{priority}</span>;
    }
  };

  // Render status badge
  const renderStatusBadge = (status) => {
    switch (status) {
      case "open":
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Open</span>;
      case "in-progress":
        return <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">In Progress</span>;
      case "resolved":
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Resolved</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Support Tickets</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Ticket List */}
        <div className="lg:col-span-1">
          {/* Search and Filter */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search tickets..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
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

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
            <div className="flex border-b">
              <button
                className={`flex-1 py-3 px-4 text-center font-medium ${
                  activeTab === "open" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("open")}
              >
                Open ({tickets.open.length})
              </button>
              <button
                className={`flex-1 py-3 px-4 text-center font-medium ${
                  activeTab === "inProgress"
                    ? "border-b-2 border-primary text-primary"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("inProgress")}
              >
                In Progress ({tickets.inProgress.length})
              </button>
              <button
                className={`flex-1 py-3 px-4 text-center font-medium ${
                  activeTab === "resolved"
                    ? "border-b-2 border-primary text-primary"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("resolved")}
              >
                Resolved ({tickets.resolved.length})
              </button>
            </div>

            {/* Ticket List */}
            <div className="divide-y divide-gray-200 max-h-[calc(100vh-300px)] overflow-y-auto">
              {getFilteredTickets().map((ticket) => (
                <div
                  key={ticket.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedTicket && selectedTicket.id === ticket.id ? "bg-gray-50" : ""
                  }`}
                  onClick={() => handleTicketSelect(ticket)}
                >
                  <div className="flex items-start">
                    <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium mr-3">
                      {ticket.user.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{ticket.subject}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {ticket.user.name} • {ticket.lastUpdated}
                      </p>
                      <div className="flex space-x-2 mt-2">
                        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800">
                          {ticket.category}
                        </span>
                        {renderPriorityBadge(ticket.priority)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {getFilteredTickets().length === 0 && (
                <div className="p-6 text-center text-gray-500">No tickets found</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Ticket Details */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Ticket Header */}
              <div className="p-6 border-b">
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-semibold">{selectedTicket.subject}</h2>
                  <div>{renderStatusBadge(selectedTicket.status)}</div>
                </div>

                <div className="mt-2 flex flex-wrap gap-3">
                  <div className="text-sm">
                    <span className="text-gray-500">Ticket #:</span> {selectedTicket.id}
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Created:</span> {selectedTicket.createdAt}
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Category:</span> {selectedTicket.category}
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Priority:</span> {selectedTicket.priority}
                  </div>
                  {selectedTicket.status === "in-progress" && (
                    <div className="text-sm">
                      <span className="text-gray-500">Assigned to:</span> {selectedTicket.assignedTo}
                    </div>
                  )}
                </div>
              </div>

              {/* Ticket Messages */}
              <div className="p-6 max-h-[calc(100vh-400px)] overflow-y-auto">
                <div className="space-y-6">
                  {selectedTicket.messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.sender === "support" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-3/4 rounded-lg p-4 ${
                          message.sender === "support" ? "bg-primary text-white" : "bg-gray-100"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`text-xs mt-2 ${
                            message.sender === "support" ? "text-primary-light" : "text-gray-500"
                          }`}
                        >
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply Form (only for non-resolved tickets) */}
              {selectedTicket.status !== "resolved" ? (
                <div className="p-6 border-t bg-gray-50">
                  <form onSubmit={handleReplySubmit}>
                    <div className="mb-4">
                      <textarea
                        rows="4"
                        placeholder="Type your reply here..."
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      ></textarea>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <select className="mr-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                          <option value="in-progress">Mark as In Progress</option>
                          <option value="resolved">Mark as Resolved</option>
                          <option value="need-info">Need More Info</option>
                        </select>
                        {activeTab !== "inProgress" && (
                          <select className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                            <option value="">Assign to...</option>
                            <option value="daniel">Daniel Rodriguez</option>
                            <option value="emily">Emily Brown</option>
                            <option value="james">James Wilson</option>
                          </select>
                        )}
                      </div>
                      <button
                        type="submit"
                        className="bg-primary hover:bg-primary-dark text-white py-2 px-6 rounded-md font-medium"
                      >
                        Reply
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="p-6 border-t bg-gray-50">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Resolved by:</span> {selectedTicket.resolvedBy}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Resolution:</span> {selectedTicket.resolution}
                  </div>
                  <button className="mt-4 text-primary hover:text-primary-dark text-sm font-medium">
                    Reopen Ticket
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">No ticket selected</h3>
              <p className="mt-1 text-sm text-gray-500">Select a ticket from the list to view its details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
