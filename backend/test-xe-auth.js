require("dotenv").config();
const xeApiService = require("./src/services/xeApiService");

console.log("Script started...");

async function testXeAuthentication() {
  console.log("🔐 Testing XE API Authentication");
  console.log("=".repeat(50));

  // Check if environment variables are loaded
  console.log("📋 Environment Variables Check:");
  console.log(`XE_API_ACCESS_KEY: ${process.env.XE_API_ACCESS_KEY ? "✅ Set" : "❌ Not Set"}`);
  console.log(`XE_API_ACCESS_SECRET: ${process.env.XE_API_ACCESS_SECRET ? "✅ Set" : "❌ Not Set"}`);
  console.log(`XE_API_BASE_URL: ${process.env.XE_API_BASE_URL || "https://pay-api-sandbox.xe.com"}`);

  console.log("\n🏦 Testing Access Token Generation:");

  try {
    // Test access token generation
    const tokenResult = await xeApiService.getAccessToken();

    if (tokenResult.success) {
      console.log("✅ Access token generated successfully!");
      console.log(`Token (first 50 chars): ${tokenResult.accessToken.substring(0, 50)}...`);
      console.log(`Expires at: ${tokenResult.expiresAt}`);

      // Test a simple API call to verify the token works
      console.log("\n🔍 Testing API call with token:");
      const testResult = await xeApiService.getPaymentFieldsFromAPI("US", "USD");

      if (testResult.success) {
        console.log("✅ API call successful!");
        console.log(`Found ${testResult.fields?.length || 0} payment fields for US/USD`);
        if (testResult.fields && testResult.fields.length > 0) {
          console.log("Field names:", testResult.fields.map((f) => f.fieldName).join(", "));
        }
      } else {
        console.log("❌ API call failed:", testResult.error);
      }
    } else {
      console.log("❌ Failed to generate access token:");
      console.log("Error:", tokenResult.error);

      if (tokenResult.error.includes("access key and secret are required")) {
        console.log("\n💡 Solution: You need to set up your .env file with valid XE API credentials:");
        console.log("1. Create backend/.env file (copy from backend/env.example)");
        console.log("2. Replace 'your_xe_api_access_key' with your actual XE API access key");
        console.log("3. Replace 'your_xe_api_access_secret' with your actual XE API secret");
      }
    }
  } catch (error) {
    console.log("💥 Unexpected error:", error.message);
  }

  console.log("\n" + "=".repeat(50));
}

// Run the test
testXeAuthentication().catch(console.error);
