import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// Async thunks
export const fetchUsers = createAsyncThunk(
  "userManagement/fetchUsers",
  async ({ page = 1, limit = 10, role, status, search }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        page,
        limit,
        ...(role && { role }),
        ...(status && { status }),
        ...(search && { search }),
      });

      const response = await api.get(`/api/admin/users?${params}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateUserVerification = createAsyncThunk(
  "userManagement/updateUserVerification",
  async ({ userId, isVerified, verificationDocuments }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/admin/users/${userId}/verify`, {
        isVerified,
        verificationDocuments,
      });
      return response.data.data.user;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  users: [],
  pagination: {
    total: 0,
    page: 1,
    pages: 1,
  },
  loading: false,
  error: null,
};

const userManagementSlice = createSlice({
  name: "userManagement",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.users;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch users";
      })
      // Update User Verification
      .addCase(updateUserVerification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserVerification.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.users.findIndex((user) => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      .addCase(updateUserVerification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to update user verification";
      });
  },
});

export const { clearError } = userManagementSlice.actions;
export default userManagementSlice.reducer;
