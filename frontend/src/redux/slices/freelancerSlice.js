import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../api/axios";
import { createSelector } from "@reduxjs/toolkit";

// Async thunk for fetching all freelancers
export const fetchFreelancers = createAsyncThunk("freelancers/fetchAll", async (filters = {}, { rejectWithValue }) => {
  try {
    // Build query parameters for country filtering
    const queryParams = new URLSearchParams();
    if (filters.country) {
      queryParams.append("country", filters.country);
    }

    const response = await axios.get(`/api/profile/freelancers?${queryParams.toString()}`);
    console.log("API Response:", response.data);
    // Return the freelancers array directly along with filter info
    return {
      freelancers: response.data.data.freelancers,
      isFiltered: !!filters.country,
    };
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

// Fetch all freelancers without filters for dropdown options
export const fetchAllFreelancersForOptions = createAsyncThunk(
  "freelancers/fetchAllForOptions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/profile/freelancers`);
      return response.data.data.freelancers;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  freelancers: [],
  allFreelancers: [], // Store all freelancers for dropdown options
  loading: false,
  error: null,
  filters: {
    searchTerm: "",
    skill: "",
    rate: "",
    experience: "",
    country: "",
  },
};

const freelancerSlice = createSlice({
  name: "freelancers",
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFreelancers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFreelancers.fulfilled, (state, action) => {
        state.loading = false;
        // Set the freelancers array directly from the action payload
        state.freelancers = action.payload.freelancers || [];
        // If this is unfiltered data, also update allFreelancers
        if (!action.payload.isFiltered) {
          state.allFreelancers = action.payload.freelancers || [];
        }
        console.log("Redux State Updated:", state.freelancers);
      })
      .addCase(fetchFreelancers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch freelancers";
      })
      .addCase(fetchAllFreelancersForOptions.fulfilled, (state, action) => {
        state.allFreelancers = action.payload || [];
      });
  },
});

export const { setFilters, clearFilters } = freelancerSlice.actions;

// Simple selectors (no createSelector needed for these)
export const selectFreelancerLoading = (state) => state.freelancers.loading;
export const selectFreelancerError = (state) => state.freelancers.error;
export const selectFreelancerFilters = (state) => state.freelancers.filters;

// Base selectors for createSelector
const selectFreelancers = (state) => state.freelancers.freelancers;
const selectFilters = (state) => state.freelancers.filters;

// Memoized selectors with proper transformations
export const selectAllFreelancers = createSelector([(state) => state.freelancers.allFreelancers], (allFreelancers) =>
  Array.isArray(allFreelancers) ? allFreelancers : []
);

// Memoized filtered freelancers selector with proper transformation
export const selectFilteredFreelancers = createSelector([selectFreelancers, selectFilters], (freelancers, filters) => {
  if (!Array.isArray(freelancers)) return [];

  return freelancers.filter((freelancer) => {
    if (!freelancer || !freelancer.user) return false;

    const matchesSearch =
      freelancer.user.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      (Array.isArray(freelancer.skills) &&
        freelancer.skills.some((skill) => skill.toLowerCase().includes(filters.searchTerm.toLowerCase())));

    const matchesSkill =
      !filters.skill || (Array.isArray(freelancer.skills) && freelancer.skills.includes(filters.skill));

    // Location filtering is now handled by backend, so we don't need to filter here
    // const matchesLocation =
    //   !filters.location ||
    //   (freelancer.location && freelancer.location.toLowerCase().includes(filters.location.toLowerCase()));

    const matchesRate =
      !filters.rate ||
      (() => {
        const rate = Number(freelancer.hourlyRate);
        if (isNaN(rate)) return true;

        switch (filters.rate) {
          case "0-20":
            return rate <= 20;
          case "20-40":
            return rate > 20 && rate <= 40;
          case "40-60":
            return rate > 40 && rate <= 60;
          case "60+":
            return rate > 60;
          default:
            return true;
        }
      })();

    return matchesSearch && matchesSkill && matchesRate;
  });
});

export default freelancerSlice.reducer;
