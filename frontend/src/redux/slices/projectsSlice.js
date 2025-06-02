import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// Async thunks
export const fetchProjects = createAsyncThunk("projects/fetchProjects", async ({ status }, { rejectWithValue }) => {
  try {
    const response = await api.get(`/api/projects?status=${status}`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch projects");
  }
});

export const createMilestone = createAsyncThunk(
  "projects/createMilestone",
  async ({ projectId, milestoneData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/projects/${projectId}/milestones`, milestoneData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to create milestone");
    }
  }
);

export const approveMilestone = createAsyncThunk(
  "projects/approveMilestone",
  async ({ projectId, milestoneId, approvalData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/projects/${projectId}/milestones/${milestoneId}/approve`, approvalData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to approve milestone");
    }
  }
);

export const updateMilestone = createAsyncThunk(
  "projects/updateMilestone",
  async ({ projectId, milestoneId, updates }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/projects/${projectId}/milestones/${milestoneId}`, updates);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update milestone");
    }
  }
);

const initialState = {
  active: [],
  completed: [],
  loading: false,
  error: null,
};

const projectsSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    clearProjectsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Projects
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          const status = action.meta.arg.status;
          const projects = action.payload.data.projects;

          if (status === "in_progress") {
            state.active = projects;
          } else if (status === "completed") {
            state.completed = projects;
          }
        } else {
          state.error = action.payload.message;
        }
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch projects";
      })
      // Create Milestone
      .addCase(createMilestone.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMilestone.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          const { projectId } = action.meta.arg;
          const newMilestone = action.payload.data.milestone;

          // Update milestone in both active and completed arrays
          const updateProjectMilestones = (array) => {
            return array.map((project) => {
              if (project._id === projectId) {
                return {
                  ...project,
                  milestones: [...project.milestones, newMilestone],
                };
              }
              return project;
            });
          };

          state.active = updateProjectMilestones(state.active);
          state.completed = updateProjectMilestones(state.completed);
        } else {
          state.error = action.payload.message;
        }
      })
      .addCase(createMilestone.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create milestone";
      })
      // Approve Milestone
      .addCase(approveMilestone.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approveMilestone.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          const { projectId, milestoneId } = action.meta.arg;
          const updatedMilestone = action.payload.data.milestone;

          // Update milestone in both active and completed arrays
          const updateMilestoneInArray = (array) => {
            return array.map((project) => {
              if (project._id === projectId) {
                return {
                  ...project,
                  milestones: project.milestones.map((milestone) =>
                    milestone._id === milestoneId ? updatedMilestone : milestone
                  ),
                };
              }
              return project;
            });
          };

          state.active = updateMilestoneInArray(state.active);
          state.completed = updateMilestoneInArray(state.completed);
        } else {
          state.error = action.payload.message;
        }
      })
      .addCase(approveMilestone.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to approve milestone";
      })
      // Update Milestone
      .addCase(updateMilestone.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMilestone.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          const { projectId, milestoneId } = action.meta.arg;
          const updatedMilestone = action.payload.data.milestone;

          // Update milestone in both active and completed arrays
          const updateMilestoneInArray = (array) => {
            return array.map((project) => {
              if (project._id === projectId) {
                return {
                  ...project,
                  milestones: project.milestones.map((milestone) =>
                    milestone._id === milestoneId ? updatedMilestone : milestone
                  ),
                };
              }
              return project;
            });
          };

          state.active = updateMilestoneInArray(state.active);
          state.completed = updateMilestoneInArray(state.completed);
        } else {
          state.error = action.payload.message;
        }
      })
      .addCase(updateMilestone.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update milestone";
      });
  },
});

export const { clearProjectsError } = projectsSlice.actions;
export default projectsSlice.reducer;
