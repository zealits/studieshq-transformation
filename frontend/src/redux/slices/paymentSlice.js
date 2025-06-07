import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// Async thunks
export const getWalletInfo = createAsyncThunk("payment/getWalletInfo", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get("/api/payments/wallet");
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

export const getPaymentMethods = createAsyncThunk("payment/getPaymentMethods", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get("/api/payments/methods");
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

export const addPaymentMethod = createAsyncThunk(
  "payment/addPaymentMethod",
  async (paymentMethodData, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/payments/methods", paymentMethodData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createPayPalOrder = createAsyncThunk(
  "payment/createPayPalOrder",
  async ({ amount }, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/payments/paypal/create-order", { amount });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const capturePayPalPayment = createAsyncThunk(
  "payment/capturePayPalPayment",
  async ({ orderId }, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/payments/paypal/capture-payment", { orderId });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const getTransactions = createAsyncThunk("payment/getTransactions", async (params, { rejectWithValue }) => {
  try {
    const response = await api.get("/api/payments/transactions", { params });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

const initialState = {
  wallet: null,
  paymentMethods: [],
  transactions: [],
  paypalOrder: null,
  loading: false,
  error: null,
  addingFunds: false,
  orderCreating: false,
  paymentCapturing: false,
};

const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearPayPalOrder: (state) => {
      state.paypalOrder = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get wallet info
      .addCase(getWalletInfo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getWalletInfo.fulfilled, (state, action) => {
        state.loading = false;
        state.wallet = action.payload?.data;
      })
      .addCase(getWalletInfo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch wallet info";
      })

      // Get payment methods
      .addCase(getPaymentMethods.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPaymentMethods.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentMethods = action.payload?.data || [];
      })
      .addCase(getPaymentMethods.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch payment methods";
      })

      // Add payment method
      .addCase(addPaymentMethod.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addPaymentMethod.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.data) {
          state.paymentMethods.push(action.payload.data);
        }
      })
      .addCase(addPaymentMethod.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to add payment method";
      })

      // Create PayPal order
      .addCase(createPayPalOrder.pending, (state) => {
        state.orderCreating = true;
        state.error = null;
      })
      .addCase(createPayPalOrder.fulfilled, (state, action) => {
        state.orderCreating = false;
        state.paypalOrder = action.payload?.data;
      })
      .addCase(createPayPalOrder.rejected, (state, action) => {
        state.orderCreating = false;
        state.error = action.payload?.message || "Failed to create PayPal order";
      })

      // Capture PayPal payment
      .addCase(capturePayPalPayment.pending, (state) => {
        state.paymentCapturing = true;
        state.error = null;
      })
      .addCase(capturePayPalPayment.fulfilled, (state, action) => {
        state.paymentCapturing = false;
        // Update wallet with new balance
        if (state.wallet && action.payload?.data?.wallet) {
          state.wallet = action.payload.data.wallet;
        }
        // Add transaction to list
        if (action.payload?.data?.transaction) {
          state.transactions.unshift(action.payload.data.transaction);
        }
        state.paypalOrder = null;
      })
      .addCase(capturePayPalPayment.rejected, (state, action) => {
        state.paymentCapturing = false;
        state.error = action.payload?.message || "Failed to capture PayPal payment";
      })

      // Get transactions
      .addCase(getTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload?.data?.transactions || [];
      })
      .addCase(getTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch transactions";
      });
  },
});

export const { clearError, clearPayPalOrder, setLoading } = paymentSlice.actions;
export default paymentSlice.reducer;
