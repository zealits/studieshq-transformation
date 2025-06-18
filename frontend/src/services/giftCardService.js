import axios from "../api/axios";

class GiftCardService {
  // Get available gift card campaigns
  async getCampaigns() {
    try {
      console.log("🎁 SERVICE: === STARTING getCampaigns API CALL ===");

      // Check authentication
      const token = localStorage.getItem("token");
      console.log("🎁 SERVICE: Token check:", {
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        tokenPreview: token ? `${token.substring(0, 20)}...` : "null",
      });

      if (!token) {
        console.error("🎁 SERVICE: ❌ No authentication token found");
        throw new Error("Authentication required");
      }

      console.log("🎁 SERVICE: Making API request to /api/payments/gift-cards/campaigns");
      console.log("🎁 SERVICE: Request headers:", {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.substring(0, 20)}...`,
      });

      const response = await axios.get("/api/payments/gift-cards/campaigns");

      console.log("🎁 SERVICE: === RAW API RESPONSE ===");
      console.log("🎁 SERVICE: Response status:", response.status);
      console.log("🎁 SERVICE: Response statusText:", response.statusText);
      console.log("🎁 SERVICE: Response headers:", response.headers);
      console.log("🎁 SERVICE: Response data:", response.data);
      console.log("🎁 SERVICE: Response data type:", typeof response.data);
      console.log("🎁 SERVICE: Response data keys:", response.data ? Object.keys(response.data) : "null");
      console.log("🎁 SERVICE: Full response JSON:", JSON.stringify(response.data, null, 2));

      console.log("🎁 SERVICE: === PROCESSING RESPONSE ===");
      if (response.data) {
        console.log("🎁 SERVICE: ✅ Response data exists");
        console.log("🎁 SERVICE: Response success flag:", response.data.success);

        if (response.data.success) {
          console.log("🎁 SERVICE: ✅ Response indicates success");

          if (response.data.data) {
            console.log("🎁 SERVICE: ✅ Response has data property");
            console.log("🎁 SERVICE: Data property type:", typeof response.data.data);
            console.log("🎁 SERVICE: Data property:", response.data.data);

            if (response.data.data.campaigns) {
              console.log("🎁 SERVICE: ✅ Found campaigns in data.campaigns");
              console.log("🎁 SERVICE: Campaigns type:", typeof response.data.data.campaigns);
              console.log("🎁 SERVICE: Is campaigns array?", Array.isArray(response.data.data.campaigns));
              console.log("🎁 SERVICE: Campaigns count:", response.data.data.campaigns.length);
              console.log("🎁 SERVICE: Campaigns:", response.data.data.campaigns);
            } else if (Array.isArray(response.data.data)) {
              console.log("🎁 SERVICE: ✅ Data is direct array");
              console.log("🎁 SERVICE: Array length:", response.data.data.length);
              console.log("🎁 SERVICE: Array items:", response.data.data);
            } else {
              console.log("🎁 SERVICE: ❌ Data structure unexpected");
              console.log("🎁 SERVICE: Data keys:", Object.keys(response.data.data));
            }
          } else {
            console.log("🎁 SERVICE: ❌ No data property in response");
          }
        } else {
          console.log("🎁 SERVICE: ❌ Response indicates failure");
          console.log("🎁 SERVICE: Error message:", response.data.message);
        }
      } else {
        console.log("🎁 SERVICE: ❌ No response data");
      }

      console.log("🎁 SERVICE: === RETURNING RESPONSE ===");
      console.log("🎁 SERVICE: Returning response.data to caller");
      console.log("🎁 SERVICE: === getCampaigns COMPLETED SUCCESSFULLY ===");

      return response.data;
    } catch (error) {
      console.error("🎁 SERVICE: === ERROR IN getCampaigns ===");
      console.error("🎁 SERVICE: Error type:", error.constructor.name);
      console.error("🎁 SERVICE: Error message:", error.message);
      console.error("🎁 SERVICE: Error stack:", error.stack);

      if (error.response) {
        console.error("🎁 SERVICE: === API ERROR RESPONSE ===");
        console.error("🎁 SERVICE: Status:", error.response.status);
        console.error("🎁 SERVICE: Status text:", error.response.statusText);
        console.error("🎁 SERVICE: Headers:", error.response.headers);
        console.error("🎁 SERVICE: Data:", error.response.data);
        console.error("🎁 SERVICE: Full error response:", JSON.stringify(error.response.data, null, 2));

        if (error.response.status === 401) {
          console.error("🎁 SERVICE: ❌ Authentication failed (401)");
          throw new Error("Authentication failed. Please login again.");
        } else if (error.response.status === 403) {
          console.error("🎁 SERVICE: ❌ Access forbidden (403)");
          throw new Error("Access denied. Insufficient permissions.");
        } else if (error.response.status === 404) {
          console.error("🎁 SERVICE: ❌ Endpoint not found (404)");
          throw new Error("Gift card service not available.");
        } else {
          console.error("🎁 SERVICE: ❌ Server error:", error.response.status);
          throw new Error(error.response.data?.message || `Server error: ${error.response.status}`);
        }
      } else if (error.request) {
        console.error("🎁 SERVICE: === NETWORK ERROR ===");
        console.error("🎁 SERVICE: Request made but no response received");
        console.error("🎁 SERVICE: Request:", error.request);
        throw new Error("Network error. Please check your connection.");
      } else {
        console.error("🎁 SERVICE: === UNKNOWN ERROR ===");
        console.error("🎁 SERVICE: Error setting up request:", error.message);
        throw new Error(error.message || "Unknown error occurred");
      }
    }
  }

  // Withdraw funds as gift card
  async withdrawAsGiftCard(withdrawalData) {
    try {
      console.log("🎁 GIFT CARD SERVICE: === STARTING withdrawAsGiftCard ===");
      console.log("🎁 GIFT CARD SERVICE: Withdrawal data:", withdrawalData);

      const response = await axios.post("/payments/gift-cards/withdraw", withdrawalData);

      console.log("🎁 GIFT CARD SERVICE: Withdrawal response:", response.data);
      console.log("🎁 GIFT CARD SERVICE: === ENDING withdrawAsGiftCard (SUCCESS) ===");

      return response.data;
    } catch (error) {
      console.error("🎁 GIFT CARD SERVICE: === ERROR in withdrawAsGiftCard ===");
      console.error("🎁 GIFT CARD SERVICE: Error:", error.response?.data || error.message);
      console.error("🎁 GIFT CARD SERVICE: === ENDING withdrawAsGiftCard (ERROR) ===");

      throw error.response?.data || { message: "Failed to process gift card withdrawal" };
    }
  }

  // Get gift card withdrawal history
  async getWithdrawalHistory(page = 1, limit = 10) {
    try {
      console.log("🎁 GIFT CARD SERVICE: === STARTING getWithdrawalHistory ===");
      console.log("🎁 GIFT CARD SERVICE: Page:", page, "Limit:", limit);

      const response = await axios.get(`/payments/gift-cards/history?page=${page}&limit=${limit}`);

      console.log("🎁 GIFT CARD SERVICE: History response:", response.data);
      console.log("🎁 GIFT CARD SERVICE: === ENDING getWithdrawalHistory (SUCCESS) ===");

      return response.data;
    } catch (error) {
      console.error("🎁 GIFT CARD SERVICE: === ERROR in getWithdrawalHistory ===");
      console.error("🎁 GIFT CARD SERVICE: Error:", error.response?.data || error.message);
      console.error("🎁 GIFT CARD SERVICE: === ENDING getWithdrawalHistory (ERROR) ===");

      throw error.response?.data || { message: "Failed to fetch gift card history" };
    }
  }

  // Check gift card order status
  async checkOrderStatus(orderId) {
    try {
      console.log("🎁 GIFT CARD SERVICE: === STARTING checkOrderStatus ===");
      console.log("🎁 GIFT CARD SERVICE: Order ID:", orderId);

      const response = await axios.get(`/payments/gift-cards/order/${orderId}/status`);

      console.log("🎁 GIFT CARD SERVICE: Status response:", response.data);
      console.log("🎁 GIFT CARD SERVICE: === ENDING checkOrderStatus (SUCCESS) ===");

      return response.data;
    } catch (error) {
      console.error("🎁 GIFT CARD SERVICE: === ERROR in checkOrderStatus ===");
      console.error("🎁 GIFT CARD SERVICE: Error:", error.response?.data || error.message);
      console.error("🎁 GIFT CARD SERVICE: === ENDING checkOrderStatus (ERROR) ===");

      throw error.response?.data || { message: "Failed to check gift card status" };
    }
  }
}

export default new GiftCardService();
