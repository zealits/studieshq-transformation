import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../../api/axios";

const ContactManagementPage = () => {
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    recent: 0,
    byStatus: { new: 0, "in-progress": 0, resolved: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});

  // Fetch contact statistics
  const fetchStats = async () => {
    try {
      const response = await api.get("/api/contact/admin/stats");
      setStats(response.data.data);
    } catch (error) {
      console.error("Error fetching contact stats:", error);
      toast.error("Failed to fetch contact statistics");
    }
  };

  // Fetch contacts with pagination and filtering
  const fetchContacts = async (page = 1, status = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (status) {
        params.append("status", status);
      }

      const response = await api.get(`/api/contact/admin?${params}`);
      setContacts(response.data.data.contacts);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast.error("Failed to fetch contact submissions");
    } finally {
      setLoading(false);
    }
  };

  // Update contact status and notes
  const updateContact = async (contactId, status, adminNotes) => {
    try {
      const response = await api.put(`/api/contact/admin/${contactId}`, {
        status,
        adminNotes,
      });

      // Update the contact in the list
      setContacts(contacts.map((contact) => (contact._id === contactId ? response.data.data : contact)));

      // Update selected contact if it's the one being updated
      if (selectedContact && selectedContact._id === contactId) {
        setSelectedContact(response.data.data);
      }

      toast.success("Contact updated successfully");
      fetchStats(); // Refresh stats
    } catch (error) {
      console.error("Error updating contact:", error);
      toast.error("Failed to update contact");
    }
  };

  // Delete contact
  const deleteContact = async (contactId) => {
    if (!window.confirm("Are you sure you want to delete this contact submission?")) {
      return;
    }

    try {
      await api.delete(`/api/contact/admin/${contactId}`);
      setContacts(contacts.filter((contact) => contact._id !== contactId));
      toast.success("Contact deleted successfully");
      fetchStats(); // Refresh stats

      if (selectedContact && selectedContact._id === contactId) {
        setIsModalOpen(false);
        setSelectedContact(null);
      }
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("Failed to delete contact");
    }
  };

  // Open contact details modal
  const openContactModal = (contact) => {
    setSelectedContact(contact);
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedContact(null);
  };

  // Handle status filter change
  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
    fetchContacts(1, status);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchContacts(page, statusFilter);
  };

  useEffect(() => {
    fetchStats();
    fetchContacts();
  }, []);

  const getStatusBadge = (status) => {
    const statusClasses = {
      new: "bg-blue-100 text-blue-800",
      "in-progress": "bg-yellow-100 text-yellow-800",
      resolved: "bg-green-100 text-green-800",
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status]}`}>
        {status === "in-progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contact Management</h1>
          <p className="text-gray-600">Manage contact form submissions and customer inquiries</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dd className="text-2xl font-semibold text-gray-900">{stats.total}</dd>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Contacts</dt>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dd className="text-2xl font-semibold text-gray-900">{stats.recent}</dd>
                <dt className="text-sm font-medium text-gray-500 truncate">This Week</dt>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dd className="text-2xl font-semibold text-gray-900">{stats.byStatus["in-progress"]}</dd>
                <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dd className="text-2xl font-semibold text-gray-900">{stats.byStatus.new}</dd>
                <dt className="text-sm font-medium text-gray-500 truncate">New</dt>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex space-x-4">
          <button
            onClick={() => handleStatusFilter("")}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              statusFilter === "" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleStatusFilter("new")}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              statusFilter === "new" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            New
          </button>
          <button
            onClick={() => handleStatusFilter("in-progress")}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              statusFilter === "in-progress" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => handleStatusFilter("resolved")}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              statusFilter === "resolved" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Resolved
          </button>
        </div>
      </div>

      {/* Contact List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Contact Submissions</h3>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : contacts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No contact submissions found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contacts.map((contact) => (
                    <tr key={contact._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                          <div className="text-sm text-gray-500">{contact.email}</div>
                          {contact.phone && <div className="text-sm text-gray-500">{contact.phone}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">{contact.message}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(contact.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(contact.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button onClick={() => openContactModal(contact)} className="text-blue-600 hover:text-blue-900">
                          View
                        </button>
                        <button onClick={() => deleteContact(contact._id)} className="text-red-600 hover:text-red-900">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Showing {(pagination.currentPage - 1) * 10 + 1} to{" "}
                {Math.min(pagination.currentPage * 10, pagination.totalContacts)} of {pagination.totalContacts} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contact Detail Modal */}
      {isModalOpen && selectedContact && (
        <ContactDetailModal contact={selectedContact} onClose={closeModal} onUpdate={updateContact} />
      )}
    </div>
  );
};

// Contact Detail Modal Component
const ContactDetailModal = ({ contact, onClose, onUpdate }) => {
  const [status, setStatus] = useState(contact.status);
  const [adminNotes, setAdminNotes] = useState(contact.adminNotes || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await onUpdate(contact._id, status, adminNotes);
      onClose();
    } catch (error) {
      console.error("Error updating contact:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Contact Details</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div>
                  <strong>Name:</strong> {contact.name}
                </div>
                <div>
                  <strong>Email:</strong> {contact.email}
                </div>
                {contact.phone && (
                  <div>
                    <strong>Phone:</strong> {contact.phone}
                  </div>
                )}
                <div>
                  <strong>Submitted:</strong> {formatDate(contact.createdAt)}
                </div>
              </div>
            </div>

            {/* Message */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Message</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="whitespace-pre-wrap">{contact.message}</p>
              </div>
            </div>

            {/* Status Update */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Status & Notes</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="new">New</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add notes about this contact..."
                  />
                </div>

                {contact.respondedAt && (
                  <div className="text-sm text-gray-600">
                    <strong>Last Updated:</strong> {formatDate(contact.respondedAt)}
                    {contact.respondedBy && <span> by {contact.respondedBy.name}</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isUpdating ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactManagementPage;
