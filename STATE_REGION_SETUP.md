# State/Region Dropdown Setup

This document explains how to set up and use the state/region dropdown functionality for the specified countries.

## Overview

The system now supports dropdown selection for states/regions for the following countries:

- United States (US)
- United Kingdom (GB)
- Australia (AU)
- China (CN)
- Mexico (MX)
- New Zealand (NZ)
- Canada (CA)

For other countries, users will see a regular text input field for state/region.

## Database Setup

### 1. Create the StateRegion Model

A new model `StateRegion` has been created to store state/region data from the GeoNames API.

### 2. Fetch and Store States Data

Run the following command to fetch and store states data for all supported countries:

```bash
cd backend
node fetch-states-data.js fetch
```

To verify the data was stored correctly:

```bash
node fetch-states-data.js verify
```

### 3. API Endpoints

The following API endpoints are available:

- `GET /api/states/countries` - Get all available countries with states
- `GET /api/states/countries/:countryCode/states` - Get states for a specific country
- `GET /api/states/countries/:countryCode/states/:isoCode` - Get specific state by ISO code

## Frontend Integration

### 1. State/Region Service

A new service `stateRegionService.js` has been created to handle API calls for states data.

### 2. Updated ConsumerDetailsForm

The `ConsumerDetailsForm` component has been updated to:

- Show a dropdown for supported countries
- Show a text input for other countries
- Automatically fetch states when country changes
- Clear region selection when country changes

## How It Works

1. When a user selects a country in the form, the system checks if it's one of the supported countries
2. If supported, it fetches the states/regions from the database via API
3. The state/region field becomes a dropdown with the fetched options
4. If not supported, it remains a regular text input field
5. The selected state/region value is stored as the ISO code (e.g., "AL" for Alabama)

## Data Structure

The states are stored with the following structure:

```javascript
{
  countryCode: "US",
  countryName: "United States",
  geonameId: 4829764,
  name: "Alabama",
  isoCode: "AL"
}
```

## Testing

1. Start the backend server
2. Run the data fetch script
3. Open the ConsumerDetailsForm
4. Select "United States" as the country
5. The State/Region field should show a dropdown with US states
6. Select "Canada" as the country
7. The State/Region field should show a dropdown with Canadian provinces
8. Select any other country
9. The State/Region field should show a regular text input

## Troubleshooting

- If states don't load, check the browser console for API errors
- Verify the database connection and that states data was fetched successfully
- Check that the GeoNames API username is valid
- Ensure the backend server is running and the API endpoints are accessible
