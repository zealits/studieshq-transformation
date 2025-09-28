import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import ConsumerDetailsForm from "./ConsumerDetailsForm";
import BankDetailsForm from "./BankDetailsForm";
import xeApiService from "../../services/xeApiService";
import paymentService from "../../services/paymentService";
import { useSelector } from "react-redux";

const PaymentMethodsManager = () => {
  const [currentStep, setCurrentStep] = useState("list"); // "list", "consumer", "bank"
  const [consumerDetails, setConsumerDetails] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState({
    list: false,
    submit: false,
    delete: null, // Track which method is being deleted
    retry: null, // Track which method is being retried
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);

  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    console.log("🔄 PaymentMethodsManager component mounted, loading payment methods...");
    loadPaymentMethods();
  }, []);

  useEffect(() => {
    console.log("📊 Payment methods state updated:", paymentMethods.length, "methods");
  }, [paymentMethods]);

  const loadPaymentMethods = async () => {
    try {
      setLoading((prev) => ({ ...prev, list: true }));

      const response = await paymentService.getPaymentMethods();

      if (response.success) {
        console.log("📋 Payment methods loaded successfully:", response.data?.length || 0, "methods");
        if (response.data?.length > 0) {
          console.log("📋 First payment method sample:", response.data[0]);
        }
        setPaymentMethods(response.data || []);
      } else {
        console.error("Failed to load payment methods:", response.message);
        setPaymentMethods([]);
      }
    } catch (error) {
      console.error("Error loading payment methods:", error);
      // Don't show error toast for now, just log it
      setPaymentMethods([]);
    } finally {
      setLoading((prev) => ({ ...prev, list: false }));
    }
  };

  const handleConsumerDetailsSubmit = (details) => {
    setConsumerDetails(details);
    setCurrentStep("bank");
  };

  const handleBankDetailsSubmit = async (data) => {
    try {
      setLoading((prev) => ({ ...prev, submit: true }));

      let response;
      if (selectedMethod) {
        // Update existing payment method
        console.log("🏦 MANAGER: Updating existing payment method:", selectedMethod._id);
        response = await xeApiService.updateBankPaymentMethod(selectedMethod._id, data);
      } else {
        // Add new payment method
        console.log("🏦 MANAGER: Adding new payment method");
        response = await xeApiService.addBankPaymentMethod(data);
      }

      if (response.success) {
        // Check if XE recipient creation was successful
        if (response.data.xeRecipient?.status === "created") {
          toast.success(
            selectedMethod
              ? "Bank payment method updated and verified successfully!"
              : "Bank payment method added and verified successfully!"
          );
        } else if (response.data.xeRecipient?.status === "failed") {
          toast.success(
            selectedMethod
              ? "Bank payment method updated, but verification pending. You can retry verification from the payment methods list."
              : "Bank payment method added, but verification pending. You can retry verification from the payment methods list."
          );
        } else {
          toast.success(
            selectedMethod ? "Bank payment method updated successfully!" : "Bank payment method added successfully!"
          );
        }
        setCurrentStep("list");
        setConsumerDetails(null);
        setSelectedMethod(null); // Reset selected method
        loadPaymentMethods(); // Refresh the list
      } else {
        toast.error(response.message || `Failed to ${selectedMethod ? "update" : "add"} bank payment method`);
      }
    } catch (error) {
      console.error(`Error ${selectedMethod ? "updating" : "adding"} bank payment method:`, error);
      toast.error(error.message || `Failed to ${selectedMethod ? "update" : "add"} bank payment method`);
    } finally {
      setLoading((prev) => ({ ...prev, submit: false }));
    }
  };

  const handleBackToConsumer = () => {
    setCurrentStep("consumer");
  };

  const handleBackToList = () => {
    setCurrentStep("list");
    setConsumerDetails(null);
    setSelectedMethod(null); // Clear selected method when going back
  };

  const startAddingBankAccount = () => {
    setCurrentStep("consumer");
  };

  const openViewModal = (method) => {
    setSelectedMethod(method);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedMethod(null);
  };

  const openDeleteModal = (method) => {
    setSelectedMethod(method);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedMethod(null);
  };

  const handleDeletePaymentMethod = async () => {
    if (!selectedMethod) return;

    try {
      setLoading((prev) => ({ ...prev, delete: selectedMethod._id }));

      const response = await paymentService.deletePaymentMethod(selectedMethod._id);

      if (response.success) {
        toast.success("Payment method deleted successfully!");
        loadPaymentMethods(); // Refresh the list
        closeDeleteModal();
      } else {
        toast.error(response.message || "Failed to delete payment method");
      }
    } catch (error) {
      console.error("Error deleting payment method:", error);
      toast.error(error.message || "Failed to delete payment method");
    } finally {
      setLoading((prev) => ({ ...prev, delete: null }));
    }
  };

  const handleRetryXeRecipient = async (method) => {
    try {
      setLoading((prev) => ({ ...prev, retry: method._id }));

      const response = await paymentService.retryXeRecipient(method._id);

      if (response.success) {
        toast.success("Bank account verification successful!");
        loadPaymentMethods(); // Refresh the list
      } else {
        // Show detailed error message if available
        if (response.details) {
          const errorMsg = response.details.shortErrorMsg || response.details.longErrorMsg || response.message;
          toast.error(`Verification failed: ${errorMsg}`);
        } else {
          toast.error(response.message || "Failed to verify bank account");
        }
      }
    } catch (error) {
      console.error("Error retrying XE recipient creation:", error);
      toast.error(error.message || "Failed to verify bank account");
    } finally {
      setLoading((prev) => ({ ...prev, retry: null }));
    }
  };

  const handleEditPaymentMethod = (method) => {
    // Pre-populate the forms with existing data
    const consumerData = method.consumerDetails || method.details?.consumerDetails;

    if (consumerData) {
      setConsumerDetails({
        ...consumerData,
        // Ensure we have the required fields for editing
        address: {
          line1: consumerData.address?.line1 || "",
          line2: consumerData.address?.line2 || "",
          country: consumerData.address?.country || method.countryCode || "",
          locality: consumerData.address?.locality || "",
          region: consumerData.address?.region || "",
          postcode: consumerData.address?.postcode || "",
        },
      });
    }

    // Store the method being edited so we can update instead of create
    setSelectedMethod(method);
    setCurrentStep("consumer");

    toast.info("Edit your details and resubmit to update verification.");
  };

  const formatPaymentMethodDisplay = (method) => {
    if (method.type === "bank" && method.provider === "xe") {
      // Handle both new structure and legacy structure for backward compatibility
      const countryCode = method.countryCode || method.details?.countryCode || "Unknown";
      const currencyCode = method.currencyCode || method.details?.currencyCode || "Unknown";

      // Get bank name from XE recipient data if available
      let bankName = "Unknown Bank";
      if (method.xeRecipients && method.xeRecipients.length > 0) {
        const xeRecipient = method.xeRecipients[0]; // Get the first (most recent) XE recipient
        if (xeRecipient.payoutMethod?.bank?.account?.accountName) {
          bankName = xeRecipient.payoutMethod.bank.account.accountName;
        }
      } else if (method.bankDetails?.bankName || method.details?.bankDetails?.bankName) {
        // Fallback to bankDetails if XE recipient data is not available
        bankName = method.bankDetails?.bankName || method.details?.bankDetails?.bankName;
      }

      let consumerName = "Bank Account";
      if (method.consumerDetails) {
        // New structure
        consumerName = `${method.consumerDetails.givenNames} ${method.consumerDetails.familyName}`;
      } else if (method.details?.consumerDetails) {
        // Legacy structure
        consumerName = `${method.details.consumerDetails.givenNames} ${method.details.consumerDetails.familyName}`;
      }

      return {
        title: `${bankName} (${countryCode}/${currencyCode})`,
        subtitle: consumerName,
        icon: "🏦",
      };
    }
    return {
      title: method.type || "Unknown",
      subtitle: method.provider || "",
      icon: "💳",
    };
  };

  if (currentStep === "consumer") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={handleBackToList} className="text-primary hover:text-primary-dark text-sm font-medium">
            ← Back to Payment Methods
          </button>
        </div>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {selectedMethod ? "Edit Bank Account Details" : "Add Bank Account Details"}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {selectedMethod
              ? "Update your consumer information. You can modify these details and resubmit for verification."
              : "Enter your consumer information to add a new bank account for international transfers."}
          </p>
        </div>
        <ConsumerDetailsForm
          onSubmit={handleConsumerDetailsSubmit}
          isLoading={loading.submit}
          initialData={consumerDetails}
          isEditing={!!selectedMethod}
        />
      </div>
    );
  }

  if (currentStep === "bank") {
    // Get existing bank details when editing
    const initialBankDetails = selectedMethod
      ? selectedMethod.bankDetails || selectedMethod.details?.bankDetails
      : null;

    return (
      <div className="space-y-4">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {selectedMethod ? "Update Bank Account Information" : "Bank Account Information"}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {selectedMethod
              ? "Review and update your bank account details. Changes will trigger re-verification with XE."
              : "Enter your bank account details for international transfers via XE."}
          </p>
        </div>
        <BankDetailsForm
          consumerDetails={consumerDetails}
          onSubmit={handleBankDetailsSubmit}
          onBack={handleBackToConsumer}
          isLoading={loading.submit}
          initialBankDetails={initialBankDetails}
          selectedMethod={selectedMethod}
        />
      </div>
    );
  }

  // Main payment methods list view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Payment Methods</h3>
          <p className="text-gray-600 text-sm">Manage your bank accounts and payment methods for receiving payments.</p>
        </div>
        <button
          onClick={startAddingBankAccount}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
        >
          + Add Bank Account
        </button>
      </div>

      {/* Payment Methods List */}
      {loading.list ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-gray-600">Loading payment methods...</span>
        </div>
      ) : paymentMethods.length > 0 ? (
        <div className="space-y-3">
          {paymentMethods.map((method) => {
            const display = formatPaymentMethodDisplay(method);
            // Check for payment method approval status
            const isVerified = method.approved === true;

            // Check for XE API errors stored in the payment method
            const hasXeError = !!(method.xeError?.message && !isVerified);
            const hasLegacyError = !!((method.details?.xeRecipientError || method.xeRecipientError) && !isVerified);
            const hasError = hasXeError || hasLegacyError;

            // Debug: Log verification status for troubleshooting
            if (isVerified) {
              console.log("✅ Approved payment method found:", method._id, {
                approved: method.approved,
                type: method.type,
                provider: method.provider,
              });
            } else if (hasError) {
              console.log("❌ Payment method with error:", method._id, {
                approved: method.approved,
                xeError: method.xeError?.message,
                legacyError: method.details?.xeRecipientError,
              });
            }

            return (
              <div
                key={method._id || method.id}
                className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                  isVerified
                    ? "border-green-200 bg-green-50"
                    : hasError
                    ? "border-amber-200 bg-amber-50"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{display.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">{display.title}</h4>
                      {isVerified && (
                        <div className="flex items-center gap-1">
                          <span
                            className="flex items-center text-green-600"
                            title="Verified for international transfers"
                          >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                            APPROVED
                          </span>
                        </div>
                      )}
                      {hasError && (
                        <div className="flex items-center gap-1">
                          <span
                            className="flex items-center text-amber-600"
                            title={
                              method.xeError?.message
                                ? `${method.xeError.message}${
                                    method.xeError.details?.errors
                                      ? `\n\nField errors:\n${method.xeError.details.errors
                                          .map(
                                            (err) =>
                                              `• ${err.fieldName}: ${err.errors?.join(", ") || "validation error"}`
                                          )
                                          .join("\n")}`
                                      : ""
                                  }`
                                : method.details?.xeRecipientError || "Verification pending - click to retry"
                            }
                          >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </span>
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                            {method.xeError?.retryCount > 1 ? `ERROR (${method.xeError.retryCount} tries)` : "ERROR"}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{display.subtitle}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>Added on {new Date(method.createdAt).toLocaleDateString()}</span>
                      {isVerified && <span className="text-green-600 font-medium">• Verified & Ready</span>}
                      {hasError && (
                        <span className="text-red-600 font-medium">
                          • {method.xeError?.message || method.details?.xeRecipientError || "Verification error"}
                          {method.xeError?.details?.errors && Array.isArray(method.xeError.details.errors) && (
                            <span className="text-gray-500 font-normal">
                              {" "}
                              ({method.xeError.details.errors.length} field
                              {method.xeError.details.errors.length > 1 ? "s" : ""})
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {method.isDefault && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Default</span>
                  )}
                  {/* Edit button - available for all payment methods */}
                  <button
                    onClick={() => handleEditPaymentMethod(method)}
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                    title="Edit payment details"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>

                  {/* Retry button - only for failed verification */}
                  {hasError && (
                    <button
                      onClick={() => handleRetryXeRecipient(method)}
                      disabled={loading.retry === method._id}
                      className="text-amber-600 hover:text-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Retry verification"
                    >
                      {loading.retry === method._id ? (
                        <div className="animate-spin h-5 w-5 border-2 border-amber-300 border-t-amber-600 rounded-full"></div>
                      ) : (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => openViewModal(method)}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                    title="View payment method details"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => openDeleteModal(method)}
                    disabled={loading.delete === method._id}
                    className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Remove payment method"
                  >
                    {loading.delete === method._id ? (
                      <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-red-600 rounded-full"></div>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-6xl mb-4">🏦</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No payment methods yet</h4>
          <p className="text-gray-600 mb-6">Add a bank account to start receiving payments from your projects.</p>
          <button
            onClick={startAddingBankAccount}
            className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
          >
            Add Your First Bank Account
          </button>
        </div>
      )}

      {/* Information Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-blue-600 mt-0.5">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">Bank Account Information</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• Bank accounts are verified through XE secure payment system</p>
              <p>• Different countries require different banking information (routing numbers, IFSC codes, etc.)</p>
              <p>• All bank details are encrypted and stored securely</p>
              <p>• Payment processing typically takes 2-5 business days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Steps Guide */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">How to add a bank account:</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="flex-shrink-0 w-5 h-5 bg-primary text-white rounded-full text-xs flex items-center justify-center">
              1
            </span>
            <span>Provide your personal information for verification</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex-shrink-0 w-5 h-5 bg-primary text-white rounded-full text-xs flex items-center justify-center">
              2
            </span>
            <span>Select your country and currency</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex-shrink-0 w-5 h-5 bg-primary text-white rounded-full text-xs flex items-center justify-center">
              3
            </span>
            <span>Enter your bank account details (varies by country)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex-shrink-0 w-5 h-5 bg-primary text-white rounded-full text-xs flex items-center justify-center">
              4
            </span>
            <span>Your bank account is ready to receive payments</span>
          </div>
        </div>
      </div>

      {/* View Payment Method Modal */}
      {showViewModal && selectedMethod && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Payment Method Details</h3>
                <button onClick={closeViewModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Basic Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <span className="ml-2 font-medium">{selectedMethod.type}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Provider:</span>
                      <span className="ml-2 font-medium">{selectedMethod.provider}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Country:</span>
                      <span className="ml-2 font-medium">
                        {selectedMethod.countryCode || selectedMethod.details?.countryCode || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Currency:</span>
                      <span className="ml-2 font-medium">
                        {selectedMethod.currencyCode || selectedMethod.details?.currencyCode || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Default:</span>
                      <span className="ml-2">
                        {selectedMethod.isDefault ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Yes</span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">No</span>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className="ml-2">
                        {selectedMethod.approved ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Approved</span>
                        ) : selectedMethod.xeError?.message ? (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                            Error
                            {selectedMethod.xeError.retryCount > 1
                              ? ` (${selectedMethod.xeError.retryCount} tries)`
                              : ""}
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Pending</span>
                        )}
                      </span>
                    </div>
                    {selectedMethod.xeError?.message && (
                      <div className="col-span-2">
                        <span className="text-gray-500">Error Details:</span>
                        <div className="ml-2 mt-1 p-3 bg-red-50 border border-red-200 rounded text-xs">
                          <div className="text-red-700 font-medium mb-2">{selectedMethod.xeError.message}</div>

                          <div className="grid grid-cols-2 gap-2 text-gray-600">
                            {selectedMethod.xeError.typeOfFailure && (
                              <div>
                                <span className="font-medium">Type:</span> {selectedMethod.xeError.typeOfFailure}
                              </div>
                            )}
                            {selectedMethod.xeError.errorCode && (
                              <div>
                                <span className="font-medium">Code:</span> {selectedMethod.xeError.errorCode}
                              </div>
                            )}
                            {selectedMethod.xeError.traceErrorId && (
                              <div className="col-span-2">
                                <span className="font-medium">Trace ID:</span> {selectedMethod.xeError.traceErrorId}
                              </div>
                            )}
                            {selectedMethod.xeError.lastAttempt && (
                              <div className="col-span-2">
                                <span className="font-medium">Last attempt:</span>{" "}
                                {new Date(selectedMethod.xeError.lastAttempt).toLocaleString()}
                              </div>
                            )}
                            {selectedMethod.xeError.failureDateTime && (
                              <div className="col-span-2">
                                <span className="font-medium">XE Error Time:</span>{" "}
                                {new Date(selectedMethod.xeError.failureDateTime).toLocaleString()}
                              </div>
                            )}
                          </div>

                          {/* Show structured field errors if available */}
                          {selectedMethod.xeError.details?.errors &&
                            Array.isArray(selectedMethod.xeError.details.errors) && (
                              <div className="mt-2 pt-2 border-t border-red-300">
                                <div className="font-medium text-red-700 mb-1">
                                  Field Validation Errors ({selectedMethod.xeError.details.errors.length}):
                                </div>
                                {selectedMethod.xeError.details.errors.map((err, index) => (
                                  <div key={index} className="mb-2 p-2 bg-red-100 rounded text-xs">
                                    <div className="font-medium text-red-800">{err.fieldName}</div>
                                    {err.errors && Array.isArray(err.errors) && (
                                      <ul className="mt-1 text-red-700 list-disc list-inside">
                                        {err.errors.map((errorMsg, msgIndex) => (
                                          <li key={msgIndex}>{errorMsg}</li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Added:</span>
                      <span className="ml-2 font-medium">
                        {new Date(selectedMethod.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Consumer Details */}
                {(selectedMethod.consumerDetails || selectedMethod.details?.consumerDetails) && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Account Holder Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {(() => {
                        const consumer = selectedMethod.consumerDetails || selectedMethod.details?.consumerDetails;
                        return (
                          <>
                            <div>
                              <span className="text-gray-500">Name:</span>
                              <span className="ml-2 font-medium">
                                {consumer.givenNames} {consumer.familyName}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Email:</span>
                              <span className="ml-2 font-medium">{consumer.emailAddress || "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Mobile:</span>
                              <span className="ml-2 font-medium">{consumer.mobileNumber || "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Title:</span>
                              <span className="ml-2 font-medium">{consumer.title || "N/A"}</span>
                            </div>
                            {consumer.address && (
                              <>
                                <div className="col-span-2">
                                  <span className="text-gray-500">Address:</span>
                                  <span className="ml-2 font-medium">
                                    {consumer.address.line1}
                                    {consumer.address.line2 && `, ${consumer.address.line2}`}
                                    {consumer.address.locality && `, ${consumer.address.locality}`}
                                    {consumer.address.region && `, ${consumer.address.region}`}
                                    {consumer.address.postcode && `, ${consumer.address.postcode}`}
                                    {consumer.address.country && `, ${consumer.address.country}`}
                                  </span>
                                </div>
                              </>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Bank Details */}
                {(selectedMethod.bankDetails || selectedMethod.details?.bankDetails) && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Bank Account Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {(() => {
                        const bank = selectedMethod.bankDetails || selectedMethod.details?.bankDetails;

                        // Custom field labels for better display
                        const fieldLabels = {
                          xeBankName: "Bank Name (XE)",
                          bankName: "Bank Name",
                          accountType: "Account Type",
                          accountNumber: "Account Number",
                          ncc: "NCC/Routing Number",
                          iban: "IBAN",
                          bic: "BIC/SWIFT Code",
                          location: "Bank Location",
                        };

                        // Get bank name from XE recipient data if available
                        let xeBankName = null;
                        if (selectedMethod.xeRecipients && selectedMethod.xeRecipients.length > 0) {
                          const xeRecipient = selectedMethod.xeRecipients[0];
                          if (xeRecipient.payoutMethod?.bank?.account?.accountName) {
                            xeBankName = xeRecipient.payoutMethod.bank.account.accountName;
                          }
                        }

                        // Show bank name first if available (prioritize XE recipient data)
                        const displayOrder = [
                          "bankName",
                          "accountType",
                          "accountNumber",
                          "ncc",
                          "iban",
                          "bic",
                          "location",
                        ];
                        const orderedEntries = displayOrder
                          .filter((key) => bank[key])
                          .map((key) => [key, bank[key]])
                          .concat(Object.entries(bank).filter(([key]) => !displayOrder.includes(key)));

                        // Add XE recipient bank name at the beginning if available
                        if (xeBankName && !bank.bankName) {
                          orderedEntries.unshift(["xeBankName", xeBankName]);
                        }

                        return orderedEntries.map(([key, value]) => (
                          <div key={key}>
                            <span className="text-gray-500">
                              {fieldLabels[key] || key.replace(/([A-Z])/g, " $1").trim()}:
                            </span>
                            <span className="ml-2 font-medium">{value || "N/A"}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {/* XE Recipient Information - Success */}
                {(selectedMethod.details?.xeRecipientId ||
                  selectedMethod.xeRecipientId ||
                  selectedMethod.details?.xeRecipientDocId) && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">XE Recipient Information</h4>
                      <div className="flex items-center gap-2">
                        <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                          APPROVED
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">XE Recipient ID:</span>
                        <span className="ml-2 font-medium font-mono text-xs">
                          {selectedMethod.details?.xeRecipientId || selectedMethod.xeRecipientId || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <span className="ml-2">
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Verified & Active
                          </span>
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Verified On:</span>
                        <span className="ml-2 font-medium">
                          {selectedMethod.details?.xeRecipientCreatedAt || selectedMethod.xeRecipientCreatedAt
                            ? new Date(
                                selectedMethod.details?.xeRecipientCreatedAt || selectedMethod.xeRecipientCreatedAt
                              ).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Integration:</span>
                        <span className="ml-2 font-medium">XE Money Transfer</span>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-green-100 rounded text-xs text-green-800">
                      <div className="flex items-center">
                        <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        ✅ This payment method is verified and ready to receive international payments through XE.
                      </div>
                    </div>
                  </div>
                )}

                {/* XE Recipient Error Information */}
                {(selectedMethod.details?.xeRecipientError || selectedMethod.xeRecipientError) &&
                  !(
                    selectedMethod.details?.xeRecipientId ||
                    selectedMethod.xeRecipientId ||
                    selectedMethod.details?.xeRecipientDocId
                  ) && (
                    <div className="bg-red-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">XE Integration Status</h4>
                      <div className="text-sm">
                        <div className="mb-2">
                          <span className="text-gray-500">Status:</span>
                          <span className="ml-2">
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Failed</span>
                          </span>
                        </div>
                        <div className="mb-2">
                          <span className="text-gray-500">Error:</span>
                          <span className="ml-2 font-medium text-red-700">
                            {selectedMethod.details.xeRecipientError}
                          </span>
                        </div>

                        {/* Show detailed error information if available */}
                        {selectedMethod.details?.xeRecipientErrorDetails && (
                          <div className="mb-3 p-3 bg-red-100 rounded">
                            <div className="font-medium text-red-800 mb-2">Detailed Error Information:</div>
                            <div className="space-y-1 text-xs">
                              {selectedMethod.details.xeRecipientErrorDetails.code && (
                                <div>
                                  <span className="text-red-600">Error Code:</span>
                                  <span className="ml-2 font-mono">
                                    {selectedMethod.details.xeRecipientErrorDetails.code}
                                  </span>
                                </div>
                              )}
                              {selectedMethod.details.xeRecipientErrorDetails.shortErrorMsg && (
                                <div>
                                  <span className="text-red-600">Message:</span>
                                  <span className="ml-2">
                                    {selectedMethod.details.xeRecipientErrorDetails.shortErrorMsg}
                                  </span>
                                </div>
                              )}
                              {selectedMethod.details.xeRecipientErrorDetails.longErrorMsg && (
                                <div>
                                  <span className="text-red-600">Details:</span>
                                  <span className="ml-2">
                                    {selectedMethod.details.xeRecipientErrorDetails.longErrorMsg}
                                  </span>
                                </div>
                              )}
                              {selectedMethod.details.xeRecipientErrorDetails.failureDateTime && (
                                <div>
                                  <span className="text-red-600">Failed At:</span>
                                  <span className="ml-2">
                                    {new Date(
                                      selectedMethod.details.xeRecipientErrorDetails.failureDateTime
                                    ).toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="mb-3">
                          <span className="text-gray-500">Last Attempt:</span>
                          <span className="ml-2 font-medium">
                            {selectedMethod.details.xeRecipientLastAttempt
                              ? new Date(selectedMethod.details.xeRecipientLastAttempt).toLocaleString()
                              : "N/A"}
                          </span>
                        </div>
                        <div className="mt-3 p-3 bg-red-100 rounded text-xs text-red-800">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span>XE recipient creation failed. You can edit details or retry verification.</span>
                            </div>
                            <button
                              onClick={() => {
                                closeViewModal();
                                handleEditPaymentMethod(selectedMethod);
                              }}
                              className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                            >
                              Edit Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
              </div>

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => {
                    closeViewModal();
                    handleEditPaymentMethod(selectedMethod);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Edit Details
                </button>
                <button
                  onClick={closeViewModal}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedMethod && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Delete Payment Method</h3>
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete this payment method? This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="text-sm">
                  <span className="font-medium">
                    {(() => {
                      const display = formatPaymentMethodDisplay(selectedMethod);
                      return display.title;
                    })()}
                  </span>
                  <div className="text-gray-500">
                    {(() => {
                      const display = formatPaymentMethodDisplay(selectedMethod);
                      return display.subtitle;
                    })()}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeDeleteModal}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  disabled={loading.delete}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePaymentMethod}
                  disabled={loading.delete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading.delete ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodsManager;
