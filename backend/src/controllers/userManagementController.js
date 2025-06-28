const User = require("../models/User");
const Profile = require("../models/Profile");

/**
 * @desc    Get all users with pagination and filters
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status, search } = req.query;
    const query = {};

    // Apply filters
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }];
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    // Get profiles for users with verification documents
    const usersWithProfiles = await Promise.all(
      users.map(async (user) => {
        const profile = await Profile.findOne({ user: user._id });
        return {
          ...user.toObject(),
          profile: profile || {},
          verificationDocuments: profile?.verificationDocuments || {
            addressProof: { status: "pending" },
            identityProof: { status: "pending" },
          },
          isVerified: profile?.isVerified || false,
          verificationStatus: profile?.verificationStatus || "pending",
          verificationDate: profile?.verificationDate,
        };
      })
    );

    res.json({
      success: true,
      data: {
        users: usersWithProfiles,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error("Error in getAllUsers:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Update user verification status
 * @route   PUT /api/admin/users/:userId/verify
 * @access  Private/Admin
 */
exports.updateUserVerification = async (req, res) => {
  try {
    const { userId } = req.params;
    const { documentType, status, rejectionReason } = req.body;

    const profile = await Profile.findOne({ user: userId });
    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    // Update verification status for the specific document
    if (documentType === "addressProof" || documentType === "identityProof") {
      profile.verificationDocuments[documentType].status = status;
      profile.verificationDocuments[documentType].verifiedAt = status === "approved" ? Date.now() : null;
      profile.verificationDocuments[documentType].rejectionReason = status === "rejected" ? rejectionReason : null;

      // Check if both documents are approved and update verification status
      profile.checkVerificationStatus();
    }

    await profile.save({ validateModifiedOnly: true });

    res.json({
      success: true,
      data: {
        profile: {
          verificationDocuments: profile.verificationDocuments,
          isVerified: profile.isVerified,
          verificationStatus: profile.verificationStatus,
          verificationDate: profile.verificationDate,
          user: {
            id: userId,
          },
        },
      },
    });
  } catch (err) {
    console.error("Error in updateUserVerification:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
