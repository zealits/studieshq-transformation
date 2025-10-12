import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

const initialState = {
  companyProfile: null,
  isLoading: false,
  error: null,
  updateSuccess: false,
};

// Async thunks
export const getCompanyProfile = createAsyncThunk("company/getProfile", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get("/api/company/profile");
    return response.data;
  } catch (error) {
    return rejectWithValue({
      message: error.response?.data?.error || "Failed to fetch company profile",
    });
  }
});

export const updateCompanyProfile = createAsyncThunk(
  "company/updateProfile",
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await api.put("/api/company/profile", profileData);
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.error || "Failed to update company profile",
      });
    }
  }
);

export const uploadCompanyDocument = createAsyncThunk(
  "company/uploadDocument",
  async (documentData, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/company/documents", documentData);
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.error || "Failed to upload document",
      });
    }
  }
);

export const getVerificationStatus = createAsyncThunk(
  "company/getVerificationStatus",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/company/verification-status");
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.error || "Failed to fetch verification status",
      });
    }
  }
);

const companySlice = createSlice({
  name: "company",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearUpdateSuccess: (state) => {
      state.updateSuccess = false;
    },
    clearAllMessages: (state) => {
      state.error = null;
      state.updateSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get company profile
      .addCase(getCompanyProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCompanyProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.companyProfile = action.payload.data;
      })
      .addCase(getCompanyProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message;
      })
      // Update company profile
      .addCase(updateCompanyProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.updateSuccess = false;
      })
      .addCase(updateCompanyProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.updateSuccess = true;
        state.companyProfile = action.payload.data;
      })
      .addCase(updateCompanyProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message;
        state.updateSuccess = false;
      })
      // Upload document
      .addCase(uploadCompanyDocument.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadCompanyDocument.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update the company profile with new document
        if (state.companyProfile) {
          state.companyProfile.user.company.documents.push(action.payload.data.document);
        }
      })
      .addCase(uploadCompanyDocument.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message;
      })
      // Get verification status
      .addCase(getVerificationStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getVerificationStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update verification status in company profile
        if (state.companyProfile) {
          state.companyProfile.user.company.verificationStatus = action.payload.data.verificationStatus;
          state.companyProfile.user.company.documents = action.payload.data.documents;
        }
      })
      .addCase(getVerificationStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message;
      });
  },
});

export const { clearError, clearUpdateSuccess, clearAllMessages } = companySlice.actions;
export default companySlice.reducer;
