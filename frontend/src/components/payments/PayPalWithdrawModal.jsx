import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import paypalService from "../../services/paypalService";
import Spinner from "../common/Spinner";

const PayPalWithdrawModal = ({ isOpen, onClose, availableBalance, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState({});

  // Get current user data from Redux store
  const { user } = useSelector((state) => state.auth);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setErrors({});
    }
  }, [isOpen]);

  // Real-time validation
  useEffect(() => {
    if (amount && availableBalance) {
      const validation = paypalService.validateWithdrawalAmount(amount, availableBalance);
      if (!validation.valid) {
        setErrors({ amount: validation.error });
      } else {
        setErrors({});
      }
    }
  }, [amount, availableBalance]);

  const handleAmountChange = (e) => {
    const value = e.target.value;
    
    // Allow only numbers and decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleAmountIncrement = () => {
    const currentAmount = parseFloat(amount) || 0;
    const newAmount = Math.min(currentAmount + 1, availableBalance);
    setAmount(newAmount.toString());
  };

  const handleAmountDecrement = () => {
    const currentAmount = parseFloat(amount) || 0;
    const newAmount = Math.max(currentAmount - 1, 0);
    setAmount(newAmount.toString());
  };

  const handleMaxAmount = () => {
    setAmount(availableBalance.toString());
  };

  const isAmountValid = () => {
    if (!amount) return false;
    const validation = paypalService.validateWithdrawalAmount(amount, availableBalance);
    return validation.valid;
  };

  const getFeeCalculation = () => {
    if (!amount || !isAmountValid()) {
      return {
        grossAmount: 0,
        fee: 0,
        netAmount: 0,
        feePercentage: 0,
      };
    }
    return paypalService.calculateWithdrawalFees(amount);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAmountValid()) {
      toast.error("Please enter a valid withdrawal amount");
      return;
    }

    if (!user?.email) {
      toast.error("User email not found. Please update your profile.");
      return;
    }

    try {
      setLoading(true);

      const withdrawalData = {
        amount: parseFloat(amount),
      };

      console.log("💰 PAYPAL MODAL: Initiating withdrawal:", withdrawalData);

      const result = await paypalService.withdrawViaPayPal(withdrawalData);

      if (result.success) {
        toast.success("Withdrawal request submitted successfully!");
        onSuccess?.(result.data);
        onClose();
      } else {
        toast.error(result.message || "Withdrawal failed");
      }
    } catch (error) {
      console.error("💰 PAYPAL MODAL: Withdrawal error:", error);
      toast.error(error.message || "Failed to process withdrawal");
    } finally {
      setLoading(false);
    }
  };

  const feeCalculation = getFeeCalculation();
  const canWithdraw = isAmountValid() && !loading;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Withdraw via PayPal</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Available Balance */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-600 font-medium">Available Balance</div>
            <div className="text-2xl font-bold text-blue-900">
              ${availableBalance ? availableBalance.toFixed(2) : "0.00"}
            </div>
          </div>

          {/* PayPal Recipient */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">PayPal Recipient</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="text-sm text-gray-600">{user?.email || "No email found"}</div>
              <div className="text-xs text-gray-500 mt-1">
                The withdrawal will be sent to this PayPal email address. Make sure you have a PayPal account associated with this email.
              </div>
            </div>
          </div>

          {/* Withdrawal Amount */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Withdrawal Amount (USD) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="amount"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                  className={`w-full px-3 py-2 pr-20 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.amount ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={loading}
                />
                <div className="absolute right-1 top-1 flex flex-col">
                  <button
                    type="button"
                    onClick={handleAmountIncrement}
                    disabled={loading || parseFloat(amount || 0) >= availableBalance}
                    className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={handleAmountDecrement}
                    disabled={loading || parseFloat(amount || 0) <= 0}
                    className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ▼
                  </button>
                </div>
              </div>
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
              <div className="flex justify-between items-center mt-2">
                <div className="text-xs text-gray-500">
                  Minimum: $1.00 • Maximum: $10,000.00
                </div>
                <button
                  type="button"
                  onClick={handleMaxAmount}
                  disabled={loading}
                  className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  Use Max
                </button>
              </div>
            </div>

            {/* Fee Breakdown */}
            {amount && isAmountValid() && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Fee Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Withdrawal Amount:</span>
                    <span>${feeCalculation.grossAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Fee ({feeCalculation.feePercentage}%):</span>
                    <span className="text-red-600">-${feeCalculation.fee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-green-600 border-t border-gray-200 pt-2">
                    <span>You will receive:</span>
                    <span>${feeCalculation.netAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canWithdraw}
                className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                  canWithdraw
                    ? "bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <Spinner size="sm" />
                    <span className="ml-2">Processing...</span>
                  </div>
                ) : (
                  `Withdraw $${feeCalculation.netAmount.toFixed(2)}`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PayPalWithdrawModal;