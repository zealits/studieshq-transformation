const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { seedCountryBusinessFields } = require("../data/countryBusinessFieldsSeed");

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUri =
      "mongodb+srv://latakhillare:LtmZBL4ZiJiZ3hs0@cluster0.impfvlk.mongodb.net/studieshqtransformationfeatures?retryWrites=true&w=majority";
    console.log(`🔌 Connecting to MongoDB: ${mongoUri.replace(/\/\/.*@/, "//***:***@")}`); // Hide credentials

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Wait for connection to be ready
    if (mongoose.connection.readyState === 1) {
      console.log("✅ Connected to MongoDB");
      console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
      console.log(`📊 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
    } else {
      throw new Error("Connection not ready");
    }
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error.message);
    throw error;
  }
};

// Main function
async function main() {
  try {
    await connectDB();

    // Small delay to ensure connection is fully established
    await new Promise((resolve) => setTimeout(resolve, 500));

    await seedCountryBusinessFields();
    console.log("✅ Country business fields seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding country business fields:", error);
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log("🔌 Disconnected from MongoDB");
    }
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
