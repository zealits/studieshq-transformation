// Correct version of proposalRoutes.js

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");
const proposalController = require("../controllers/proposalController");

// Get freelancer's proposals
router.get("/freelancer", auth, checkRole("freelancer"), proposalController.getFreelancerProposals);

// Withdraw a proposal
router.delete("/:id", auth, checkRole("freelancer"), proposalController.withdrawProposal);

module.exports = router;
