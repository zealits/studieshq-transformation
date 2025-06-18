const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Mock gift card campaigns endpoint
app.get("/api/payments/gift-cards/campaigns", (req, res) => {
  console.log("🎁 TEST ENDPOINT: Gift card campaigns requested");

  const mockCampaigns = [
    {
      id: "f3f940c3-0281-448d-886d-4969b3596826",
      name: "Amazon Gift Card",
      description: "Redeemable on Amazon.com for millions of items",
      currencies: ["USD"],
      denominations: [10, 25, 50, 100, 200, 500],
      active: true,
      terms: "Valid for 10 years from issue date. No expiration on gift card balance.",
    },
    {
      id: "visa-gift-card-campaign",
      name: "Visa Gift Card",
      description: "Use anywhere Visa is accepted",
      currencies: ["USD"],
      denominations: [10, 25, 50, 100, 200, 500],
      active: true,
      terms: "Valid for 12 months. May have activation fees.",
    },
    {
      id: "starbucks-gift-card-campaign",
      name: "Starbucks Gift Card",
      description: "Perfect for coffee lovers",
      currencies: ["USD"],
      denominations: [5, 10, 15, 25, 50, 100],
      active: true,
      terms: "Valid at participating Starbucks locations. No expiration date.",
    },
  ];

  res.json({
    success: true,
    data: {
      campaigns: mockCampaigns,
      count: mockCampaigns.length,
    },
  });
});

// Mock gift card withdrawal endpoint
app.post("/api/payments/gift-cards/withdraw", (req, res) => {
  console.log("🎁 TEST ENDPOINT: Gift card withdrawal requested");
  console.log("🎁 TEST ENDPOINT: Request body:", req.body);

  const { campaignId, amount, recipientEmail, recipientName, message } = req.body;

  // Validate required fields
  if (!campaignId || !amount || !recipientEmail || !recipientName) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: campaignId, amount, recipientEmail, recipientName",
    });
  }

  if (amount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Amount must be greater than 0",
    });
  }

  // Mock successful withdrawal response
  const mockOrderId = `mock-order-${Date.now()}`;
  const mockTransactionId = `GC-${Math.random().toString(36).substr(2, 8)}`;

  res.json({
    success: true,
    data: {
      transaction: {
        id: mockTransactionId,
        transactionId: mockTransactionId,
        amount: amount,
        type: "gift_card_withdrawal",
        status: "completed",
        giftCardOrder: {
          id: mockOrderId,
          status: "pending",
          campaignName: "Test Gift Card",
          recipientEmail: recipientEmail,
        },
        createdAt: new Date().toISOString(),
      },
      newBalance: 1000 - amount, // Mock remaining balance
    },
  });
});

// Mock gift card history endpoint
app.get("/api/payments/gift-cards/history", (req, res) => {
  console.log("🎁 TEST ENDPOINT: Gift card history requested");
  console.log("🎁 TEST ENDPOINT: Query params:", req.query);

  const mockTransactions = [
    {
      id: "trans123",
      transactionId: "GC-12345678",
      amount: -50,
      type: "gift_card_withdrawal",
      status: "completed",
      description: "Gift card withdrawal - Amazon Gift Card",
      recipientEmail: "test@example.com",
      createdAt: new Date().toISOString(),
      giftCardOrder: {
        order_id: "mock-order-123",
        status: "completed",
        campaign_name: "Amazon Gift Card",
      },
    },
    {
      id: "trans124",
      transactionId: "GC-87654321",
      amount: -25,
      type: "gift_card_withdrawal",
      status: "completed",
      description: "Gift card withdrawal - Starbucks Gift Card",
      recipientEmail: "user@example.com",
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      giftCardOrder: {
        order_id: "mock-order-124",
        status: "completed",
        campaign_name: "Starbucks Gift Card",
      },
    },
  ];

  res.json({
    success: true,
    data: {
      transactions: mockTransactions,
      pagination: {
        page: parseInt(req.query.page || 1),
        limit: parseInt(req.query.limit || 10),
        total: mockTransactions.length,
        pages: 1,
      },
    },
  });
});

// Mock gift card order status endpoint
app.get("/api/payments/gift-cards/order/:orderId/status", (req, res) => {
  console.log("🎁 TEST ENDPOINT: Gift card order status requested");
  console.log("🎁 TEST ENDPOINT: Order ID:", req.params.orderId);

  const mockOrder = {
    order_id: req.params.orderId,
    external_id: "GC-12345678",
    campaign_id: "f3f940c3-0281-448d-886d-4969b3596826",
    campaign_name: "Amazon Gift Card",
    status: "completed",
    spend: 50,
    recipients: [
      {
        email: "test@example.com",
        name: "Test User",
      },
    ],
    send_time: new Date().toISOString(),
    message: "Thanks for your hard work! Enjoy your gift card.",
  };

  res.json({
    success: true,
    data: {
      order: mockOrder,
      transaction: {
        id: "trans123",
        transactionId: "GC-12345678",
        amount: 50,
        status: "completed",
        createdAt: new Date().toISOString(),
      },
    },
  });
});

const PORT = 2001;
app.listen(PORT, () => {
  console.log(`🎁 TEST SERVER: Running on http://localhost:${PORT}`);
  console.log(
    `🎁 TEST SERVER: Gift cards campaigns endpoint: http://localhost:${PORT}/api/payments/gift-cards/campaigns`
  );
  console.log(
    `🎁 TEST SERVER: Gift cards withdraw endpoint: http://localhost:${PORT}/api/payments/gift-cards/withdraw`
  );
  console.log(`🎁 TEST SERVER: Gift cards history endpoint: http://localhost:${PORT}/api/payments/gift-cards/history`);
  console.log(
    `🎁 TEST SERVER: Gift cards order status endpoint: http://localhost:${PORT}/api/payments/gift-cards/order/:orderId/status`
  );
  console.log(`🎁 TEST SERVER: Use this server to test gift card functionality before using real Giftogram API`);
});
