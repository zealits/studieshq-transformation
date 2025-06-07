const paypal = require("@paypal/checkout-server-sdk");

// Environment setup (sandbox vs production)
function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  // Use sandbox environment for development
  if (process.env.NODE_ENV === "production") {
    return new paypal.core.LiveEnvironment(clientId, clientSecret);
  } else {
    return new paypal.core.SandboxEnvironment(clientId, clientSecret);
  }
}

// Returns PayPal HTTP client instance with environment that has access
// credentials context. Use this instance to invoke PayPal APIs, provided the
// credentials have access.
function client() {
  return new paypal.core.PayPalHttpClient(environment());
}

module.exports = { client, environment };
