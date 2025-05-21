export const updateProposalStatus = (jobId, proposalId, statusData) => async (dispatch) => {
  try {
    const response = await fetch(`/api/jobs/${jobId}/proposals/${proposalId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(statusData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update proposal status");
    }

    return data;
  } catch (error) {
    console.error("Error updating proposal status:", error);
    throw error;
  }
};
