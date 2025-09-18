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
}

export default new PaymentService();
