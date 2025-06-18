import axios from "../api/axios";

const projectService = {
  // Get all projects for user
  getUserProjects: async (filters = {}) => {
    try {
      const response = await axios.get("/api/projects", { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get project details
  getProjectDetails: async (projectId) => {
    try {
      const response = await axios.get(`/api/projects/${projectId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update project status
  updateProject: async (projectId, updateData) => {
    try {
      const response = await axios.put(`/api/projects/${projectId}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Submit milestone work
  submitMilestoneWork: async (projectId, milestoneId, workData) => {
    try {
      const response = await axios.post(`/api/projects/${projectId}/milestones/${milestoneId}/submit`, workData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Mark milestone as complete
  completeMilestone: async (projectId, milestoneId) => {
    try {
      const response = await axios.put(`/api/projects/${projectId}/milestones/${milestoneId}/complete`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Request milestone revision
  requestMilestoneRevision: async (projectId, milestoneId, revisionData) => {
    try {
      const response = await axios.post(`/api/projects/${projectId}/milestones/${milestoneId}/revision`, revisionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Complete project
  completeProject: async (projectId) => {
    try {
      const response = await axios.put(`/api/projects/${projectId}/complete`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default projectService;
