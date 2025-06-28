import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import api from "../../api/axios";
import toast from "react-hot-toast";

const SupportPage = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [tickets, setTickets] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [replies, setReplies] = useState([]);
  const [refreshInterval, setRefreshInterval] = useState(null);

  const { token } = useSelector((state) => state.auth);

  // Fetch all tickets
  const fetchTickets = async (silent = false) => {
    try {
      if (!silent && !loading) {
        // Only show loading state for manual refresh, not auto-refresh
        setLoading(true);
      }
      
      const response = await api.get('/api/support/admin/tickets', {
        headers: { 'x-auth-token': token },
        timeout: 5000 // 5 second timeout for faster response
      });
      
      if (response.data.success) {
        setTickets(response.data.data.tickets);
      }
    } catch (error) {
      if (!silent) {
        console.error('Error fetching tickets:', error);
        toast.error('Failed to fetch tickets');
      }
    } finally {
      if (!silent && loading) {
        setLoading(false);
      }
    }
  };

  // Fetch analytics
  const fetchAnalytics = async (silent = false) => {
    try {
      const response = await api.get('/api/support/admin/analytics', {
        headers: { 'x-auth-token': token },
        timeout: 5000 // 5 second timeout for faster response
      });
      
      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error) {
      if (!silent) {
        console.error('Error fetching analytics:', error);
      }
    }
  };

  // Fetch ticket details and replies
  const fetchTicketDetails = async (ticketId) => {
    try {
      const response = await api.get(`/api/support/tickets/${ticketId}`, {
        headers: { 'x-auth-token': token }
      });
      
      if (response.data.success) {
        setTicketDetails(response.data.data.ticket);
        setReplies(response.data.data.replies);
      }
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      toast.error('Failed to fetch ticket details');
    }
  };

  // Update ticket status/priority
  const updateTicket = async (ticketId, updates) => {
    try {
      const response = await api.put(`/api/support/admin/tickets/${ticketId}`, updates, {
        headers: { 'x-auth-token': token }
      });
      
      if (response.data.success) {
        toast.success('Ticket updated successfully');
        await fetchTickets();
        if (selectedTicket?._id === ticketId) {
          await fetchTicketDetails(ticketId);
        }
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast.error('Failed to update ticket');
    }
  };

  // Send reply
  const sendReply = async (ticketId, content, isInternal = false) => {
    try {
      const response = await api.post(`/api/support/tickets/${ticketId}/replies`, {
        content,
        isInternal
      }, {
        headers: { 'x-auth-token': token }
      });
      
      if (response.data.success) {
        toast.success('Reply sent successfully');
        setReplyText('');
        await fetchTicketDetails(ticketId);
        await fetchTickets();
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    }
  };

  // Manual refresh function
  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchTickets(false), fetchAnalytics(false)]);
      toast.success('Data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTickets(), fetchAnalytics()]);
      setLoading(false);
    };
    
    loadData();
  }, [token]);

  // Auto-refresh tickets every 10 seconds instead of 30 seconds for better responsiveness
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTickets(true); // Silent refresh - don't show loading states
      if (selectedTicket) {
        fetchTicketDetails(selectedTicket._id);
      }
    }, 10000); // Changed from 30000 to 10000 (10 seconds)
    
    setRefreshInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedTicket]);

  // Filter tickets based on active tab and search
  const getFilteredTickets = () => {
    let filtered = tickets;
    
    // Filter by status
    if (activeTab !== "all") {
      const statusMap = {
        open: "open",
        inProgress: "in-progress", 
        resolved: "resolved",
        closed: "closed"
      };
      filtered = filtered.filter(ticket => ticket.status === statusMap[activeTab]);
    }
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(ticket =>
        ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    }
    
    return filtered;
  };

  const handleTicketSelect = async (ticket) => {
    setSelectedTicket(ticket);
    await fetchTicketDetails(ticket._id);
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    
    await sendReply(selectedTicket._id, replyText);
  };

  const handleStatusChange = async (status) => {
    if (!selectedTicket) return;
    await updateTicket(selectedTicket._id, { status });
  };

  const handlePriorityChange = async (priority) => {
    if (!selectedTicket) return;
    await updateTicket(selectedTicket._id, { priority });
  };

  const renderPriorityBadge = (priority) => {
    const colors = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[priority]}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const renderStatusBadge = (status) => {
    const colors = {
      open: "bg-blue-100 text-blue-800",
      "in-progress": "bg-yellow-100 text-yellow-800",
      "waiting-for-response": "bg-purple-100 text-purple-800",
      resolved: "bg-green-100 text-green-800",
      closed: "bg-gray-100 text-gray-800",
    };

    const labels = {
      open: "Open",
      "in-progress": "In Progress", 
      "waiting-for-response": "Waiting for Response",
      resolved: "Resolved",
      closed: "Closed",
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
    <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Management</h1>
          <p className="text-gray-600">Manage and respond to support tickets</p>
        </div>
        
        <div className="flex space-x-4">
          <button 
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {refreshing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Refreshing...</span>
              </>
            ) : (
              <>
                <span>🔄</span>
                <span>Refresh</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-medium">📋</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalTickets}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-sm font-medium">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.resolvedTickets}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-600 text-sm font-medium">⏳</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.inProgressTickets}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-red-600 text-sm font-medium">🚨</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Open</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.openTickets}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Support Tickets</h2>
              <span className="text-sm text-gray-500">{getFilteredTickets().length} tickets</span>
            </div>

            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              {[
                { key: "all", label: "All" },
                { key: "open", label: "Open" },
                { key: "inProgress", label: "In Progress" },
                { key: "resolved", label: "Resolved" }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.key
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tickets List */}
          <div className="max-h-96 overflow-y-auto">
            {getFilteredTickets().map((ticket) => (
              <div
                key={ticket._id}
                onClick={() => handleTicketSelect(ticket)}
                className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedTicket?._id === ticket._id ? "bg-blue-50 border-blue-200" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-mono text-gray-500">{ticket?.ticketNumber}</span>
                      {renderPriorityBadge(ticket?.priority)}
                    </div>
                      <p className="text-sm font-medium text-gray-900 truncate">{ticket.subject}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600">
                          {ticket?.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600">{ticket.user.name}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-600">{formatDate(ticket.createdAt)}</span>
                    </div>
                  </div>
                  <div className="ml-2">
                    {renderStatusBadge(ticket.status)}
                    </div>
                  </div>
                </div>
              ))}

              {getFilteredTickets().length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <p>No tickets found</p>
              </div>
              )}
          </div>
        </div>

        {/* Ticket Details */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <div className="bg-white rounded-lg shadow-sm border">
              {/* Ticket Header */}
              <div className="p-6 border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <h2 className="text-xl font-semibold text-gray-900">{ticketDetails?.subject}</h2>
                      {renderStatusBadge(ticketDetails?.status)}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>#{ticketDetails?.ticketNumber}</span>
                      <span>•</span>
                      <span>{ticketDetails?.user.name} ({ticketDetails?.user.role})</span>
                      <span>•</span>
                      <span>{formatDate(ticketDetails?.createdAt)}</span>
                </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Priority Dropdown */}
                    <select
                      value={ticketDetails?.priority || 'medium'}
                      onChange={(e) => handlePriorityChange(e.target.value)}
                      className="text-sm border border-gray-300 rounded-md px-3 py-1"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    
                    {/* Status Dropdown */}
                    <select
                      value={ticketDetails?.status || 'open'}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="text-sm border border-gray-300 rounded-md px-3 py-1"
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="waiting-for-response">Waiting for Response</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  </div>
                
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-800">{ticketDetails?.description}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    Category: {ticketDetails?.category}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="max-h-96 overflow-y-auto p-6 space-y-4">
                {replies.map((reply, index) => (
                  <div
                    key={reply._id}
                    className={`flex ${reply.author?.role === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                        reply.author?.role === 'admin'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-medium">
                          {reply.author?.name || 'Unknown User'} ({reply.author?.role || 'user'})
                        </span>
                        {reply.isInternal && (
                          <span className="text-xs bg-yellow-200 text-yellow-800 px-1 rounded">
                            Internal
                          </span>
                        )}
                      </div>
                      <p className="text-sm">{reply.content}</p>
                      <p className={`text-xs mt-1 ${
                        reply.author?.role === 'admin' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatDate(reply.createdAt)}
                      </p>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Reply Form */}
              <div className="p-6 border-t">
                  <form onSubmit={handleReplySubmit}>
                  <div className="mb-3">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center space-x-1 text-sm text-gray-600">
                        <input type="checkbox" className="rounded" />
                        <span>Internal note (not visible to user)</span>
                      </label>
                      </div>
                      <button
                        type="submit"
                      disabled={!replyText.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                      Send Reply
                      </button>
                    </div>
                  </form>
                </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border h-96 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p>Select a ticket to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
