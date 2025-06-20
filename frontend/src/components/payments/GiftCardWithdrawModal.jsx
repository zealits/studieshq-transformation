import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import giftCardService from "../../services/giftCardService";
import Spinner from "../common/Spinner";

const GiftCardWithdrawModal = ({ isOpen, onClose, availableBalance, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  
  // Get current user data from Redux store
  const { user } = useSelector((state) => state.auth);

  // Fixed campaign ID from your curl example
  const FIXED_CAMPAIGN_ID = "b9f641d1-610b-41cd-a2ce-0255638ee28e";
  
  // Fixed denominations for the campaign
  const AVAILABLE_DENOMINATIONS = [5, 10, 25, 50, 100, 200, 500];

  const [formData, setFormData] = useState({
    amount: "",
    message: "",
  });

  const [errors, setErrors] = useState({});

  // Auto-populate recipient info from user profile when modal opens
  useEffect(() => {
    if (isOpen && user) {
      console.log("🎁 MODAL: === MODAL OPENED - AUTO-POPULATING USER DATA ===");
      console.log("🎁 MODAL: User data:", user);
      console.log("🎁 MODAL: Available balance:", availableBalance);

      // Reset form when modal opens
      setFormData({
        amount: "",
        message: "",
      });
      setErrors({});
    }
  }, [isOpen, user]);

  // Generate unique identifiers
  const generateUniqueId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
  };

  const generateExternalId = () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const uniqueId = generateUniqueId();
    return `order-${dateStr}-${uniqueId}`;
  };

  const generateReferenceNumber = () => {
    const prefix = "REF";
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  };

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

    console.log("🎁 MODAL VALIDATION: === STARTING FORM VALIDATION ===");
    console.log("🎁 MODAL VALIDATION: Form data:", formData);
    console.log("🎁 MODAL VALIDATION: Available balance:", availableBalance);
    console.log("🎁 MODAL VALIDATION: User:", user);

    if (!formData.amount) {
      newErrors.amount = "Amount is required";
    } else if (parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    } else if (parseFloat(formData.amount) > availableBalance) {
      newErrors.amount = "Amount exceeds available balance";
    } else {
      // Check if the selected amount is a valid denomination
      const selectedAmount = parseFloat(formData.amount);
      console.log("🎁 MODAL VALIDATION: === DENOMINATION VALIDATION ===");
      console.log("🎁 MODAL VALIDATION: Selected amount:", selectedAmount);
      console.log("🎁 MODAL VALIDATION: Available denominations:", AVAILABLE_DENOMINATIONS);
      console.log("🎁 MODAL VALIDATION: Denominations include selected amount?", AVAILABLE_DENOMINATIONS.includes(selectedAmount));
      
      if (!AVAILABLE_DENOMINATIONS.includes(selectedAmount)) {
        newErrors.amount = `Invalid amount. Available denominations: $${AVAILABLE_DENOMINATIONS.join(", $")}`;
        console.log("🎁 MODAL VALIDATION: ❌ Invalid denomination selected");
      } else {
        console.log("🎁 MODAL VALIDATION: ✅ Valid denomination selected");
      }
    }

    // Validate user data
    if (!user) {
      newErrors.user = "User information not available. Please refresh and try again.";
    } else {
      if (!user.email) {
        newErrors.user = "User email not available. Please update your profile.";
      }
      if (!user.name) {
        newErrors.user = "User name not available. Please update your profile.";
      }
    }

    console.log("🎁 MODAL VALIDATION: Validation errors:", newErrors);
    console.log("🎁 MODAL VALIDATION: Form is valid:", Object.keys(newErrors).length === 0);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("🎁 MODAL SUBMIT: === GIFT CARD WITHDRAWAL STARTED ===");
    console.log("🎁 MODAL SUBMIT: Form data:", formData);
    console.log("🎁 MODAL SUBMIT: User:", user);
    console.log("🎁 MODAL SUBMIT: Available balance:", availableBalance);

    if (!validateForm()) {
      console.warn("🎁 MODAL SUBMIT: ❌ Form validation failed");
      return;
    }

    console.log("🎁 MODAL SUBMIT: ✅ Form validation passed");

    try {
      console.log("🎁 MODAL SUBMIT: Setting loading state to true");
      setLoading(true);

      // Generate unique identifiers
      const externalId = generateExternalId();
      const referenceNumber = generateReferenceNumber();

      const withdrawalData = {
        campaignId: FIXED_CAMPAIGN_ID,
        amount: parseFloat(formData.amount),
        recipientEmail: user.email.toLowerCase().trim(),
        recipientName: user.name.trim(),
        message: formData.message.trim() || "Gift card from StudiesHQ",
        externalId: externalId,
        referenceNumber: referenceNumber,
      };

      console.log("🎁 MODAL SUBMIT: === PREPARED WITHDRAWAL DATA ===");
      console.log("🎁 MODAL SUBMIT: Withdrawal data:", JSON.stringify(withdrawalData, null, 2));
      console.log("🎁 MODAL SUBMIT: Campaign ID:", withdrawalData.campaignId);
      console.log("🎁 MODAL SUBMIT: Amount:", withdrawalData.amount);
      console.log("🎁 MODAL SUBMIT: Recipient email:", withdrawalData.recipientEmail);
      console.log("🎁 MODAL SUBMIT: Recipient name:", withdrawalData.recipientName);
      console.log("🎁 MODAL SUBMIT: Message:", withdrawalData.message);
      console.log("🎁 MODAL SUBMIT: External ID:", withdrawalData.externalId);
      console.log("🎁 MODAL SUBMIT: Reference Number:", withdrawalData.referenceNumber);

      console.log("🎁 MODAL SUBMIT: Calling giftCardService.withdrawAsGiftCard()...");
      const response = await giftCardService.withdrawAsGiftCard(withdrawalData);

      console.log("🎁 MODAL SUBMIT: === WITHDRAWAL RESPONSE RECEIVED ===");
      console.log("🎁 MODAL SUBMIT: Response:", response);
      console.log("🎁 MODAL SUBMIT: Response type:", typeof response);
      console.log("🎁 MODAL SUBMIT: Response keys:", response ? Object.keys(response) : "null");
      console.log("🎁 MODAL SUBMIT: Full response JSON:", JSON.stringify(response, null, 2));

      console.log("🎁 MODAL SUBMIT: ✅ Withdrawal successful!");
      toast.success("Gift card withdrawal processed successfully!");

      console.log("🎁 MODAL SUBMIT: Calling onSuccess callback...");
      onSuccess(response.data);

      console.log("🎁 MODAL SUBMIT: Closing modal...");
      onClose();

      console.log("🎁 MODAL SUBMIT: === WITHDRAWAL PROCESS COMPLETED ===");
    } catch (error) {
      console.error("🎁 MODAL SUBMIT: === ERROR PROCESSING WITHDRAWAL ===");
      console.error("🎁 MODAL SUBMIT: Error type:", error.constructor.name);
      console.error("🎁 MODAL SUBMIT: Error message:", error.message);
      console.error("🎁 MODAL SUBMIT: Error stack:", error.stack);
      console.error("🎁 MODAL SUBMIT: Full error object:", error);

      if (error.response) {
        console.error("🎁 MODAL SUBMIT: Error response status:", error.response.status);
        console.error("🎁 MODAL SUBMIT: Error response data:", error.response.data);
        console.error("🎁 MODAL SUBMIT: Error response headers:", error.response.headers);
      }

      console.error("🎁 MODAL SUBMIT: === END ERROR DETAILS ===");

      toast.error(error.message || "Failed to process gift card withdrawal");
    } finally {
      console.log("🎁 MODAL SUBMIT: Setting loading state to false");
      setLoading(false);
      console.log("🎁 MODAL SUBMIT: === WITHDRAWAL ATTEMPT FINISHED ===");
    }
  };

  if (!isOpen) return null;

  // Get user display info
  const recipientName = user?.name || "Unknown User";
  const recipientEmail = user?.email || "No email available";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Withdraw as Gift Card</h3>
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

        {/* Recipient Information Display */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-sm text-gray-800 mb-2">Gift Card Recipient</h4>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              <strong>Name:</strong> {recipientName}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Email:</strong> {recipientEmail}
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            The gift card will be sent to your registered email address.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount - Denomination Selection */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Gift Card Amount (USD) *
            </label>
            <select
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.amount ? "border-red-500" : "border-gray-300"
              }`}
              disabled={loading}
            >
              <option value="">Select amount</option>
              {(() => {
                console.log("🎁 MODAL RENDER: Available balance:", availableBalance, typeof availableBalance);
                console.log("🎁 MODAL RENDER: Denominations:", AVAILABLE_DENOMINATIONS);
                
                const affordableDenominations = AVAILABLE_DENOMINATIONS.filter((denom) => {
                  const canAfford = Number(denom) <= Number(availableBalance);
                  console.log(`🎁 MODAL RENDER: Can afford $${denom}? ${canAfford} (${denom} <= ${availableBalance})`);
                  return canAfford;
                });
                
                console.log("🎁 MODAL RENDER: Affordable denominations:", affordableDenominations);
                console.log("🎁 MODAL RENDER: Affordable count:", affordableDenominations.length);
                
                return null;
              })()}
              {AVAILABLE_DENOMINATIONS.filter((denom) => Number(denom) <= Number(availableBalance)).length > 0 ? (
                AVAILABLE_DENOMINATIONS
                  .filter((denom) => Number(denom) <= Number(availableBalance))
                  .sort((a, b) => a - b) // Sort denominations in ascending order
                  .map((denomination) => (
                    <option key={denomination} value={denomination}>
                      ${Number(denomination).toFixed(2)}
                    </option>
                  ))
              ) : (
                <option disabled>
                  Insufficient balance for any denomination
                </option>
              )}
            </select>
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
            <div className="text-xs text-gray-500 mt-1">
              <p>Available amounts: ${AVAILABLE_DENOMINATIONS.map(d => Number(d).toFixed(2)).join(", $")}</p>
              {(() => {
                const numericBalance = Number(availableBalance) || 0;
                const affordableDenominations = AVAILABLE_DENOMINATIONS.filter((d) => Number(d) <= numericBalance);
                const affordableCount = affordableDenominations.length;
                const totalCount = AVAILABLE_DENOMINATIONS.length;
                
                console.log("🎁 MODAL BALANCE VALIDATION:", {
                  denominations: AVAILABLE_DENOMINATIONS,
                  availableBalance: availableBalance,
                  numericBalance: numericBalance,
                  affordableDenominations: affordableDenominations,
                  affordableCount: affordableCount,
                  totalCount: totalCount
                });
                
                if (affordableCount === 0) {
                  const minDenomination = AVAILABLE_DENOMINATIONS.length > 0 
                    ? Math.min(...AVAILABLE_DENOMINATIONS)
                    : null;
                  
                  return (
                    <p className="text-red-600 mt-1">
                      ⚠️ Your balance (${numericBalance.toFixed(2)}) is insufficient for any denomination of this gift card.
                      <br />
                      <span className="text-xs">
                        {minDenomination !== null 
                          ? `Minimum required: $${minDenomination.toFixed(2)}`
                          : "No denominations available"
                        }
                      </span>
                    </p>
                  );
                } else if (affordableCount < totalCount) {
                  return (
                    <p className="text-yellow-600 mt-1">
                      💡 {affordableCount} of {totalCount} denominations available due to balance limit.
                    </p>
                  );
                } else {
                  return (
                    <p className="text-green-600 mt-1">
                      ✅ All denominations available with your current balance.
                    </p>
                  );
                }
              })()}
            </div>
          </div>

          {/* Optional Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Personal Message (Optional)
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Add a personal message with your gift card..."
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              If no message is provided, a default message will be used.
            </p>
          </div>

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
              disabled={loading || !user}
            >
              {loading ? (
                <>
                  <Spinner size="sm" />
                  <span className="ml-2">Processing...</span>
                </>
              ) : (
                "Process Withdrawal"
              )}
            </button>
          </div>
        </form>

        {/* Info Section */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> The gift card will be automatically generated and sent to your email address. 
            You can then forward it to anyone you'd like to gift it to.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GiftCardWithdrawModal;
