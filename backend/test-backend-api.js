const axios = require("axios");

const testBackendAPI = async () => {
  console.log("🧪 BACKEND API TEST: Starting backend API test...\n");

  const baseURL = "http://localhost:2001";

  try {
    // Test 1: Health check (just see if server is running)
    console.log("🔍 Test 1: Basic server health check...");
    try {
      const healthResponse = await axios.get(`${baseURL}/api/auth/health`, {
        timeout: 5000,
      });
      console.log("✅ Server is running and responsive");
    } catch (error) {
      if (error.code === "ECONNREFUSED") {
        console.log("❌ Server is not running on port 2001");
        console.log("💡 Make sure to run: cd backend && npm run dev");
        return;
      } else {
        console.log("⚠️ Server is running but /api/auth/health endpoint not available");
      }
    }

    // Test 2: Try gift card campaigns without auth (should fail)
    console.log("\n🔍 Test 2: Gift card campaigns without authentication...");
    try {
      const campaignsResponse = await axios.get(`${baseURL}/api/payments/gift-cards/campaigns`);
      console.log("⚠️ Unexpected: Got response without auth:", campaignsResponse.status);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log("✅ Correctly requires authentication (401 error)");
      } else {
        console.log("❌ Unexpected error:", error.response?.status, error.message);
      }
    }

    // Test 3: Check if mock token works (for testing purposes)
    console.log("\n🔍 Test 3: Gift card campaigns with mock token...");
    try {
      const campaignsResponse = await axios.get(`${baseURL}/api/payments/gift-cards/campaigns`, {
        headers: {
          "x-auth-token": "mock-token-for-testing",
        },
      });

      console.log("Response status:", campaignsResponse.status);
      console.log("Response data:", JSON.stringify(campaignsResponse.data, null, 2));

      if (campaignsResponse.data.success && campaignsResponse.data.data.campaigns?.length > 0) {
        console.log("✅ Gift card campaigns endpoint is working!");
        console.log("📊 Found", campaignsResponse.data.data.campaigns.length, "campaigns");
        console.log("🎯 First campaign:", campaignsResponse.data.data.campaigns[0].name);
      } else {
        console.log("⚠️ Gift card campaigns endpoint responded but no campaigns found");
      }
    } catch (error) {
      console.log("❌ Gift card campaigns endpoint failed:");
      console.log("   Status:", error.response?.status);
      console.log("   Message:", error.response?.data?.message || error.message);
      console.log("   Data:", JSON.stringify(error.response?.data, null, 2));
    }

    // Test 4: Test the individual service
    console.log("\n🔍 Test 4: Testing Giftogram service directly...");
    try {
      const giftogramService = require("./src/services/giftogramService");
      const campaignsResult = await giftogramService.getCampaigns();

      console.log("Service result:", {
        success: campaignsResult.success,
        campaignCount: campaignsResult.campaigns?.length || 0,
        firstCampaign: campaignsResult.campaigns?.[0]?.name || "none",
      });

      if (campaignsResult.success && campaignsResult.campaigns?.length > 0) {
        console.log("✅ Giftogram service is working correctly");
      } else {
        console.log("❌ Giftogram service failed to return campaigns");
      }
    } catch (error) {
      console.log("❌ Giftogram service error:", error.message);
    }
  } catch (error) {
    console.error("🚨 Test suite error:", error.message);
  }

  console.log("\n🏁 Backend API test completed.");
};

// Run the test
if (require.main === module) {
  testBackendAPI().catch(console.error);
}

module.exports = { testBackendAPI };
