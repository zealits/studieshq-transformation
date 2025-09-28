import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import xeApiService from "../../services/xeApiService";

const BankDetailsForm = ({
  consumerDetails,
  onSubmit,
  onBack,
  isLoading = false,
  initialBankDetails = null,
  selectedMethod = null,
}) => {
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [availableCountries, setAvailableCountries] = useState([]);
  const [availableCurrencies, setAvailableCurrencies] = useState([]);
  const [paymentFields, setPaymentFields] = useState([]);
  const [bankDetails, setBankDetails] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState({
    countries: false,
    currencies: false,
    fields: false,
  });

  // Load supported countries on component mount
  useEffect(() => {
    loadSupportedCountries();
  }, []);

  // Pre-populate form when editing
  useEffect(() => {
    if (selectedMethod && initialBankDetails) {
      console.log("🏦 BANK FORM: Pre-populating form with existing data:", {
        country: selectedMethod.countryCode,
        currency: selectedMethod.currencyCode,
        bankDetails: initialBankDetails,
      });

      // Set country and currency from the payment method
      setSelectedCountry(selectedMethod.countryCode || "");
      setSelectedCurrency(selectedMethod.currencyCode || "");

      // Set bank details
      setBankDetails(initialBankDetails || {});
    }
  }, [selectedMethod, initialBankDetails]);

  // Load currencies when country changes
  useEffect(() => {
    if (selectedCountry) {
      loadSupportedCurrencies(selectedCountry);
    } else {
      setAvailableCurrencies([]);
      setSelectedCurrency("");
    }
  }, [selectedCountry]);

  // Load payment fields when both country and currency are selected
  useEffect(() => {
    if (selectedCountry && selectedCurrency) {
      loadPaymentFields(selectedCountry, selectedCurrency);
    } else {
      setPaymentFields([]);
      // Only clear bank details if not editing
      if (!selectedMethod) {
        setBankDetails({});
      }
    }
  }, [selectedCountry, selectedCurrency, selectedMethod]);

  const loadSupportedCountries = async () => {
    try {
      setLoading((prev) => ({ ...prev, countries: true }));
      const response = await xeApiService.getSupportedCountries();

      if (response.success) {
        setAvailableCountries(response.data || []);
      } else {
        toast.error("Failed to load supported countries");
      }
    } catch (error) {
      console.error("Error loading countries:", error);
      toast.error("Failed to load supported countries");
    } finally {
      setLoading((prev) => ({ ...prev, countries: false }));
    }
  };

  const loadSupportedCurrencies = async (countryCode) => {
    try {
      setLoading((prev) => ({ ...prev, currencies: true }));
      const response = await xeApiService.getSupportedCurrencies(countryCode);

      if (response.success) {
        setAvailableCurrencies(response.data || []);
      } else {
        toast.error("Failed to load supported currencies");
      }
    } catch (error) {
      console.error("Error loading currencies:", error);
      toast.error("Failed to load supported currencies");
    } finally {
      setLoading((prev) => ({ ...prev, currencies: false }));
    }
  };

  const loadPaymentFields = async (countryCode, currencyCode) => {
    try {
      setLoading((prev) => ({ ...prev, fields: true }));
      const response = await xeApiService.getPaymentFields(countryCode, currencyCode);

      if (response.success) {
        const fields = response.data || [];
        setPaymentFields(fields);

        // Auto-populate bank location with selected country code
        const initialBankDetails = {};
        fields.forEach((field) => {
          // Auto-populate location fields with the selected country code
          if (
            field.fieldName.toLowerCase().includes("location") ||
            field.fieldName.toLowerCase() === "location" ||
            field.label.toLowerCase().includes("location of bank")
          ) {
            initialBankDetails[field.fieldName] = countryCode;
            console.log(`🏦 AUTO-POPULATE: Setting ${field.fieldName} to ${countryCode}`);
          }
        });

        setBankDetails(initialBankDetails);
        setFormErrors({});

        console.log("🏦 BANK DETAILS FORM: Payment fields loaded:", {
          fieldsCount: fields.length,
          autoPopulatedFields: Object.keys(initialBankDetails),
          countryCode,
          currencyCode,
        });
      } else {
        toast.error("Failed to load payment fields");
      }
    } catch (error) {
      console.error("Error loading payment fields:", error);
      toast.error("Failed to load payment fields");
    } finally {
      setLoading((prev) => ({ ...prev, fields: false }));
    }
  };

  const handleCountryChange = (e) => {
    const countryCode = e.target.value;
    setSelectedCountry(countryCode);
    setSelectedCurrency("");
    setPaymentFields([]);
    setBankDetails({}); // Will be auto-populated when fields load
    setFormErrors({});
  };

  const handleCurrencyChange = (e) => {
    const currencyCode = e.target.value;
    setSelectedCurrency(currencyCode);
    setPaymentFields([]);
    setBankDetails({}); // Will be auto-populated when fields load
    setFormErrors({});
  };

  const handleBankDetailChange = (fieldName, value) => {
    setBankDetails((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    // Clear error when user starts typing
    if (formErrors[fieldName]) {
      setFormErrors((prev) => ({
        ...prev,
        [fieldName]: "",
      }));
    }
  };

  const validateBankDetails = () => {
    const errors = {};

    // Validate bankName (optional, but check length if provided)
    if (bankDetails.bankName && bankDetails.bankName.length > 100) {
      errors.bankName = "Bank Name must be 100 characters or less";
    }

    // Validate accountType (optional - no validation needed as it's a dropdown)

    // Validate dynamic payment fields
    paymentFields.forEach((field) => {
      const value = bankDetails[field.fieldName] || "";

      if (field.required && !value.trim()) {
        errors[field.fieldName] = `${field.label} is required`;
        return;
      }

      if (value.trim()) {
        // Check minimum length
        if (field.minimumLength && value.length < field.minimumLength) {
          errors[field.fieldName] = `${field.label} must be at least ${field.minimumLength} characters`;
          return;
        }

        // Check maximum length
        if (field.maximumLength && value.length > field.maximumLength) {
          errors[field.fieldName] = `${field.label} must be no more than ${field.maximumLength} characters`;
          return;
        }

        // Check pattern if provided
        if (field.pattern) {
          const regex = new RegExp(field.pattern);
          if (!regex.test(value)) {
            errors[field.fieldName] = `${field.label} format is invalid`;
            return;
          }
        }
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedCountry || !selectedCurrency) {
      toast.error("Please select both country and currency");
      return;
    }

    if (paymentFields.length === 0) {
      toast.error("No payment fields available for the selected country/currency");
      return;
    }

    if (!validateBankDetails()) {
      toast.error("Please fix the form errors before submitting");
      return;
    }

    // Prepare submission data
    const submissionData = {
      consumerDetails,
      bankDetails,
      countryCode: selectedCountry,
      currencyCode: selectedCurrency,
    };

    onSubmit(submissionData);
  };

  const renderField = (field) => {
    const value = bankDetails[field.fieldName] || "";
    const error = formErrors[field.fieldName];

    // Check if this field was auto-populated
    const isAutoPopulated =
      (field.fieldName.toLowerCase().includes("location") ||
        field.fieldName.toLowerCase() === "location" ||
        field.label.toLowerCase().includes("location of bank")) &&
      value === selectedCountry;

    return (
      <div key={field.fieldName} className="space-y-1">
        <label htmlFor={field.fieldName} className="block text-sm font-medium text-gray-700">
          {field.label} {field.required && <span className="text-red-500">*</span>}
          {isAutoPopulated && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
              Auto-filled
            </span>
          )}
        </label>

        <input
          type="text"
          id={field.fieldName}
          name={field.fieldName}
          value={value}
          onChange={(e) => handleBankDetailChange(field.fieldName, e.target.value)}
          minLength={field.minimumLength || undefined}
          maxLength={field.maximumLength || undefined}
          pattern={field.pattern || undefined}
          className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
            error ? "border-red-500" : isAutoPopulated ? "border-green-300 bg-green-50" : "border-gray-300"
          }`}
          placeholder={`Enter ${field.label.toLowerCase()}`}
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {isAutoPopulated && !error && (
          <p className="text-green-600 text-sm">✓ Auto-populated with selected country code ({selectedCountry})</p>
        )}

        {/* Show field constraints */}
        <div className="text-xs text-gray-500 space-y-1">
          {field.minimumLength && field.maximumLength && (
            <p>
              Length: {field.minimumLength} - {field.maximumLength} characters
            </p>
          )}
          {field.pattern && <p>Format: {getPatternDescription(field.fieldName, field.pattern)}</p>}
        </div>
      </div>
    );
  };

  const getPatternDescription = (fieldName, pattern) => {
    // Provide user-friendly descriptions for common patterns
    if (fieldName === "ncc" && pattern === "^[0-9]{9}$") {
      return "9-digit routing number";
    }
    return "Special format required";
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Bank Account Details</h3>
        <button type="button" onClick={onBack} className="text-primary hover:text-primary-dark text-sm font-medium">
          ← Back to Consumer Details
        </button>
      </div>

      <p className="text-gray-600 mb-6">
        Select your country and currency to see the required bank account information.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Country and Currency Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
              Country *
            </label>
            <select
              id="country"
              name="country"
              value={selectedCountry}
              onChange={handleCountryChange}
              disabled={loading.countries}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              <option value="">{loading.countries ? "Loading countries..." : "Select country"}</option>
              {availableCountries.map((country) => (
                <option key={country.code || country.countryCode} value={country.code || country.countryCode}>
                  {country.name || country.countryName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
              Currency *
            </label>
            <select
              id="currency"
              name="currency"
              value={selectedCurrency}
              onChange={handleCurrencyChange}
              disabled={!selectedCountry || loading.currencies}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              <option value="">
                {!selectedCountry
                  ? "Select country first"
                  : loading.currencies
                  ? "Loading currencies..."
                  : "Select currency"}
              </option>
              {availableCurrencies.map((currency) => (
                <option key={currency.code || currency.currencyCode} value={currency.code || currency.currencyCode}>
                  {currency.name || currency.currencyName} ({currency.code || currency.currencyCode})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Additional Bank Details */}
        {selectedCountry && selectedCurrency && (
          <div className="border-t pt-6">
            <h4 className="text-md font-medium text-gray-700 mb-4">Bank Account Information</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Bank Name */}
              <div className="space-y-1">
                <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">
                  Bank Name
                </label>
                <input
                  type="text"
                  id="bankName"
                  name="bankName"
                  value={bankDetails.bankName || ""}
                  onChange={(e) => handleBankDetailChange("bankName", e.target.value)}
                  maxLength={100}
                  className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                    formErrors.bankName ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter your bank name (e.g., Chase Bank, Wells Fargo)"
                />
                {formErrors.bankName && <p className="text-red-500 text-sm">{formErrors.bankName}</p>}
                <div className="text-xs text-gray-500">
                  <p>Name of your bank or financial institution (optional, up to 100 characters)</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Account Type */}
              <div className="space-y-1">
                <label htmlFor="accountType" className="block text-sm font-medium text-gray-700">
                  Account Type
                </label>
                <select
                  id="accountType"
                  name="accountType"
                  value={bankDetails.accountType || ""}
                  onChange={(e) => handleBankDetailChange("accountType", e.target.value)}
                  className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                    formErrors.accountType ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select account type (optional)</option>
                  <option value="Savings">Savings</option>
                  <option value="Current">Current</option>
                  <option value="Checking">Checking</option>
                  <option value="NRE">NRE (Non-Resident External)</option>
                  <option value="NRO">NRO (Non-Resident Ordinary)</option>
                  <option value="Loan">Loan</option>
                  <option value="Overdraft">Overdraft</option>
                  <option value="CashCredit">Cash Credit</option>
                  <option value="Business">Business</option>
                  <option value="Corporate">Corporate</option>
                </select>
                {formErrors.accountType && <p className="text-red-500 text-sm">{formErrors.accountType}</p>}
                <div className="text-xs text-gray-500">
                  <p>Type of your bank account (optional)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Fields */}
        {selectedCountry && selectedCurrency && (
          <div className="border-t pt-6">
            <h4 className="text-md font-medium text-gray-700 mb-4">
              Required Bank Information for {selectedCountry}/{selectedCurrency}
            </h4>

            {loading.fields ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2 text-gray-600">Loading payment fields...</span>
              </div>
            ) : paymentFields.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{paymentFields.map(renderField)}</div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No payment fields available for this country/currency combination.
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        {selectedCountry && selectedCurrency && paymentFields.length > 0 && (
          <div className="border-t pt-6">
            <h4 className="text-md font-medium text-gray-700 mb-3">Summary</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p>
                <strong>Consumer:</strong> {consumerDetails.givenNames} {consumerDetails.familyName}
              </p>
              {bankDetails.bankName && (
                <p>
                  <strong>Bank:</strong> {bankDetails.bankName}
                </p>
              )}
              <p>
                <strong>Country:</strong> {selectedCountry}
              </p>
              <p>
                <strong>Currency:</strong> {selectedCurrency}
              </p>
              <p>
                <strong>Required Fields:</strong> {paymentFields.length}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Back
          </button>

          <button
            type="submit"
            disabled={
              !selectedCountry || !selectedCurrency || paymentFields.length === 0 || loading.fields || isLoading
            }
            className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Adding Payment Method..." : "Add Bank Account"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BankDetailsForm;
