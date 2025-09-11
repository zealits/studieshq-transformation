import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { formatDistanceToNow } from "date-fns";

const InvitationsPage = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:2001";

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/jobs/invitations`, {
        headers: {
          "x-auth-token": localStorage.getItem("token"),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch invitations");
      }

      const data = await response.json();
      setInvitations(data.data.invitations || []);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      toast.error("Failed to load invitations");
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (invitationId, response) => {
    try {
      setResponding(invitationId);
      const res = await fetch(`${API_URL}/api/jobs/invitations/${invitationId}/respond`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": localStorage.getItem("token"),
        },
        body: JSON.stringify({ response }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`Invitation ${response} successfully!`);
        fetchInvitations(); // Refresh the list
      } else {
        toast.error(data.message || "Failed to respond to invitation");
      }
    } catch (error) {
      console.error("Error responding to invitation:", error);
      toast.error("Failed to respond to invitation");
    } finally {
      setResponding(null);
    }
  };

  const formatDeadline = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const formatBudget = (budget) => {
    return `$${budget.min} - $${budget.max}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Job Invitations</h1>

      {invitations.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-2">No invitations found</div>
          <div className="text-gray-400 text-sm">
            You haven't received any job invitations yet.
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {invitations.map((invitation) => (
            <div key={invitation._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {invitation.job.title}
                  </h3>
                  <p className="text-gray-600 mb-2">from {invitation.client.name}</p>
                  <p className="text-sm text-gray-500">
                    Invited {formatDistanceToNow(new Date(invitation.createdAt))} ago
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Expires</div>
                  <div className="text-sm font-medium">
                    {formatDeadline(invitation.expiresAt)}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-gray-700 mb-4">{invitation.job.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Budget</div>
                    <div className="font-medium">{formatBudget(invitation.job.budget)}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Category</div>
                    <div className="font-medium">{invitation.job.category}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Duration</div>
                    <div className="font-medium">{invitation.job.duration}</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-500 mb-2">Required Skills</div>
                  <div className="flex flex-wrap gap-2">
                    {invitation.job.skills?.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {invitation.message && (
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <div className="text-sm text-gray-500 mb-1">Personal Message</div>
                    <p className="text-gray-700 italic">"{invitation.message}"</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => handleResponse(invitation._id, "declined")}
                  disabled={responding === invitation._id}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {responding === invitation._id ? "Declining..." : "Decline"}
                </button>
                <button
                  onClick={() => handleResponse(invitation._id, "accepted")}
                  disabled={responding === invitation._id}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {responding === invitation._id ? "Accepting..." : "Accept Invitation"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvitationsPage;

