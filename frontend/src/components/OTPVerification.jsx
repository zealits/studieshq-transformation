import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../api/axios";

const OTPVerification = ({ countryCode, phoneNumber, onVerificationSuccess, onCancel, isOpen = false }) => {
  const [otpCode, setOtpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // Timer for resend cooldown
  useEffect(() => {
    let timer;
    if (timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [timeLeft]);

  // Send OTP when component opens
  useEffect(() => {
    if (isOpen && countryCode && phoneNumber) {
      handleSendOTP();
    }
  }, [isOpen, countryCode, phoneNumber]);

  const handleSendOTP = async () => {
    if (!countryCode || !phoneNumber) {
      toast.error("Please provide a valid phone number");
      return;
    }

    setIsSending(true);
    try {
      const response = await api.post("/api/otp/send-verification", {
        countryCode,
        phoneNumber,
      });

      if (response.data.success) {
        toast.success("OTP sent successfully!");
        setTimeLeft(60); // 60 seconds cooldown
        setCanResend(false);
      }
    } catch (error) {
      console.error("Send OTP error:", error);
      toast.error(error.response?.data?.error || "Failed to send OTP");
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!otpCode || otpCode.length < 4) {
      toast.error("Please enter a valid OTP code");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post("/api/otp/verify", {
        countryCode,
        phoneNumber,
        otpCode,
      });

      if (response.data.success) {
        toast.success("Phone number verified successfully!");
        setOtpCode("");
        onVerificationSuccess && onVerificationSuccess(response.data);
      }
    } catch (error) {
      console.error("Verify OTP error:", error);
      toast.error(error.response?.data?.error || "Invalid or expired OTP code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = () => {
    if (canResend) {
      handleSendOTP();
    }
  };

  const formatPhoneNumber = () => {
    return `${countryCode} ${phoneNumber}`;
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Verify Phone Number</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">We've sent a verification code to:</p>
          <p className="font-medium text-gray-900">{formatPhoneNumber()}</p>
        </div>

        <form onSubmit={handleVerifyOTP}>
          <div className="mb-4">
            <label htmlFor="otpCode" className="block text-sm font-medium text-gray-700 mb-2">
              Enter OTP Code
            </label>
            <input
              type="text"
              id="otpCode"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-center text-xl tracking-widest"
              placeholder="Enter OTP"
              maxLength="8"
              autoComplete="one-time-code"
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-col space-y-3">
            <button
              type="submit"
              disabled={isLoading || !otpCode}
              className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Verifying...
                </div>
              ) : (
                "Verify OTP"
              )}
            </button>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={!canResend || isSending}
                className="text-sm text-primary hover:text-primary-dark disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {isSending ? "Sending..." : "Resend OTP"}
              </button>

              {timeLeft > 0 && <span className="text-sm text-gray-500">Resend in {timeLeft}s</span>}
            </div>
          </div>
        </form>

        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-xs text-blue-600">
            💡 Tip: The OTP code will expire in 10 minutes. If you don't receive it, please check your phone and try
            resending.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
