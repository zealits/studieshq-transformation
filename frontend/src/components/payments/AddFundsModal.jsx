import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { toast } from "react-hot-toast";
import { createPayPalOrder, capturePayPalPayment, clearError, clearPayPalOrder } from "../../redux/slices/paymentSlice";

const AddFundsModal = ({ isOpen, onClose, onSuccess }) => {
  const [amount, setAmount] = useState("");
  const [showPayPal, setShowPayPal] = useState(false);

  const dispatch = useDispatch();
  const { paypalOrder, orderCreating, paymentCapturing, error } = useSelector((state) => state.payment);

  // PayPal client ID (this will come from environment variables)
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || "test";

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    // Clean up PayPal order when modal closes
    return () => {
      if (paypalOrder) {
        dispatch(clearPayPalOrder());
      }
    };
  }, [paypalOrder, dispatch]);

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleContinue = () => {
    const numAmount = parseFloat(amount);

    if (!amount || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (numAmount < 1) {
      toast.error("Minimum amount is $1.00");
      return;
    }

    if (numAmount > 10000) {
      toast.error("Maximum amount is $10,000.00");
      return;
    }

    // Directly show PayPal interface since it's the only payment method
    setShowPayPal(true);
  };

  const createOrder = async () => {
    try {
      const result = await dispatch(createPayPalOrder({ amount: parseFloat(amount) })).unwrap();
      console.log("PayPal order created:", result);
      return result.data.orderId;
    } catch (error) {
      console.error("Error creating PayPal order:", error);
      throw error;
    }
  };

  const onApprove = async (data) => {
    try {
      const result = await dispatch(capturePayPalPayment({ orderId: data.orderID })).unwrap();

      // Success - close modal and notify parent
      setAmount("");
      setShowPayPal(false);
      onClose();

      if (onSuccess) {
        onSuccess(result);
      }

      toast.success("💰 Funds added successfully via PayPal!", {
        duration: 4000,
        icon: "🎉",
      });
    } catch (error) {
      console.error("Error capturing PayPal payment:", error);
      toast.error("❌ Payment failed. Please try again.", {
        duration: 4000,
      });
    }
  };

  const onError = (err) => {
    console.error("PayPal error:", err);
    toast.error("❌ PayPal payment error. Please try again.", {
      duration: 4000,
    });
  };

  const onCancel = () => {
    setShowPayPal(false);
    dispatch(clearPayPalOrder());
  };

  const handleClose = () => {
    setAmount("");
    setShowPayPal(false);
    dispatch(clearPayPalOrder());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2 border-b border-gray-100">
            <h2 className="text-xl font-semibold">Add Funds to Wallet</h2>
            <button onClick={handleClose} className="text-gray-500 hover:text-gray-700" disabled={paymentCapturing}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!showPayPal ? (
            <div>
              {/* Amount Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={orderCreating}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum: $1.00 • Maximum: $10,000.00</p>
              </div>


              {/* Continue Button */}
              <div className="mt-6">
                <button
                  onClick={handleContinue}
                  disabled={!amount || orderCreating}
                  className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  {orderCreating ? "Processing..." : "Continue"}
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* PayPal Payment Section */}
              <div className="mb-4">
                <h3 className="font-medium mb-2">Complete Your Payment</h3>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-semibold text-lg">${parseFloat(amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium">PayPal</span>
                  </div>
                </div>
              </div>

              {/* PayPal Buttons */}
              <div className="mb-4">
                {paypalClientId !== "test" ? (
                  <PayPalScriptProvider
                    options={{
                      "client-id": paypalClientId,
                      currency: "USD",
                      intent: "capture",
                    }}
                  >
                    <PayPalButtons
                      style={{
                        layout: "vertical",
                        color: "blue",
                        shape: "rect",
                        label: "paypal",
                      }}
                      createOrder={createOrder}
                      onApprove={onApprove}
                      onError={onError}
                      onCancel={onCancel}
                      disabled={paymentCapturing}
                    />
                  </PayPalScriptProvider>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <p className="text-yellow-800 font-medium">PayPal Integration Not Configured</p>
                    <p className="text-yellow-600 text-sm mt-1">
                      Please configure PayPal credentials to enable payments
                    </p>
                  </div>
                )}
              </div>

              {/* Back Button */}
              <button
                onClick={() => setShowPayPal(false)}
                disabled={paymentCapturing}
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Back
              </button>

              {paymentCapturing && (
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600"
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
                    <span className="text-blue-600">Processing payment...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddFundsModal;
