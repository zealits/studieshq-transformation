const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const paymentController = require("../../controllers/paymentController");

// Payment methods routes
// GET /api/payments/methods - Get all payment methods for the authenticated user
router.get("/methods", auth, paymentController.getPaymentMethods);

// POST /api/payments/methods - Add a new payment method
router.post("/methods", auth, paymentController.addPaymentMethod);

// DELETE /api/payments/methods/:id - Delete a payment method
router.delete("/methods/:id", auth, paymentController.deletePaymentMethod);

// PUT /api/payments/methods/:id/default - Set a payment method as default
router.put("/methods/:id/default", auth, paymentController.setDefaultPaymentMethod);

// Wallet routes
// GET /api/payments/wallet - Get wallet information
router.get("/wallet", auth, paymentController.getWalletInfo);

// POST /api/payments/wallet/deposit - Add funds to wallet
router.post("/wallet/deposit", auth, paymentController.addFunds);

// POST /api/payments/wallet/withdraw - Withdraw funds from wallet
router.post("/wallet/withdraw", auth, paymentController.withdrawFunds);

// Statistics routes
// GET /api/payments/statistics - Get payment statistics
router.get("/statistics", auth, paymentController.getPaymentStatistics);

// Transaction routes
// GET /api/payments/transactions - Get user transactions
router.get("/transactions", auth, paymentController.getTransactions);

// Invoice routes
// GET /api/payments/invoices - Get invoices
router.get("/invoices", auth, paymentController.getInvoices);

// POST /api/payments/invoices - Create an invoice (freelancer only)
router.post("/invoices", auth, paymentController.createInvoice);

// POST /api/payments/invoices/:id/pay - Pay an invoice (client only)
router.post("/invoices/:id/pay", auth, paymentController.payInvoice);

// Milestone payment routes
// POST /api/payments/projects/:projectId/milestones/:milestoneId/pay - Pay for a completed milestone
router.post("/projects/:projectId/milestones/:milestoneId/pay", auth, paymentController.releaseMilestonePayment);

module.exports = router;
