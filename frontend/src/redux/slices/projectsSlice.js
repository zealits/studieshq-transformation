import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// Async thunks
export const fetchProjects = createAsyncThunk("projects/fetchProjects", async ({ status }, { rejectWithValue }) => {
  try {
    const response = await api.get(`/api/projects?status=${status}`);
    console.log("API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("API Error:", error.response?.data || error);
    return rejectWithValue(error.response?.data?.message || "Failed to fetch projects");
  }
});

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
        console.log("Action Payload:", action.payload);
        console.log("Status:", action.meta.arg.status);

        if (action.payload.success) {
          const status = action.meta.arg.status;
          const projects = action.payload.data.projects;

          if (status === "in_progress") {
            state.active = projects;
          } else if (status === "completed") {
            state.completed = projects;
          }

          console.log("Updated State:", {
            active: state.active,
            completed: state.completed,
          });
        } else {
          state.error = action.payload.message;
        }
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch projects";
        console.error("Fetch Projects Error:", action.payload);
      })
      // Update Milestone
      .addCase(updateMilestone.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMilestone.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          // Update the milestone in both active and completed arrays
          const updateMilestoneInArray = (array) => {
            return array.map((project) => {
              if (project._id === action.meta.arg.projectId) {
                return {
                  ...project,
                  milestones: project.milestones.map((milestone) =>
                    milestone._id === action.meta.arg.milestoneId
                      ? { ...milestone, ...action.payload.data.milestone }
                      : milestone
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
