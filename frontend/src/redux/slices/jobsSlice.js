import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  jobs: [],
  filteredJobs: [],
  job: null,
  proposals: [],
  myProposals: [],
  savedJobs: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchJobs = createAsyncThunk("jobs/fetchJobs", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get("/api/jobs");
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch jobs");
  }
});

export const fetchJobById = createAsyncThunk("jobs/fetchJobById", async (jobId, { rejectWithValue }) => {
  try {
    const response = await axios.get(`/api/jobs/${jobId}`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch job details");
  }
});

export const createJob = createAsyncThunk("jobs/createJob", async (jobData, { rejectWithValue }) => {
  try {
    const response = await axios.post("/api/jobs", jobData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to create job");
  }
});

export const submitProposal = createAsyncThunk(
  "jobs/submitProposal",
  async ({ jobId, proposalData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/jobs/${jobId}/proposals`, proposalData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to submit proposal");
    }
  }
);

export const fetchMyProposals = createAsyncThunk("jobs/fetchMyProposals", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get("/api/proposals/me");
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch your proposals");
  }
});

export const saveJob = createAsyncThunk("jobs/saveJob", async (jobId, { rejectWithValue }) => {
  try {
    const response = await axios.post(`/api/jobs/${jobId}/save`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to save job");
  }
});

export const fetchSavedJobs = createAsyncThunk("jobs/fetchSavedJobs", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get("/api/jobs/saved");
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch saved jobs");
  }
});

const jobsSlice = createSlice({
  name: "jobs",
  initialState,
  reducers: {
    clearJobError: (state) => {
      state.error = null;
    },
    filterJobs: (state, action) => {
      const { query, filters } = action.payload;
      let filtered = [...state.jobs];

      // Apply search query if provided
      if (query) {
        const searchTerms = query.toLowerCase().split(" ");
        filtered = filtered.filter((job) => {
          return searchTerms.every(
            (term) =>
              job.title.toLowerCase().includes(term) ||
              job.description.toLowerCase().includes(term) ||
              job.skills.some((skill) => skill.toLowerCase().includes(term))
          );
        });
      }

      // Apply filters if provided
      if (filters) {
        if (filters.payRange) {
          const [min, max] = filters.payRange;
          filtered = filtered.filter((job) => job.budget >= min && (max === null || job.budget <= max));
        }

        if (filters.jobType && filters.jobType.length > 0) {
          filtered = filtered.filter((job) => filters.jobType.includes(job.jobType));
        }

        if (filters.experienceLevel && filters.experienceLevel.length > 0) {
          filtered = filtered.filter((job) => filters.experienceLevel.includes(job.experienceLevel));
        }

        if (filters.skills && filters.skills.length > 0) {
          filtered = filtered.filter((job) => filters.skills.some((skill) => job.skills.includes(skill)));
        }
      }

      state.filteredJobs = filtered;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Jobs
      .addCase(fetchJobs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.jobs = action.payload;
        state.filteredJobs = action.payload;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Job by ID
      .addCase(fetchJobById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.job = action.payload;
      })
      .addCase(fetchJobById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create Job
      .addCase(createJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createJob.fulfilled, (state, action) => {
        state.isLoading = false;
        state.jobs.unshift(action.payload);
        state.filteredJobs.unshift(action.payload);
      })
      .addCase(createJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Submit Proposal
      .addCase(submitProposal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(submitProposal.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myProposals.push(action.payload);
      })
      .addCase(submitProposal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch My Proposals
      .addCase(fetchMyProposals.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyProposals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myProposals = action.payload;
      })
      .addCase(fetchMyProposals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Save Job
      .addCase(saveJob.fulfilled, (state, action) => {
        if (!state.savedJobs.some((job) => job._id === action.payload._id)) {
          state.savedJobs.push(action.payload);
        }
      })
      // Fetch Saved Jobs
      .addCase(fetchSavedJobs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSavedJobs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.savedJobs = action.payload;
      })
      .addCase(fetchSavedJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearJobError, filterJobs } = jobsSlice.actions;
export default jobsSlice.reducer;
