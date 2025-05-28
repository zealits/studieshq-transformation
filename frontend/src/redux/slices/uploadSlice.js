import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios.js";
import { fetchMyProfile } from "./profileSlice";

// Upload profile image
export const uploadProfileImage = createAsyncThunk(
  "upload/profileImage",
  async (imageFile, { rejectWithValue, dispatch }) => {
    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      const response = await api.post("/api/upload/profile-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Refresh profile data after successful upload
      await dispatch(fetchMyProfile());

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Upload failed" });
    }
  }
);

const uploadSlice = createSlice({
  name: "upload",
  initialState: {
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    resetUploadState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadProfileImage.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(uploadProfileImage.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(uploadProfileImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Upload failed";
      });
  },
});

export const { resetUploadState } = uploadSlice.actions;
export default uploadSlice.reducer;
