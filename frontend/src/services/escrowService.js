import axios from "../api/axios";

const escrowService = {
  // Block budget for job posting
  blockJobBudget: async (jobId) => {
    try {
      const response = await axios.post("/api/escrow/block-budget", { jobId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create escrow when freelancer is hired
  createEscrow: async (projectId, freelancerId, agreedAmount) => {
    try {
      console.log("🌐 CREATE ESCROW: Making API request...");
      console.log("  ├─ Project ID:", projectId);
      console.log("  ├─ Freelancer ID:", freelancerId);
      console.log("  └─ Agreed Amount:", agreedAmount);

      const response = await axios.post("/api/escrow/create", {
        projectId,
        freelancerId,
        agreedAmount,
      });

      console.log("🌐 CREATE ESCROW: Response received:", response.data);
      return response.data;
    } catch (error) {
      console.error("🌐 CREATE ESCROW: Error:", error);
      throw error.response?.data || error;
    }
  },

  // Get escrow details for a project
  getEscrowDetails: async (projectId) => {
    try {
      const response = await axios.get(`/api/escrow/${projectId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Release milestone payment (Admin only)
  releaseMilestonePayment: async (projectId, milestoneId) => {
    try {
      const response = await axios.post(`/api/escrow/${projectId}/milestones/${milestoneId}/release`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get freelancer's escrow and payment data
  getFreelancerEscrowData: async () => {
    try {
      console.log("🌐 FREELANCER ESCROW DATA: Making API request...");
      const response = await axios.get("/api/escrow/freelancer/data");
      console.log("🌐 FREELANCER ESCROW DATA: Response received:", response.data);
      return response.data;
    } catch (error) {
      console.error("🌐 FREELANCER ESCROW DATA: Error:", error);
      throw error.response?.data || error;
    }
  },

  // Get client's escrow and payment data
  getClientEscrowData: async () => {
    try {
      console.log("🌐 CLIENT ESCROW DATA: Making API request...");
      const response = await axios.get("/api/escrow/client/data");
      console.log("🌐 CLIENT ESCROW DATA: Response received:", response.data);
      return response.data;
    } catch (error) {
      console.error("🌐 CLIENT ESCROW DATA: Error:", error);
      throw error.response?.data || error;
    }
  },

  // Get all escrow data for admin dashboard
  getAllEscrowData: async (filters = {}) => {
    try {
      const response = await axios.get("/api/escrow/admin/all", { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get platform revenue statistics
  getPlatformRevenue: async (filters = {}) => {
    try {
      const response = await axios.get("/api/escrow/platform/revenue", { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Test excess refund calculation
  testExcessRefund: async (data) => {
    try {
      const response = await axios.post("/api/escrow/test/excess-refund", data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Debug escrow data for current user
  getDebugData: async () => {
    try {
      const response = await axios.get("/api/escrow/debug");
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Fix existing escrows that have no milestones
  fixExistingEscrows: async () => {
    try {
      const response = await axios.post("/api/escrow/fix/existing");
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default escrowService;
