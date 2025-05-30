import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

const initialState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
  needsVerification: false,
  registrationSuccess: false,
};

// Async thunks
export const login = createAsyncThunk("auth/login", async ({ email, password }, { rejectWithValue }) => {
  try {
    const response = await api.post("/api/auth/login", { email, password });

    // Store token in localStorage
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }

    return response.data;
  } catch (error) {
    // Handle specific error for unverified email
    if (error.response?.data?.needsVerification) {
      return rejectWithValue({
        message: error.response.data.errors[0].msg || "Please verify your email before logging in",
        needsVerification: true,
        email,
      });
    }
    return rejectWithValue({
      message: error.response?.data?.errors?.[0]?.msg || error.response?.data?.error || "Login failed",
    });
  }
});

export const register = createAsyncThunk(
  "auth/register",
  async ({ name, email, password, role }, { rejectWithValue }) => {
    try {
      console.log(name, email, password, role);
      const response = await api.post("/api/auth/register", { name, email, password, role });

      console.log(response.data);
      // Store token in localStorage
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }

      return {
        ...response.data,
        registrationEmail: email,
      };
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.errors?.[0]?.msg || error.response?.data?.error || "Registration failed",
      });
    }
  }
);

export const resendVerification = createAsyncThunk("auth/resendVerification", async (email, { rejectWithValue }) => {
  try {
    const response = await api.post("/api/auth/resend-verification", { email });
    return response.data;
  } catch (error) {
    return rejectWithValue({
      message: error.response?.data?.error || "Failed to resend verification email",
    });
  }
});

export const logout = createAsyncThunk("auth/logout", async () => {
  // Remove token from localStorage
  localStorage.removeItem("token");
  return { success: true };
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearRegistrationSuccess: (state) => {
      state.registrationSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.needsVerification = false;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data.user;
        state.token = action.payload.token;
        state.needsVerification = false;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message;
        state.needsVerification = action.payload?.needsVerification || false;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.registrationSuccess = false;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.registrationSuccess = true;
        // Don't set user and token here since they need to verify email first
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message;
        state.registrationSuccess = false;
      })
      // Resend verification
      .addCase(resendVerification.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resendVerification.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(resendVerification.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isLoading = false;
        state.error = null;
        state.needsVerification = false;
        state.registrationSuccess = false;
      });
  },
});

export const { clearError, clearRegistrationSuccess } = authSlice.actions;
export default authSlice.reducer;
