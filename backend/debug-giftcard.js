const axios = require("axios");

// Debug script to test gift card functionality
const testGiftCardFlow = async () => {
  const baseURL = "http://localhost:2001/api";

  console.log("🎁 GIFT CARD DEBUG: Starting gift card flow test...\n");

  try {
    // Test 1: Get gift card campaigns
    console.log("📋 Test 1: Getting gift card campaigns...");
    const campaignsResponse = await axios.get(`${baseURL}/payments/gift-cards/campaigns`, {
      headers: {
        Authorization: "Bearer your-test-token-here", // Replace with actual token
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Campaigns Response:", JSON.stringify(campaignsResponse.data, null, 2));
    console.log("");

    if (!campaignsResponse.data.success || !campaignsResponse.data.data.campaigns.length) {
      throw new Error("No campaigns available or API failed");
    }

    const firstCampaign = campaignsResponse.data.data.campaigns[0];
    console.log("🎯 Using campaign:", firstCampaign.name, "ID:", firstCampaign.id);
    console.log("");

    // Test 2: Create gift card withdrawal
    console.log("💳 Test 2: Creating gift card withdrawal...");
    const withdrawalData = {
      campaignId: firstCampaign.id,
      amount: 25,
      recipientEmail: "test@example.com",
      recipientName: "Test User",
      message: "Test gift card from debugging script",
    };

    console.log("📤 Sending withdrawal request:", JSON.stringify(withdrawalData, null, 2));

    const withdrawalResponse = await axios.post(`${baseURL}/payments/gift-cards/withdraw`, withdrawalData, {
      headers: {
        Authorization: "Bearer your-test-token-here", // Replace with actual token
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Withdrawal Response:", JSON.stringify(withdrawalResponse.data, null, 2));
    console.log("");

    const orderId = withdrawalResponse.data.data.transaction.giftCardOrder.id;
    console.log("🆔 Gift card order ID:", orderId);
    console.log("");

    // Test 3: Check gift card order status
    console.log("📊 Test 3: Checking gift card order status...");
    const statusResponse = await axios.get(`${baseURL}/payments/gift-cards/order/${orderId}/status`, {
      headers: {
        Authorization: "Bearer your-test-token-here", // Replace with actual token
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Status Response:", JSON.stringify(statusResponse.data, null, 2));
    console.log("");

    // Test 4: Get gift card withdrawal history
    console.log("📜 Test 4: Getting gift card withdrawal history...");
    const historyResponse = await axios.get(`${baseURL}/payments/gift-cards/history?page=1&limit=5`, {
      headers: {
        Authorization: "Bearer your-test-token-here", // Replace with actual token
        "Content-Type": "application/json",
      },
    });

    console.log("✅ History Response:", JSON.stringify(historyResponse.data, null, 2));
    console.log("");

    console.log("🎉 All gift card tests completed successfully!");
  } catch (error) {
    console.error("❌ GIFT CARD DEBUG ERROR:");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);

    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", JSON.stringify(error.response.data, null, 2));
    }

    if (error.request) {
      console.error("Request failed - no response received");
      console.error("Request URL:", error.config?.url);
    }
  }
};

// Test individual API components
const testGiftogramService = async () => {
  console.log("🔧 Testing Giftogram Service directly...\n");

  try {
    // Test if we can import the service
    const giftogramService = require("./src/services/giftogramService");

    console.log("📋 Test: Getting campaigns from service...");
    const campaignsResult = await giftogramService.getCampaigns();
    console.log("Campaigns result:", JSON.stringify(campaignsResult, null, 2));
    console.log("");

    if (campaignsResult.success && campaignsResult.campaigns.length > 0) {
      const testCampaign = campaignsResult.campaigns[0];

      console.log("💳 Test: Creating mock order...");
      const orderData = {
        campaignId: testCampaign.id,
        amount: 25,
        recipientEmail: "test@example.com",
        recipientName: "Test User",
        senderEmail: "sender@example.com",
        senderName: "Sender User",
        message: "Test message",
        externalId: "DEBUG-TEST-" + Date.now(),
      };

      const orderResult = await giftogramService.createGiftCardOrder(orderData);
      console.log("Order result:", JSON.stringify(orderResult, null, 2));
      console.log("");
    }
  } catch (error) {
    console.error("❌ Service test error:", error.message);
    console.error("Stack:", error.stack);
  }
};

// Run tests
const runAllTests = async () => {
  console.log("🚀 Starting comprehensive gift card debugging...\n");

  // Test service first
  await testGiftogramService();

  console.log("\n" + "=".repeat(50) + "\n");

  // Test full API flow
  await testGiftCardFlow();

  console.log("\n🏁 All debugging tests completed.");
};

// Check if script is run directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testGiftCardFlow,
  testGiftogramService,
  runAllTests,
};
