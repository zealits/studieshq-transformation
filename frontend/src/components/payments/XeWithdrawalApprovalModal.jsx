import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import paymentService from "../../services/paymentService";

const XeWithdrawalApprovalModal = ({
  isOpen,
  onClose,
  withdrawalTransaction,
  onApprovalSuccess,
  onCancellationSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [hasBeenCancelled, setHasBeenCancelled] = useState(false);

  // Calculate time left until expiry
  useEffect(() => {
    if (withdrawalTransaction?.xePayment?.quote?.expires) {
      const expiryTime = new Date(withdrawalTransaction.xePayment.quote.expires);
      const now = new Date();
      const timeDiff = Math.floor((expiryTime - now) / 1000);

      if (timeDiff > 0) {
        setTimeLeft(timeDiff);
        setTimerActive(true);
        setIsExpired(false);
      } else {
        setTimeLeft(0);
        setTimerActive(false);
        setIsExpired(true);
      }
    }
  }, [withdrawalTransaction]);

  // Timer countdown effect
  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            setTimerActive(false);
            setIsExpired(true);
            toast.error("Contract has expired. The withdrawal will be automatically cancelled.");
            // Automatically cancel the withdrawal and close the modal when contract expires
            setTimeout(async () => {
              await autoCancelContract("Contract expired");
              onCancellationSuccess?.({
                message: "Withdrawal automatically cancelled due to contract expiry",
                transactionId: withdrawalTransaction.id,
              });
              onClose();
            }, 2000); // Close after 2 seconds to show the error message
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

  // Auto-cancel function that can be called from multiple places
  const autoCancelContract = async (reason = "Modal closed") => {
    if (hasBeenCancelled || !withdrawalTransaction?.id) {
      console.log("Contract already cancelled or no transaction ID, skipping auto-cancel");
      return;
    }

    try {
      console.log(`🏦 MODAL: Auto-cancelling contract due to: ${reason}`);
      setHasBeenCancelled(true);

      // Only attempt to cancel if the transaction is still pending
      if (withdrawalTransaction.status === "pending_approval") {
        await paymentService.cancelXeWithdrawal(withdrawalTransaction.id);
        console.log(`🏦 MODAL: ✅ Contract auto-cancelled successfully due to: ${reason}`);
      } else {
        console.log("Transaction already processed, skipping auto-cancel");
      }
    } catch (error) {
      console.error(`🏦 MODAL: Error auto-cancelling contract due to ${reason}:`, error);
    }
  };

  // Handle page refresh and browser close events
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isOpen && withdrawalTransaction?.id && !hasBeenCancelled) {
        // Use sendBeacon for reliable API calls during page unload
        const data = JSON.stringify({
          transactionId: withdrawalTransaction.id,
          reason: "Page refresh/close",
        });

        if (navigator.sendBeacon) {
          navigator.sendBeacon("/api/payments/cancel-xe-withdrawal", data);
        }

        // Also try to cancel immediately
        autoCancelContract("Page refresh/close");
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && isOpen && withdrawalTransaction?.id && !hasBeenCancelled) {
        autoCancelContract("Page hidden");
      }
    };

    if (isOpen) {
      window.addEventListener("beforeunload", handleBeforeUnload);
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isOpen, withdrawalTransaction?.id, hasBeenCancelled]);

  // Handle modal close (X button, ESC key, etc.)
  const handleModalClose = async () => {
    if (!hasBeenCancelled && withdrawalTransaction?.id) {
      await autoCancelContract("Modal closed by user");
    }
    onClose();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleApprove = async () => {
    if (isExpired) {
      toast.error("Cannot approve expired contract");
      return;
    }

    setLoading(true);
    try {
      const response = await paymentService.approveXeWithdrawal(withdrawalTransaction.id);

      if (response.success) {
        toast.success("Withdrawal approved successfully!");
        onApprovalSuccess?.(response.data);
        onClose();
      } else {
        throw new Error(response.message || "Failed to approve withdrawal");
      }
    } catch (error) {
      console.error("Error approving withdrawal:", error);
      toast.error(error.message || "Failed to approve withdrawal");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      await autoCancelContract("User clicked cancel button");
      toast.success("Withdrawal cancelled successfully!");
      onCancellationSuccess?.({
        message: "Withdrawal cancelled by user",
        transactionId: withdrawalTransaction.id,
      });
      onClose();
    } catch (error) {
      console.error("Error cancelling withdrawal:", error);
      toast.error("Failed to cancel withdrawal");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !withdrawalTransaction) {
    return null;
  }

  const { xePayment } = withdrawalTransaction;
  const isExpiredOrExpiring = isExpired || timeLeft < 30; // Show warning when less than 30 seconds left

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Approve XE Withdrawal</h2>
            <button onClick={handleModalClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Essential Information Only */}
          <div className="space-y-4 mb-6">
            {/* FX Conversion Details */}
            {xePayment?.quote?.fxDetails && xePayment.quote.fxDetails.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-medium text-gray-900 mb-3">Exchange Rate Details</h3>
                <div className="space-y-2 text-sm">
                  {xePayment.quote.fxDetails.map((fxDetail, index) => (
                    <div key={index} className="space-y-2">
                      {/* Sell Currency (Source) */}
                      {fxDetail.sell && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Selling:</span>
                          <span className="font-medium">
                            {fxDetail.sell.amount} {fxDetail.sell.currency}
                          </span>
                        </div>
                      )}

                      {/* Buy Currency (Target) */}
                      {fxDetail.buy && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Receiving:</span>
                          <span className="font-medium">
                            {fxDetail.buy.amount} {fxDetail.buy.currency}
                          </span>
                        </div>
                      )}

                      {/* Exchange Rate */}
                      {fxDetail.rate && fxDetail.rate.rate > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Exchange Rate:</span>
                          <span className="font-medium">
                            1 {fxDetail.rate.sellCurrency} = {fxDetail.rate.rate} {fxDetail.rate.buyCurrency}
                          </span>
                        </div>
                      )}

                      {/* Quote Type */}
                      {fxDetail.quoteType && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Quote Type:</span>
                          <span className="font-medium capitalize">{fxDetail.quoteType}</span>
                        </div>
                      )}

                      {/* Value Date */}
                      {fxDetail.valueDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Value Date:</span>
                          <span className="font-medium">{new Date(fxDetail.valueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Settlement Details */}
            {xePayment?.summary && xePayment.summary.length > 0 && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-medium text-gray-900 mb-3">Settlement Details</h3>
                <div className="space-y-2 text-sm">
                  {xePayment.summary.map((summary, index) => (
                    <div key={index} className="space-y-2">
                      {/* Settlement Amount */}
                      {summary.settlementAmount && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Settlement Amount:</span>
                          <span className="font-medium text-green-700">
                            {summary.settlementAmount.amount} {summary.settlementAmount.currency}
                          </span>
                        </div>
                      )}

                      {/* Settlement Fees */}
                      {summary.settlementFees && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Fees:</span>
                          <span className="font-medium">
                            {summary.settlementFees.amount} {summary.settlementFees.currency}
                          </span>
                        </div>
                      )}

                      {/* Settlement Date */}
                      {summary.settlementDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Settlement Date:</span>
                          <span className="font-medium">{new Date(summary.settlementDate).toLocaleDateString()}</span>
                        </div>
                      )}

                      {/* Settlement Method */}
                      {summary.settlementMethod && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Method:</span>
                          <span className="font-medium capitalize">
                            {summary.settlementMethod.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expiry Timer */}
            {xePayment?.quote?.expires && (
              <div
                className={`p-4 rounded-lg border-2 ${
                  isExpiredOrExpiring ? "border-red-200 bg-red-50" : "border-blue-200 bg-blue-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`font-medium ${isExpiredOrExpiring ? "text-red-800" : "text-blue-800"}`}>
                      {isExpired ? "Contract Expired" : "Contract Expires In"}
                    </h4>
                    <p className={`text-sm ${isExpiredOrExpiring ? "text-red-600" : "text-blue-600"}`}>
                      {isExpired ? "This contract can no longer be approved" : "Please approve or cancel before expiry"}
                    </p>
                  </div>
                  {!isExpired && (
                    <div
                      className={`text-2xl font-mono font-bold ${
                        isExpiredOrExpiring ? "text-red-600" : "text-blue-600"
                      }`}
                    >
                      {formatTime(timeLeft)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Processing..." : "Cancel"}
            </button>
            <button
              onClick={handleApprove}
              disabled={loading || isExpired}
              className={`flex-1 px-4 py-2 rounded-md text-white transition-colors ${
                isExpired
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              {loading ? "Processing..." : isExpired ? "Expired" : "Approve"}
            </button>
          </div>

          {/* Warning for expired contracts */}
          {isExpired && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">
                This quote has expired. The contract will be automatically cancelled. Please create a new withdrawal
                request if you still want to proceed.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default XeWithdrawalApprovalModal;
