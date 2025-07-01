import api from "../api/axios";

const adminService = {
  // Create milestone for a project
  createMilestone: async (projectId, milestoneData) => {
    try {
      const response = await api.post(`/api/admin/projects/${projectId}/milestones`, milestoneData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get all projects with escrow details
  getProjectsWithEscrow: async (status, page = 1, limit = 10) => {
    try {
      const params = { page, limit };
      if (status) params.status = status;

      const response = await api.get("/api/admin/projects", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get milestone details
  getMilestoneDetails: async (projectId, milestoneId) => {
    try {
      const response = await api.get(`/api/admin/projects/${projectId}/milestones/${milestoneId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Release milestone payment
  releaseMilestonePayment: async (projectId, milestoneId) => {
    try {
      const response = await api.post(`/api/admin/projects/${projectId}/milestones/${milestoneId}/release`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update platform settings
  updatePlatformSettings: async (settings) => {
    try {
      const response = await api.put("/api/admin/settings", { settings });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get platform settings
  getPlatformSettings: async () => {
    try {
      const response = await api.get("/api/admin/settings");
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get admin dashboard statistics
  getDashboardStats: async (startDate, endDate) => {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get("/api/admin/dashboard/stats", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get platform revenue
  getPlatformRevenue: async (startDate, endDate) => {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get("/api/admin/platform/revenue", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // NEW PAYMENT ANALYTICS METHODS

  // Get comprehensive payment analytics
  getPaymentAnalytics: async (startDate, endDate, userType) => {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (userType) params.userType = userType;

      const response = await api.get("/api/admin/payment/analytics", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get platform financial overview
  getPlatformFinancialOverview: async (startDate, endDate) => {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get("/api/admin/payment/financial-overview", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get user payment details
  getUserPaymentDetails: async (userId, page = 1, limit = 20) => {
    try {
      const params = { page, limit };
      const response = await api.get(`/api/admin/users/${userId}/payments`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default adminService;
