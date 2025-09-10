const axios = require("axios");
const { giftogram } = require("../config/config");

class GiftogramService {
  constructor() {
    this.apiUrl = giftogram.apiUrl;
    this.apiKey = giftogram.apiKey;
    this.apiSecret = giftogram.apiSecret;
    this.environment = giftogram.environment;
    this.defaultCampaignId = giftogram.defaultCampaignId;

    // Create axios instance with default headers - Fixed authentication format
    this.api = axios.create({
      baseURL: this.apiUrl,
      headers: {
        "Content-Type": "application/json",
        Authorization: this.apiKey, // Fixed: Using direct API key instead of Bearer
      },
    });
  }

  // Get list of available campaigns/gift card options
  async getCampaigns() {
    try {
      // Validate API credentials
      if (!this.apiKey || !this.apiUrl) {
        throw new Error("Giftogram API credentials not configured. Please check your API key and URL.");
      }

      console.log("🎁 GIFTOGRAM SERVICE: ✅ Making API call to /api/v1/campaigns");
      console.log("🎁 GIFTOGRAM SERVICE: Full endpoint URL:", `${this.api.defaults.baseURL}/api/v1/campaigns`);
      console.log("🎁 GIFTOGRAM SERVICE: Request headers:", {
        Authorization: this.apiKey ? `${this.apiKey.substring(0, 10)}...` : "null",
        "Content-Type": "application/json",
      });

      const response = await this.api.get("/api/v1/campaigns");

      console.log("🎁 GIFTOGRAM SERVICE: === RAW API RESPONSE RECEIVED ===");
      console.log("🎁 GIFTOGRAM SERVICE: Response status:", response.status);
      console.log("🎁 GIFTOGRAM SERVICE: Response statusText:", response.statusText);
      console.log("🎁 GIFTOGRAM SERVICE: Response headers:", response.headers);
      console.log("🎁 GIFTOGRAM SERVICE: Response data type:", typeof response.data);
      console.log("🎁 GIFTOGRAM SERVICE: Response data keys:", response.data ? Object.keys(response.data) : "null");
      console.log("🎁 GIFTOGRAM SERVICE: Full response data:", JSON.stringify(response.data, null, 2));

      // Handle Giftogram API response structure based on provided examples
      let campaigns = [];
      if (response.data) {
        if (response.data.data) {
          // Single campaign response (when getting by ID)
          if (response.data.data.id) {
            campaigns = [response.data.data];
            console.log("🎁 GIFTOGRAM SERVICE: Found single campaign in data.data");
          } else if (Array.isArray(response.data.data)) {
            campaigns = response.data.data;
            console.log("🎁 GIFTOGRAM SERVICE: Found campaigns array in data.data");
          }
        } else if (Array.isArray(response.data)) {
          campaigns = response.data;
          console.log("🎁 GIFTOGRAM SERVICE: Found campaigns as direct array");
        } else {
          console.log("🎁 GIFTOGRAM SERVICE: No campaigns found in expected locations");
          console.log("🎁 GIFTOGRAM SERVICE: Available keys:", Object.keys(response.data));
        }
      }

      console.log("🎁 GIFTOGRAM SERVICE: Processed campaigns:", {
        count: campaigns.length,
        campaigns: campaigns.map((c) => ({
          id: c.id,
          name: c.name,
          currencies: c.currencies,
          denominations: c.denominations,
          active: c.active,
        })),
      });

      const result = {
        success: true,
        campaigns: campaigns,
      };

      console.log("🎁 GIFTOGRAM SERVICE: === ENDING getCampaigns (SUCCESS) ===");
      return result;
    } catch (error) {
      console.error("🎁 GIFTOGRAM SERVICE: === ERROR in getCampaigns ===");
      console.error("🎁 GIFTOGRAM SERVICE: Error type:", error.constructor.name);
      console.error("🎁 GIFTOGRAM SERVICE: Error message:", error.message);
      console.error("🎁 GIFTOGRAM SERVICE: Error response:", error.response?.data);
      console.error("🎁 GIFTOGRAM SERVICE: Error status:", error.response?.status);

      return {
        success: false,
        error: error.response?.data?.message || error.message || "Failed to fetch campaigns",
        statusCode: error.response?.status,
      };
    }
  }

  // Get campaign by ID
  async getCampaignById(campaignId) {
    try {
      console.log("🎁 GIFTOGRAM SERVICE: === STARTING getCampaignById ===");
      console.log("🎁 GIFTOGRAM SERVICE: Campaign ID:", campaignId);

      // Validate API credentials and campaign ID
      if (!this.apiKey || !this.apiUrl) {
        throw new Error("Giftogram API credentials not configured. Please check your API key and URL.");
      }

      if (!campaignId) {
        throw new Error("Campaign ID is required");
      }

      console.log("🎁 GIFTOGRAM SERVICE: Making API call to /api/v1/campaigns/" + campaignId);
      const response = await this.api.get(`/api/v1/campaigns/${campaignId}`);

      console.log("🎁 GIFTOGRAM SERVICE: Campaign response received");
      console.log("🎁 GIFTOGRAM SERVICE: Response status:", response.status);
      console.log("🎁 GIFTOGRAM SERVICE: Response data:", JSON.stringify(response.data, null, 2));

      const result = {
        success: true,
        campaign: response.data.data || response.data,
      };

      console.log("🎁 GIFTOGRAM SERVICE: === ENDING getCampaignById (SUCCESS) ===");
      return result;
    } catch (error) {
      console.error("🎁 GIFTOGRAM SERVICE: === ERROR in getCampaignById ===");
      console.error("🎁 GIFTOGRAM SERVICE: Error:", error.response?.data || error.message);

      return {
        success: false,
        error: error.response?.data?.message || error.message || "Failed to fetch campaign",
        statusCode: error.response?.status,
      };
    }
  }

  // Create a gift card order - Fixed to match Giftogram API structure
  async createGiftCardOrder(orderData) {
    try {
      console.log("🎁 GIFTOGRAM SERVICE: Creating gift card order", {
        campaignId: orderData.campaignId,
        amount: orderData.amount,
        recipientEmail: orderData.recipientEmail,
      });

      // Validate API credentials
      if (!this.apiKey || !this.apiUrl) {
        throw new Error("Giftogram API credentials not configured. Please check your API key and URL.");
      }

      // Validate order data
      const validation = this.validateOrderData(orderData);
      if (!validation.valid) {
        throw new Error(`Invalid order data: ${validation.error}`);
      }

      // Fixed: Using correct Giftogram API payload structure
      const payload = {
        external_id: orderData.externalId,
        campaign_id: orderData.campaignId,
        notes: `Gift card withdrawal for user: ${orderData.senderName}`,
        reference_number: orderData.externalId,
        message: orderData.message || "Thanks for your hard work! Enjoy your gift card.",
        subject: "Your Gift Card is Ready!",
        recipients: [
          {
            email: orderData.recipientEmail,
            name: orderData.recipientName,
          },
        ],
        denomination: orderData.amount.toString(), // Fixed: Convert to string as required by Giftogram API
      };

      console.log("🎁 GIFTOGRAM SERVICE: Sending order payload:", JSON.stringify(payload, null, 2));

      // Fixed: Using correct endpoint
      const response = await this.api.post("/api/v1/orders", payload);

      console.log("🎁 GIFTOGRAM SERVICE: Order created successfully");
      console.log("🎁 GIFTOGRAM SERVICE: Response status:", response.status);
      console.log("🎁 GIFTOGRAM SERVICE: Response data:", JSON.stringify(response.data, null, 2));

      const orderResult = {
        success: true,
        order: response.data.data || response.data,
      };

      console.log("🎁 GIFTOGRAM SERVICE: Gift card order created successfully", {
        orderId: orderResult.order.order_id,
        status: orderResult.order.status,
        campaignName: orderResult.order.campaign_name,
      });

      return orderResult;
    } catch (error) {
      console.error("🎁 GIFTOGRAM SERVICE: Error creating gift card order:", error.response?.data || error.message);
      console.error("🎁 GIFTOGRAM SERVICE: Error status:", error.response?.status);
      console.error("🎁 GIFTOGRAM SERVICE: Error headers:", error.response?.headers);

      return {
        success: false,
        error: error.response?.data?.message || error.message || "Failed to create gift card order",
        statusCode: error.response?.status,
      };
    }
  }

  // Get order by ID
  async getOrder(orderId) {
    try {
      console.log("🎁 GIFTOGRAM SERVICE: === STARTING getOrder ===");
      console.log("🎁 GIFTOGRAM SERVICE: Order ID:", orderId);

      // Validate API credentials and order ID
      if (!this.apiKey || !this.apiUrl) {
        throw new Error("Giftogram API credentials not configured. Please check your API key and URL.");
      }

      if (!orderId) {
        throw new Error("Order ID is required");
      }

      console.log("🎁 GIFTOGRAM SERVICE: Making API call to /api/v1/orders/" + orderId);
      const response = await this.api.get(`/api/v1/orders/${orderId}`);

      console.log("🎁 GIFTOGRAM SERVICE: Order response received");
      console.log("🎁 GIFTOGRAM SERVICE: Response data:", JSON.stringify(response.data, null, 2));

      const result = {
        success: true,
        order: response.data.data || response.data,
      };

      console.log("🎁 GIFTOGRAM SERVICE: === ENDING getOrder (SUCCESS) ===");
      return result;
    } catch (error) {
      console.error("🎁 GIFTOGRAM SERVICE: === ERROR in getOrder ===");
      console.error("🎁 GIFTOGRAM SERVICE: Error:", error.response?.data || error.message);

      return {
        success: false,
        error: error.response?.data?.message || error.message || "Failed to fetch order",
        statusCode: error.response?.status,
      };
    }
  }

  // Get list of orders
  async getOrders(filters = {}) {
    try {
      console.log("🎁 GIFTOGRAM SERVICE: === STARTING getOrders ===");
      console.log("🎁 GIFTOGRAM SERVICE: Filters:", filters);

      // Validate API credentials
      if (!this.apiKey || !this.apiUrl) {
        throw new Error("Giftogram API credentials not configured. Please check your API key and URL.");
      }

      console.log("🎁 GIFTOGRAM SERVICE: Making API call to /api/v1/orders");
      const response = await this.api.get("/api/v1/orders");

      console.log("🎁 GIFTOGRAM SERVICE: Orders response received");
      console.log("🎁 GIFTOGRAM SERVICE: Response data:", JSON.stringify(response.data, null, 2));

      let orders = [];
      if (response.data.data) {
        orders = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
      }

      const result = {
        success: true,
        orders: orders,
        links: response.data.links,
      };

      console.log("🎁 GIFTOGRAM SERVICE: === ENDING getOrders (SUCCESS) ===");
      return result;
    } catch (error) {
      console.error("🎁 GIFTOGRAM SERVICE: === ERROR in getOrders ===");
      console.error("🎁 GIFTOGRAM SERVICE: Error:", error.response?.data || error.message);

      return {
        success: false,
        error: error.response?.data?.message || error.message || "Failed to fetch orders",
        statusCode: error.response?.status,
      };
    }
  }

  // Get the default campaign ID configured in environment
  getDefaultCampaignId() {
    if (!this.defaultCampaignId) {
      throw new Error(
        "Default campaign ID not configured. Please set GIFTOGRAM_DEFAULT_CAMPAIGN_ID in your environment variables."
      );
    }
    return this.defaultCampaignId;
  }

  // Get giftogram configuration (without sensitive data)
  getConfig() {
    return {
      environment: this.environment,
      apiUrl: this.apiUrl,
      defaultCampaignId: this.defaultCampaignId,
      hasApiKey: !!this.apiKey,
    };
  }

  // Validate order data before sending to API
  validateOrderData(orderData) {
    const errors = [];

    if (!orderData.campaignId) {
      errors.push("Campaign ID is required");
    }

    if (!orderData.amount || orderData.amount <= 0) {
      errors.push("Amount must be greater than 0");
    }

    if (!orderData.recipientEmail) {
      errors.push("Recipient email is required");
    } else if (!/\S+@\S+\.\S+/.test(orderData.recipientEmail)) {
      errors.push("Invalid recipient email format");
    }

    if (!orderData.recipientName || !orderData.recipientName.trim()) {
      errors.push("Recipient name is required");
    }

    if (!orderData.externalId) {
      errors.push("External ID is required");
    }

    if (errors.length > 0) {
      return {
        valid: false,
        error: errors.join(", "),
      };
    }

    return {
      valid: true,
    };
  }
}

module.exports = new GiftogramService();
