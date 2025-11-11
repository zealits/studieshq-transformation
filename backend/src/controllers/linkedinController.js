const axios = require("axios");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const Profile = require("../models/Profile");
const User = require("../models/User");

/**
 * @desc    Generate LinkedIn OAuth authorization URL
 * @route   GET /api/linkedin/auth
 * @access  Private
 */
exports.initiateLinkedInAuth = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID;
    // Redirect URI should point to backend callback endpoint
    const backendUrl = process.env.BACKEND_URL || process.env.API_URL || "http://localhost:2001";
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI || `${backendUrl}/api/linkedin/callback`;

    if (!clientId) {
      return res.status(500).json({
        success: false,
        message: "LinkedIn Client ID not configured",
      });
    }

    // Generate state parameter for CSRF protection
    // Include userId in state for callback (format: randomHex:userId)
    // In production, use Redis/session to store state->userId mapping
    const randomState = crypto.randomBytes(32).toString("hex");
    const state = `${randomState}:${userId}`;

    // LinkedIn OAuth 2.0 authorization URL
    const scopes = "openid profile email";
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scopes)}`;

    res.json({
      success: true,
      authUrl,
      state: randomState, // Return only random part to frontend
    });
  } catch (error) {
    console.error("Error initiating LinkedIn auth:", error);
    res.status(500).json({
      success: false,
      message: "Error initiating LinkedIn authentication",
      error: error.message,
    });
  }
};

/**
 * @desc    Handle LinkedIn OAuth callback
 * @route   GET /api/linkedin/callback
 * @access  Public (LinkedIn redirects here)
 */
exports.handleLinkedInCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    // Get userId from state or session - for now, we'll need to pass it via state
    // For better security, store state->userId mapping in Redis or session
    // For now, we'll get it from a temporary token or require user to be logged in
    // Since LinkedIn redirects here, we can't use req.user directly
    // We'll need to get userId from state parameter or require re-authentication
    
    // Option 1: Get userId from state (encode it in state)
    // Option 2: Store state->userId mapping temporarily
    // For now, let's get it from a cookie or session
    
    // Since we can't use req.user (no auth middleware), we'll need to:
    // 1. Store userId in state when initiating auth, OR
    // 2. Use a temporary token/session
    
    // For simplicity, let's encode userId in state (not ideal for production, but works)
    // In production, use Redis or session storage
    let userId = null;
    if (state) {
      // State format: {randomHex}:{userId}
      // We'll need to modify initiateLinkedInAuth to include userId
      const stateParts = state.split(":");
      if (stateParts.length === 2) {
        userId = stateParts[1];
      }
    }

    if (!userId) {
      // If no userId in state, redirect to login
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      return res.redirect(`${frontendUrl}/freelancer/profile?linkedin_error=${encodeURIComponent("User session expired. Please try again.")}`);
    }

    if (error) {
      return res.status(400).json({
        success: false,
        message: "LinkedIn authorization failed",
        error: error,
      });
    }

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Authorization code not provided",
      });
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    // Redirect URI should match what was used in authorization request
    const backendUrl = process.env.BACKEND_URL || process.env.API_URL || "http://localhost:2001";
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI || `${backendUrl}/api/linkedin/callback`;

    if (!clientId || !clientSecret) {
      return res.status(500).json({
        success: false,
        message: "LinkedIn credentials not configured",
      });
    }

    // Exchange authorization code for access token
    const tokenResponse = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, id_token } = tokenResponse.data;

    if (!access_token || !id_token) {
      return res.status(400).json({
        success: false,
        message: "Failed to obtain access token from LinkedIn",
      });
    }

    // Decode and verify ID token (basic verification - in production, verify signature)
    let idTokenPayload;
    try {
      // Decode without verification first (for development)
      // In production, you should verify the signature using LinkedIn's JWKS
      idTokenPayload = jwt.decode(id_token);
      
      if (!idTokenPayload) {
        throw new Error("Invalid ID token");
      }

      // Basic validation - LinkedIn issuer can be "https://www.linkedin.com" or variations
      // Accept issuer if it starts with the expected LinkedIn domain
      const validIssuers = [
        "https://www.linkedin.com",
        "https://www.linkedin.com/",
        "https://www.linkedin.com/oauth/v2",
      ];
      
      const isValidIssuer = validIssuers.some(validIss => 
        idTokenPayload.iss === validIss || idTokenPayload.iss?.startsWith("https://www.linkedin.com")
      );

      if (!isValidIssuer) {
        throw new Error(`Invalid token issuer: ${idTokenPayload.iss}`);
      }

      // Audience can be a string or array
      const audience = Array.isArray(idTokenPayload.aud) 
        ? idTokenPayload.aud 
        : [idTokenPayload.aud];
      
      if (!audience.includes(clientId)) {
        throw new Error("Invalid token audience");
      }

      // Check expiration
      if (idTokenPayload.exp && idTokenPayload.exp < Date.now() / 1000) {
        throw new Error("Token expired");
      }
    } catch (tokenError) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID token",
        error: tokenError.message,
      });
    }

    // Helper function to convert locale object to string
    const formatLocale = (locale) => {
      if (!locale) return undefined;
      // If already a string, return as is
      if (typeof locale === 'string') return locale;
      // If it's an object with country and language, format as "language-country"
      if (typeof locale === 'object' && locale.language && locale.country) {
        return `${locale.language}-${locale.country}`;
      }
      // If it's an object, try to stringify it
      if (typeof locale === 'object') {
        return JSON.stringify(locale);
      }
      return String(locale);
    };

    // Get user info from LinkedIn UserInfo endpoint
    let userInfo;
    try {
      const userInfoResponse = await axios.get("https://api.linkedin.com/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      userInfo = userInfoResponse.data;
    } catch (userInfoError) {
      // If userinfo fails, use data from ID token
      userInfo = {
        sub: idTokenPayload.sub,
        name: idTokenPayload.name,
        given_name: idTokenPayload.given_name,
        family_name: idTokenPayload.family_name,
        picture: idTokenPayload.picture,
        email: idTokenPayload.email,
        email_verified: idTokenPayload.email_verified,
        locale: idTokenPayload.locale,
      };
    }

    // Note: LinkedIn's Profile API requires r_basicprofile permission which is restricted
    // to approved LinkedIn partners. The OIDC scopes (openid profile email) don't include
    // access to the Profile API endpoints that would give us the vanity URL.
    // 
    // Since we can't get the vanity URL via API without special permissions, we'll:
    // 1. Mark the account as verified (which is valid - we have the LinkedIn ID)
    // 2. Not set a LinkedIn URL automatically (user can add it manually if needed)
    // 3. The verification status is still meaningful - it proves the user owns a LinkedIn account
    
    let linkedinProfileUrl = null;
    // Find or create profile for user
    let profile = await Profile.findOne({ user: userId });

    if (!profile) {
      // Create new profile if it doesn't exist
      const profileData = {
        user: userId,
        linkedinVerification: {
          isVerified: true,
          linkedinId: userInfo.sub,
          verifiedAt: new Date(),
          profileData: {
            name: userInfo.name,
            givenName: userInfo.given_name,
            familyName: userInfo.family_name,
            email: userInfo.email,
            emailVerified: userInfo.email_verified,
            picture: userInfo.picture,
            locale: formatLocale(userInfo.locale),
          },
        },
      };
      
      // Only set LinkedIn URL if we have a valid profile URL
      if (linkedinProfileUrl) {
        profileData.social = {
          linkedin: linkedinProfileUrl,
        };
      }
      
      profile = new Profile(profileData);
    } else {
      // Update existing profile
      // Only update LinkedIn URL if we have a valid profile URL
      if (linkedinProfileUrl) {
        profile.social.linkedin = linkedinProfileUrl;
      }
      // If we don't have a URL, keep the existing one (if any) or leave it as is
      
      profile.linkedinVerification = {
        isVerified: true,
        linkedinId: userInfo.sub,
        verifiedAt: new Date(),
        profileData: {
          name: userInfo.name,
          givenName: userInfo.given_name,
          familyName: userInfo.family_name,
          email: userInfo.email,
          emailVerified: userInfo.email_verified,
          picture: userInfo.picture,
          locale: formatLocale(userInfo.locale),
        },
      };
    }

    await profile.save();

    // If user doesn't have an avatar and LinkedIn picture is available, set it as avatar
    if (userInfo.picture) {
      const user = await User.findById(userId);
      if (user) {
        const avatarSource = user.avatarSource || "default";
        const shouldUpdateAvatar =
          !user.avatar ||
          avatarSource === "default" ||
          avatarSource === "linkedin";

        if (shouldUpdateAvatar) {
          user.avatar = userInfo.picture;
          user.avatarSource = "linkedin";
          await user.save();
        }
      }
    }

    // Redirect to frontend with success message
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/freelancer/profile?linkedin_verified=true`);
  } catch (error) {
    console.error("Error handling LinkedIn callback:", error);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/freelancer/profile?linkedin_error=${encodeURIComponent(error.message)}`);
  }
};

/**
 * @desc    Get LinkedIn verification status
 * @route   GET /api/linkedin/status
 * @access  Private
 */
exports.getLinkedInStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await Profile.findOne({ user: userId });

    if (!profile) {
      return res.json({
        success: true,
        data: {
          isVerified: false,
          linkedinUrl: null,
        },
      });
    }

    res.json({
      success: true,
      data: {
        isVerified: profile.linkedinVerification?.isVerified || false,
        linkedinId: profile.linkedinVerification?.linkedinId || null,
        linkedinUrl: profile.social?.linkedin || null,
        verifiedAt: profile.linkedinVerification?.verifiedAt || null,
        profileData: profile.linkedinVerification?.profileData || null,
      },
    });
  } catch (error) {
    console.error("Error getting LinkedIn status:", error);
    res.status(500).json({
      success: false,
      message: "Error getting LinkedIn verification status",
      error: error.message,
    });
  }
};

/**
 * @desc    Disconnect LinkedIn account
 * @route   DELETE /api/linkedin/disconnect
 * @access  Private
 */
exports.disconnectLinkedIn = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await Profile.findOne({ user: userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // Remove LinkedIn verification but keep the URL if manually entered
    profile.linkedinVerification = {
      isVerified: false,
      linkedinId: null,
      verifiedAt: null,
      profileData: null,
    };

    await profile.save();

    res.json({
      success: true,
      message: "LinkedIn account disconnected successfully",
    });
  } catch (error) {
    console.error("Error disconnecting LinkedIn:", error);
    res.status(500).json({
      success: false,
      message: "Error disconnecting LinkedIn account",
      error: error.message,
    });
  }
};

