const mongoose = require("mongoose");
const axios = require("axios");
const StateRegion = require("./src/models/StateRegion");

require("dotenv").config();

// Database configuration
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/studieshq", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

// Countries and their GeoNames geonameId
const countries = [
  { name: "United States", code: "US", geonameId: 6252001 },
  { name: "United Kingdom", code: "GB", geonameId: 2635167 },
  { name: "Australia", code: "AU", geonameId: 2077456 },
  { name: "China", code: "CN", geonameId: 1814991 },
  { name: "Mexico", code: "MX", geonameId: 3996063 },
  { name: "New Zealand", code: "NZ", geonameId: 2186224 },
  { name: "Canada", code: "CA", geonameId: 6251999 },
];

// Function to fetch states/regions for a country
const fetchStatesForCountry = async (country) => {
  try {
    console.log(`Fetching states for ${country.name}...`);

    const response = await axios.get(
      `http://api.geonames.org/childrenJSON?geonameId=${country.geonameId}&username=aniket17`
    );

    if (response.data && response.data.geonames) {
      const states = response.data.geonames.map((state) => ({
        countryCode: country.code,
        countryName: country.name,
        geonameId: state.geonameId,
        name: state.name,
        isoCode: state.adminCode1,
      }));

      // Clear existing data for this country
      await StateRegion.deleteMany({ countryCode: country.code });
      console.log(`Cleared existing states for ${country.name}`);

      // Insert new data
      const result = await StateRegion.insertMany(states);
      console.log(`Successfully stored ${result.length} states for ${country.name}`);

      return result;
    } else {
      console.log(`No states found for ${country.name}`);
      return [];
    }
  } catch (error) {
    console.error(`Error fetching states for ${country.name}:`, error.message);
    return [];
  }
};

// Function to fetch all countries' states
const fetchAllStates = async () => {
  try {
    await connectDB();
    console.log("Starting to fetch states data...");

    for (const country of countries) {
      await fetchStatesForCountry(country);
      // Add a small delay to avoid overwhelming the API
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log("All states data fetched and stored successfully!");

    // Display summary
    const summary = await StateRegion.aggregate([
      {
        $group: {
          _id: "$countryName",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    console.log("\nSummary of stored states:");
    summary.forEach((item) => {
      console.log(`${item._id}: ${item.count} states`);
    });
  } catch (error) {
    console.error("Error in fetchAllStates:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
};

// Function to verify stored data
const verifyStoredData = async () => {
  try {
    await connectDB();

    console.log("Verifying stored data...");

    for (const country of countries) {
      const count = await StateRegion.countDocuments({ countryCode: country.code });
      console.log(`${country.name} (${country.code}): ${count} states`);

      if (count > 0) {
        const sample = await StateRegion.findOne({ countryCode: country.code });
        console.log(`  Sample: ${sample.name} (${sample.isoCode})`);
      }
    }
  } catch (error) {
    console.error("Error verifying data:", error);
  } finally {
    await mongoose.connection.close();
  }
};

// Main execution
const main = async () => {
  const command = process.argv[2];

  switch (command) {
    case "fetch":
      await fetchAllStates();
      break;
    case "verify":
      await verifyStoredData();
      break;
    default:
      console.log("Usage:");
      console.log("  node fetch-states-data.js fetch   - Fetch and store states data");
      console.log("  node fetch-states-data.js verify  - Verify stored data");
      break;
  }
};

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  fetchAllStates,
  verifyStoredData,
  fetchStatesForCountry,
};
