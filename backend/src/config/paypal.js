const paypal = require("@paypal/checkout-server-sdk");

// Environment setup (sandbox vs production)
function environment() {
  // Use separate credentials for sandbox and production
  let clientId, clientSecret;

  if (process.env.NODE_ENV === "production") {
    // Production credentials
    clientId = process.env.PAYPAL_PRODUCTION_CLIENT_ID;
    clientSecret = process.env.PAYPAL_PRODUCTION_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error(
        "PayPal production credentials are missing. Please set PAYPAL_PRODUCTION_CLIENT_ID and PAYPAL_PRODUCTION_CLIENT_SECRET"
      );
    }

    console.log("Using PayPal Live Environment with client ID:", clientId?.substring(0, 10) + "...");
    return new paypal.core.LiveEnvironment(clientId, clientSecret);
  } else {
    // Sandbox credentials
    clientId = process.env.PAYPAL_CLIENT_ID;
    clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("PayPal sandbox credentials are missing. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET");
    }

    console.log("Using PayPal Sandbox Environment with client ID:", clientId?.substring(0, 10) + "...");
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
