import axios from "../api/axios";

const profileService = {
  // Get profile by user ID
  getProfileByUserId: async (userId) => {
    try {
      const response = await axios.get(`/api/profile/user/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get all freelancer profiles
  getAllFreelancers: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.location) {
        queryParams.append("location", filters.location);
      }
      
      const response = await axios.get(`/api/profile/freelancers?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get current user's profile
  getCurrentUserProfile: async () => {
    try {
      const response = await axios.get("/api/profile/me");
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update current user's profile
  updateProfile: async (profileData) => {
    try {
      const response = await axios.put("/api/profile", profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Add education to profile
  addEducation: async (educationData) => {
    try {
      const response = await axios.put("/api/profile/education", educationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Remove education from profile
  removeEducation: async (educationId) => {
    try {
      const response = await axios.delete(`/api/profile/education/${educationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Add experience to profile
  addExperience: async (experienceData) => {
    try {
      const response = await axios.put("/api/profile/experience", experienceData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Remove experience from profile
  removeExperience: async (experienceId) => {
    try {
      const response = await axios.delete(`/api/profile/experience/${experienceId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default profileService;



