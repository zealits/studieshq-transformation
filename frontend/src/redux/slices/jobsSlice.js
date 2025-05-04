import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios.js";

const initialState = {
  jobs: [],
  filteredJobs: [],
  job: null,
  clientJobs: {
    active: [],
    closed: [],
    draft: [],
  },
  proposals: [],
  myProposals: [],
  savedJobs: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchJobs = createAsyncThunk("jobs/fetchJobs", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get("/api/jobs");
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch jobs");
  }
});

export const fetchClientJobs = createAsyncThunk("jobs/fetchClientJobs", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get("/api/jobs?mine=true");
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch client jobs");
  }
});

export const fetchJobById = createAsyncThunk("jobs/fetchJobById", async (jobId, { rejectWithValue }) => {
  try {
    const response = await api.get(`/api/jobs/${jobId}`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch job details");
  }
});

export const createJob = createAsyncThunk("jobs/createJob", async (jobData, { rejectWithValue }) => {
  try {
    const response = await api.post("/api/jobs", jobData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to create job");
  }
});

export const saveJobAsDraft = createAsyncThunk("jobs/saveJobAsDraft", async (jobData, { rejectWithValue }) => {
  try {
    // Add draft status to job data
    const draftData = { ...jobData, status: "draft" };
    const response = await api.post("/api/jobs", draftData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to save job as draft");
  }
});

export const updateJob = createAsyncThunk("jobs/updateJob", async ({ jobId, jobData }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/api/jobs/${jobId}`, jobData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to update job");
  }
});

export const submitProposal = createAsyncThunk(
  "jobs/submitProposal",
  async ({ jobId, proposalData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/jobs/${jobId}/proposals`, proposalData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to submit proposal");
    }
  }
);

export const saveJob = createAsyncThunk("jobs/saveJob", async (jobId, { rejectWithValue }) => {
  try {
    const response = await api.post(`/api/jobs/${jobId}/save`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to save job");
  }
});

export const fetchSavedJobs = createAsyncThunk("jobs/fetchSavedJobs", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get("/api/jobs/saved");
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch saved jobs");
  }
});

export const publishDraftJob = createAsyncThunk("jobs/publishDraftJob", async (jobId, { rejectWithValue }) => {
  try {
    const response = await api.put(`/api/jobs/${jobId}/publish`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to publish job");
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
        state.jobs = action.payload?.data?.jobs || [];
        state.filteredJobs = action.payload?.data?.jobs || [];
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Client Jobs
      .addCase(fetchClientJobs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchClientJobs.fulfilled, (state, action) => {
        state.isLoading = false;
        // Categorize jobs by status
        const jobs = action.payload?.data?.jobs || [];
        state.clientJobs = {
          active: jobs.filter((job) => job.status === "open" || job.status === "in_progress"),
          closed: jobs.filter((job) => job.status === "completed" || job.status === "cancelled"),
          draft: jobs.filter((job) => job.status === "draft"),
        };
      })
      .addCase(fetchClientJobs.rejected, (state, action) => {
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
        state.job = action.payload?.data?.job || null;
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
        const newJob = action.payload?.data?.job;
        if (newJob) {
          state.clientJobs.active.unshift(newJob);
          state.jobs.unshift(newJob);
          state.filteredJobs.unshift(newJob);
        }
      })
      .addCase(createJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Save Job as Draft
      .addCase(saveJobAsDraft.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveJobAsDraft.fulfilled, (state, action) => {
        state.isLoading = false;
        const newDraft = action.payload?.data?.job;
        if (newDraft) {
          state.clientJobs.draft.unshift(newDraft);
        }
      })
      .addCase(saveJobAsDraft.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Job
      .addCase(updateJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateJob.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedJob = action.payload.data.job;

        // Update job in the appropriate category based on status
        if (updatedJob.status === "open" || updatedJob.status === "in_progress") {
          state.clientJobs.active = state.clientJobs.active.map((job) =>
            job._id === updatedJob._id ? updatedJob : job
          );
          // If it was previously in draft, remove it from there
          state.clientJobs.draft = state.clientJobs.draft.filter((job) => job._id !== updatedJob._id);
        } else if (updatedJob.status === "completed" || updatedJob.status === "cancelled") {
          state.clientJobs.closed = state.clientJobs.closed.map((job) =>
            job._id === updatedJob._id ? updatedJob : job
          );
          // If it was previously active, remove it from there
          state.clientJobs.active = state.clientJobs.active.filter((job) => job._id !== updatedJob._id);
        } else if (updatedJob.status === "draft") {
          state.clientJobs.draft = state.clientJobs.draft.map((job) => (job._id === updatedJob._id ? updatedJob : job));
        }

        // Update in main jobs array
        state.jobs = state.jobs.map((job) => (job._id === updatedJob._id ? updatedJob : job));
        state.filteredJobs = state.filteredJobs.map((job) => (job._id === updatedJob._id ? updatedJob : job));
      })
      .addCase(updateJob.rejected, (state, action) => {
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
        const proposal = action.payload?.data?.proposal;
        if (proposal) {
          state.myProposals.push(proposal);
        }
      })
      .addCase(submitProposal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Save Job
      .addCase(saveJob.fulfilled, (state, action) => {
        const job = action.payload?.data?.job;
        if (job && !state.savedJobs.some((savedJob) => savedJob._id === job._id)) {
          state.savedJobs.push(job);
        }
      })
      // Fetch Saved Jobs
      .addCase(fetchSavedJobs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSavedJobs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.savedJobs = action.payload?.data?.jobs || [];
      })
      .addCase(fetchSavedJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Publish Draft Job
      .addCase(publishDraftJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(publishDraftJob.fulfilled, (state, action) => {
        state.isLoading = false;
        const publishedJob = action.payload?.data?.job;

        if (publishedJob) {
          // Remove from draft jobs
          state.clientJobs.draft = state.clientJobs.draft.filter((job) => job._id !== publishedJob._id);

          // Add to active jobs
          state.clientJobs.active.unshift(publishedJob);

          // Update in main jobs array if it exists
          state.jobs = state.jobs.map((job) => (job._id === publishedJob._id ? publishedJob : job));
          state.filteredJobs = state.filteredJobs.map((job) => (job._id === publishedJob._id ? publishedJob : job));
        }
      })
      .addCase(publishDraftJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearJobError, filterJobs } = jobsSlice.actions;
export default jobsSlice.reducer;
