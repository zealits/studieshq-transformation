import api from "../api/axios";

class XeApiService {
  /**
   * Get supported countries for bank transfers
   * @returns {Promise<Object>} API response with countries list
   */
  async getSupportedCountries() {
    try {
      console.log("🏦 XE API SERVICE: Getting supported countries...");

      const response = await api.get("/api/payments/bank/countries");

      console.log("🏦 XE API SERVICE: ✅ Supported countries retrieved successfully");

      return response.data;
    } catch (error) {
      console.error("🏦 XE API SERVICE: ❌ Error getting supported countries:", error);

      if (error.response?.data) {
        throw new Error(error.response.data.message || "Failed to get supported countries");
      }

      throw new Error("Network error while getting supported countries");
    }
  }

  /**
   * Get supported currencies for a specific country
   * @param {string} countryCode - ISO 2-letter country code
   * @returns {Promise<Object>} API response with currencies list
   */
  async getSupportedCurrencies(countryCode) {
    try {
      console.log(`🏦 XE API SERVICE: Getting supported currencies for ${countryCode}...`);

      const response = await api.get(`/api/payments/bank/countries/${countryCode}/currencies`);

      console.log("🏦 XE API SERVICE: ✅ Supported currencies retrieved successfully");

      return response.data;
    } catch (error) {
      console.error("🏦 XE API SERVICE: ❌ Error getting supported currencies:", error);

      if (error.response?.data) {
        throw new Error(error.response.data.message || "Failed to get supported currencies");
      }

      throw new Error("Network error while getting supported currencies");
    }
  }

  /**
   * Get payment fields for a specific country and currency
   * @param {string} countryCode - ISO 2-letter country code (e.g., 'US', 'IN')
   * @param {string} currencyCode - ISO 3-letter currency code (e.g., 'USD', 'INR')
   * @returns {Promise<Object>} API response with payment fields
   */
  async getPaymentFields(countryCode, currencyCode) {
    try {
      console.log(`🏦 XE API SERVICE: Getting payment fields for ${countryCode}/${currencyCode}...`);

      const response = await api.get(`/api/payments/bank/fields/${countryCode}/${currencyCode}`);

      console.log("🏦 XE API SERVICE: ✅ Payment fields retrieved successfully");

      return response.data;
    } catch (error) {
      console.error("🏦 XE API SERVICE: ❌ Error getting payment fields:", error);

      if (error.response?.data) {
        throw new Error(error.response.data.message || "Failed to get payment fields");
      }

      throw new Error("Network error while getting payment fields");
    }
  }

  /**
   * Add bank details as payment method
   * @param {Object} data - Bank details data
   * @param {Object} data.consumerDetails - Consumer information
   * @param {Object} data.bankDetails - Bank account details
   * @param {string} data.countryCode - Country code
   * @param {string} data.currencyCode - Currency code
   * @returns {Promise<Object>} API response
   */
  async addBankPaymentMethod(data) {
    try {
      console.log("🏦 XE API SERVICE: Adding bank payment method...");

      const response = await api.post("/api/payments/bank/add-method", data);

      console.log("🏦 XE API SERVICE: ✅ Bank payment method added successfully");

      return response.data;
    } catch (error) {
      console.error("🏦 XE API SERVICE: ❌ Error adding bank payment method:", error);

      if (error.response?.data) {
        throw new Error(error.response.data.message || "Failed to add bank payment method");
      }

      throw new Error("Network error while adding bank payment method");
    }
  }

  /**
   * Update existing bank payment method
   * @param {string} paymentMethodId - Payment method ID
   * @param {Object} data - Bank details data
   * @param {Object} data.consumerDetails - Consumer information
   * @param {Object} data.bankDetails - Bank account details
   * @param {string} data.countryCode - Country code
   * @param {string} data.currencyCode - Currency code
   * @returns {Promise<Object>} API response
   */
  async updateBankPaymentMethod(paymentMethodId, data) {
    try {
      console.log("🏦 XE API SERVICE: Updating bank payment method:", paymentMethodId);

      const response = await api.put(`/api/payments/bank/${paymentMethodId}`, data);

      console.log("🏦 XE API SERVICE: ✅ Bank payment method updated successfully");

      return response.data;
    } catch (error) {
      console.error("🏦 XE API SERVICE: ❌ Error updating bank payment method:", error);

      if (error.response?.data) {
        throw new Error(error.response.data.message || "Failed to update bank payment method");
      }

      throw new Error("Network error while updating bank payment method");
    }
  }
}

export default new XeApiService();
