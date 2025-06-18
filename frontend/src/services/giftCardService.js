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
      console.log("🎁 WITHDRAWAL SERVICE: === STARTING withdrawAsGiftCard ===");
      console.log("🎁 WITHDRAWAL SERVICE: Input data:", JSON.stringify(withdrawalData, null, 2));
      console.log("🎁 WITHDRAWAL SERVICE: Data validation:", {
        hasCampaignId: !!withdrawalData.campaignId,
        hasAmount: !!withdrawalData.amount,
        hasRecipientEmail: !!withdrawalData.recipientEmail,
        hasRecipientName: !!withdrawalData.recipientName,
        amountType: typeof withdrawalData.amount,
        amountValue: withdrawalData.amount,
      });

      // Check authentication
      const token = localStorage.getItem("token");
      console.log("🎁 WITHDRAWAL SERVICE: Auth check:", {
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        tokenPreview: token ? `${token.substring(0, 20)}...` : "null",
      });

      if (!token) {
        console.error("🎁 WITHDRAWAL SERVICE: ❌ No authentication token found");
        throw new Error("Authentication required");
      }

      console.log("🎁 WITHDRAWAL SERVICE: Making API request to /api/payments/gift-cards/withdraw");
      console.log("🎁 WITHDRAWAL SERVICE: Request headers:", {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.substring(0, 20)}...`,
      });
      console.log("🎁 WITHDRAWAL SERVICE: Request payload:", JSON.stringify(withdrawalData, null, 2));

      const response = await axios.post("/api/payments/gift-cards/withdraw", withdrawalData);

      console.log("🎁 WITHDRAWAL SERVICE: === WITHDRAWAL RESPONSE RECEIVED ===");
      console.log("🎁 WITHDRAWAL SERVICE: Response status:", response.status);
      console.log("🎁 WITHDRAWAL SERVICE: Response statusText:", response.statusText);
      console.log("🎁 WITHDRAWAL SERVICE: Response headers:", response.headers);
      console.log("🎁 WITHDRAWAL SERVICE: Response data:", response.data);
      console.log("🎁 WITHDRAWAL SERVICE: Response data type:", typeof response.data);
      console.log("🎁 WITHDRAWAL SERVICE: Response keys:", response.data ? Object.keys(response.data) : "null");
      console.log("🎁 WITHDRAWAL SERVICE: Full response JSON:", JSON.stringify(response.data, null, 2));

      if (response.data && response.data.success) {
        console.log("🎁 WITHDRAWAL SERVICE: ✅ Withdrawal successful");
        console.log("🎁 WITHDRAWAL SERVICE: Success data:", response.data.data);
      } else {
        console.warn("🎁 WITHDRAWAL SERVICE: ⚠️ Response indicates failure");
        console.warn("🎁 WITHDRAWAL SERVICE: Error message:", response.data?.message);
      }

      console.log("🎁 WITHDRAWAL SERVICE: === ENDING withdrawAsGiftCard (SUCCESS) ===");
      return response.data;
    } catch (error) {
      console.error("🎁 WITHDRAWAL SERVICE: === ERROR in withdrawAsGiftCard ===");
      console.error("🎁 WITHDRAWAL SERVICE: Error type:", error.constructor.name);
      console.error("🎁 WITHDRAWAL SERVICE: Error message:", error.message);
      console.error("🎁 WITHDRAWAL SERVICE: Error stack:", error.stack);
      console.error("🎁 WITHDRAWAL SERVICE: Full error object:", error);

      if (error.response) {
        console.error("🎁 WITHDRAWAL SERVICE: === API ERROR RESPONSE ===");
        console.error("🎁 WITHDRAWAL SERVICE: Status:", error.response.status);
        console.error("🎁 WITHDRAWAL SERVICE: Status text:", error.response.statusText);
        console.error("🎁 WITHDRAWAL SERVICE: Headers:", error.response.headers);
        console.error("🎁 WITHDRAWAL SERVICE: Data:", error.response.data);
        console.error("🎁 WITHDRAWAL SERVICE: Full error response:", JSON.stringify(error.response.data, null, 2));

        if (error.response.status === 401) {
          console.error("🎁 WITHDRAWAL SERVICE: ❌ Authentication failed (401)");
          throw new Error("Authentication failed. Please login again.");
        } else if (error.response.status === 403) {
          console.error("🎁 WITHDRAWAL SERVICE: ❌ Access forbidden (403)");
          throw new Error("Access denied. Insufficient permissions.");
        } else if (error.response.status === 404) {
          console.error("🎁 WITHDRAWAL SERVICE: ❌ Endpoint not found (404)");
          throw new Error("Gift card withdrawal service not available.");
        } else if (error.response.status === 422) {
          console.error("🎁 WITHDRAWAL SERVICE: ❌ Validation error (422)");
          throw new Error(error.response.data?.message || "Invalid withdrawal data.");
        } else {
          console.error("🎁 WITHDRAWAL SERVICE: ❌ Server error:", error.response.status);
          throw new Error(error.response.data?.message || `Server error: ${error.response.status}`);
        }
      } else if (error.request) {
        console.error("🎁 WITHDRAWAL SERVICE: === NETWORK ERROR ===");
        console.error("🎁 WITHDRAWAL SERVICE: Request made but no response received");
        console.error("🎁 WITHDRAWAL SERVICE: Request:", error.request);
        throw new Error("Network error. Please check your connection.");
      } else {
        console.error("🎁 WITHDRAWAL SERVICE: === UNKNOWN ERROR ===");
        console.error("🎁 WITHDRAWAL SERVICE: Error setting up request:", error.message);
        throw new Error(error.message || "Unknown error occurred");
      }
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
