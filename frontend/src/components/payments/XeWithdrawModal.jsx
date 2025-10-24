import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import paymentService from "../../services/paymentService";
import XeWithdrawalApprovalModal from "./XeWithdrawalApprovalModal";

const XeWithdrawModal = ({
  isOpen,
  onClose,
  approvedPaymentMethods = [],
  onWithdrawalSuccess,
  availableBalance = 0,
}) => {
  const [step, setStep] = useState("amount"); // "amount", "processing", "success"
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [withdrawalResult, setWithdrawalResult] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [pendingWithdrawal, setPendingWithdrawal] = useState(null);
  const [amountError, setAmountError] = useState(null);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Filter for approved bank transfer payment methods
  const xePaymentMethods = approvedPaymentMethods.filter(
    (method) => method.type === "bank" && method.provider === "xe" && method.approved === true
  );

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep("amount");
      setSelectedPaymentMethod(xePaymentMethods.length === 1 ? xePaymentMethods[0] : null);
      setAmount("");
      setError(null);
      setAmountError(null);
      setAcceptTerms(false);
      setWithdrawalResult(null);
      setShowApprovalModal(false);
      setPendingWithdrawal(null);
    }
  }, [isOpen]);

  // Validate amount input
  const validateAmount = (value) => {
    const numValue = parseFloat(value);

    // Clear previous errors
    setAmountError(null);

    // Check if value is empty
    if (!value || value.trim() === "") {
      return true; // Allow empty input
    }

    // Check if value is a valid number
    if (isNaN(numValue)) {
      setAmountError("Please enter a valid number");
      return false;
    }

    // Check if value is negative
    if (numValue < 0) {
      setAmountError("Amount cannot be negative");
      return false;
    }

    // Check if value is zero
    if (numValue === 0) {
      setAmountError("Amount must be greater than 0");
      return false;
    }

    // Check if value exceeds available balance
    if (numValue > availableBalance) {
      setAmountError(`Amount cannot exceed available balance of $${availableBalance.toFixed(2)}`);
      return false;
    }

    return true;
  };

  // Handle amount change with validation
  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    validateAmount(value);
  };

  const handleWithdraw = async () => {
    if (!selectedPaymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    if (!amount || amount.trim() === "") {
      toast.error("Please enter a withdrawal amount");
      return;
    }

    // Validate amount before proceeding
    if (!validateAmount(amount)) {
      return; // Error message already set by validateAmount
    }

    const numAmount = parseFloat(amount);
    if (numAmount > availableBalance) {
      toast.error(`Amount cannot exceed available balance of $${availableBalance.toFixed(2)}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("🏦 BANK TRANSFER WITHDRAW: Creating withdrawal contract:", {
        paymentMethodId: selectedPaymentMethod._id,
        amount: parseFloat(amount),
      });

      setStep("processing");

      const response = await paymentService.proceedXeWithdrawal(selectedPaymentMethod._id, {
        amount: parseFloat(amount),
        purpose: "Freelance Payment",
      });

      if (response.success) {
        console.log("🏦 BANK TRANSFER WITHDRAW: ✅ Contract created successfully:", response.data);

        // Store the pending withdrawal and show approval modal
        setPendingWithdrawal(response.data.transaction);
        setShowApprovalModal(true);
        setStep("amount"); // Reset to amount step

        toast.success("Withdrawal contract created! Please approve or cancel.");
      } else {
        throw new Error(response.message || "Failed to create withdrawal contract");
      }
    } catch (error) {
      console.error("🏦 BANK TRANSFER WITHDRAW: ❌ Error creating withdrawal contract:", error);

      let errorMessage = "Failed to create withdrawal contract";

      // Handle structured error responses from backend
      if (error.details) {
        console.log("🏦 BANK TRANSFER WITHDRAW: Structured error details:", error.details);

        if (error.details.longErrorMsg) {
          errorMessage = error.details.longErrorMsg;
        } else if (error.details.shortErrorMsg) {
          errorMessage = error.details.shortErrorMsg;
        } else if (error.details.message) {
          errorMessage = error.details.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      setStep("amount");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalSuccess = (approvalData) => {
    console.log("🏦 BANK TRANSFER WITHDRAW: ✅ Withdrawal approved:", approvalData);
    setWithdrawalResult(approvalData);
    setStep("success");
    setShowApprovalModal(false);
    setPendingWithdrawal(null);

    toast.success("Withdrawal approved and completed successfully!");

    // Notify parent component about successful withdrawal
    if (onWithdrawalSuccess) {
      onWithdrawalSuccess(approvalData);
    }
  };

  const handleCancellationSuccess = (cancellationData) => {
    console.log("🏦 BANK TRANSFER WITHDRAW: ✅ Withdrawal cancelled:", cancellationData);
    setShowApprovalModal(false);
    setPendingWithdrawal(null);

    toast.success("Withdrawal cancelled successfully!");
  };

  const handleCloseSuccess = () => {
    onClose();
    // Reset all state
    setStep("amount");
    setSelectedPaymentMethod(null);
    setAmount("");
    setError(null);
    setWithdrawalResult(null);
    setShowApprovalModal(false);
    setPendingWithdrawal(null);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Bank Transfer Withdrawal</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Step Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-center space-x-4">
              <div className={`flex items-center ${step === "amount" ? "text-blue-600" : "text-gray-400"}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === "amount" ? "bg-blue-600 text-white" : "bg-gray-200"
                  }`}
                >
                  1
                </div>
                <span className="ml-2 text-sm font-medium">Amount</span>
              </div>
              <div className={`w-8 h-0.5 ${step === "processing" ? "bg-blue-600" : "bg-gray-200"}`}></div>
              <div className={`flex items-center ${step === "processing" ? "text-blue-600" : "text-gray-400"}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === "processing" ? "bg-blue-600 text-white" : "bg-gray-200"
                  }`}
                >
                  2
                </div>
                <span className="ml-2 text-sm font-medium">Processing</span>
              </div>
              <div className={`w-8 h-0.5 ${step === "success" ? "bg-blue-600" : "bg-gray-200"}`}></div>
              <div className={`flex items-center ${step === "success" ? "text-blue-600" : "text-gray-400"}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === "success" ? "bg-blue-600 text-white" : "bg-gray-200"
                  }`}
                >
                  3
                </div>
                <span className="ml-2 text-sm font-medium">Complete</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Amount Step */}
            {step === "amount" && (
              <div className="space-y-4">
                {/* Payment Method Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Bank Account</label>
                  <select
                    value={selectedPaymentMethod?._id || ""}
                    onChange={(e) => {
                      const method = xePaymentMethods.find((m) => m._id === e.target.value);
                      setSelectedPaymentMethod(method);
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a bank account...</option>
                    {xePaymentMethods.map((method) => {
                      // Get bank name from xeRecipients if available, fallback to bankDetails
                      let bankName = "Bank";
                      if (method.xeRecipients && method.xeRecipients.length > 0) {
                        const xeRecipient = method.xeRecipients[0];
                        if (xeRecipient.payoutMethod?.bank?.account?.accountName) {
                          bankName = xeRecipient.payoutMethod.bank.account.accountName;
                        }
                      } else if (method.bankDetails?.bankName) {
                        bankName = method.bankDetails.bankName;
                      }

                      return (
                        <option key={method._id} value={method._id}>
                          {bankName} ({method.countryCode}/{method.currencyCode}) - {method.consumerDetails?.givenNames}{" "}
                          {method.consumerDetails?.familyName}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Selected Bank Account Details */}
                {selectedPaymentMethod && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Selected Bank Account</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bank:</span>
                        <span className="font-medium">
                          {(() => {
                            // Get bank name from xeRecipients if available, fallback to bankDetails
                            if (selectedPaymentMethod.xeRecipients && selectedPaymentMethod.xeRecipients.length > 0) {
                              const xeRecipient = selectedPaymentMethod.xeRecipients[0];
                              if (xeRecipient.payoutMethod?.bank?.account?.accountName) {
                                return xeRecipient.payoutMethod.bank.account.accountName;
                              }
                            }
                            return selectedPaymentMethod.bankDetails?.bankName || "N/A";
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Account Holder:</span>
                        <span className="font-medium">
                          {selectedPaymentMethod.consumerDetails?.givenNames}{" "}
                          {selectedPaymentMethod.consumerDetails?.familyName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Country/Currency:</span>
                        <span className="font-medium">
                          {selectedPaymentMethod.countryCode}/{selectedPaymentMethod.currencyCode}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Account Type:</span>
                        <span className="font-medium">{selectedPaymentMethod.bankDetails?.accountType || "N/A"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Status:</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          APPROVED
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Withdrawal Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Withdrawal Amount (USD)
                    <span className="text-sm text-gray-500 ml-2">Available: ${availableBalance.toFixed(2)}</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder="Enter amount"
                      min="0.01"
                      step="0.01"
                      max={availableBalance}
                      className={`w-full border rounded-md px-3 py-2 pr-8 focus:outline-none focus:ring-2 ${
                        amountError ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                      }`}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => {
                            const newAmount = Math.min(availableBalance, (parseFloat(amount) || 0) + 1);
                            setAmount(newAmount.toString());
                            validateAmount(newAmount.toString());
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newAmount = Math.max(0.01, (parseFloat(amount) || 0.01) - 1);
                            setAmount(newAmount.toString());
                            validateAmount(newAmount.toString());
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Amount Error Display */}
                  {amountError && <p className="mt-1 text-sm text-red-600">{amountError}</p>}
                </div>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* Terms and Conditions Checkbox */}
                <div className="pt-4">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="acceptTerms" className="text-sm text-gray-700">
                      By proceeding, you accept Xe's{" "}
                      <a
                        href="https://help.xe.com/hc/en-gb/sections/16573963247889-Terms-and-conditions"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        Terms and Conditions
                      </a>{" "}
                      and{" "}
                      <a
                        href="https://help.xe.com/hc/en-gb/sections/16573566300689-Policies"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        Privacy Policy
                      </a>
                    </label>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-4">
                  <button
                    onClick={handleWithdraw}
                    disabled={loading || !selectedPaymentMethod || !amount || amountError || !acceptTerms}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Creating Contract...
                      </>
                    ) : (
                      "Create Withdrawal Contract"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Processing Step */}
            {step === "processing" && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Creating Withdrawal Contract</h3>
                <p className="text-gray-600">Please wait while we create your withdrawal contract...</p>
              </div>
            )}

            {/* Success Step */}
            {step === "success" && withdrawalResult && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Withdrawal Completed Successfully!</h3>
                  <p className="text-gray-600">Your withdrawal has been processed and completed.</p>
                </div>

                {/* Transaction Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Transaction Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaction ID:</span>
                      <span className="font-medium font-mono">{withdrawalResult.transaction?.transactionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium">${withdrawalResult.transaction?.amount?.toFixed(2)} USD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium capitalize">
                        {withdrawalResult.transaction?.status?.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Contract Number:</span>
                      <span className="font-medium font-mono text-xs">
                        {withdrawalResult.transaction?.contractNumber}
                      </span>
                    </div>
                  </div>
                </div>

                {/* New Wallet Balance */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3">Updated Wallet Balance</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">New Balance:</span>
                      <span className="font-medium text-green-600">${withdrawalResult.newBalance?.toFixed(2)} USD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount Withdrawn:</span>
                      <span className="font-medium">${withdrawalResult.transaction?.amount?.toFixed(2)} USD</span>
                    </div>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={handleCloseSuccess}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && pendingWithdrawal && (
        <XeWithdrawalApprovalModal
          isOpen={showApprovalModal}
          onClose={() => setShowApprovalModal(false)}
          withdrawalTransaction={pendingWithdrawal}
          onApprovalSuccess={handleApprovalSuccess}
          onCancellationSuccess={handleCancellationSuccess}
        />
      )}
    </div>
  );
};

export default XeWithdrawModal;
