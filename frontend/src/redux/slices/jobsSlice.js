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
  adminJobs: [],
  jobCountsByCategory: [], // Add job counts by category
  proposals: [],
  myProposals: [],
  savedJobs: [],
  isLoading: false,
  error: null,
  categories: [],
};

// Async thunks
export const fetchJobs = createAsyncThunk("jobs/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get("/api/jobs");
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

export const fetchClientJobs = createAsyncThunk("jobs/fetchClientJobs", async (_, { rejectWithValue, getState }) => {
  try {
    // Get the current user from auth state
    const { auth } = getState();
    const clientId = auth?.user?.id;

    if (!clientId) {
      return rejectWithValue("Client ID not found. Please re-login.");
    }

    // Check for auth token
    const token = localStorage.getItem("token");
    console.log(`Auth token available: ${!!token}`);
    if (!token) {
      console.error("No authentication token found in localStorage");
      return rejectWithValue("Authentication token missing. Please re-login.");
    }

    // Explicitly request only the client's own jobs with mine=true and clientId parameter
    console.log(`Fetching client jobs for client ID: ${clientId}`);
    const response = await api.get(`/api/jobs?mine=true&clientId=${clientId}`);

    // Log the response for debugging
    console.log(`Received ${response.data?.data?.jobs?.length || 0} client jobs`);

    return response.data;
  } catch (error) {
    console.error("Error fetching client jobs:", error);
    console.error("Response:", error.response?.data);
    return rejectWithValue(error.response?.data?.message || "Failed to fetch client jobs");
  }
});

export const fetchJobById = createAsyncThunk("jobs/fetchJobById", async (jobId, { rejectWithValue, getState }) => {
  try {
    console.log("Fetching job by ID:", jobId);

    // Get the current user info from auth state
    const { auth } = getState();
    const isClient = auth?.user?.role === "client";

    // Check for auth token
    const token = localStorage.getItem("token");
    console.log(`Auth token available: ${!!token}`);
    if (!token) {
      console.error("No authentication token found in localStorage");
      return rejectWithValue("Authentication token missing. Please re-login.");
    }

    if (isClient) {
      // For clients, let's verify this job belongs to them by checking clientJobs first
      const { clientJobs } = getState().jobs;
      const allClientJobs = [...clientJobs.active, ...clientJobs.closed, ...clientJobs.draft];

      // Check if this job exists in the client's jobs
      const jobExists = allClientJobs.some((job) => job._id === jobId);

      console.log(`Client attempting to fetch job ${jobId}, exists in client jobs: ${jobExists}`);

      // If we already know the client doesn't own this job, deny access early
      if (!jobExists) {
        console.warn(`Client attempted to access job ${jobId} which they don't own`);
        // Let the API call proceed anyway, as the backend will handle authorization
      }
    }

    const response = await api.get(`/api/jobs/${jobId}`);
    console.log(`Fetched job ${jobId} successfully`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching job ${jobId}:`, error);

    // If authentication error (401), provide a specific message
    if (error.response?.status === 401) {
      return rejectWithValue("Authentication required. Please log in again.");
    }

    // If access denied (403), provide a more specific error message
    if (error.response?.status === 403) {
      return rejectWithValue("You don't have permission to view this job");
    }

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

export const fetchJobProposals = createAsyncThunk("jobs/fetchJobProposals", async (jobId, { rejectWithValue }) => {
  try {
    const response = await api.get(`/api/jobs/${jobId}/proposals`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch proposals");
  }
});

export const updateProposalStatus = createAsyncThunk(
  "jobs/updateProposalStatus",
  async ({ jobId, proposalId, status }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/jobs/${jobId}/proposals/${proposalId}`, { status });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update proposal status");
    }
  }
);

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

export const fetchAllJobsForAdmin = createAsyncThunk(
  "jobs/fetchAllJobsForAdmin",
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

      const response = await api.get(`/api/jobs/admin/all?${queryParams.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching admin jobs:", error);
      return rejectWithValue(error.response?.data?.message || "Failed to fetch jobs for admin");
    }
  }
);

export const fetchJobCountsByCategory = createAsyncThunk(
  "jobs/fetchJobCountsByCategory",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/jobs/categories/counts");
      return response.data.data;
    } catch (error) {
      console.error("Error fetching job counts by category:", error);
      return rejectWithValue(error.response?.data?.message || "Failed to fetch job counts by category");
    }
  }
);

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

      // Search filter
      if (query) {
        const searchTerm = query.toLowerCase();
        filtered = filtered.filter(
          (job) =>
            job.title.toLowerCase().includes(searchTerm) ||
            job.description.toLowerCase().includes(searchTerm) ||
            job.skills.some((skill) => skill.toLowerCase().includes(searchTerm))
        );
      }

      // Category filter
      if (filters.category) {
        filtered = filtered.filter((job) => job.category === filters.category);
      }

      // Budget filter
      if (filters.budget) {
        filtered = filtered.filter((job) => {
          const [min, max] = filters.budget.split("-").map(Number);
          const jobBudget = job.budget.type === "fixed" ? job.budget.max : job.budget.max * 40; // Assuming 40 hours per week for hourly jobs

          if (filters.budget === "10000+") {
            return jobBudget >= 10000;
          }
          return jobBudget >= min && jobBudget <= max;
        });
      }

      // Job type filter
      if (filters.jobType) {
        filtered = filtered.filter((job) => job.budget.type === filters.jobType);
      }

      // Experience level filter
      if (filters.experience) {
        filtered = filtered.filter((job) => job.experience === filters.experience);
      }

      // Sorting
      switch (filters.sortBy) {
        case "newest":
          filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break;
        case "budget-high":
          filtered.sort((a, b) => {
            const budgetA = a.budget.type === "fixed" ? a.budget.max : a.budget.max * 40;
            const budgetB = b.budget.type === "fixed" ? b.budget.max : b.budget.max * 40;
            return budgetB - budgetA;
          });
          break;
        case "budget-low":
          filtered.sort((a, b) => {
            const budgetA = a.budget.type === "fixed" ? a.budget.min : a.budget.min * 40;
            const budgetB = b.budget.type === "fixed" ? b.budget.min : b.budget.min * 40;
            return budgetA - budgetB;
          });
          break;
        case "proposals":
          filtered.sort((a, b) => (b.proposals?.length || 0) - (a.proposals?.length || 0));
          break;
        default:
          break;
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
        state.jobs = action.payload.jobs || [];
        state.filteredJobs = action.payload.jobs || [];
        // Extract unique categories from jobs
        state.categories = [...new Set(action.payload.jobs.map((job) => job.category))].filter(Boolean);
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch jobs";
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
          active: jobs.filter((job) => job.status === "open"),
          closed: jobs.filter(
            (job) => job.status === "in_progress" || job.status === "completed" || job.status === "cancelled"
          ),
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
          // Add job to appropriate category based on its status
          if (newJob.status === "draft") {
            state.clientJobs.draft.unshift(newJob);
          } else if (newJob.status === "open" || newJob.status === "in_progress") {
            state.clientJobs.active.unshift(newJob);
          } else if (newJob.status === "completed" || newJob.status === "cancelled") {
            state.clientJobs.closed.unshift(newJob);
          }

          // Add to main jobs array regardless of status
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
      // Fetch Job Proposals
      .addCase(fetchJobProposals.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobProposals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.proposals = action.payload?.data?.proposals || [];

        // Also update proposals in the corresponding job in clientJobs
        const proposals = action.payload?.data?.proposals || [];
        const jobId = action.meta.arg; // The job ID from the original request

        // Update in active jobs
        const activeJobIndex = state.clientJobs.active.findIndex((job) => job._id === jobId);
        if (activeJobIndex !== -1) {
          state.clientJobs.active[activeJobIndex].proposals = proposals;
        }

        // Update in closed jobs
        const closedJobIndex = state.clientJobs.closed.findIndex((job) => job._id === jobId);
        if (closedJobIndex !== -1) {
          state.clientJobs.closed[closedJobIndex].proposals = proposals;
        }
      })
      .addCase(fetchJobProposals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Proposal Status
      .addCase(updateProposalStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProposalStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedProposal = action.payload?.data?.proposal;

        // Update the proposal in the proposals array
        if (updatedProposal) {
          state.proposals = state.proposals.map((proposal) =>
            proposal._id === updatedProposal._id ? updatedProposal : proposal
          );

          // Also update in the job's proposals
          const jobId = action.meta.arg.jobId;

          // Update in active jobs
          const activeJobIndex = state.clientJobs.active.findIndex((job) => job._id === jobId);
          if (activeJobIndex !== -1) {
            state.clientJobs.active[activeJobIndex].proposals = state.clientJobs.active[activeJobIndex].proposals.map(
              (proposal) => (proposal._id === updatedProposal._id ? updatedProposal : proposal)
            );

            // If the job status changes to in_progress (when a proposal is accepted)
            if (updatedProposal.status === "accepted") {
              state.clientJobs.active[activeJobIndex].status = "in_progress";
            }
          }

          // Update in closed jobs
          const closedJobIndex = state.clientJobs.closed.findIndex((job) => job._id === jobId);
          if (closedJobIndex !== -1) {
            state.clientJobs.closed[closedJobIndex].proposals = state.clientJobs.closed[closedJobIndex].proposals.map(
              (proposal) => (proposal._id === updatedProposal._id ? updatedProposal : proposal)
            );
          }
        }
      })
      .addCase(updateProposalStatus.rejected, (state, action) => {
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
      })
      // Fetch All Jobs for Admin
      .addCase(fetchAllJobsForAdmin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllJobsForAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.adminJobs = action.payload.jobs || [];
        // Extract unique categories from admin jobs
        state.categories = action.payload.categories || [];
      })
      .addCase(fetchAllJobsForAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch jobs for admin";
      })
      // Fetch Job Counts by Category
      .addCase(fetchJobCountsByCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobCountsByCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.jobCountsByCategory = action.payload || [];
      })
      .addCase(fetchJobCountsByCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearJobError, filterJobs } = jobsSlice.actions;
export default jobsSlice.reducer;
