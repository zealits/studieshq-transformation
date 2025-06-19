import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { 
  ArrowLeft, 
  Calendar, 
  Tag, 
  User, 
  MessageSquare, 
  Send, 
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  FileText,
  Paperclip,
  Download,
  RefreshCw,
  Copy,
  X
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../api/axios";

const TicketDetails = () => {
  const [ticket, setTicket] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState({ score: 5, feedback: "" });
  const [submittingRating, setSubmittingRating] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const fileInputRef = useRef(null);
  const lastUpdateRef = useRef(null);

  const { id } = useParams();
  const { user, token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // Get support base path based on user role
  const getSupportBasePath = () => {
    if (!user) return "/support";
    switch (user.role) {
      case "freelancer":
        return "/freelancer/support";
      case "client":
        return "/client/support";
      case "admin":
        return "/admin/support";
      default:
        return "/support";
    }
  };

  const supportBasePath = getSupportBasePath();

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !user || !token || !id) return;

    const interval = setInterval(() => {
      if (["open", "in-progress", "waiting-for-response"].includes(ticket?.status)) {
        handleRefresh(true); // Silent refresh
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, ticket?.status, user, token, id]);

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "waiting-for-response":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200";
      case "closed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "text-red-600 bg-red-50";
      case "high":
        return "text-orange-600 bg-orange-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "open":
        return <AlertCircle className="w-5 h-5" />;
      case "in-progress":
        return <Clock className="w-5 h-5" />;
      case "waiting-for-response":
        return <MessageSquare className="w-5 h-5" />;
      case "resolved":
        return <CheckCircle className="w-5 h-5" />;
      case "closed":
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const fetchTicketDetails = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get(`/api/support/tickets/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setTicket(response.data.data.ticket);
        setReplies(response.data.data.replies);
        lastUpdateRef.current = new Date();
        
        // Show rating form if ticket is resolved/closed and not yet rated
        if (["resolved", "closed"].includes(response.data.data.ticket.status) && !response.data.data.ticket.rating?.score) {
          setShowRating(true);
        }
      } else {
        toast.error(response.data.message || "Failed to fetch ticket details");
        navigate(supportBasePath);
      }
    } catch (error) {
      console.error("Error fetching ticket details:", error);
      if (!silent) {
        toast.error("Failed to fetch ticket details");
        navigate(supportBasePath);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleRefresh = async (silent = false) => {
    if (!silent) setRefreshing(true);
    await fetchTicketDetails(silent);
    if (!silent) {
      setRefreshing(false);
      toast.success("Ticket refreshed");
    }
  };

  useEffect(() => {
    if (user && token && id) {
      fetchTicketDetails();
    }
  }, [user, token, id]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/', 'application/pdf', 'text/', 'application/msword', 'application/vnd.openxmlformats-officedocument'];
    
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast.error(`File "${file.name}" is too large. Maximum size is 10MB.`);
        return false;
      }
      
      const isValidType = allowedTypes.some(type => file.type.startsWith(type));
      if (!isValidType) {
        toast.error(`File "${file.name}" is not supported.`);
        return false;
      }
      
      return true;
    });

    setAttachments(prev => [...prev, ...validFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    
    if (!replyContent.trim() && attachments.length === 0) {
      toast.error("Please enter a reply message or attach a file");
      return;
    }

    setSubmittingReply(true);

    try {
      const formData = new FormData();
      formData.append('content', replyContent);
      
      attachments.forEach((file, index) => {
        formData.append('attachments', file);
      });

      const response = await api.post(`/api/support/tickets/${id}/replies`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        toast.success("Reply sent successfully!");
        setReplyContent("");
        setAttachments([]);
        fetchTicketDetails(); // Refresh to get updated replies and ticket status
      } else {
        toast.error(response.data.message || "Failed to send reply");
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("Failed to send reply");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    setSubmittingRating(true);

    try {
      const response = await api.post(`/api/support/tickets/${id}/rate`, rating, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        toast.success("Thank you for your feedback!");
        setShowRating(false);
        fetchTicketDetails(); // Refresh to show updated ticket
      } else {
        toast.error(response.data.message || "Failed to submit rating");
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast.error("Failed to submit rating");
    } finally {
      setSubmittingRating(false);
    }
  };

  const copyTicketNumber = () => {
    navigator.clipboard.writeText(ticket.ticketNumber);
    toast.success("Ticket number copied to clipboard");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Authentication Required
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Please log in to view ticket details.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading ticket details...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Ticket Not Found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            The ticket you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <div className="mt-6">
            <Link
              to={supportBasePath}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Back to Support
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const canReply = ["open", "in-progress", "waiting-for-response"].includes(ticket.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => navigate(supportBasePath)}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Support
            </button>
            
            <div className="flex items-center space-x-2 ml-auto">
              <button
                onClick={() => handleRefresh()}
                disabled={refreshing}
                className="inline-flex items-center px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-600">Auto-refresh</span>
              </label>
            </div>
          </div>
          
          <div className="bg-white shadow-lg rounded-lg">
            <div className="px-6 py-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(ticket.status)}`}>
                      {getStatusIcon(ticket.status)}
                      <span className="ml-2 capitalize">{ticket.status.replace('-', ' ')}</span>
                    </div>
                    <button
                      onClick={copyTicketNumber}
                      className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                      title="Click to copy ticket number"
                    >
                      #{ticket.ticketNumber}
                      <Copy className="w-3 h-3 ml-1" />
                    </button>
                  </div>
                  
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {ticket.subject}
                  </h1>
                  
                  <div className="flex flex-wrap items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Tag className="w-4 h-4 mr-1" />
                      {ticket.category}
                    </div>
                    <div className="flex items-center">
                      <div className={`px-2 py-1 rounded text-xs font-medium capitalize ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority} Priority
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Created {formatDate(ticket.createdAt)}
                    </div>
                    {ticket.assignedAdmin && (
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        Assigned to {ticket.assignedAdmin.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Original Description */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Description</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
                </div>
              </div>

              {/* Rating Display */}
              {ticket.rating?.score && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Your Rating</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < ticket.rating.score
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        {ticket.rating.score}/5
                      </span>
                    </div>
                    {ticket.rating.feedback && (
                      <p className="text-sm text-gray-700">{ticket.rating.feedback}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Rated on {formatDate(ticket.rating.ratedAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Conversation */}
        <div className="bg-white shadow-lg rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Conversation</h2>
              {lastUpdateRef.current && (
                <span className="text-sm text-gray-500">
                  Last updated: {formatDate(lastUpdateRef.current)}
                </span>
              )}
            </div>
          </div>
          
          <div className="px-6 py-6">
            {replies.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No replies yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Our support team will respond to your ticket soon.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {replies.map((reply, index) => (
                  <div
                    key={reply._id}
                    className={`flex ${
                      reply.author.role === "admin" ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`max-w-3xl ${
                        reply.author.role === "admin"
                          ? "bg-blue-50 border-blue-200"
                          : "bg-gray-50 border-gray-200"
                      } border rounded-lg p-4`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {reply.author.name}
                          </span>
                          {reply.author.role === "admin" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Support Team
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(reply.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{reply.content}</p>
                      
                      {/* Display attachments if they exist */}
                      {reply.attachments && reply.attachments.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Attachments:</h4>
                          <div className="space-y-2">
                            {reply.attachments.map((attachment, attachIndex) => (
                              <div key={attachIndex} className="flex items-center space-x-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                <a
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-indigo-600 hover:text-indigo-700 underline"
                                >
                                  {attachment.originalName}
                                </a>
                                <span className="text-xs text-gray-500">
                                  ({formatFileSize(attachment.size)})
                                </span>
                                <a
                                  href={attachment.url}
                                  download
                                  className="text-gray-500 hover:text-gray-700"
                                  title="Download file"
                                >
                                  <Download className="w-3 h-3" />
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reply Form */}
        {canReply && (
          <div className="bg-white shadow-lg rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Add Reply</h3>
            </div>
            <div className="px-6 py-6">
              <form onSubmit={handleReplySubmit}>
                <div className="mb-4">
                  <textarea
                    rows={4}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Type your reply here..."
                    disabled={submittingReply}
                  />
                </div>
                
                {/* File Attachments */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Attachments (Optional)
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center px-3 py-1 text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      <Paperclip className="w-4 h-4 mr-1" />
                      Add Files
                    </button>
                  </div>
                  
                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700">{file.name}</span>
                            <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum file size: 10MB. Supported formats: Images, PDF, Word documents, Text files
                  </p>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingReply || (!replyContent.trim() && attachments.length === 0)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingReply ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Reply
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Rating Form */}
        {showRating && (
          <div className="bg-white shadow-lg rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Rate Your Experience</h3>
              <p className="text-sm text-gray-600">
                How was our support? Your feedback helps us improve.
              </p>
            </div>
            <div className="px-6 py-6">
              <form onSubmit={handleRatingSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating *
                  </label>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(prev => ({ ...prev, score: star }))}
                        className="p-1"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= rating.score
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {rating.score}/5
                    </span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Feedback (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={rating.feedback}
                    onChange={(e) => setRating(prev => ({ ...prev, feedback: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Tell us about your experience..."
                    disabled={submittingRating}
                  />
                </div>
                
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setShowRating(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                    disabled={submittingRating}
                  >
                    Skip
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRating}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingRating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      "Submit Rating"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Closed Ticket Notice */}
        {!canReply && !showRating && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Ticket {ticket.status === "closed" ? "Closed" : "Resolved"}
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    This ticket has been {ticket.status}. If you need further assistance, 
                    please{" "}
                    <Link
                      to={`${supportBasePath}/submit`}
                      className="font-medium underline hover:text-yellow-600"
                    >
                      create a new ticket
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tips and Help */}
        {canReply && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <FileText className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Tips for Better Support
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Be specific about your issue and include relevant details</li>
                    <li>Attach screenshots or files that help explain your problem</li>
                    <li>Check your email for updates - we'll notify you of new replies</li>
                    <li>Response times are typically within 24 hours during business days</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketDetails; 