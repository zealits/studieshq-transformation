import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { createPayPalOrder, capturePayPalPayment, clearError, clearPayPalOrder } from "../../redux/slices/paymentSlice";

const AddFundsModal = ({ isOpen, onClose, onSuccess }) => {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("paypal");
  const [showPayPal, setShowPayPal] = useState(false);

  const dispatch = useDispatch();
  const { paypalOrder, orderCreating, paymentCapturing, error } = useSelector((state) => state.payment);

  // PayPal client ID (this will come from environment variables)
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || "test";

  useEffect(() => {
    if (error) {
      alert(error);
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
      alert("Please enter a valid amount");
      return;
    }

    if (numAmount < 1) {
      alert("Minimum amount is $1.00");
      return;
    }

    if (numAmount > 10000) {
      alert("Maximum amount is $10,000.00");
      return;
    }

    if (paymentMethod === "paypal") {
      setShowPayPal(true);
    }
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

      alert("Funds added successfully!");
    } catch (error) {
      console.error("Error capturing PayPal payment:", error);
      alert("Payment failed. Please try again.");
    }
  };

  const onError = (err) => {
    console.error("PayPal error:", err);
    alert("PayPal payment error. Please try again.");
  };

  const onCancel = () => {
    setShowPayPal(false);
    dispatch(clearPayPalOrder());
  };

  const handleClose = () => {
    setAmount("");
    setShowPayPal(false);
    setPaymentMethod("paypal");
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

              {/* Payment Method Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={paymentMethod === "paypal"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                      disabled={orderCreating}
                    />
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.26-.98 5.05-4.347 6.797-8.646 6.797h-2.19c-.524 0-.967.382-1.05.9l-1.12 7.106h3.484c.441 0 .82-.314.893-.748l.748-4.74h2.421c3.634 0 6.475-1.48 7.302-5.75.346-1.79.183-3.284-.794-4.284z" />
                        </svg>
                      </div>
                      <span className="font-medium">PayPal</span>
                    </div>
                  </label>

                  {/* Future payment methods can be added here */}
                  <label className="flex items-center opacity-50">
                    <input type="radio" name="paymentMethod" value="card" disabled className="mr-3" />
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                      </div>
                      <span className="text-gray-500">Credit/Debit Card (Coming Soon)</span>
                    </div>
                  </label>
                </div>
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
