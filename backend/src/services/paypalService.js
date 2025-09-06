const paypal = require("@paypal/checkout-server-sdk");
const { client } = require("../config/paypal");
const https = require("https");
const axios = require("axios");

class PayPalService {
  /**
   * Create PayPal order for adding funds
   * @param {number} amount - Amount in USD
   * @param {string} currency - Currency code (default: USD)
   * @returns {Promise<Object>} PayPal order response
   */
  async createOrder(amount, currency = "USD") {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
          description: "Add funds to StudiesHQ wallet",
        },
      ],
      application_context: {
        brand_name: "StudiesHQ",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        return_url: `${process.env.FRONTEND_URL}/client/payments?success=true`,
        cancel_url: `${process.env.FRONTEND_URL}/client/payments?cancelled=true`,
      },
    });

    try {
      const order = await client().execute(request);
      return {
        success: true,
        orderId: order.result.id,
        status: order.result.status,
        links: order.result.links,
      };
    } catch (error) {
      console.error("PayPal order creation error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Capture PayPal order payment
   * @param {string} orderId - PayPal order ID
   * @returns {Promise<Object>} Capture response
   */
  async captureOrder(orderId) {
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    try {
      const capture = await client().execute(request);
      return {
        success: true,
        captureId: capture.result.id,
        status: capture.result.status,
        payerInfo: capture.result.payer,
        amount: capture.result.purchase_units[0].payments.captures[0].amount,
        transactionId: capture.result.purchase_units[0].payments.captures[0].id,
      };
    } catch (error) {
      console.error("PayPal order capture error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get order details
   * @param {string} orderId - PayPal order ID
   * @returns {Promise<Object>} Order details
   */
  async getOrder(orderId) {
    const request = new paypal.orders.OrdersGetRequest(orderId);

    try {
      const order = await client().execute(request);
      return {
        success: true,
        order: order.result,
      };
    } catch (error) {
      console.error("PayPal get order error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Refund a captured payment
   * @param {string} captureId - PayPal capture ID
   * @param {number} amount - Amount to refund
   * @param {string} currency - Currency code
   * @returns {Promise<Object>} Refund response
   */
  async refundPayment(captureId, amount, currency = "USD") {
    const request = new paypal.payments.CapturesRefundRequest(captureId);
    request.requestBody({
      amount: {
        currency_code: currency,
        value: amount.toFixed(2),
      },
      note_to_payer: "Refund from StudiesHQ",
    });

    try {
      const refund = await client().execute(request);
      return {
        success: true,
        refundId: refund.result.id,
        status: refund.result.status,
        amount: refund.result.amount,
      };
    } catch (error) {
      console.error("PayPal refund error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get PayPal access token for Payouts API
   * @returns {Promise<Object>} Access token response
   */
  async getAccessToken() {
    // Determine PayPal API URL based on environment
    const baseURL = process.env.NODE_ENV === "production" ? "https://api.paypal.com" : "https://api.sandbox.paypal.com";

    // Use appropriate credentials based on environment
    const clientId =
      process.env.NODE_ENV === "production" ? process.env.PAYPAL_PRODUCTION_CLIENT_ID : process.env.PAYPAL_CLIENT_ID;
    const clientSecret =
      process.env.NODE_ENV === "production"
        ? process.env.PAYPAL_PRODUCTION_CLIENT_SECRET
        : process.env.PAYPAL_CLIENT_SECRET;

    console.log("💰 PAYPAL SERVICE: Environment:", process.env.NODE_ENV || "development");
    console.log("💰 PAYPAL SERVICE: Using API URL:", baseURL);
    console.log("💰 PAYPAL SERVICE: Client ID:", clientId?.substring(0, 10) + "...");

    if (!clientId || !clientSecret) {
      const missingEnv =
        process.env.NODE_ENV === "production"
          ? "PAYPAL_PRODUCTION_CLIENT_ID and PAYPAL_PRODUCTION_CLIENT_SECRET"
          : "PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET";
      console.error("💰 PAYPAL SERVICE: Missing credentials:", missingEnv);
      return {
        success: false,
        error: `Missing PayPal credentials: ${missingEnv}`,
      };
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    try {
      console.log("💰 PAYPAL SERVICE: Requesting access token from:", `${baseURL}/v1/oauth2/token`);

      const response = await axios.post(`${baseURL}/v1/oauth2/token`, "grant_type=client_credentials", {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      console.log("💰 PAYPAL SERVICE: ✅ Access token obtained successfully");

      return {
        success: true,
        accessToken: response.data.access_token,
        tokenType: response.data.token_type,
        expiresIn: response.data.expires_in,
        baseURL, // Include baseURL for use in other methods
      };
    } catch (error) {
      console.error("💰 PAYPAL SERVICE: ❌ Access token error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error_description || error.message,
      };
    }
  }

  /**
   * Create a payout to send money to user's email
   * @param {string} recipientEmail - PayPal email of recipient
   * @param {number} amount - Amount to send in USD
   * @param {string} note - Note for the payout
   * @param {string} uniqueId - Unique identifier for the payout
   * @returns {Promise<Object>} Payout response
   */
  async createPayout(recipientEmail, amount, note = "User withdrawal from StudiesHQ", uniqueId) {
    try {
      // Get access token first
      const tokenResponse = await this.getAccessToken();
      if (!tokenResponse.success) {
        return {
          success: false,
          error: "Failed to get PayPal access token: " + tokenResponse.error,
        };
      }

      const payoutData = {
        sender_batch_header: {
          sender_batch_id: uniqueId,
          recipient_type: "EMAIL",
          email_subject: "You have a payment from StudiesHQ",
          email_message: "You have received a payment from StudiesHQ. Thank you for using our platform!",
        },
        items: [
          {
            recipient_type: "EMAIL",
            amount: {
              value: amount.toFixed(2),
              currency: "USD",
            },
            receiver: recipientEmail,
            note: note,
            sender_item_id: uniqueId,
          },
        ],
      };

      console.log("💰 PAYPAL PAYOUT: Creating payout request:", JSON.stringify(payoutData, null, 2));

      const response = await axios.post(`${tokenResponse.baseURL}/v1/payments/payouts`, payoutData, {
        headers: {
          Authorization: `${tokenResponse.tokenType} ${tokenResponse.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      console.log("💰 PAYPAL PAYOUT: Payout created successfully:", response.data);

      return {
        success: true,
        payoutBatchId: response.data.batch_header.payout_batch_id,
        batchStatus: response.data.batch_header.batch_status,
        timeCreated: response.data.batch_header.time_created,
        sender_batch_id: response.data.batch_header.sender_batch_id,
        links: response.data.links,
      };
    } catch (error) {
      console.error("💰 PAYPAL PAYOUT ERROR:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        details: error.response?.data || null,
      };
    }
  }

  /**
   * Get payout status
   * @param {string} payoutBatchId - PayPal payout batch ID
   * @returns {Promise<Object>} Payout status response
   */
  async getPayoutStatus(payoutBatchId) {
    try {
      const tokenResponse = await this.getAccessToken();
      if (!tokenResponse.success) {
        return {
          success: false,
          error: "Failed to get PayPal access token: " + tokenResponse.error,
        };
      }

      const response = await axios.get(`${tokenResponse.baseURL}/v1/payments/payouts/${payoutBatchId}`, {
        headers: {
          Authorization: `${tokenResponse.tokenType} ${tokenResponse.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      return {
        success: true,
        batch: response.data,
      };
    } catch (error) {
      console.error("PayPal payout status error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }
}

module.exports = new PayPalService();
