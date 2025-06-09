import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// Fetch projects
export const fetchProjects = createAsyncThunk(
  "projects/fetchProjects",
  async ({ status } = {}, { rejectWithValue }) => {
    try {
      console.log("status", status);
      const queryParam = status ? `?status=${status}` : "";
      const response = await api.get(`/api/projects${queryParam}`);
      console.log("response", response);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Create milestone
export const createMilestone = createAsyncThunk(
  "projects/createMilestone",
  async ({ projectId, milestone }, { rejectWithValue }) => {
    try {
      console.log("milestone", milestone);
      const response = await api.post(`/api/projects/${projectId}/milestones`, milestone);
      return { ...response.data, projectId }; // Include projectId in the response
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Update milestone
export const updateMilestone = createAsyncThunk(
  "projects/updateMilestone",
  async ({ projectId, milestoneId, milestone }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/projects/${projectId}/milestones/${milestoneId}`, milestone);
      return { ...response.data, projectId }; // Include projectId in the response
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Delete milestone
export const deleteMilestone = createAsyncThunk(
  "projects/deleteMilestone",
  async ({ projectId, milestoneId }, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/api/projects/${projectId}/milestones/${milestoneId}`);
      return { ...response.data, projectId, milestoneId }; // Include projectId and milestoneId in the response
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Start milestone work (freelancer)
export const startMilestone = createAsyncThunk(
  "projects/startMilestone",
  async ({ projectId, milestoneId, estimatedCompletionDate }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/projects/${projectId}/milestones/${milestoneId}/start`, {
        estimatedCompletionDate,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Submit milestone work (freelancer)
export const submitMilestoneWork = createAsyncThunk(
  "projects/submitMilestoneWork",
  async ({ projectId, milestoneId, submissionDetails, attachmentUrls }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/projects/${projectId}/milestones/${milestoneId}/submit`, {
        submissionDetails,
        attachmentUrls,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Review milestone work (client)
export const reviewMilestoneWork = createAsyncThunk(
  "projects/reviewMilestoneWork",
  async ({ projectId, milestoneId, action, feedback }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/projects/${projectId}/milestones/${milestoneId}/review`, {
        action,
        feedback,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Resubmit milestone work (freelancer)
export const resubmitMilestoneWork = createAsyncThunk(
  "projects/resubmitMilestoneWork",
  async ({ projectId, milestoneId, submissionDetails, attachmentUrls }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/projects/${projectId}/milestones/${milestoneId}/resubmit`, {
        submissionDetails,
        attachmentUrls,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Get milestone attachments
export const getMilestoneAttachments = createAsyncThunk(
  "projects/getMilestoneAttachments",
  async ({ projectId, milestoneId }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/projects/${projectId}/milestones/${milestoneId}/attachments`);
      return response.data;
    } catch (error) {
      console.error("API Error in getMilestoneAttachments:", error);

      // Handle different error scenarios
      if (error.response) {
        // Server responded with error status
        return rejectWithValue({
          message: error.response.data?.message || "Server error",
          status: error.response.status,
          data: error.response.data,
        });
      } else if (error.request) {
        // Request was made but no response received
        return rejectWithValue({
          message: "No response from server",
          status: 0,
        });
      } else {
        // Something else happened
        return rejectWithValue({
          message: error.message || "Unknown error",
          status: 0,
        });
      }
    }
  }
);

// Upload milestone deliverables
export const uploadMilestoneDeliverables = createAsyncThunk(
  "projects/uploadMilestoneDeliverables",
  async (files, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await api.post("/api/upload/milestone-deliverable", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Approve milestone
export const approveMilestone = createAsyncThunk(
  "projects/approveMilestone",
  async ({ projectId, milestoneId, approvalStatus, approvalComment }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/projects/${projectId}/milestones/${milestoneId}/approve`, {
        approvalStatus,
        approvalComment,
      });
      return { ...response.data, projectId }; // Include projectId in the response
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchAllProjectsForAdmin = createAsyncThunk(
  "projects/fetchAllProjectsForAdmin",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { status, category, search, page = 1, limit = 50 } = params;

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (status && status !== "all") queryParams.append("status", status);
      if (category) queryParams.append("category", category);
      if (search) queryParams.append("search", search);
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());

      const response = await api.get(`/api/projects/admin/all?${queryParams.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching admin projects:", error);
      return rejectWithValue(error.response?.data?.message || "Failed to fetch projects for admin");
    }
  }
);

const projectsSlice = createSlice({
  name: "projects",
  initialState: {
    projects: [],
    adminProjects: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch projects
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload.data.projects;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch projects";
      })
      // Create milestone
      .addCase(createMilestone.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMilestone.fulfilled, (state, action) => {
        state.loading = false;
        const project = state.projects.find((p) => p._id === action.payload.projectId);
        if (project) {
          // Initialize milestones array if it doesn't exist
          if (!project.milestones) {
            project.milestones = [];
          }
          project.milestones.push(action.payload.data.milestone);
        }
      })
      .addCase(createMilestone.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to create milestone";
      })
      // Update milestone
      .addCase(updateMilestone.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMilestone.fulfilled, (state, action) => {
        state.loading = false;
        const project = state.projects.find((p) => p._id === action.payload.projectId);
        if (project && project.milestones) {
          const index = project.milestones.findIndex((m) => m._id === action.payload.data.milestone._id);
          if (index !== -1) {
            project.milestones[index] = action.payload.data.milestone;
          }
        }
      })
      .addCase(updateMilestone.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to update milestone";
      })
      // Delete milestone
      .addCase(deleteMilestone.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMilestone.fulfilled, (state, action) => {
        state.loading = false;
        const project = state.projects.find((p) => p._id === action.payload.projectId);
        if (project && project.milestones) {
          project.milestones = project.milestones.filter((m) => m._id !== action.payload.milestoneId);
        }
      })
      .addCase(deleteMilestone.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to delete milestone";
      })
      // Approve milestone
      .addCase(approveMilestone.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approveMilestone.fulfilled, (state, action) => {
        state.loading = false;
        const project = state.projects.find((p) => p._id === action.payload.projectId);
        if (project && project.milestones) {
          const index = project.milestones.findIndex((m) => m._id === action.payload.data.milestone._id);
          if (index !== -1) {
            project.milestones[index] = action.payload.data.milestone;
          }
        }
      })
      .addCase(approveMilestone.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to approve milestone";
      })
      // Start milestone
      .addCase(startMilestone.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startMilestone.fulfilled, (state, action) => {
        state.loading = false;
        // Update milestone in state
        state.projects.forEach((project) => {
          const milestone = project.milestones.find((m) => m._id === action.payload.data.milestone._id);
          if (milestone) {
            Object.assign(milestone, action.payload.data.milestone);
          }
        });
      })
      .addCase(startMilestone.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to start milestone";
      })
      // Submit milestone work
      .addCase(submitMilestoneWork.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitMilestoneWork.fulfilled, (state, action) => {
        state.loading = false;
        state.projects.forEach((project) => {
          const milestone = project.milestones.find((m) => m._id === action.payload.data.milestone._id);
          if (milestone) {
            Object.assign(milestone, action.payload.data.milestone);
          }
        });
      })
      .addCase(submitMilestoneWork.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to submit milestone work";
      })
      // Review milestone work
      .addCase(reviewMilestoneWork.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reviewMilestoneWork.fulfilled, (state, action) => {
        state.loading = false;
        state.projects.forEach((project) => {
          const milestone = project.milestones.find((m) => m._id === action.payload.data.milestone._id);
          if (milestone) {
            Object.assign(milestone, action.payload.data.milestone);
          }
        });
      })
      .addCase(reviewMilestoneWork.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to review milestone work";
      })
      // Resubmit milestone work
      .addCase(resubmitMilestoneWork.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resubmitMilestoneWork.fulfilled, (state, action) => {
        state.loading = false;
        state.projects.forEach((project) => {
          const milestone = project.milestones.find((m) => m._id === action.payload.data.milestone._id);
          if (milestone) {
            Object.assign(milestone, action.payload.data.milestone);
          }
        });
      })
      .addCase(resubmitMilestoneWork.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to resubmit milestone work";
      })
      // Upload milestone deliverables
      .addCase(uploadMilestoneDeliverables.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadMilestoneDeliverables.fulfilled, (state, action) => {
        state.loading = false;
        // File upload successful - don't need to update project state here
      })
      .addCase(uploadMilestoneDeliverables.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to upload deliverables";
      })
      // Get milestone attachments
      .addCase(getMilestoneAttachments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMilestoneAttachments.fulfilled, (state, action) => {
        state.loading = false;
        // Attachments loaded - handled in component
      })
      .addCase(getMilestoneAttachments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to load attachments";
      })
      // Fetch All Projects for Admin
      .addCase(fetchAllProjectsForAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllProjectsForAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.adminProjects = action.payload.projects || [];
      })
      .addCase(fetchAllProjectsForAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch projects for admin";
      });
  },
});

export const { clearError } = projectsSlice.actions;
export default projectsSlice.reducer;
