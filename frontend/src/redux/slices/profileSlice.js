import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import api from "../../api/axios.js";

const initialState = {
  data: null,
  publicProfile: null,
  portfolioItems: [],
  reviews: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchMyProfile = createAsyncThunk("profile/fetchMyProfile", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get("/api/profile/me");
    console.log("response.data", response.data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch profile");
  }
});

export const updateProfile = createAsyncThunk("profile/updateProfile", async (profileData, { rejectWithValue }) => {
  try {
    const response = await api.put("/api/profile", profileData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to update profile");
  }
});

// Keep this for backward compatibility with existing components
export const updateFreelancerProfile = updateProfile;

export const fetchPublicProfile = createAsyncThunk(
  "profile/fetchPublicProfile",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/profile/user/${userId}`);
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

      const response = await api.post("/api/profile/portfolio", formData, {
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
    const response = await api.get(`/api/profile/${userId}/portfolio`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch portfolio");
  }
});

export const fetchReviews = createAsyncThunk("profile/fetchReviews", async (userId, { rejectWithValue }) => {
  try {
    const response = await api.get(`/api/profile/${userId}/reviews`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch reviews");
  }
});

export const submitReview = createAsyncThunk(
  "profile/submitReview",
  async ({ targetId, reviewData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/profile/${targetId}/reviews`, reviewData);
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
        state.data = action.payload;
      })
      .addCase(fetchMyProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
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
