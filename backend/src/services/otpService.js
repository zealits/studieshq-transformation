const twilio = require("twilio");

// Initialize Twilio client
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

/**
 * Send OTP verification code to phone number
 * @param {string} phoneNumber - Phone number in E.164 format (e.g., +1234567890)
 * @returns {Promise} - Twilio verification response
 */
exports.sendOTPVerification = async (phoneNumber) => {
  try {
    const verification = await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID).verifications.create({
      to: phoneNumber,
      channel: "sms",
    });

    return {
      success: true,
      status: verification.status,
      sid: verification.sid,
      message: "OTP sent successfully",
    };
  } catch (error) {
    console.error("Twilio OTP send error:", error);
    throw new Error(error.message || "Failed to send OTP");
  }
};

/**
 * Verify OTP code
 * @param {string} phoneNumber - Phone number in E.164 format
 * @param {string} code - OTP code to verify
 * @returns {Promise} - Verification result
 */
exports.verifyOTP = async (phoneNumber, code) => {
  try {
    const verificationCheck = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: phoneNumber,
        code: code,
      });

    return {
      success: verificationCheck.status === "approved",
      status: verificationCheck.status,
      message:
        verificationCheck.status === "approved" ? "Phone number verified successfully" : "Invalid or expired OTP code",
    };
  } catch (error) {
    console.error("Twilio OTP verify error:", error);
    throw new Error(error.message || "Failed to verify OTP");
  }
};

/**
 * Format phone number to E.164 format
 * @param {string} countryCode - Country code (e.g., '+1')
 * @param {string} phoneNumber - Local phone number
 * @returns {string} - Formatted phone number in E.164 format
 */
exports.formatPhoneNumber = (countryCode, phoneNumber) => {
  // Remove any non-numeric characters except + from country code
  const cleanCountryCode = countryCode.replace(/[^\d+]/g, "");
  // Remove any non-numeric characters from phone number
  const cleanPhoneNumber = phoneNumber.replace(/\D/g, "");

  // Ensure country code starts with +
  const formattedCountryCode = cleanCountryCode.startsWith("+") ? cleanCountryCode : "+" + cleanCountryCode;

  return formattedCountryCode + cleanPhoneNumber;
};
