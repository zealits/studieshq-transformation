import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../api/axios";
import { createSelector } from "@reduxjs/toolkit";

// Async thunk for fetching all freelancers
export const fetchFreelancers = createAsyncThunk("freelancers/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get(`/api/profile/freelancers`);
    console.log("API Response:", response.data);
    // Return the freelancers array directly
    return response.data.data.freelancers;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

const initialState = {
  freelancers: [],
  loading: false,
  error: null,
  filters: {
    searchTerm: "",
    skill: "",
    rate: "",
    experience: "",
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
        state.freelancers = action.payload || [];
        console.log("Redux State Updated:", state.freelancers);
      })
      .addCase(fetchFreelancers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch freelancers";
      });
  },
});

export const { setFilters, clearFilters } = freelancerSlice.actions;

// Base selectors
const selectFreelancerState = (state) => state.freelancers;
const selectFreelancers = (state) => state.freelancers.freelancers;
const selectFilters = (state) => state.freelancers.filters;

// Memoized selectors with transformations
export const selectAllFreelancers = createSelector([selectFreelancers], (freelancers) => freelancers || []);

export const selectFreelancerFilters = createSelector([selectFilters], (filters) => filters);

export const selectFreelancerLoading = createSelector([selectFreelancerState], (state) => state.loading);

export const selectFreelancerError = createSelector([selectFreelancerState], (state) => state.error);

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
