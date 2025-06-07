const paypal = require("@paypal/checkout-server-sdk");
const { client } = require("../config/paypal");

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
}

module.exports = new PayPalService(); 