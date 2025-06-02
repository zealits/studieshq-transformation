import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// Fetch projects
export const fetchProjects = createAsyncThunk("projects/fetchProjects", async ({ status }, { rejectWithValue }) => {
  try {
    console.log("status", status);
    const response = await api.get(`/api/projects?status=${status}`);
    console.log("response", response);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

// Create milestone
export const createMilestone = createAsyncThunk(
  "projects/createMilestone",
  async ({ projectId, milestone }, { rejectWithValue }) => {
    try {
      console.log("milestone", milestone);
      const response = await api.post(`/api/projects/${projectId}/milestones`, milestone);
      return response.data;
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
      return response.data;
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
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const projectsSlice = createSlice({
  name: "projects",
  initialState: {
    projects: [],
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
        const project = state.projects.find((p) => p._id === action.payload.data.milestone.project);
        if (project) {
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
        const project = state.projects.find((p) => p._id === action.payload.data.milestone.project);
        if (project) {
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
        const project = state.projects.find((p) => p._id === action.payload.data.project);
        if (project) {
          project.milestones = project.milestones.filter((m) => m._id !== action.payload.data.milestoneId);
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
        const project = state.projects.find((p) => p._id === action.payload.data.milestone.project);
        if (project) {
          const index = project.milestones.findIndex((m) => m._id === action.payload.data.milestone._id);
          if (index !== -1) {
            project.milestones[index] = action.payload.data.milestone;
          }
        }
      })
      .addCase(approveMilestone.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to approve milestone";
      });
  },
});

export const { clearError } = projectsSlice.actions;
export default projectsSlice.reducer;
