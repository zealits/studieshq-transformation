const Proposal = require("../models/Proposal");
const Job = require("../models/Job");

const proposalController = {
  /**
   * @desc    Get all proposals for a freelancer
   * @route   GET /api/proposals/freelancer
   * @access  Private (Freelancer only)
   */
  getFreelancerProposals: async (req, res) => {
    console.log("hit");
    try {
      const proposals = await Proposal.find({ freelancer: req.user.id })
        .populate({
          path: "job",
          select: "title description budget deadline status client",
          populate: {
            path: "client",
            select: "name avatar",
          },
        })
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: { proposals },
      });
    } catch (err) {
      console.error("Error in getFreelancerProposals:", err.message);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  /**
   * @desc    Withdraw a proposal
   * @route   DELETE /api/proposals/:id
   * @access  Private (Freelancer only)
   */
  withdrawProposal: async (req, res) => {
    try {
      const proposal = await Proposal.findOne({
        _id: req.params.id,
        freelancer: req.user.id,
      });

      if (!proposal) {
        return res.status(404).json({
          success: false,
          message: "Proposal not found",
        });
      }

      // Only allow withdrawal if proposal is pending
      if (proposal.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Can only withdraw pending proposals",
        });
      }

      // Update job application count
      await Job.findByIdAndUpdate(proposal.job, {
        $inc: { applicationCount: -1 },
      });

      // Delete the proposal
      await Proposal.deleteOne({ _id: proposal._id });

      res.json({
        success: true,
        data: {},
      });
    } catch (err) {
      console.error("Error in withdrawProposal:", err.message);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
};

module.exports = proposalController;
