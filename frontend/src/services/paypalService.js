import api from "../api/axios";

class PayPalService {
  /**
   * Withdraw funds via PayPal
   * @param {Object} withdrawalData - Withdrawal data containing amount
   * @returns {Promise<Object>} API response
   */
  async withdrawViaPayPal(withdrawalData) {
    try {
      console.log("💰 PAYPAL SERVICE: Initiating PayPal withdrawal:", withdrawalData);

      const response = await api.post("/api/payments/paypal/withdraw", withdrawalData);

      console.log("💰 PAYPAL SERVICE: PayPal withdrawal response:", response.data);

      return response.data;
    } catch (error) {
      console.error("💰 PAYPAL SERVICE: PayPal withdrawal error:", error);

      // Handle error response
      if (error.response?.data) {
        throw new Error(error.response.data.message || "PayPal withdrawal failed");
      }

      throw new Error("Network error during PayPal withdrawal");
    }
  }

  /**
   * Get PayPal withdrawal history
   * @param {Object} params - Query parameters (page, limit)
   * @returns {Promise<Object>} API response
   */
  async getWithdrawalHistory(params = {}) {
    try {
      console.log("💰 PAYPAL SERVICE: Fetching PayPal withdrawal history:", params);

      const response = await api.get("/api/payments/paypal/withdrawals", { params });

      console.log("💰 PAYPAL SERVICE: PayPal withdrawal history response:", response.data);

      return response.data;
    } catch (error) {
      console.error("💰 PAYPAL SERVICE: Get withdrawal history error:", error);

      if (error.response?.data) {
        throw new Error(error.response.data.message || "Failed to fetch withdrawal history");
      }

      throw new Error("Network error while fetching withdrawal history");
    }
  }

  /**
   * Check PayPal payout status
   * @param {string} batchId - PayPal payout batch ID
   * @returns {Promise<Object>} API response
   */
  async checkPayoutStatus(batchId) {
    try {
      console.log("💰 PAYPAL SERVICE: Checking PayPal payout status for batch:", batchId);

      const response = await api.get(`/api/payments/paypal/payout/${batchId}/status`);

      console.log("💰 PAYPAL SERVICE: PayPal payout status response:", response.data);

      return response.data;
    } catch (error) {
      console.error("💰 PAYPAL SERVICE: Check payout status error:", error);

      if (error.response?.data) {
        throw new Error(error.response.data.message || "Failed to check payout status");
      }

      throw new Error("Network error while checking payout status");
    }
  }

  /**
   * Validate withdrawal amount
   * @param {number} amount - Amount to validate
   * @param {number} availableBalance - Available balance
   * @returns {Object} Validation result
   */
  validateWithdrawalAmount(amount, availableBalance) {
    const validation = {
      valid: true,
      error: null,
    };

    if (!amount || isNaN(amount)) {
      validation.valid = false;
      validation.error = "Please enter a valid amount";
      return validation;
    }

    const numericAmount = parseFloat(amount);

    if (numericAmount <= 0) {
      validation.valid = false;
      validation.error = "Amount must be greater than 0";
      return validation;
    }

    if (numericAmount < 1) {
      validation.valid = false;
      validation.error = "Minimum withdrawal amount is $1.00";
      return validation;
    }

    if (numericAmount > availableBalance) {
      validation.valid = false;
      validation.error = `Amount exceeds available balance ($${availableBalance.toFixed(2)})`;
      return validation;
    }

    // Optional: Add maximum withdrawal limit
    const maxWithdrawal = 10000; // $10,000 max per withdrawal
    if (numericAmount > maxWithdrawal) {
      validation.valid = false;
      validation.error = `Maximum withdrawal amount is $${maxWithdrawal.toLocaleString()}`;
      return validation;
    }

    return validation;
  }

  /**
   * Calculate withdrawal fees and net amount
   * @param {number} amount - Gross withdrawal amount
   * @returns {Object} Fee calculation result
   */
  calculateWithdrawalFees(amount) {
    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      return {
        grossAmount: 0,
        fee: 0,
        netAmount: 0,
        feePercentage: 0,
      };
    }

    // 1% platform fee
    const feePercentage = 0.01;
    const fee = numericAmount * feePercentage;
    const netAmount = numericAmount - fee;

    return {
      grossAmount: numericAmount,
      fee: fee,
      netAmount: netAmount,
      feePercentage: feePercentage * 100, // Convert to percentage for display
    };
  }
}

export default new PayPalService();
