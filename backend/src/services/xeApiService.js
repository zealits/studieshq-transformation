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
   * Maps currency code to country code
   * @param {string} currencyCode - Currency code (e.g., 'INR', 'USD')
   * @returns {string} Country code (e.g., 'IN', 'US')
   */
  getCountryCodeFromCurrency(currencyCode) {
    const currencyToCountryMap = {
      INR: "IN", // Indian Rupee -> India
      USD: "US", // US Dollar -> United States
      EUR: "DE", // Euro -> Germany (primary)
      GBP: "GB", // British Pound -> United Kingdom
      CAD: "CA", // Canadian Dollar -> Canada
      AUD: "AU", // Australian Dollar -> Australia
      JPY: "JP", // Japanese Yen -> Japan
      CNY: "CN", // Chinese Yuan -> China
      SGD: "SG", // Singapore Dollar -> Singapore
      HKD: "HK", // Hong Kong Dollar -> Hong Kong
      NZD: "NZ", // New Zealand Dollar -> New Zealand
      CHF: "CH", // Swiss Franc -> Switzerland
      SEK: "SE", // Swedish Krona -> Sweden
      NOK: "NO", // Norwegian Krone -> Norway
      DKK: "DK", // Danish Krone -> Denmark
      PLN: "PL", // Polish Zloty -> Poland
      CZK: "CZ", // Czech Koruna -> Czech Republic
      HUF: "HU", // Hungarian Forint -> Hungary
      BRL: "BR", // Brazilian Real -> Brazil
      MXN: "MX", // Mexican Peso -> Mexico
      ZAR: "ZA", // South African Rand -> South Africa
      KRW: "KR", // South Korean Won -> South Korea
      THB: "TH", // Thai Baht -> Thailand
      MYR: "MY", // Malaysian Ringgit -> Malaysia
      PHP: "PH", // Philippine Peso -> Philippines
      IDR: "ID", // Indonesian Rupiah -> Indonesia
      VND: "VN", // Vietnamese Dong -> Vietnam
      TRY: "TR", // Turkish Lira -> Turkey
      RUB: "RU", // Russian Ruble -> Russia
      AED: "AE", // UAE Dirham -> United Arab Emirates
      SAR: "SA", // Saudi Riyal -> Saudi Arabia
      EGP: "EG", // Egyptian Pound -> Egypt
      NGN: "NG", // Nigerian Naira -> Nigeria
      KES: "KE", // Kenyan Shilling -> Kenya
      GHS: "GH", // Ghanaian Cedi -> Ghana
      MAD: "MA", // Moroccan Dirham -> Morocco
      TND: "TN", // Tunisian Dinar -> Tunisia
      DZD: "DZ", // Algerian Dinar -> Algeria
      ETB: "ET", // Ethiopian Birr -> Ethiopia
      UGX: "UG", // Ugandan Shilling -> Uganda
      TZS: "TZ", // Tanzanian Shilling -> Tanzania
      ZMW: "ZM", // Zambian Kwacha -> Zambia
      BWP: "BW", // Botswanan Pula -> Botswana
      MWK: "MW", // Malawian Kwacha -> Malawi
      ZWL: "ZW", // Zimbabwean Dollar -> Zimbabwe
    };

    return currencyToCountryMap[currencyCode] || "US"; // Default to US if not found
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
   * Get FX quotation for withdrawal
   * @param {number} usdAmount - Amount in USD to withdraw
   * @param {string} buyCurrency - Target currency (user's currency)
   * @param {string} countryTo - Target country code
   * @param {string} xeRecipientId - XE recipient ID (optional)
   * @returns {Promise<Object>} FX quotation response
   */
  async getFxQuotation(usdAmount, buyCurrency, countryTo, xeRecipientId = null) {
    try {
      console.log(`🏦 XE API SERVICE: Getting FX quotation for ${usdAmount} USD to ${buyCurrency} (${countryTo})`);

      const accessToken = await this.getValidAccessToken();

      if (!accessToken) {
        return {
          success: false,
          error: "Failed to get access token",
        };
      }

      const quotationPayload = {
        sell: {
          currency: "USD",
          amount: usdAmount,
        },
        buy: {
          currency: buyCurrency,
        },
        countryTo: countryTo,
        deliveryMethod: "BankAccount",
      };

      // Only include settlementDetails if we have a valid recipient ID
      if (xeRecipientId) {
        quotationPayload.settlementDetails = {
          settlementMethod: "BankTransfer",
          recipientId: xeRecipientId,
        };
      }

      console.log("🏦 XE API SERVICE: FX quotation payload:", JSON.stringify(quotationPayload, null, 2));

      const response = await axios.post(`${this.baseURL}/v2/fxquotes`, quotationPayload, {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      console.log("🏦 XE API SERVICE: ✅ FX quotation retrieved successfully:", response.data);

      return {
        success: true,
        quotation: response.data,
      };
    } catch (error) {
      console.error("🏦 XE API SERVICE: ❌ Error getting FX quotation:", error.response?.data || error.message);

      // Handle structured XE API error response
      let structuredError = null;
      let errorMessage = error.message;

      if (error.response?.data) {
        console.log(
          "🏦 XE API SERVICE: FX quotation raw error response:",
          JSON.stringify(error.response.data, null, 2)
        );

        // Handle different XE API error formats
        if (Array.isArray(error.response.data)) {
          // Array of error objects
          structuredError = error.response.data[0]; // Take the first error
        } else if (
          error.response.data.errors ||
          error.response.data.shortErrorMsg ||
          error.response.data.longErrorMsg
        ) {
          // Structured error object
          structuredError = error.response.data;
        } else {
          // Fallback to raw response
          structuredError = error.response.data;
        }

        // Extract appropriate error message
        if (structuredError?.longErrorMsg) {
          errorMessage = structuredError.longErrorMsg;
        } else if (structuredError?.shortErrorMsg) {
          errorMessage = structuredError.shortErrorMsg;
        } else if (structuredError?.message) {
          errorMessage = structuredError.message;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }

      return {
        success: false,
        error: errorMessage,
        details: structuredError || error.response?.data || null,
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
        if (paymentMethod.bankDetails.bankName || paymentMethod.consumerDetails?.givenNames) {
          accountData.accountName =
            paymentMethod.bankDetails.bankName ||
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
      let errorMessage = error.message;

      if (error.response?.data) {
        console.log("🏦 XE API SERVICE: Raw error response:", JSON.stringify(error.response.data, null, 2));

        // Handle different XE API error formats
        if (Array.isArray(error.response.data)) {
          // Array of error objects
          structuredError = error.response.data[0]; // Take the first error
        } else if (
          error.response.data.errors ||
          error.response.data.shortErrorMsg ||
          error.response.data.longErrorMsg
        ) {
          // Structured error object
          structuredError = error.response.data;
        } else {
          // Fallback to raw response
          structuredError = error.response.data;
        }

        // Extract appropriate error message
        if (structuredError?.longErrorMsg) {
          errorMessage = structuredError.longErrorMsg;
        } else if (structuredError?.shortErrorMsg) {
          errorMessage = structuredError.shortErrorMsg;
        } else if (structuredError?.message) {
          errorMessage = structuredError.message;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }

      return {
        success: false,
        error: errorMessage,
        details: structuredError || error.response?.data || null,
      };
    }
  }

  /**
   * Create a payment for recipient
   * @param {Object} paymentData - Payment details
   * @param {number} paymentData.sellAmount - Amount in USD to send
   * @param {string} paymentData.buyCurrency - Target currency
   * @param {string} paymentData.xeRecipientId - XE recipient ID
   * @param {string} paymentData.clientReference - Client reference for payment
   * @param {string} paymentData.purpose - Purpose of payment
   * @returns {Promise<Object>} Payment creation response
   */
  async createPayment(paymentData) {
    try {
      console.log("🏦 XE API SERVICE: Creating payment for recipient...");

      const accessToken = await this.getValidAccessToken();

      if (!accessToken) {
        return {
          success: false,
          error: "Failed to get access token",
        };
      }

      const {
        sellAmount = paymentData.amount,
        buyCurrency = paymentData.targetCurrency,
        xeRecipientId = paymentData.recipientId,
        clientReference = paymentData.clientReference,
        purpose = paymentData.purpose || "Freelance Payment",
      } = paymentData;

      console.log("🏦 XE API SERVICE: Payment data received:", {
        sellAmount,
        buyCurrency,
        xeRecipientId,
        clientReference,
        purpose,
        originalPaymentData: paymentData,
      });

      // Generate unique client reference if not provided (max 35 chars for XE API)
      const uniqueClientReference =
        clientReference || `shq${Date.now().toString().slice(-8)}${Math.random().toString(36).substr(2, 6)}`;

      console.log("🏦 XE API SERVICE: Using client reference:", uniqueClientReference);

      // Determine purpose of payment code based on currency
      const purposeOfPaymentCode = buyCurrency === "INR" ? "CORP_INR_UTILTY" : "CORP_INVOICE";

      const paymentPayload = {
        payments: [
          {
            clientReference: uniqueClientReference,
            sellAmount: {
              currency: "USD",
              amount: sellAmount,
            },
            buyAmount: {
              currency: buyCurrency,
            },
            purposeOfPaymentCode: purposeOfPaymentCode,
            recipient: {
              recipientId: {
                xeRecipientId: xeRecipientId,
                clientReference: uniqueClientReference,
              },
              type: "Registered",
            },
          },
        ],
        autoApprove: false,
        settlementDetails: {
          settlementMethod: "DirectDebit",
          bankAccountId: process.env.XE_BANK_ACCOUNT_ID || 123456,
        },
      };

      console.log("🏦 XE API SERVICE: Payment payload:", JSON.stringify(paymentPayload, null, 2));

      const accountNumber = process.env.XE_ACCOUNT_NUMBER || "XEMT0440856664";

      const response = await axios.post(`${this.baseURL}/v2/payments?accountNumber=${accountNumber}`, paymentPayload, {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      console.log("🏦 XE API SERVICE: ✅ Payment created successfully:", response.data);

      return {
        success: true,
        payment: response.data,
        contractNumber: response.data.identifier?.contractNumber,
        quoteExpires: response.data.quote?.expires,
      };
    } catch (error) {
      console.error("🏦 XE API SERVICE: ❌ Error creating payment:", error.response?.data || error.message);

      // Handle structured XE API error response
      let structuredError = null;
      let errorMessage = error.message;

      if (error.response?.data) {
        console.log(
          "🏦 XE API SERVICE: Payment creation raw error response:",
          JSON.stringify(error.response.data, null, 2)
        );

        // Handle XE API error format for 400 status code
        if (error.response.status === 400 && error.response.data) {
          const errorData = error.response.data;

          // Standard XE API error format
          if (errorData.longErrorMsg) {
            errorMessage = errorData.longErrorMsg;
          } else if (errorData.shortErrorMsg) {
            errorMessage = errorData.shortErrorMsg;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }

          structuredError = errorData;
        } else {
          // Fallback error handling
          structuredError = error.response.data;
          errorMessage = error.response.data.message || error.message;
        }
      }

      return {
        success: false,
        error: errorMessage,
        details: structuredError || error.response?.data || null,
        statusCode: error.response?.status,
      };
    }
  }

  /**
   * Approve a payment contract
   * @param {string} contractNumber - Contract number to approve
   * @returns {Promise<Object>} Contract approval response
   */
  async approveContract(contractNumber) {
    try {
      console.log(`🏦 XE API SERVICE: Approving contract ${contractNumber}...`);

      const accessToken = await this.getValidAccessToken();

      if (!accessToken) {
        return {
          success: false,
          error: "Failed to get access token",
        };
      }

      const response = await axios.post(
        `${this.baseURL}/v2/contracts/${contractNumber}/approve`,
        {},
        {
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log("🏦 XE API SERVICE: ✅ Contract approved successfully:", response.data);

      return {
        success: true,
        contract: response.data,
        contractNumber: response.data.identifier?.contractNumber,
      };
    } catch (error) {
      console.error("🏦 XE API SERVICE: ❌ Error approving contract:", error.response?.data || error.message);

      // Handle structured XE API error response
      let structuredError = null;
      let errorMessage = error.message;

      if (error.response?.data) {
        console.log(
          "🏦 XE API SERVICE: Contract approval raw error response:",
          JSON.stringify(error.response.data, null, 2)
        );

        // Handle XE API error format
        const errorData = error.response.data;

        if (errorData.longErrorMsg) {
          errorMessage = errorData.longErrorMsg;
        } else if (errorData.shortErrorMsg) {
          errorMessage = errorData.shortErrorMsg;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }

        structuredError = errorData;
      }

      return {
        success: false,
        error: errorMessage,
        details: structuredError || error.response?.data || null,
        statusCode: error.response?.status,
      };
    }
  }

  /**
   * Cancel a payment contract
   * @param {string} contractNumber - Contract number to cancel
   * @returns {Promise<Object>} Contract cancellation response
   */
  async cancelContract(contractNumber) {
    try {
      console.log(`🏦 XE API SERVICE: Cancelling contract ${contractNumber}...`);

      const accessToken = await this.getValidAccessToken();

      if (!accessToken) {
        return {
          success: false,
          error: "Failed to get access token",
        };
      }

      const response = await axios.delete(`${this.baseURL}/v2/contracts/${contractNumber}`, {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log("🏦 XE API SERVICE: ✅ Contract cancelled successfully:", {
        status: response.status,
        statusText: response.statusText,
      });

      return {
        success: true,
        status: response.status,
        statusText: response.statusText,
        contractNumber: contractNumber,
      };
    } catch (error) {
      console.error("🏦 XE API SERVICE: ❌ Error cancelling contract:", error.response?.data || error.message);

      // Handle structured XE API error response
      let structuredError = null;
      let errorMessage = error.message;

      if (error.response?.data) {
        console.log(
          "🏦 XE API SERVICE: Contract cancellation raw error response:",
          JSON.stringify(error.response.data, null, 2)
        );

        // Handle XE API error format
        const errorData = error.response.data;

        if (errorData.longErrorMsg) {
          errorMessage = errorData.longErrorMsg;
        } else if (errorData.shortErrorMsg) {
          errorMessage = errorData.shortErrorMsg;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }

        structuredError = errorData;
      }

      return {
        success: false,
        error: errorMessage,
        details: structuredError || error.response?.data || null,
        statusCode: error.response?.status,
      };
    }
  }
}

module.exports = new XeApiService();
