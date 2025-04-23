import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  freelancerProfile: null,
  clientProfile: null,
  publicProfile: null,
  portfolioItems: [],
  reviews: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchMyProfile = createAsyncThunk("profile/fetchMyProfile", async (_, { rejectWithValue, getState }) => {
  try {
    const { auth } = getState();
    const role = auth.user?.role;

    if (!role) {
      return rejectWithValue("User role not found");
    }

    const endpoint = role === "freelancer" ? "/api/freelancers/me" : "/api/clients/me";
    const response = await axios.get(endpoint);
    return { role, data: response.data };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch profile");
  }
});

export const updateFreelancerProfile = createAsyncThunk(
  "profile/updateFreelancerProfile",
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await axios.put("/api/freelancers/me", profileData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update profile");
    }
  }
);

export const updateClientProfile = createAsyncThunk(
  "profile/updateClientProfile",
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await axios.put("/api/clients/me", profileData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update profile");
    }
  }
);

export const fetchPublicProfile = createAsyncThunk(
  "profile/fetchPublicProfile",
  async ({ userId, role }, { rejectWithValue }) => {
    try {
      const endpoint = role === "freelancer" ? `/api/freelancers/${userId}` : `/api/clients/${userId}`;
      const response = await axios.get(endpoint);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch public profile");
    }
  }
);

export const addPortfolioItem = createAsyncThunk(
  "profile/addPortfolioItem",
  async (portfolioData, { rejectWithValue }) => {
    try {
      const formData = new FormData();

      Object.keys(portfolioData).forEach((key) => {
        if (key === "images") {
          for (let i = 0; i < portfolioData.images.length; i++) {
            formData.append("images", portfolioData.images[i]);
          }
        } else {
          formData.append(key, portfolioData[key]);
        }
      });

      const response = await axios.post("/api/freelancers/portfolio", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to add portfolio item");
    }
  }
);

export const fetchPortfolio = createAsyncThunk("profile/fetchPortfolio", async (userId, { rejectWithValue }) => {
  try {
    const response = await axios.get(`/api/freelancers/${userId}/portfolio`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch portfolio");
  }
});

export const fetchReviews = createAsyncThunk("profile/fetchReviews", async ({ userId, role }, { rejectWithValue }) => {
  try {
    const endpoint = role === "freelancer" ? `/api/freelancers/${userId}/reviews` : `/api/clients/${userId}/reviews`;

    const response = await axios.get(endpoint);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch reviews");
  }
});

export const submitReview = createAsyncThunk(
  "profile/submitReview",
  async ({ targetId, targetRole, reviewData }, { rejectWithValue }) => {
    try {
      const endpoint =
        targetRole === "freelancer" ? `/api/freelancers/${targetId}/reviews` : `/api/clients/${targetId}/reviews`;

      const response = await axios.post(endpoint, reviewData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to submit review");
    }
  }
);

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    clearProfileError: (state) => {
      state.error = null;
    },
    clearPublicProfile: (state) => {
      state.publicProfile = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch My Profile
      .addCase(fetchMyProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.role === "freelancer") {
          state.freelancerProfile = action.payload.data;
        } else if (action.payload.role === "client") {
          state.clientProfile = action.payload.data;
        }
      })
      .addCase(fetchMyProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Freelancer Profile
      .addCase(updateFreelancerProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateFreelancerProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.freelancerProfile = action.payload;
      })
      .addCase(updateFreelancerProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Client Profile
      .addCase(updateClientProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateClientProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.clientProfile = action.payload;
      })
      .addCase(updateClientProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Public Profile
      .addCase(fetchPublicProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPublicProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.publicProfile = action.payload;
      })
      .addCase(fetchPublicProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Add Portfolio Item
      .addCase(addPortfolioItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addPortfolioItem.fulfilled, (state, action) => {
        state.isLoading = false;
        state.portfolioItems.push(action.payload);
      })
      .addCase(addPortfolioItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Portfolio
      .addCase(fetchPortfolio.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPortfolio.fulfilled, (state, action) => {
        state.isLoading = false;
        state.portfolioItems = action.payload;
      })
      .addCase(fetchPortfolio.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Reviews
      .addCase(fetchReviews.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reviews = action.payload;
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Submit Review
      .addCase(submitReview.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(submitReview.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reviews.push(action.payload);
      })
      .addCase(submitReview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearProfileError, clearPublicProfile } = profileSlice.actions;
export default profileSlice.reducer;
