const axios = require("axios");

const testToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoidGVzdC11c2VyLWlkLTEyMzQ1Iiwicm9sZSI6ImZyZWVsYW5jZXIiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJmaXJzdE5hbWUiOiJUZXN0IiwibGFzdE5hbWUiOiJVc2VyIn0sImlhdCI6MTc1MDIxNzA1MiwiZXhwIjoxNzUwMjIwNjUyfQ.rykVXrUeeaByZOuLNfJFZwdfSEDwEHkubD1bM7H0obk";

const testGiftCardAPI = async () => {
  console.log("🧪 Testing Gift Card API with valid token...\n");

  try {
    console.log("🎯 Testing GET /api/payments/gift-cards/campaigns");
    const response = await axios.get("http://localhost:2001/api/payments/gift-cards/campaigns", {
      headers: {
        "x-auth-token": testToken,
      },
    });

    console.log("✅ Success! Response status:", response.status);
    console.log("📋 Response data:", JSON.stringify(response.data, null, 2));

    if (response.data.success && response.data.data.campaigns?.length > 0) {
      console.log("\n🎉 GIFT CARD API IS WORKING!");
      console.log("📊 Found", response.data.data.campaigns.length, "campaigns:");
      response.data.data.campaigns.forEach((campaign, index) => {
        console.log(`   ${index + 1}. ${campaign.name} (ID: ${campaign.id})`);
      });
    } else {
      console.log("\n⚠️ API responded but no campaigns found");
    }
  } catch (error) {
    console.log("❌ API call failed:");
    console.log("   Status:", error.response?.status);
    console.log("   Message:", error.response?.data?.message);
    console.log("   Data:", JSON.stringify(error.response?.data, null, 2));
  }

  console.log("\n🏁 Test completed.");
};

testGiftCardAPI().catch(console.error);
