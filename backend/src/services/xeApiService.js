const axios = require("axios");
const PaymentField = require("../models/PaymentField");
require("dotenv").config();

class XeApiService {
  constructor() {
    this.baseURL = process.env.XE_API_BASE_URL || "https://pay-api-sandbox.xe.com";
    this.accessKey = process.env.XE_API_ACCESS_KEY;
    this.accessSecret = process.env.XE_API_ACCESS_SECRET;
    this.accessToken = null;
    this.tokenExpiresAt = null;
  }

  /**
   * Get access token from XE API
   * @returns {Promise<Object>} Token response with access token and expiry
   */
  async getAccessToken() {
    try {
      console.log("🏦 XE API SERVICE: Getting access token...");
      console.log(this.accessKey, this.accessSecret, "accessKey, accessSecret");
      if (!this.accessKey || !this.accessSecret) {
        throw new Error("XE API access key and secret are required");
      }

      const response = await axios.post(
        `${this.baseURL}/v2/auth/token`,
        {
          accessKey: this.accessKey,
          accessSecret: this.accessSecret,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("🏦 XE API SERVICE: ✅ Access token obtained successfully");

      const { accessToken, expiresAt } = response.data;

      // Store token and expiry for reuse
      this.accessToken = accessToken;
      this.tokenExpiresAt = new Date(expiresAt);

      return {
        success: true,
        accessToken,
        expiresAt,
      };
    } catch (error) {
      console.error("🏦 XE API SERVICE: ❌ Error getting access token:", error.response?.data || error.message);

      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Get a valid access token (either existing or new)
   * @returns {Promise<string|null>} Access token or null if failed
   */
  async getValidAccessToken() {
    try {
      // Check if we have a valid token that hasn't expired
      if (this.accessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
        console.log("🏦 XE API SERVICE: Using existing valid token");
        return this.accessToken;
      }

      // Get new token
      const tokenResponse = await this.getAccessToken();

      if (!tokenResponse.success) {
        console.error("🏦 XE API SERVICE: Failed to get access token:", tokenResponse.error);
        return null;
      }

      return tokenResponse.accessToken;
    } catch (error) {
      console.error("🏦 XE API SERVICE: Error in getValidAccessToken:", error.message);
      return null;
    }
  }

  /**
   * Get payment fields for a specific country and currency (from database)
   * @param {string} countryCode - ISO 2-letter country code (e.g., 'US', 'IN')
   * @param {string} currencyCode - ISO 3-letter currency code (e.g., 'USD', 'INR')
   * @returns {Promise<Object>} Payment fields response
   */
  async getPaymentFields(countryCode, currencyCode) {
    try {
      console.log(`🏦 XE API SERVICE: Getting payment fields for ${countryCode}/${currencyCode} from database`);

      const paymentFieldRecord = await PaymentField.findByCountryAndCurrency(countryCode, currencyCode);

      if (!paymentFieldRecord) {
        console.log(`🏦 XE API SERVICE: ❌ No payment fields found for ${countryCode}/${currencyCode}`);
        return {
          success: false,
          error: `No payment fields found for ${countryCode}/${currencyCode}. Please run the seeding command to populate data.`,
        };
      }

      // Get enhanced field descriptions
      const enhancedFields = paymentFieldRecord.getFieldDescriptions();

      console.log(`🏦 XE API SERVICE: ✅ Payment fields retrieved from database for ${countryCode}/${currencyCode}`);
      console.log(
        `🏦 XE API SERVICE: Found ${enhancedFields.length} fields:`,
        enhancedFields.map((f) => f.fieldName)
      );

      return {
        success: true,
        fields: enhancedFields,
        source: "database",
        lastUpdated: paymentFieldRecord.lastUpdated,
      };
    } catch (error) {
      console.error("🏦 XE API SERVICE: ❌ Error getting payment fields from database:", error.message);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get payment fields for a specific country and currency (directly from XE API - for seeding)
   * @param {string} countryCode - ISO 2-letter country code (e.g., 'US', 'IN')
   * @param {string} currencyCode - ISO 3-letter currency code (e.g., 'USD', 'INR')
   * @returns {Promise<Object>} Payment fields response
   */
  async getPaymentFieldsFromAPI(countryCode, currencyCode) {
    try {
      console.log(`🏦 XE API SERVICE: Getting payment fields for ${countryCode}/${currencyCode} from XE API`);

      const accessToken = await this.getValidAccessToken();

      if (!accessToken) {
        return {
          success: false,
          error: "Failed to get access token",
        };
      }

      const response = await axios.get(
        `${this.baseURL}/v2/paymentFields/country/${countryCode}/currency/${currencyCode}`,
        {
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log("🏦 XE API SERVICE: ✅ Payment fields retrieved successfully from API:", response.data);

      return {
        success: true,
        fields: response.data,
        source: "xe_api",
      };
    } catch (error) {
      console.error(
        "🏦 XE API SERVICE: ❌ Error getting payment fields from API:",
        error.response?.data || error.message
      );

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        details: error.response?.data || null,
      };
    }
  }

  /**
   * Get list of supported countries (from database)
   * @returns {Promise<Object>} Supported countries response
   */
  async getSupportedCountries() {
    try {
      console.log("🏦 XE API SERVICE: Getting supported countries from database...");

      const countries = await PaymentField.getAllCountries();

      if (countries.length === 0) {
        console.log("🏦 XE API SERVICE: ❌ No countries found in database");
        return {
          success: false,
          error: "No countries found in database. Please run the seeding command to populate data.",
        };
      }

      console.log(`🏦 XE API SERVICE: ✅ ${countries.length} supported countries retrieved from database`);

      return {
        success: true,
        countries,
        source: "database",
      };
    } catch (error) {
      console.error("🏦 XE API SERVICE: ❌ Error getting supported countries from database:", error.message);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get list of supported currencies for a country (from database)
   * @param {string} countryCode - ISO 2-letter country code
   * @returns {Promise<Object>} Supported currencies response
   */
  async getSupportedCurrencies(countryCode) {
    try {
      console.log(`🏦 XE API SERVICE: Getting supported currencies for ${countryCode} from database...`);

      const currencies = await PaymentField.getCurrenciesForCountry(countryCode);

      if (currencies.length === 0) {
        console.log(`🏦 XE API SERVICE: ❌ No currencies found for country ${countryCode}`);
        return {
          success: false,
          error: `No supported currencies found for country: ${countryCode}. Please run the seeding command to populate data.`,
        };
      }

      console.log(
        `🏦 XE API SERVICE: ✅ ${currencies.length} supported currencies retrieved from database for ${countryCode}`
      );

      return {
        success: true,
        currencies,
        source: "database",
      };
    } catch (error) {
      console.error("🏦 XE API SERVICE: ❌ Error getting supported currencies from database:", error.message);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create a recipient on XE API using payment details from database
   * @param {Object} paymentMethod - PaymentMethod object from database
   * @param {string} userId - User ID for generating client reference
   * @returns {Promise<Object>} Recipient creation response
   */
  async createRecipient(paymentMethod, userId) {
    try {
      console.log("🏦 XE API SERVICE: Creating recipient...");

      const accessToken = await this.getValidAccessToken();

      if (!accessToken) {
        return {
          success: false,
          error: "Failed to get access token",
        };
      }

      // Generate client reference
      const clientReference = `studiesh${userId.slice(-6)}`;

      // Build account object dynamically based on available data
      const accountData = {};

      if (paymentMethod.bankDetails) {
        // Essential fields
        if (paymentMethod.bankDetails.accountNumber) {
          accountData.accountNumber = paymentMethod.bankDetails.accountNumber;
        }
        if (paymentMethod.bankDetails.accountName || paymentMethod.consumerDetails?.givenNames) {
          accountData.accountName =
            paymentMethod.bankDetails.accountName ||
            `${paymentMethod.consumerDetails.givenNames} ${paymentMethod.consumerDetails.familyName}`.trim();
        }

        // Country
        if (paymentMethod.countryCode) {
          accountData.country = paymentMethod.countryCode;
        }

        // Optional fields - only include if present
        if (paymentMethod.bankDetails.iban) {
          accountData.iban = paymentMethod.bankDetails.iban;
        }
        if (paymentMethod.bankDetails.bic || paymentMethod.bankDetails.swiftCode) {
          accountData.bic = paymentMethod.bankDetails.bic || paymentMethod.bankDetails.swiftCode;
        }
        if (paymentMethod.bankDetails.ncc || paymentMethod.bankDetails.routingNumber) {
          accountData.ncc = paymentMethod.bankDetails.ncc || paymentMethod.bankDetails.routingNumber;
        }
        if (paymentMethod.bankDetails.accountType) {
          accountData.accountType = paymentMethod.bankDetails.accountType;
        }
        if (paymentMethod.bankDetails.sortCode) {
          accountData.sortCode = paymentMethod.bankDetails.sortCode;
        }
        if (paymentMethod.bankDetails.bsb) {
          accountData.bsb = paymentMethod.bankDetails.bsb;
        }
        if (paymentMethod.bankDetails.ifsc) {
          accountData.ifsc = paymentMethod.bankDetails.ifsc;
        }
      }

      // Build the recipient payload
      const recipientPayload = {
        payoutMethod: {
          type: "BankAccount",
          bank: {
            account: accountData,
          },
        },
        entity: {
          type: "Consumer",
          consumer: {
            givenNames: paymentMethod.consumerDetails?.givenNames || "",
            familyName: paymentMethod.consumerDetails?.familyName || "",
          },
          isDeactivated: false,
        },
        clientReference: clientReference,
        currency: paymentMethod.currencyCode || "USD",
      };

      // Add address if available
      if (paymentMethod.consumerDetails?.address) {
        recipientPayload.entity.consumer.address = {
          line1: paymentMethod.consumerDetails.address.line1,
          line2: paymentMethod.consumerDetails.address.line2,
          country: paymentMethod.consumerDetails.address.country || paymentMethod.countryCode,
          locality: paymentMethod.consumerDetails.address.locality,
          region: paymentMethod.consumerDetails.address.region,
          postcode: paymentMethod.consumerDetails.address.postcode,
        };
      }

      console.log("🏦 XE API SERVICE: Recipient payload:", JSON.stringify(recipientPayload, null, 2));

      // Get account number for query parameter (if available)
      const accountNumber = process.env.XE_ACCOUNT_NUMBER || "XEMT0440856664";

      const response = await axios.post(
        `${this.baseURL}/v2/recipients?accountNumber=${accountNumber}`,
        recipientPayload,
        {
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("🏦 XE API SERVICE: ✅ Recipient created successfully:", response.data);

      return {
        success: true,
        recipient: response.data,
        clientReference: clientReference,
      };
    } catch (error) {
      console.error("🏦 XE API SERVICE: ❌ Error creating recipient:", error.response?.data || error.message);

      // Handle structured XE API error response
      let structuredError = null;
      if (error.response?.data) {
        // Check if it's the structured error format
        if (Array.isArray(error.response.data) && error.response.data.length > 0) {
          structuredError = error.response.data[0]; // Take the first error
        } else if (error.response.data.code !== undefined) {
          structuredError = error.response.data;
        }
      }

      return {
        success: false,
        error: structuredError?.shortErrorMsg || error.response?.data?.message || error.message,
        details: structuredError || error.response?.data || null,
      };
    }
  }
}

module.exports = new XeApiService();
