import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import paypalService from "../../services/paypalService";
import Spinner from "../common/Spinner";

const PayPalWithdrawModal = ({ isOpen, onClose, availableBalance, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
  });
  const [errors, setErrors] = useState({});
  const [feeCalculation, setFeeCalculation] = useState({
    grossAmount: 0,
    fee: 0,
    netAmount: 0,
    feePercentage: 0,
  });

  // Get current user data from Redux store
  const { user } = useSelector((state) => state.auth);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && user) {
      console.log("💰 PAYPAL MODAL: === MODAL OPENED - RESETTING FORM ===");
      console.log("💰 PAYPAL MODAL: User data:", user);
      console.log("💰 PAYPAL MODAL: Available balance:", availableBalance);

      setFormData({
        amount: "",
      });
      setErrors({});
      setFeeCalculation({
        grossAmount: 0,
        fee: 0,
        netAmount: 0,
        feePercentage: 0,
      });
    }
  }, [isOpen, user, availableBalance]);

  // Update fee calculation when amount changes
  useEffect(() => {
    if (formData.amount) {
      const calculation = paypalService.calculateWithdrawalFees(formData.amount);
      setFeeCalculation(calculation);
      console.log("💰 PAYPAL MODAL: Fee calculation updated:", calculation);
    } else {
      setFeeCalculation({
        grossAmount: 0,
        fee: 0,
        netAmount: 0,
        feePercentage: 0,
      });
    }
  }, [formData.amount]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    console.log("💰 PAYPAL MODAL VALIDATION: === STARTING FORM VALIDATION ===");
    console.log("💰 PAYPAL MODAL VALIDATION: Form data:", formData);
    console.log("💰 PAYPAL MODAL VALIDATION: Available balance:", availableBalance);
    console.log("💰 PAYPAL MODAL VALIDATION: User:", user);

    // Validate amount using PayPal service
    const amountValidation = paypalService.validateWithdrawalAmount(formData.amount, availableBalance);
    if (!amountValidation.valid) {
      newErrors.amount = amountValidation.error;
    }

    // Validate user data
    if (!user) {
      newErrors.user = "User information not available. Please refresh and try again.";
    } else {
      if (!user.email) {
        newErrors.user = "User email not available. Please update your profile with a valid PayPal email.";
      }
    }

    console.log("💰 PAYPAL MODAL VALIDATION: Validation errors:", newErrors);
    console.log("💰 PAYPAL MODAL VALIDATION: Form is valid:", Object.keys(newErrors).length === 0);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("💰 PAYPAL MODAL SUBMIT: === PAYPAL WITHDRAWAL STARTED ===");
    console.log("💰 PAYPAL MODAL SUBMIT: Form data:", formData);
    console.log("💰 PAYPAL MODAL SUBMIT: User:", user);
    console.log("💰 PAYPAL MODAL SUBMIT: Available balance:", availableBalance);
    console.log("💰 PAYPAL MODAL SUBMIT: Fee calculation:", feeCalculation);

    if (!validateForm()) {
      console.warn("💰 PAYPAL MODAL SUBMIT: ❌ Form validation failed");
      return;
    }

    console.log("💰 PAYPAL MODAL SUBMIT: ✅ Form validation passed");

    try {
      console.log("💰 PAYPAL MODAL SUBMIT: Setting loading state to true");
      setLoading(true);

      const withdrawalData = {
        amount: parseFloat(formData.amount),
      };

      console.log("💰 PAYPAL MODAL SUBMIT: === PREPARED WITHDRAWAL DATA ===");
      console.log("💰 PAYPAL MODAL SUBMIT: Withdrawal data:", JSON.stringify(withdrawalData, null, 2));
      console.log("💰 PAYPAL MODAL SUBMIT: Amount:", withdrawalData.amount);
      console.log("💰 PAYPAL MODAL SUBMIT: Expected PayPal email:", user.email);

      console.log("💰 PAYPAL MODAL SUBMIT: Calling paypalService.withdrawViaPayPal()...");
      const response = await paypalService.withdrawViaPayPal(withdrawalData);

      console.log("💰 PAYPAL MODAL SUBMIT: === WITHDRAWAL RESPONSE RECEIVED ===");
      console.log("💰 PAYPAL MODAL SUBMIT: Response:", response);
      console.log("💰 PAYPAL MODAL SUBMIT: Full response JSON:", JSON.stringify(response, null, 2));

      console.log("💰 PAYPAL MODAL SUBMIT: ✅ Withdrawal successful!");
      toast.success("PayPal withdrawal processed successfully! You will receive the payment at your registered email.");

      console.log("💰 PAYPAL MODAL SUBMIT: Calling onSuccess callback...");
      onSuccess(response.data);

      console.log("💰 PAYPAL MODAL SUBMIT: Closing modal...");
      onClose();

      console.log("💰 PAYPAL MODAL SUBMIT: === WITHDRAWAL PROCESS COMPLETED ===");
    } catch (error) {
      console.error("💰 PAYPAL MODAL SUBMIT: === ERROR PROCESSING WITHDRAWAL ===");
      console.error("💰 PAYPAL MODAL SUBMIT: Error type:", error.constructor.name);
      console.error("💰 PAYPAL MODAL SUBMIT: Error message:", error.message);
      console.error("💰 PAYPAL MODAL SUBMIT: Full error object:", error);

      console.error("💰 PAYPAL MODAL SUBMIT: === END ERROR DETAILS ===");

      toast.error(error.message || "Failed to process PayPal withdrawal");
    } finally {
      console.log("💰 PAYPAL MODAL SUBMIT: Setting loading state to false");
      setLoading(false);
      console.log("💰 PAYPAL MODAL SUBMIT: === WITHDRAWAL ATTEMPT FINISHED ===");
    }
  };

  if (!isOpen) return null;

  // Get user display info
  const recipientEmail = user?.email || "No email available";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Withdraw via PayPal</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={loading}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Available Balance:</strong> ${availableBalance?.toFixed(2) || "0.00"}
          </p>
        </div>

        {/* PayPal Email Information */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-sm text-gray-800 mb-2">PayPal Recipient</h4>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              <strong>Email:</strong> {recipientEmail}
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            The withdrawal will be sent to this PayPal email address. Make sure you have a PayPal account associated
            with this email.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Input */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Withdrawal Amount (USD) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="0.00"
                min="1"
                max={availableBalance}
                step="0.01"
                className={`w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.amount ? "border-red-500" : "border-gray-300"
                }`}
                disabled={loading}
              />
            </div>
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
            <div className="text-xs text-gray-500 mt-1">
              <p>Minimum: $1.00 • Maximum: $10,000.00</p>
            </div>
          </div>

          {/* Fee Breakdown */}
          {feeCalculation.grossAmount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h4 className="font-medium text-sm text-yellow-800 mb-2">Fee Breakdown</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Withdrawal Amount:</span>
                  <span className="font-medium">${feeCalculation.grossAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform Fee ({feeCalculation.feePercentage}%):</span>
                  <span className="font-medium text-red-600">-${feeCalculation.fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-yellow-300 pt-1">
                  <span className="font-medium text-gray-800">You will receive:</span>
                  <span className="font-bold text-green-600">${feeCalculation.netAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {errors.user && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{errors.user}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
              disabled={loading || !user || feeCalculation.netAmount <= 0}
            >
              {loading ? (
                <>
                  <Spinner size="sm" />
                  <span className="ml-2">Processing...</span>
                </>
              ) : (
                `Withdraw $${feeCalculation.netAmount.toFixed(2)}`
              )}
            </button>
          </div>
        </form>

        {/* Info Section */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> The withdrawal will be processed via PayPal and sent to your registered email
            address. You should receive the payment within a few minutes to a few hours depending on PayPal processing
            times.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PayPalWithdrawModal;

