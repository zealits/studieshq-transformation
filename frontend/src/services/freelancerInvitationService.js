import axios from "../api/axios";

/**
 * Download Excel template for bulk freelancer invitations
 */
export const downloadTemplate = async () => {
  try {
    const response = await axios.get("/api/admin/freelancer-invitations/template", {
      responseType: "blob",
    });

    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "freelancer_invitation_template.xlsx");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error("Error downloading template:", error);
    throw error;
  }
};

/**
 * Upload and process Excel file for bulk freelancer invitations
 */
export const uploadInvitations = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post("/api/admin/freelancer-invitations/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error uploading invitations:", error);
    throw error;
  }
};

/**
 * Get all freelancer invitations
 */
export const getAllInvitations = async (params = {}) => {
  try {
    const response = await axios.get("/api/admin/freelancer-invitations", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching invitations:", error);
    throw error;
  }
};

/**
 * Resend invitation email
 */
export const resendInvitation = async (id) => {
  try {
    const response = await axios.post(`/api/admin/freelancer-invitations/${id}/resend`);
    return response.data;
  } catch (error) {
    console.error("Error resending invitation:", error);
    throw error;
  }
};

/**
 * Delete invitation
 */
export const deleteInvitation = async (id) => {
  try {
    const response = await axios.delete(`/api/admin/freelancer-invitations/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting invitation:", error);
    throw error;
  }
};

const freelancerInvitationService = {
  downloadTemplate,
  uploadInvitations,
  getAllInvitations,
  resendInvitation,
  deleteInvitation,
};

export default freelancerInvitationService;



