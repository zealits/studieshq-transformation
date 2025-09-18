const mongoose = require("mongoose");
const PaymentField = require("../models/PaymentField");
const xeApiService = require("../services/xeApiService");
require("dotenv").config();

// Country-currency mappings (same as in xeApiService but with names)
const countryCurrencyMappings = [
  { country: { code: "US", name: "United States" }, currency: { code: "USD", name: "US Dollar" } },
  { country: { code: "CA", name: "Canada" }, currency: { code: "CAD", name: "Canadian Dollar" } },
  { country: { code: "GB", name: "United Kingdom" }, currency: { code: "GBP", name: "British Pound" } },
  { country: { code: "AU", name: "Australia" }, currency: { code: "AUD", name: "Australian Dollar" } },
  { country: { code: "DE", name: "Germany" }, currency: { code: "EUR", name: "Euro" } },
  { country: { code: "FR", name: "France" }, currency: { code: "EUR", name: "Euro" } },
  { country: { code: "IT", name: "Italy" }, currency: { code: "EUR", name: "Euro" } },
  { country: { code: "ES", name: "Spain" }, currency: { code: "EUR", name: "Euro" } },
  { country: { code: "NL", name: "Netherlands" }, currency: { code: "EUR", name: "Euro" } },
  { country: { code: "BE", name: "Belgium" }, currency: { code: "EUR", name: "Euro" } },
  { country: { code: "AT", name: "Austria" }, currency: { code: "EUR", name: "Euro" } },
  { country: { code: "CH", name: "Switzerland" }, currency: { code: "CHF", name: "Swiss Franc" } },
  { country: { code: "DK", name: "Denmark" }, currency: { code: "DKK", name: "Danish Krone" } },
  { country: { code: "SE", name: "Sweden" }, currency: { code: "SEK", name: "Swedish Krona" } },
  { country: { code: "NO", name: "Norway" }, currency: { code: "NOK", name: "Norwegian Krone" } },
  { country: { code: "FI", name: "Finland" }, currency: { code: "EUR", name: "Euro" } },
  { country: { code: "IE", name: "Ireland" }, currency: { code: "EUR", name: "Euro" } },
  { country: { code: "LU", name: "Luxembourg" }, currency: { code: "EUR", name: "Euro" } },
  { country: { code: "PT", name: "Portugal" }, currency: { code: "EUR", name: "Euro" } },
  { country: { code: "GR", name: "Greece" }, currency: { code: "EUR", name: "Euro" } },
  { country: { code: "PL", name: "Poland" }, currency: { code: "PLN", name: "Polish Zloty" } },
  { country: { code: "CZ", name: "Czech Republic" }, currency: { code: "CZK", name: "Czech Koruna" } },
  { country: { code: "HU", name: "Hungary" }, currency: { code: "HUF", name: "Hungarian Forint" } },
  { country: { code: "SK", name: "Slovakia" }, currency: { code: "EUR", name: "Euro" } },
  { country: { code: "SI", name: "Slovenia" }, currency: { code: "EUR", name: "Euro" } },
  { country: { code: "EE", name: "Estonia" }, currency: { code: "EUR", name: "Euro" } },
  { country: { code: "LV", name: "Latvia" }, currency: { code: "EUR", name: "Euro" } },
  { country: { code: "LT", name: "Lithuania" }, currency: { code: "EUR", name: "Euro" } },
  { country: { code: "MT", name: "Malta" }, currency: { code: "EUR", name: "Euro" } },
  { country: { code: "CY", name: "Cyprus" }, currency: { code: "EUR", name: "Euro" } },
  { country: { code: "BG", name: "Bulgaria" }, currency: { code: "BGN", name: "Bulgarian Lev" } },
  { country: { code: "RO", name: "Romania" }, currency: { code: "RON", name: "Romanian Leu" } },
  { country: { code: "HR", name: "Croatia" }, currency: { code: "EUR", name: "Euro" } },
  { country: { code: "JP", name: "Japan" }, currency: { code: "JPY", name: "Japanese Yen" } },
  { country: { code: "SG", name: "Singapore" }, currency: { code: "SGD", name: "Singapore Dollar" } },
  { country: { code: "HK", name: "Hong Kong" }, currency: { code: "HKD", name: "Hong Kong Dollar" } },
  { country: { code: "NZ", name: "New Zealand" }, currency: { code: "NZD", name: "New Zealand Dollar" } },
  { country: { code: "IN", name: "India" }, currency: { code: "INR", name: "Indian Rupee" } },
  { country: { code: "MX", name: "Mexico" }, currency: { code: "MXN", name: "Mexican Peso" } },
  { country: { code: "BR", name: "Brazil" }, currency: { code: "BRL", name: "Brazilian Real" } },
  { country: { code: "ZA", name: "South Africa" }, currency: { code: "ZAR", name: "South African Rand" } },
];

class PaymentFieldSeeder {
  constructor() {
    this.successCount = 0;
    this.errorCount = 0;
    this.skippedCount = 0;
    this.errors = [];
  }

  async connectToDatabase() {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("✅ Connected to MongoDB");
    } catch (error) {
      console.error("❌ Failed to connect to MongoDB:", error.message);
      throw error;
    }
  }

  async seedPaymentFields(options = {}) {
    const { force = false, dryRun = false } = options;

    console.log("🌱 PAYMENT FIELDS SEEDER: Starting seeding process...");
    console.log(`📊 Total combinations to process: ${countryCurrencyMappings.length}`);

    if (dryRun) {
      console.log("🔍 DRY RUN MODE: No data will be saved to database");
    }

    // Clear existing data if force flag is set
    if (force && !dryRun) {
      console.log("🗑️ Clearing existing payment fields...");
      await PaymentField.deleteMany({});
      console.log("✅ Existing payment fields cleared");
    }

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // response = await xeApiService.getAccessToken();
    // console.log(response, "response");

    for (let i = 0; i < countryCurrencyMappings.length; i++) {
      const mapping = countryCurrencyMappings[i];
      const { country, currency } = mapping;

      try {
        console.log(
          `\n📍 Processing ${i + 1}/${countryCurrencyMappings.length}: ${country.name} (${country.code}) - ${
            currency.name
          } (${currency.code})`
        );

        // Check if already exists (unless force mode)
        if (!force) {
          const existing = await PaymentField.findByCountryAndCurrency(country.code, currency.code);
          if (existing) {
            console.log(`⏭️ Skipping ${country.code}/${currency.code} - already exists`);
            this.skippedCount++;
            continue;
          }
        }

        // Fetch payment fields from XE API
        console.log(`🔄 Fetching payment fields from XE API...`);
        const result = await xeApiService.getPaymentFieldsFromAPI(country.code, currency.code);

        if (!result.success) {
          console.log(`❌ Failed to fetch fields for ${country.code}/${currency.code}: ${result.error}`);
          this.errors.push({
            country: country.code,
            currency: currency.code,
            error: result.error,
          });
          this.errorCount++;
          continue;
        }

        const paymentFieldData = {
          countryCode: country.code,
          countryName: country.name,
          currencyCode: currency.code,
          currencyName: currency.name,
          fields: result.fields || [],
          isActive: true,
          lastUpdated: new Date(),
          source: "xe_api",
        };

        if (dryRun) {
          console.log(
            `✅ DRY RUN: Would save ${result.fields?.length || 0} fields for ${country.code}/${currency.code}`
          );
          console.log(`   Fields: ${result.fields?.map((f) => f.fieldName).join(", ") || "none"}`);
        } else {
          // Save to database (upsert)
          const saved = await PaymentField.findOneAndUpdate(
            { countryCode: country.code, currencyCode: currency.code },
            paymentFieldData,
            { upsert: true, new: true }
          );

          console.log(`✅ Saved ${saved.fields.length} fields for ${country.code}/${currency.code}`);
          console.log(`   Fields: ${saved.fields.map((f) => f.fieldName).join(", ")}`);
        }

        this.successCount++;

        // Add delay to avoid rate limiting
        if (i < countryCurrencyMappings.length - 1) {
          console.log("⏱️ Waiting 1 second to avoid rate limiting...");
          await delay(1000);
        }
      } catch (error) {
        console.log(`❌ Error processing ${country.code}/${currency.code}:`, error.message);
        this.errors.push({
          country: country.code,
          currency: currency.code,
          error: error.message,
        });
        this.errorCount++;
      }
    }

    this.printSummary(dryRun);
  }

  printSummary(dryRun = false) {
    console.log("\n" + "=".repeat(60));
    console.log("📊 SEEDING SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Successful: ${this.successCount}`);
    console.log(`⏭️ Skipped: ${this.skippedCount}`);
    console.log(`❌ Errors: ${this.errorCount}`);
    console.log(`📋 Total: ${this.successCount + this.skippedCount + this.errorCount}`);

    if (this.errors.length > 0) {
      console.log("\n❌ ERRORS:");
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.country}/${error.currency}: ${error.error}`);
      });
    }

    if (dryRun) {
      console.log("\n🔍 This was a DRY RUN - no data was actually saved to the database");
    }

    console.log("=".repeat(60));
  }

  async getStats() {
    try {
      const totalRecords = await PaymentField.countDocuments({ isActive: true });
      const countries = await PaymentField.getAllCountries();

      console.log("\n📊 DATABASE STATS:");
      console.log(`Total active payment field records: ${totalRecords}`);
      console.log(`Countries with data: ${countries.length}`);

      console.log("\nCountries:");
      countries.forEach((country) => {
        console.log(`  • ${country.name} (${country.code})`);
      });

      return {
        totalRecords,
        countriesCount: countries.length,
        countries,
      };
    } catch (error) {
      console.error("Error getting stats:", error.message);
    }
  }

  async disconnect() {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    force: args.includes("--force"),
    dryRun: args.includes("--dry-run"),
    stats: args.includes("--stats"),
    help: args.includes("--help"),
  };

  if (options.help) {
    console.log(`
🌱 Payment Fields Seeder

Usage: node seedPaymentFields.js [options]

Options:
  --force      Force overwrite existing data
  --dry-run    Show what would be done without saving to database
  --stats      Show current database statistics
  --help       Show this help message

Examples:
  node seedPaymentFields.js                    # Seed only missing data
  node seedPaymentFields.js --force            # Overwrite all existing data
  node seedPaymentFields.js --dry-run          # Preview what would be seeded
  node seedPaymentFields.js --stats            # Show database stats
`);
    return;
  }

  const seeder = new PaymentFieldSeeder();

  try {
    await seeder.connectToDatabase();

    if (options.stats) {
      await seeder.getStats();
    } else {
      await seeder.seedPaymentFields(options);
    }
  } catch (error) {
    console.error("💥 Fatal error:", error.message);
    process.exit(1);
  } finally {
    await seeder.disconnect();
  }
}

// Export for use in other scripts
module.exports = { PaymentFieldSeeder, countryCurrencyMappings };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
