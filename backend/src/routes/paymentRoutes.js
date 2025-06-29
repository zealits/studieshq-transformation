const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const auth = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");
const paymentController = require("../controllers/paymentController");

// Placeholder for controller functions
// These would be imported from ../controllers/paymentController
const {
  createPaymentMethod,
  getPaymentMethods,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  addFunds,
  withdrawFunds,
  releaseMilestonePayment,
  createInvoice,
  getInvoices,
  getInvoice,
  payInvoice,
  getTransactions,
  getTransaction,
  getBalance,
  getEarningStats,
  getSpendingStats,
} = {
  // Temporary implementations for development
  createPaymentMethod: (req, res) => {
    res.status(201).json({
      success: true,
      data: {
        paymentMethod: {
          id: "pm123",
          type: req.body.type,
          last4: req.body.last4,
          brand: req.body.brand,
          expiryMonth: req.body.expiryMonth,
          expiryYear: req.body.expiryYear,
          isDefault: req.body.isDefault || false,
          user: req.user.id,
          createdAt: new Date().toISOString(),
        },
      },
    });
  },
  getPaymentMethods: (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        paymentMethods: [
          {
            id: "pm123",
            type: "card",
            last4: "4242",
            brand: "Visa",
            expiryMonth: 12,
            expiryYear: 2024,
            isDefault: true,
            createdAt: "2023-04-15T00:00:00.000Z",
          },
          {
            id: "pm124",
            type: "card",
            last4: "5555",
            brand: "Mastercard",
            expiryMonth: 10,
            expiryYear: 2025,
            isDefault: false,
            createdAt: "2023-05-20T00:00:00.000Z",
          },
          {
            id: "pm125",
            type: "paypal",
            email: "user@example.com",
            isDefault: false,
            createdAt: "2023-06-10T00:00:00.000Z",
          },
        ],
      },
    });
  },
  deletePaymentMethod: (req, res) => {
    res.status(200).json({
      success: true,
      data: {},
    });
  },
  setDefaultPaymentMethod: (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        paymentMethod: {
          id: req.params.id,
          isDefault: true,
          updatedAt: new Date().toISOString(),
        },
      },
    });
  },
  addFunds: (req, res) => {
    res.status(201).json({
      success: true,
      data: {
        transaction: {
          id: "trans123",
          type: "deposit",
          amount: req.body.amount,
          description: "Add funds to wallet",
          status: "completed",
          paymentMethod: req.body.paymentMethod,
          user: req.user.id,
          createdAt: new Date().toISOString(),
        },
      },
    });
  },
  withdrawFunds: (req, res) => {
    res.status(201).json({
      success: true,
      data: {
        transaction: {
          id: "trans124",
          type: "withdrawal",
          amount: req.body.amount,
          description: "Withdraw funds from wallet",
          status: "processing",
          paymentMethod: req.body.paymentMethod,
          user: req.user.id,
          createdAt: new Date().toISOString(),
        },
      },
    });
  },
  releaseMilestonePayment: (req, res) => {
    res.status(201).json({
      success: true,
      data: {
        transaction: {
          id: "trans125",
          type: "milestone_payment",
          amount: req.body.amount,
          description: `Payment for milestone: ${req.body.milestoneTitle}`,
          status: "completed",
          project: req.body.project,
          milestone: req.params.milestone_id,
          fromUser: req.user.id,
          toUser: req.body.freelancer,
          createdAt: new Date().toISOString(),
        },
      },
    });
  },
  createInvoice: (req, res) => {
    res.status(201).json({
      success: true,
      data: {
        invoice: {
          id: "inv123",
          invoiceNumber: "INV-2023-001",
          amount: req.body.amount,
          description: req.body.description,
          dueDate: req.body.dueDate,
          status: "pending",
          fromUser: req.user.id,
          toUser: req.body.client,
          project: req.body.project,
          items: req.body.items,
          createdAt: new Date().toISOString(),
        },
      },
    });
  },
  getInvoices: (req, res) => {
    // Different responses based on role
    const userRole = req.user.role;
    const userId = req.user.id;

    const invoices = [
      {
        id: "inv123",
        invoiceNumber: "INV-2023-001",
        amount: 1500,
        description: "Website Development Services",
        dueDate: "2023-07-15T00:00:00.000Z",
        status: "paid",
        fromUser: {
          id: "freelancer123",
          name: "Jane Freelancer",
        },
        toUser: {
          id: "client123",
          name: "John Client",
          company: "ABC Corporation",
        },
        project: {
          id: "proj123",
          title: "E-commerce Website Development",
        },
        paidAt: "2023-07-10T00:00:00.000Z",
        createdAt: "2023-07-01T00:00:00.000Z",
      },
      {
        id: "inv124",
        invoiceNumber: "INV-2023-002",
        amount: 1000,
        description: "Mobile App Design Services",
        dueDate: "2023-08-15T00:00:00.000Z",
        status: "pending",
        fromUser: {
          id: "freelancer123",
          name: "Jane Freelancer",
        },
        toUser: {
          id: "client124",
          name: "Sarah Manager",
          company: "XYZ Ventures",
        },
        project: {
          id: "proj124",
          title: "Mobile App Design",
        },
        createdAt: "2023-08-01T00:00:00.000Z",
      },
    ];

    // Filter invoices based on user role and ID
    let filteredInvoices = invoices;
    if (userRole === "freelancer") {
      filteredInvoices = invoices.filter((i) => i.fromUser.id === userId);
    } else if (userRole === "client") {
      filteredInvoices = invoices.filter((i) => i.toUser.id === userId);
    }

    res.status(200).json({
      success: true,
      count: filteredInvoices.length,
      data: { invoices: filteredInvoices },
    });
  },
  getInvoice: (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        invoice: {
          id: req.params.id,
          invoiceNumber: "INV-2023-001",
          amount: 1500,
          description: "Website Development Services",
          dueDate: "2023-07-15T00:00:00.000Z",
          status: "paid",
          fromUser: {
            id: "freelancer123",
            name: "Jane Freelancer",
            email: "jane@example.com",
            phone: "123-456-7890",
            address: "123 Freelancer St, San Francisco, CA 94101",
          },
          toUser: {
            id: "client123",
            name: "John Client",
            company: "ABC Corporation",
            email: "john@abccorp.com",
            phone: "987-654-3210",
            address: "456 Client Ave, New York, NY 10001",
          },
          project: {
            id: "proj123",
            title: "E-commerce Website Development",
          },
          items: [
            {
              description: "Frontend Development",
              amount: 800,
              quantity: 1,
            },
            {
              description: "Backend API Development",
              amount: 700,
              quantity: 1,
            },
          ],
          subtotal: 1500,
          tax: 0,
          total: 1500,
          notes: "Payment due within 15 days.",
          paidAt: "2023-07-10T00:00:00.000Z",
          createdAt: "2023-07-01T00:00:00.000Z",
        },
      },
    });
  },
  payInvoice: (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        invoice: {
          id: req.params.id,
          status: "paid",
          paidAt: new Date().toISOString(),
          paymentMethod: req.body.paymentMethod,
          transaction: "trans126",
          updatedAt: new Date().toISOString(),
        },
      },
    });
  },
  getTransactions: (req, res) => {
    const transactions = [
      {
        id: "trans123",
        type: "deposit",
        amount: 2000,
        description: "Add funds to wallet",
        status: "completed",
        paymentMethod: {
          id: "pm123",
          type: "card",
          last4: "4242",
        },
        createdAt: "2023-06-01T00:00:00.000Z",
      },
      {
        id: "trans124",
        type: "milestone_payment",
        amount: 1000,
        description: "Payment for milestone: Design and Wireframing",
        status: "completed",
        project: {
          id: "proj123",
          title: "E-commerce Website Development",
        },
        toUser: {
          id: "freelancer123",
          name: "Jane Freelancer",
        },
        createdAt: "2023-06-16T00:00:00.000Z",
      },
      {
        id: "trans125",
        type: "withdrawal",
        amount: 950,
        description: "Withdraw funds from wallet",
        status: "processing",
        paymentMethod: {
          id: "pm125",
          type: "paypal",
          email: "user@example.com",
        },
        createdAt: "2023-06-20T00:00:00.000Z",
        fee: 50,
      },
    ];

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: { transactions },
    });
  },
  getTransaction: (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        transaction: {
          id: req.params.id,
          type: "milestone_payment",
          amount: 1000,
          description: "Payment for milestone: Design and Wireframing",
          status: "completed",
          project: {
            id: "proj123",
            title: "E-commerce Website Development",
          },
          milestone: {
            id: "mile123",
            title: "Design and Wireframing",
          },
          fromUser: {
            id: "client123",
            name: "John Client",
          },
          toUser: {
            id: "freelancer123",
            name: "Jane Freelancer",
          },
          platformFee: 50,
          netAmount: 950,
          createdAt: "2023-06-16T00:00:00.000Z",
        },
      },
    });
  },
  getBalance: (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        balance: {
          available: 1250,
          pending: 2000,
          reserved: 500,
          total: 3750,
          currency: "USD",
          lastUpdated: new Date().toISOString(),
        },
      },
    });
  },
  getEarningStats: (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalEarned: 5000,
          pendingPayments: 2000,
          thisMonth: 1500,
          lastMonth: 2000,
          averagePerProject: 2500,
          completedProjects: 2,
          inProgressProjects: 1,
          monthlySummary: [
            { month: "Jan", amount: 0 },
            { month: "Feb", amount: 0 },
            { month: "Mar", amount: 0 },
            { month: "Apr", amount: 0 },
            { month: "May", amount: 1500 },
            { month: "Jun", amount: 2000 },
            { month: "Jul", amount: 1500 },
            { month: "Aug", amount: 0 },
            { month: "Sep", amount: 0 },
            { month: "Oct", amount: 0 },
            { month: "Nov", amount: 0 },
            { month: "Dec", amount: 0 },
          ],
        },
      },
    });
  },
  getSpendingStats: (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalSpent: 8000,
          pendingPayments: 3000,
          thisMonth: 2000,
          lastMonth: 3000,
          averagePerProject: 4000,
          completedProjects: 2,
          inProgressProjects: 2,
          monthlySummary: [
            { month: "Jan", amount: 0 },
            { month: "Feb", amount: 0 },
            { month: "Mar", amount: 0 },
            { month: "Apr", amount: 0 },
            { month: "May", amount: 3000 },
            { month: "Jun", amount: 3000 },
            { month: "Jul", amount: 2000 },
            { month: "Aug", amount: 0 },
            { month: "Sep", amount: 0 },
            { month: "Oct", amount: 0 },
            { month: "Nov", amount: 0 },
            { month: "Dec", amount: 0 },
          ],
        },
      },
    });
  },
};

// @route   GET /api/payments/methods
// @desc    Get all payment methods for current user
// @access  Private
router.get("/methods", auth, paymentController.getPaymentMethods);

// @route   POST /api/payments/methods
// @desc    Add a new payment method
// @access  Private
router.post(
  "/methods",
  [
    auth,
    [
      check("type", "Payment method type is required").not().isEmpty(),
      // Conditional validation based on payment type
      check("cardNumber", "Valid card number is required").if(check("type").equals("card")).isLength({ min: 16 }),
      check("cardExpiry", "Card expiry date is required").if(check("type").equals("card")).not().isEmpty(),
      check("cardCVC", "Card CVC is required").if(check("type").equals("card")).isLength({ min: 3 }),
      check("cardholderName", "Cardholder name is required").if(check("type").equals("card")).not().isEmpty(),

      check("email", "Valid PayPal email is required").if(check("type").equals("paypal")).isEmail(),

      check("accountNumber", "Bank account number is required").if(check("type").equals("bank")).not().isEmpty(),
      check("routingNumber", "Bank routing number is required").if(check("type").equals("bank")).not().isEmpty(),
      check("bankName", "Bank name is required").if(check("type").equals("bank")).not().isEmpty(),
      check("accountHolderName", "Account holder name is required").if(check("type").equals("bank")).not().isEmpty(),
    ],
  ],
  paymentController.addPaymentMethod
);

// @route   DELETE /api/payments/methods/:id
// @desc    Delete a payment method
// @access  Private
router.delete("/methods/:id", auth, paymentController.deletePaymentMethod);

// @route   PUT /api/payments/methods/:id/default
// @desc    Set a payment method as default
// @access  Private
router.put("/methods/:id/default", auth, paymentController.setDefaultPaymentMethod);

// @route   GET /api/payments/wallet
// @desc    Get user wallet/balance info
// @access  Private
router.get("/wallet", auth, paymentController.getWalletInfo);

// @route   POST /api/payments/funds/add
// @desc    Add funds to wallet
// @access  Private
router.post(
  "/funds/add",
  [
    auth,
    [
      check("amount", "Amount must be greater than 0").isFloat({ min: 0.01 }),
      check("paymentMethodId", "Payment method ID is required").not().isEmpty(),
    ],
  ],
  paymentController.addFunds
);

// @route   POST /api/payments/funds/withdraw
// @desc    Withdraw funds from wallet
// @access  Private
router.post(
  "/funds/withdraw",
  [
    auth,
    [
      check("amount", "Amount must be greater than 0").isFloat({ min: 0.01 }),
      check("paymentMethodId", "Payment method ID is required").not().isEmpty(),
    ],
  ],
  paymentController.withdrawFunds
);

// @route   POST /api/payments/projects/:projectId/milestones/:milestoneId/release
// @desc    Release milestone payment (delegates to escrow controller)
// @access  Private (Client and Admin)
router.post(
  "/projects/:projectId/milestones/:milestoneId/release",
  [auth, checkRole(["client", "admin"])],
  paymentController.releaseMilestonePayment
);

// @route   GET /api/payments/invoices
// @desc    Get all invoices (filtered by user role)
// @access  Private
router.get("/invoices", auth, paymentController.getInvoices);

// @route   GET /api/payments/invoices/:id
// @desc    Get a single invoice
// @access  Private
router.get("/invoices/:id", auth, paymentController.getInvoice);

// @route   POST /api/payments/invoices
// @desc    Create a new invoice (freelancer only)
// @access  Private
router.post(
  "/invoices",
  [
    auth,
    [
      check("clientId", "Client ID is required").not().isEmpty(),
      check("items", "At least one item is required").isArray().not().isEmpty(),
      check("items.*.description", "Item description is required").not().isEmpty(),
      check("items.*.amount", "Item amount must be greater than 0").isFloat({ min: 0.01 }),
      check("dueDate", "Due date is required").isISO8601(),
    ],
  ],
  paymentController.createInvoice
);

// @route   POST /api/payments/invoices/:id/pay
// @desc    Pay an invoice (client only)
// @access  Private
router.post(
  "/invoices/:id/pay",
  [auth, [check("paymentMethodId", "Payment method ID is required").optional()]],
  paymentController.payInvoice
);

// @route   GET /api/payments/transactions
// @desc    Get all transactions for user
// @access  Private
router.get("/transactions", auth, paymentController.getTransactions);

// @route   GET /api/payments/transactions/:id
// @desc    Get a single transaction
// @access  Private
router.get("/transactions/:id", auth, paymentController.getTransaction);

// @route   GET /api/payments/statistics
// @desc    Get earnings/spending statistics
// @access  Private
router.get("/statistics", auth, paymentController.getPaymentStatistics);

// PayPal routes
// @route   POST /api/payments/paypal/create-order
// @desc    Create PayPal order for adding funds
// @access  Private
router.post("/paypal/create-order", auth, paymentController.createPayPalOrder);

// @route   POST /api/payments/paypal/capture-payment
// @desc    Capture PayPal payment
// @access  Private
router.post("/paypal/capture-payment", auth, paymentController.capturePayPalPayment);

// ***** GIFTOGRAM GIFT CARD ROUTES *****

// @route   GET /api/payments/gift-cards/campaigns
// @desc    Get available gift card campaigns
// @access  Private (Freelancers only)
router.get("/gift-cards/campaigns", auth, checkRole(["freelancer"]), paymentController.getGiftCardCampaigns);

// @route   POST /api/payments/gift-cards/withdraw
// @desc    Withdraw funds as gift card
// @access  Private (Freelancers only)
router.post(
  "/gift-cards/withdraw",
  [
    auth,
    checkRole(["freelancer"]),
    check("campaignId", "Campaign ID is required").notEmpty(),
    check("amount", "Amount must be a positive number").isFloat({ min: 0.01 }),
    check("recipientEmail", "Valid recipient email is required").isEmail(),
    check("recipientName", "Recipient name is required").notEmpty().trim(),
  ],
  paymentController.withdrawAsGiftCard
);

// @route   GET /api/payments/gift-cards/history
// @desc    Get gift card withdrawal history
// @access  Private (Freelancers only)
router.get("/gift-cards/history", auth, checkRole(["freelancer"]), paymentController.getGiftCardWithdrawals);

// @route   GET /api/payments/gift-cards/order/:orderId/status
// @desc    Check gift card order status
// @access  Private (Freelancers only)
router.get(
  "/gift-cards/order/:orderId/status",
  auth,
  checkRole(["freelancer"]),
  paymentController.checkGiftCardOrderStatus
);

module.exports = router;
