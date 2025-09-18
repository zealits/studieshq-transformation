# Payment Fields Management

This document explains how to manage payment fields data for the XE API integration.

## Overview

Instead of making real-time API calls to XE API for every request, we store all payment fields data in our database. This approach provides:

- ✅ **Better Performance** - No API delays
- ✅ **Reliability** - No dependency on XE API availability
- ✅ **Cost Efficiency** - Reduced API calls
- ✅ **Offline Support** - Works even when XE API is down

## Database Schema

Payment fields are stored in the `PaymentField` collection with the following structure:

```javascript
{
  countryCode: "US",           // ISO 2-letter country code
  countryName: "United States", // Human-readable country name
  currencyCode: "USD",         // ISO 3-letter currency code
  currencyName: "US Dollar",   // Human-readable currency name
  fields: [                    // Array of required payment fields
    {
      fieldName: "accountNumber",
      label: "Account number",
      required: true,
      pattern: null,
      minimumLength: 5,
      maximumLength: 17,
      description: "Bank account number"
    },
    // ... more fields
  ],
  isActive: true,
  lastUpdated: "2025-09-15T...",
  source: "xe_api"
}
```

## Commands

### Seed Payment Fields (Initial Setup)

```bash
# Seed only missing data (recommended for first run)
npm run seed:payment-fields

# Force overwrite all existing data
npm run seed:payment-fields:force

# Preview what would be seeded (dry run)
npm run seed:payment-fields:dry-run

# Show current database statistics
npm run seed:payment-fields:stats
```

### Direct Node Commands

```bash
# Basic seeding
node src/utils/seedPaymentFields.js

# With options
node src/utils/seedPaymentFields.js --force --dry-run

# Show help
node src/utils/seedPaymentFields.js --help
```

## Usage Example

### 1. Initial Setup

First, add your XE API credentials to `.env`:

```env
XE_API_ACCESS_KEY=your_xe_api_access_key
XE_API_ACCESS_SECRET=your_xe_api_access_secret
XE_API_BASE_URL=https://pay-api-sandbox.xe.com
```

### 2. Seed the Database

```bash
# Check what would be seeded
npm run seed:payment-fields:dry-run

# Perform the actual seeding
npm run seed:payment-fields
```

### 3. Verify Data

```bash
# Check database statistics
npm run seed:payment-fields:stats
```

## Sample Output

```
🌱 PAYMENT FIELDS SEEDER: Starting seeding process...
📊 Total combinations to process: 41

📍 Processing 1/41: United States (US) - US Dollar (USD)
🔄 Fetching payment fields from XE API...
✅ Saved 3 fields for US/USD
   Fields: accountNumber, country, ncc

📍 Processing 2/41: India (IN) - Indian Rupee (INR)
🔄 Fetching payment fields from XE API...
✅ Saved 4 fields for IN/INR
   Fields: accountNumber, country, ifsc, beneficiaryName

============================================================
📊 SEEDING SUMMARY
============================================================
✅ Successful: 38
⏭️ Skipped: 0
❌ Errors: 3
📋 Total: 41
============================================================
```

## Maintenance

### Regular Updates

Run the seeding command periodically to keep payment fields up-to-date:

```bash
# Weekly/monthly update (only fetches missing data)
npm run seed:payment-fields

# Force refresh all data (use sparingly)
npm run seed:payment-fields:force
```

### Monitoring

Check database statistics to ensure data is available:

```bash
npm run seed:payment-fields:stats
```

Expected output:

```
📊 DATABASE STATS:
Total active payment field records: 38
Countries with data: 38

Countries:
  • United States (US)
  • Canada (CA)
  • United Kingdom (GB)
  • Australia (AU)
  ...
```

## Error Handling

If seeding fails for some countries:

1. **Check API credentials** - Ensure XE API keys are valid
2. **Check network connectivity** - Ensure XE API is accessible
3. **Review error messages** - Look for specific country/currency issues
4. **Retry failed entries** - Run seeding again (it will skip successful entries)

## API Integration

The service automatically uses database data instead of API calls:

```javascript
// This now reads from database, not XE API
const result = await xeApiService.getPaymentFields('US', 'USD');

// Returns enhanced data with descriptions
{
  success: true,
  fields: [
    {
      fieldName: "accountNumber",
      label: "Account number",
      required: true,
      description: "Bank account number",
      minimumLength: 5,
      maximumLength: 17
    }
  ],
  source: "database",
  lastUpdated: "2025-09-15T..."
}
```

## Troubleshooting

### "No payment fields found" Error

This means the database is empty. Run the seeding command:

```bash
npm run seed:payment-fields
```

### Seeding Fails with API Errors

1. Verify XE API credentials in `.env`
2. Check if you have access to the XE sandbox/production environment
3. Ensure your IP is whitelisted (if required)
4. Check API rate limits

### Database Connection Issues

1. Verify MongoDB connection string in `.env`
2. Ensure MongoDB is running
3. Check database permissions

## Technical Details

- **Rate Limiting**: 1-second delay between API calls to avoid rate limits
- **Error Recovery**: Failed entries can be retried without affecting successful ones
- **Data Validation**: All data is validated before saving to database
- **Indexing**: Optimized database indexes for fast country/currency lookups
- **Atomic Operations**: Uses upsert operations to prevent duplicates
