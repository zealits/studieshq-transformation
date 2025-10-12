import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import paymentService from "../../services/paymentService";

const XeWithdrawModal = ({ isOpen, onClose, approvedPaymentMethods = [], onWithdrawalSuccess }) => {
  const [step, setStep] = useState("amount"); // "amount", "quotation", "processing", "success"
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [amount, setAmount] = useState("");
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [proceedLoading, setProceedLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [withdrawalResult, setWithdrawalResult] = useState(null);

  // Filter for approved XE payment methods
  const xePaymentMethods = approvedPaymentMethods.filter(
    (method) => method.type === "bank" && method.provider === "xe" && method.approved === true
  );

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep("amount");
      setSelectedPaymentMethod(xePaymentMethods.length === 1 ? xePaymentMethods[0] : null);
      setAmount("");
      setQuotation(null);
      setError(null);
      setTimeLeft(0);
      setTimerActive(false);
      setProceedLoading(false);
      setWithdrawalResult(null);
    }
  }, [isOpen]);

  // Timer countdown effect
  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            setTimerActive(false);
            setStep("amount");
            setQuotation(null);
            toast.error("Quote expired. Please request a new quote.");
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleGetQuotation = async () => {
    if (!selectedPaymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid withdrawal amount");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("🏦 XE WITHDRAW: Getting quotation for:", {
        paymentMethodId: selectedPaymentMethod._id,
        amount: parseFloat(amount),
      });

      const response = await paymentService.getXeFxQuotation(selectedPaymentMethod._id, parseFloat(amount));

      if (response.success) {
        setQuotation(response.data);
        setStep("quotation");

        // Start timer (90 seconds)
        setTimeLeft(90);
        setTimerActive(true);

        console.log("🏦 XE WITHDRAW: ✅ Quotation received:", response.data);
        toast.success("Quotation received successfully!");
      } else {
        throw new Error(response.message || "Failed to get quotation");
      }
    } catch (error) {
      console.error("🏦 XE WITHDRAW: ❌ Error getting quotation:", error);

      let errorMessage = "Failed to get quotation";

      // Handle structured error responses from XE API
      if (error.details) {
        console.log("🏦 XE WITHDRAW: Structured error details:", error.details);

        if (error.details.errors && Array.isArray(error.details.errors)) {
          // Handle structured errors with fieldName and errors array
          const errorMessages = error.details.errors.map((err) => {
            if (err.errors && Array.isArray(err.errors)) {
              // Make field names more user-friendly
              let fieldDisplay = err.fieldName || "Field";
              if (fieldDisplay.includes("AccountType")) {
                fieldDisplay = "Bank Account Type";
              } else if (fieldDisplay.includes("Account")) {
                fieldDisplay = "Bank Account";
              } else if (fieldDisplay.includes("PayoutMethod")) {
                fieldDisplay = "Payment Method";
              }
              return `${fieldDisplay}: ${err.errors.join(", ")}`;
            }
            return err.fieldName || "Unknown field error";
          });
          errorMessage = errorMessages.join(". ");
        } else if (error.details.longErrorMsg) {
          errorMessage = error.details.longErrorMsg;
        } else if (error.details.shortErrorMsg) {
          errorMessage = error.details.shortErrorMsg;
        }
      } else if (error.longErrorMsg) {
        errorMessage = error.longErrorMsg;
      } else if (error.shortErrorMsg) {
        errorMessage = error.shortErrorMsg;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Add helpful context for common errors
      if (errorMessage.toLowerCase().includes("account type")) {
        errorMessage += ". Please contact support to update your bank account details.";
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = async () => {
    if (!selectedPaymentMethod || !quotation) {
      toast.error("Missing required information for withdrawal");
      return;
    }

    setProceedLoading(true);
    setError(null);

    try {
      console.log("🏦 XE WITHDRAW: === PROCEEDING WITH WITHDRAWAL ===");
      console.log("🏦 XE WITHDRAW: Proceeding with:", {
        paymentMethodId: selectedPaymentMethod._id,
        amount: parseFloat(amount),
        quotationId: quotation.quotation.quoteId,
      });

      setStep("processing");

      const response = await paymentService.proceedXeWithdrawal(selectedPaymentMethod._id, {
        amount: parseFloat(amount),
        purpose: "Freelance Payment",
      });

      if (response.success) {
        console.log("🏦 XE WITHDRAW: ✅ Withdrawal completed successfully:", response.data);

        setWithdrawalResult(response.data);
        setStep("success");
        setTimerActive(false);

        toast.success("XE withdrawal processed successfully!");

        // Notify parent component about successful withdrawal
        if (onWithdrawalSuccess) {
          onWithdrawalSuccess(response.data);
        }
      } else {
        throw new Error(response.message || "Failed to process withdrawal");
      }
    } catch (error) {
      console.error("🏦 XE WITHDRAW: ❌ Error processing withdrawal:", error);

      let errorMessage = "Failed to process withdrawal";

      // Handle structured error responses from backend
      if (error.details) {
        console.log("🏦 XE WITHDRAW: Structured error details:", error.details);

        if (error.details.longErrorMsg) {
          errorMessage = error.details.longErrorMsg;
        } else if (error.details.shortErrorMsg) {
          errorMessage = error.details.shortErrorMsg;
        } else if (error.details.message) {
          errorMessage = error.details.message;
        }

        // Add context for payment creation errors
        if (error.statusCode === 400) {
          errorMessage += ". Please check your account details and try again.";
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      setStep("quotation"); // Go back to quotation view
      toast.error(errorMessage);
    } finally {
      setProceedLoading(false);
    }
  };

  const handleBack = () => {
    setStep("amount");
    setQuotation(null);
    setError(null);
    setTimeLeft(0);
    setTimerActive(false);
    setProceedLoading(false);
    setWithdrawalResult(null);
  };

  const handleCloseSuccess = () => {
    onClose();
    // Reset all state
    setStep("amount");
    setSelectedPaymentMethod(null);
    setAmount("");
    setQuotation(null);
    setError(null);
    setTimeLeft(0);
    setTimerActive(false);
    setProceedLoading(false);
    setWithdrawalResult(null);
  };

  const formatPaymentMethodDisplay = (method) => {
    const countryCode = method.countryCode || "Unknown";
    const currencyCode = method.currencyCode || "Unknown";

    // Get bank name from XE recipient data if available
    let bankName = "Unknown Bank";
    if (method.xeRecipients && method.xeRecipients.length > 0) {
      const xeRecipient = method.xeRecipients[0]; // Get the first (most recent) XE recipient
      if (xeRecipient.payoutMethod?.bank?.account?.accountName) {
        bankName = xeRecipient.payoutMethod.bank.account.accountName;
      }
    } else if (method.bankDetails?.bankName) {
      // Fallback to bankDetails if XE recipient data is not available
      bankName = method.bankDetails.bankName;
    }

    let consumerName = "Bank Account";
    if (method.consumerDetails) {
      consumerName = `${method.consumerDetails.givenNames} ${method.consumerDetails.familyName}`;
    }

    return {
      title: `${bankName} (${countryCode}/${currencyCode})`,
      subtitle: consumerName,
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {step === "amount" && "XE Bank Withdrawal"}
            {step === "quotation" && "Withdrawal Quote"}
            {step === "processing" && "Processing Withdrawal"}
            {step === "success" && "Withdrawal Successful"}
          </h3>
          <button
            onClick={step === "success" ? handleCloseSuccess : onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === "amount" && (
            <div className="space-y-4">
              {/* Payment Method Selection */}
              {xePaymentMethods.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Bank Account</label>
                  <select
                    value={selectedPaymentMethod?._id || ""}
                    onChange={(e) => setSelectedPaymentMethod(xePaymentMethods.find((m) => m._id === e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a bank account</option>
                    {xePaymentMethods.map((method) => {
                      const display = formatPaymentMethodDisplay(method);
                      return (
                        <option key={method._id} value={method._id}>
                          {display.title} - {display.subtitle}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Selected Payment Method Display */}
              {selectedPaymentMethod && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Selected Bank Account</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Bank:</span>
                      <span className="font-medium">
                        {selectedPaymentMethod.xeRecipients && selectedPaymentMethod.xeRecipients.length > 0
                          ? selectedPaymentMethod.xeRecipients[0].payoutMethod?.bank?.account?.accountName ||
                            "Unknown Bank"
                          : selectedPaymentMethod.bankDetails?.bankName || "Unknown Bank"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Account Holder:</span>
                      <span className="font-medium">{formatPaymentMethodDisplay(selectedPaymentMethod).subtitle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Country/Currency:</span>
                      <span className="font-medium">
                        {selectedPaymentMethod.countryCode}/{selectedPaymentMethod.currencyCode}
                      </span>
                    </div>
                    {selectedPaymentMethod.bankDetails?.accountType && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Account Type:</span>
                        <span className="font-medium">{selectedPaymentMethod.bankDetails.accountType}</span>
                      </div>
                    )}
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">✓ APPROVED</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Withdrawal Amount (USD)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount to withdraw"
                  min="0.01"
                  step="0.01"
                  autoComplete="off"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <div className="mt-2 text-sm text-red-700">{error}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleGetQuotation}
                disabled={loading || !selectedPaymentMethod || !amount}
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
                    Getting Quote...
                  </>
                ) : (
                  "Get Quotation"
                )}
              </button>
            </div>
          )}

          {step === "quotation" && quotation && (
            <div className="space-y-4">
              {/* Timer */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <div className="text-yellow-800 font-medium">Quote Valid For:</div>
                <div className="text-2xl font-bold text-yellow-900 mt-1">{formatTime(timeLeft)}</div>
                <div className="text-sm text-yellow-600 mt-1">This quote will expire automatically</div>
              </div>

              {/* Quotation Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Exchange Details</h4>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">You send:</span>
                    <span className="font-medium">
                      {quotation.quotation.fxDetail.sell.amount.toFixed(2)} {quotation.quotation.fxDetail.sell.currency}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Recipient gets:</span>
                    <span className="font-medium text-green-600">
                      {quotation.quotation.fxDetail.buy.amount.toFixed(2)} {quotation.quotation.fxDetail.buy.currency}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Exchange rate:</span>
                    <span className="font-medium">
                      1 {quotation.quotation.fxDetail.rate.sellCurrency} ={" "}
                      {quotation.quotation.fxDetail.rate.rate.toFixed(4)}{" "}
                      {quotation.quotation.fxDetail.rate.buyCurrency}
                    </span>
                  </div>

                  {quotation.quotation.summary && quotation.quotation.summary[0] && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Settlement fees:</span>
                      <span className="font-medium">
                        {quotation.quotation.summary[0].settlementFees.amount.toFixed(2)}{" "}
                        {quotation.quotation.summary[0].settlementFees.currency}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quote Information */}
              <div className="text-sm text-gray-600">
                <div>Quote ID: {quotation.quotation.quoteId}</div>
                <div>Effective Date: {quotation.quotation.fxDetail.effectiveDate}</div>
                <div>
                  Status: <span className="text-green-600 font-medium">{quotation.quotation.status}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleBack}
                  disabled={proceedLoading}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed"
                >
                  Back
                </button>
                <button
                  onClick={handleProceed}
                  disabled={!timerActive || proceedLoading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {proceedLoading ? (
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
                      Processing...
                    </>
                  ) : (
                    "Proceed"
                  )}
                </button>
              </div>
            </div>
          )}

          {step === "processing" && (
            <div className="space-y-4 text-center">
              {/* Processing Animation */}
              <div className="flex justify-center">
                <svg
                  className="animate-spin h-16 w-16 text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Processing Your Withdrawal</h4>
                <p className="text-gray-600">
                  We're creating and approving your payment with XE. This may take a few moments...
                </p>
              </div>

              {/* Progress Steps */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-gray-700">Quote received</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
                    <span className="text-gray-700">Creating payment...</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-gray-300 rounded-full mr-3"></div>
                    <span className="text-gray-500">Approving contract</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-gray-300 rounded-full mr-3"></div>
                    <span className="text-gray-500">Finalizing withdrawal</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === "success" && withdrawalResult && (
            <div className="space-y-4">
              {/* Success Icon */}
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mt-4 mb-2">Withdrawal Processed Successfully!</h4>
                <p className="text-gray-600">
                  Your XE withdrawal has been created and approved. Funds will be transferred to your bank account.
                </p>
              </div>

              {/* Transaction Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3">Transaction Details</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-medium">{withdrawalResult.transaction.transactionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Withdrawn:</span>
                    <span className="font-medium">${withdrawalResult.transaction.amount.toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Contract Number:</span>
                    <span className="font-medium">{withdrawalResult.transaction.xePayment.contractNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="text-green-600 font-medium capitalize">{withdrawalResult.transaction.status}</span>
                  </div>
                </div>
              </div>

              {/* XE Payment Information */}
              {withdrawalResult.transaction.xePayment && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3">XE Payment Information</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Target Amount:</span>
                      <span className="font-medium text-green-600">
                        {withdrawalResult.transaction.xePayment.targetAmount?.toFixed(2)}{" "}
                        {withdrawalResult.transaction.xePayment.targetCurrency}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Exchange Rate:</span>
                      <span className="font-medium">
                        1 USD = {withdrawalResult.transaction.xePayment.exchangeRate?.toFixed(4)}{" "}
                        {withdrawalResult.transaction.xePayment.targetCurrency}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Contract Status:</span>
                      <span className="font-medium capitalize">
                        {withdrawalResult.transaction.xePayment.contractApproved ? "Approved" : "Pending"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* New Wallet Balance */}
              <div className="bg-green-50 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3">Updated Wallet Balance</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">New Balance:</span>
                    <span className="font-medium text-green-600">${withdrawalResult.newBalance.toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Withdrawn:</span>
                    <span className="font-medium">${withdrawalResult.transaction.amount.toFixed(2)} USD</span>
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
  );
};

export default XeWithdrawModal;
