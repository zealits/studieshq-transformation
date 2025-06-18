import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import giftCardService from "../../services/giftCardService";
import Spinner from "../common/Spinner";

const GiftCardWithdrawModal = ({ isOpen, onClose, availableBalance, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  const [formData, setFormData] = useState({
    campaignId: "",
    amount: "",
    recipientEmail: "",
    recipientName: "",
    message: "",
  });

  const [errors, setErrors] = useState({});

  // Load gift card campaigns when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log("🎁 MODAL: === MODAL OPENED - STARTING CAMPAIGN LOAD ===");
      console.log("🎁 MODAL: Modal isOpen:", isOpen);
      console.log("🎁 MODAL: Available balance:", availableBalance);
      console.log("🎁 MODAL: Calling loadCampaigns()...");

      loadCampaigns();

      // Reset form when modal opens
      setFormData({
        campaignId: "",
        amount: "",
        recipientEmail: "",
        recipientName: "",
        message: "",
      });
      setErrors({});

      console.log("🎁 MODAL: Form data reset and loadCampaigns called");
    } else {
      console.log("🎁 MODAL: Modal closed, isOpen:", isOpen);
    }
  }, [isOpen]);

  const loadCampaigns = async () => {
    try {
      console.log("🎁 MODAL: === STARTING loadCampaigns FUNCTION ===");
      console.log("🎁 MODAL: Setting loadingCampaigns to true");
      setLoadingCampaigns(true);

      console.log("🎁 MODAL: About to call giftCardService.getCampaigns()...");
      const response = await giftCardService.getCampaigns();

      console.log("🎁 MODAL: === RESPONSE RECEIVED FROM SERVICE ===");
      console.log("🎁 MODAL: Raw response:", response);
      console.log("🎁 MODAL: Response type:", typeof response);
      console.log("🎁 MODAL: Response structure:", {
        hasResponse: !!response,
        hasSuccess: !!response?.success,
        successValue: response?.success,
        hasData: !!response?.data,
        hasCampaigns: !!response?.campaigns,
        responseKeys: response ? Object.keys(response) : [],
        dataKeys: response?.data ? Object.keys(response.data) : [],
      });
      console.log("🎁 MODAL: Full response JSON:", JSON.stringify(response, null, 2));

      // Handle different response structures
      let campaignsList = [];

      console.log("🎁 MODAL: === PROCESSING RESPONSE STRUCTURE ===");

      if (response && response.success) {
        console.log("🎁 MODAL: ✅ Response indicates success");

        if (response.data && Array.isArray(response.data.campaigns)) {
          campaignsList = response.data.campaigns;
          console.log("🎁 MODAL: ✅ Found campaigns in response.data.campaigns");
          console.log("🎁 MODAL: Campaigns count:", campaignsList.length);
        } else if (response.data && Array.isArray(response.data)) {
          campaignsList = response.data;
          console.log("🎁 MODAL: ✅ Found campaigns in response.data (direct array)");
          console.log("🎁 MODAL: Campaigns count:", campaignsList.length);
        } else if (response.campaigns && Array.isArray(response.campaigns)) {
          campaignsList = response.campaigns;
          console.log("🎁 MODAL: ✅ Found campaigns in response.campaigns");
          console.log("🎁 MODAL: Campaigns count:", campaignsList.length);
        } else {
          console.warn("🎁 MODAL: ❌ No campaigns found in expected locations");
          console.warn("🎁 MODAL: Available response keys:", Object.keys(response));
          if (response.data) {
            console.warn("🎁 MODAL: Available data keys:", Object.keys(response.data));
          }
        }
      } else {
        console.warn("🎁 MODAL: ❌ Response does not indicate success");
        console.warn("🎁 MODAL: Success flag:", response?.success);
        console.warn("🎁 MODAL: Error message:", response?.message);
        console.warn("🎁 MODAL: Full response for debugging:", response);
      }

      console.log("🎁 MODAL: === FINAL PROCESSED CAMPAIGNS ===");
      console.log("🎁 MODAL: Final campaigns list:", campaignsList);
      console.log("🎁 MODAL: Campaigns count:", campaignsList.length);
      console.log(
        "🎁 MODAL: Campaign details:",
        campaignsList.map((c) => ({
          id: c.id,
          name: c.name,
          active: c.active,
          currencies: c.currencies,
          denominations: c.denominations,
        }))
      );

      console.log("🎁 MODAL: Setting campaigns state...");
      setCampaigns(campaignsList);
      console.log("🎁 MODAL: Campaigns state set successfully");

      if (campaignsList.length === 0) {
        console.warn("🎁 MODAL: ⚠️ No campaigns available - showing error to user");
        toast.error("No gift card options are currently available");
      } else {
        console.log("🎁 MODAL: ✅ Successfully loaded", campaignsList.length, "campaigns");
        console.log("🎁 MODAL: Campaign names:", campaignsList.map((c) => c.name).join(", "));
      }

      console.log("🎁 MODAL: === ENDING loadCampaigns (SUCCESS) ===");
    } catch (error) {
      console.error("🎁 MODAL: === ERROR in loadCampaigns ===");
      console.error("🎁 MODAL: Error type:", error.constructor.name);
      console.error("🎁 MODAL: Error message:", error.message);
      console.error("🎁 MODAL: Error stack:", error.stack);
      console.error("🎁 MODAL: Full error object:", error);

      if (error.response) {
        console.error("🎁 MODAL: Error response status:", error.response.status);
        console.error("🎁 MODAL: Error response data:", error.response.data);
        console.error("🎁 MODAL: Error response headers:", error.response.headers);
      }

      console.error("🎁 MODAL: === ENDING loadCampaigns (ERROR) ===");

      toast.error(error.message || "Failed to load gift card options");
      setCampaigns([]);
      console.log("🎁 MODAL: Set campaigns to empty array due to error");
    } finally {
      console.log("🎁 MODAL: Setting loadingCampaigns to false");
      setLoadingCampaigns(false);
      console.log("🎁 MODAL: loadCampaigns function completed");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // If campaign is changed, reset the amount since denominations are different
    if (name === "campaignId") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        amount: "", // Clear amount when campaign changes
      }));

      // Clear both campaign and amount errors
      setErrors((prev) => ({
        ...prev,
        campaignId: "",
        amount: "",
      }));
    } else {
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
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.campaignId) {
      newErrors.campaignId = "Please select a gift card option";
    }

    if (!formData.amount) {
      newErrors.amount = "Amount is required";
    } else if (parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    } else if (parseFloat(formData.amount) > availableBalance) {
      newErrors.amount = "Amount exceeds available balance";
    } else if (selectedCampaign && selectedCampaign.denominations) {
      // Check if the selected amount is a valid denomination for this campaign
      const selectedAmount = parseFloat(formData.amount);
      if (!selectedCampaign.denominations.includes(selectedAmount)) {
        newErrors.amount = `Invalid amount. Available denominations: $${selectedCampaign.denominations.join(", $")}`;
      }
    }

    if (!formData.recipientEmail) {
      newErrors.recipientEmail = "Recipient email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.recipientEmail)) {
      newErrors.recipientEmail = "Please enter a valid email address";
    }

    if (!formData.recipientName.trim()) {
      newErrors.recipientName = "Recipient name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("🎁 MODAL SUBMIT: === GIFT CARD WITHDRAWAL STARTED ===");
    console.log("🎁 MODAL SUBMIT: Form data:", formData);
    console.log("🎁 MODAL SUBMIT: Selected campaign:", selectedCampaign);
    console.log("🎁 MODAL SUBMIT: Available balance:", availableBalance);

    if (!validateForm()) {
      console.warn("🎁 MODAL SUBMIT: ❌ Form validation failed");
      return;
    }

    console.log("🎁 MODAL SUBMIT: ✅ Form validation passed");

    try {
      console.log("🎁 MODAL SUBMIT: Setting loading state to true");
      setLoading(true);

      const withdrawalData = {
        campaignId: formData.campaignId,
        amount: parseFloat(formData.amount),
        recipientEmail: formData.recipientEmail.toLowerCase().trim(),
        recipientName: formData.recipientName.trim(),
        message: formData.message.trim() || undefined,
      };

      console.log("🎁 MODAL SUBMIT: === PREPARED WITHDRAWAL DATA ===");
      console.log("🎁 MODAL SUBMIT: Withdrawal data:", JSON.stringify(withdrawalData, null, 2));
      console.log("🎁 MODAL SUBMIT: Campaign ID:", withdrawalData.campaignId);
      console.log("🎁 MODAL SUBMIT: Amount:", withdrawalData.amount);
      console.log("🎁 MODAL SUBMIT: Recipient email:", withdrawalData.recipientEmail);
      console.log("🎁 MODAL SUBMIT: Recipient name:", withdrawalData.recipientName);
      console.log("🎁 MODAL SUBMIT: Message:", withdrawalData.message);

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

  const selectedCampaign = campaigns.find((c) => c.id === formData.campaignId);

  // Log denomination changes for debugging
  React.useEffect(() => {
    if (selectedCampaign) {
      console.log("🎁 MODAL: Selected campaign changed:", {
        id: selectedCampaign.id,
        name: selectedCampaign.name,
        denominations: selectedCampaign.denominations,
        affordableDenominations: selectedCampaign.denominations?.filter((d) => d <= availableBalance),
        currentAmount: formData.amount,
      });
    }
  }, [selectedCampaign, availableBalance, formData.amount]);

  if (!isOpen) return null;

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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Gift Card Campaign Selection */}
          <div>
            <label htmlFor="campaignId" className="block text-sm font-medium text-gray-700 mb-1">
              Gift Card Type *
            </label>
            {loadingCampaigns ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="sm" />
                <span className="ml-2 text-sm text-gray-500">Loading gift card options...</span>
              </div>
            ) : (
              <>
                {(() => {
                  console.log("🎁 MODAL RENDER: === RENDERING CAMPAIGNS DROPDOWN ===");
                  console.log("🎁 MODAL RENDER: Campaigns array:", campaigns);
                  console.log("🎁 MODAL RENDER: Campaigns count:", campaigns.length);
                  console.log(
                    "🎁 MODAL RENDER: Campaign names:",
                    campaigns.map((c) => c.name)
                  );
                  console.log("🎁 MODAL RENDER: loadingCampaigns:", loadingCampaigns);
                  console.log("🎁 MODAL RENDER: formData.campaignId:", formData.campaignId);
                  return null;
                })()}
                <select
                  id="campaignId"
                  name="campaignId"
                  value={formData.campaignId}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.campaignId ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={loading}
                >
                  <option value="">Select a gift card option</option>
                  {campaigns.length > 0 ? (
                    campaigns.map((campaign) => {
                      console.log("🎁 MODAL RENDER: Rendering option for campaign:", campaign.name);
                      return (
                        <option key={campaign.id} value={campaign.id}>
                          {campaign.name} {campaign.description && `- ${campaign.description}`}
                        </option>
                      );
                    })
                  ) : (
                    <option disabled>No gift card options available</option>
                  )}
                </select>
                {campaigns.length === 0 && !loadingCampaigns && (
                  <p className="text-yellow-600 text-xs mt-1">
                    🔍 No gift card campaigns are currently available. Check the console for details.
                  </p>
                )}
              </>
            )}
            {errors.campaignId && <p className="text-red-500 text-xs mt-1">{errors.campaignId}</p>}
          </div>

          {/* Selected Campaign Info */}
          {selectedCampaign && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm text-gray-800 mb-1">{selectedCampaign.name}</h4>
              {selectedCampaign.description && (
                <p className="text-xs text-gray-600 mb-2">{selectedCampaign.description}</p>
              )}
              {selectedCampaign.terms && <p className="text-xs text-gray-500">{selectedCampaign.terms}</p>}
            </div>
          )}

          {/* Amount - Denomination Selection */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Gift Card Amount (USD) *
            </label>
            {selectedCampaign && selectedCampaign.denominations ? (
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
                {selectedCampaign.denominations.filter((denom) => denom <= availableBalance).length > 0 ? ( // Only show denominations user can afford
                  selectedCampaign.denominations
                    .filter((denom) => denom <= availableBalance)
                    .map((denomination) => (
                      <option key={denomination} value={denomination}>
                        ${denomination.toFixed(2)}
                      </option>
                    ))
                ) : (
                  <option disabled>Insufficient balance for any denomination</option>
                )}
              </select>
            ) : (
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="Select a gift card type first"
                min="0.01"
                max={availableBalance}
                step="0.01"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.amount ? "border-red-500" : "border-gray-300"
                }`}
                disabled={true}
              />
            )}
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
            {selectedCampaign && selectedCampaign.denominations && (
              <div className="text-xs text-gray-500 mt-1">
                <p>Available amounts: ${selectedCampaign.denominations.join(", $")}</p>
                {selectedCampaign.denominations.filter((d) => d <= availableBalance).length === 0 && (
                  <p className="text-red-600 mt-1">
                    ⚠️ Your balance (${availableBalance?.toFixed(2)}) is insufficient for any denomination of this gift
                    card.
                  </p>
                )}
                {selectedCampaign.denominations.some((d) => d > availableBalance) &&
                  selectedCampaign.denominations.filter((d) => d <= availableBalance).length > 0 && (
                    <p className="text-yellow-600 mt-1">
                      💡 Some higher amounts are not available due to insufficient balance.
                    </p>
                  )}
              </div>
            )}
          </div>

          {/* Recipient Email */}
          <div>
            <label htmlFor="recipientEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Email *
            </label>
            <input
              type="email"
              id="recipientEmail"
              name="recipientEmail"
              value={formData.recipientEmail}
              onChange={handleInputChange}
              placeholder="recipient@example.com"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.recipientEmail ? "border-red-500" : "border-gray-300"
              }`}
              disabled={loading}
            />
            {errors.recipientEmail && <p className="text-red-500 text-xs mt-1">{errors.recipientEmail}</p>}
          </div>

          {/* Recipient Name */}
          <div>
            <label htmlFor="recipientName" className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Name *
            </label>
            <input
              type="text"
              id="recipientName"
              name="recipientName"
              value={formData.recipientName}
              onChange={handleInputChange}
              placeholder="Full name of the recipient"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.recipientName ? "border-red-500" : "border-gray-300"
              }`}
              disabled={loading}
            />
            {errors.recipientName && <p className="text-red-500 text-xs mt-1">{errors.recipientName}</p>}
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
          </div>

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
              disabled={loading || loadingCampaigns || campaigns.length === 0}
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

        {campaigns.length === 0 && !loadingCampaigns && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              No gift card options are currently available. Please try again later or contact support.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GiftCardWithdrawModal;
