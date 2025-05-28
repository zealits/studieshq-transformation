const cloudinary = require("cloudinary").v2;
const { cloudinaryConfig } = require("../config/config");
const User = require("../models/User");

// Configure Cloudinary
cloudinary.config(cloudinaryConfig);

/**
 * @desc    Upload profile image
 * @route   POST /api/upload/profile-image
 * @access  Private
 */
exports.uploadProfileImage = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    // Check if file is provided
    if (!req.files || !req.files.image) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }

    const file = req.files.image;

    // Validate file type
    if (!file.mimetype.startsWith("image/")) {
      return res.status(400).json({ success: false, message: "Please upload an image file" });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: "Image size should be less than 5MB" });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "profile_images",
      width: 300,
      crop: "scale",
    });

    // Update user's avatar in database
    const user = await User.findByIdAndUpdate(req.user.id, { avatar: result.secure_url }, { new: true }).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      data: {
        user,
        imageUrl: result.secure_url,
      },
    });
  } catch (err) {
    console.error("Error in uploadProfileImage:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
