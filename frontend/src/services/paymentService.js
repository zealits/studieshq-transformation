import api from "../api/axios";

class PaymentService {
  /**
   * Get all payment methods for current user
   * @returns {Promise<Object>} API response with payment methods
   */
  async getPaymentMethods() {
    try {
      console.log("💳 PAYMENT SERVICE: Getting payment methods...");

      const response = await api.get("/api/payments/methods");

      console.log("💳 PAYMENT SERVICE: ✅ Payment methods retrieved successfully");

      return response.data;
    } catch (error) {
      console.error("💳 PAYMENT SERVICE: ❌ Error getting payment methods:", error);

      if (error.response?.data) {
        throw new Error(error.response.data.message || "Failed to get payment methods");
      }

      throw new Error("Network error while getting payment methods");
    }
  }

  /**
   * Delete a payment method
   * @param {string} methodId - Payment method ID
   * @returns {Promise<Object>} API response
   */
  async deletePaymentMethod(methodId) {
    try {
      console.log("💳 PAYMENT SERVICE: Deleting payment method:", methodId);

      const response = await api.delete(`/api/payments/methods/${methodId}`);

      console.log("💳 PAYMENT SERVICE: ✅ Payment method deleted successfully");

      return response.data;
    } catch (error) {
      console.error("💳 PAYMENT SERVICE: ❌ Error deleting payment method:", error);

      if (error.response?.data) {
        throw new Error(error.response.data.message || "Failed to delete payment method");
      }

      throw new Error("Network error while deleting payment method");
    }
  }

  /**
   * Set payment method as default
   * @param {string} methodId - Payment method ID
   * @returns {Promise<Object>} API response
   */
  async setDefaultPaymentMethod(methodId) {
    try {
      console.log("💳 PAYMENT SERVICE: Setting default payment method:", methodId);

      const response = await api.put(`/api/payments/methods/${methodId}/default`);

      console.log("💳 PAYMENT SERVICE: ✅ Default payment method set successfully");

      return response.data;
    } catch (error) {
      console.error("💳 PAYMENT SERVICE: ❌ Error setting default payment method:", error);

      if (error.response?.data) {
        throw new Error(error.response.data.message || "Failed to set default payment method");
      }

      throw new Error("Network error while setting default payment method");
    }
  }

  /**
   * Retry XE recipient creation for a payment method
   * @param {string} methodId - Payment method ID
   * @returns {Promise<Object>} API response
   */
  async retryXeRecipient(methodId) {
    try {
      console.log("💳 PAYMENT SERVICE: Retrying XE recipient creation:", methodId);

      const response = await api.post(`/api/payments/bank/retry-recipient/${methodId}`);

      console.log("💳 PAYMENT SERVICE: ✅ XE recipient retry completed");

      return response.data;
    } catch (error) {
      console.error("💳 PAYMENT SERVICE: ❌ Error retrying XE recipient creation:", error);

      if (error.response?.data) {
        return error.response.data; // Return the error response which may contain details
      }

      throw new Error("Network error while retrying XE recipient creation");
    }
  }

  /**
   * Get FX quotation for XE withdrawal
   * @param {string} paymentMethodId - Payment method ID
   * @param {number} amount - Withdrawal amount in USD
   * @returns {Promise<Object>} API response with quotation
   */
  async getXeFxQuotation(paymentMethodId, amount) {
    try {
      console.log("💳 PAYMENT SERVICE: Getting XE FX quotation:", { paymentMethodId, amount });

      const response = await api.post(`/api/payments/bank/xe-quotation/${paymentMethodId}`, {
        amount: parseFloat(amount),
      });

      console.log("💳 PAYMENT SERVICE: ✅ XE FX quotation retrieved successfully");

      return response.data;
    } catch (error) {
      console.error("💳 PAYMENT SERVICE: ❌ Error getting XE FX quotation:", error);

      if (error.response?.data) {
        throw error.response.data; // Throw the structured error response
      }

      throw new Error("Network error while getting XE FX quotation");
    }
  }

  /**
   * Proceed with XE withdrawal (create payment and approve)
   * @param {string} paymentMethodId - Payment method ID
   * @param {Object} withdrawalData - Withdrawal data
   * @param {number} withdrawalData.amount - Withdrawal amount in USD
   * @param {string} [withdrawalData.purpose] - Purpose of the withdrawal
   * @returns {Promise<Object>} API response with withdrawal result
   */
  async proceedXeWithdrawal(paymentMethodId, withdrawalData) {
    try {
      console.log("💳 PAYMENT SERVICE: Proceeding with XE withdrawal:", { paymentMethodId, withdrawalData });

      const response = await api.post(`/api/payments/bank/xe-withdraw/${paymentMethodId}`, {
        amount: parseFloat(withdrawalData.amount),
        purpose: withdrawalData.purpose || "Freelance Payment",
      });

      console.log("💳 PAYMENT SERVICE: ✅ XE withdrawal processed successfully");

      return response.data;
    } catch (error) {
      console.error("💳 PAYMENT SERVICE: ❌ Error processing XE withdrawal:", error);

      if (error.response?.data) {
        throw error.response.data; // Throw the structured error response
      }

      throw new Error("Network error while processing XE withdrawal");
    }
  }
}

export default new PaymentService();
