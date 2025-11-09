import axios from "../api/axios";

const jobService = {
  // Get all jobs with filters
  getJobs: async (filters = {}) => {
    try {
      const response = await axios.get("/api/jobs", { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create a new job
  createJob: async (jobData) => {
    try {
      const response = await axios.post("/api/jobs", jobData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update job
  updateJob: async (jobId, jobData) => {
    try {
      const response = await axios.put(`/api/jobs/${jobId}`, jobData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Close job (set status to cancelled)
  closeJob: async (jobId) => {
    try {
      const response = await axios.put(`/api/jobs/${jobId}`, { status: "cancelled" });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete job
  deleteJob: async (jobId) => {
    try {
      const response = await axios.delete(`/api/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get job details
  getJobDetails: async (jobId) => {
    try {
      const response = await axios.get(`/api/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Submit proposal
  submitProposal: async (jobId, proposalData) => {
    try {
      const response = await axios.post(`/api/jobs/${jobId}/proposals`, proposalData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get proposals for a job
  getProposals: async (jobId) => {
    try {
      const response = await axios.get(`/api/jobs/${jobId}/proposals`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update proposal status (accept/reject)
  updateProposalStatus: async (jobId, proposalId, status) => {
    try {
      const response = await axios.put(`/api/jobs/${jobId}/proposals/${proposalId}`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Publish job (make it live)
  publishJob: async (jobId) => {
    try {
      const response = await axios.put(`/api/jobs/${jobId}/publish`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get ranked candidates for a job (Best Match)
  getRankedCandidates: async (jobId, topK = 100, filters = {}) => {
    try {
      const params = { top_k: topK, ...filters };
      const response = await axios.get(`/api/jobs/${jobId}/ranked-candidates`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default jobService;
