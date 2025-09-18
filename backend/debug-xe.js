console.log("=== XE API Debug Test ===");

// Test 1: Basic console output
console.log("1. Basic console test - OK");

// Test 2: Environment variables
require("dotenv").config();
console.log("2. dotenv loaded");
console.log("XE_API_ACCESS_KEY exists:", !!process.env.XE_API_ACCESS_KEY);
console.log("XE_API_ACCESS_SECRET exists:", !!process.env.XE_API_ACCESS_SECRET);
console.log("XE_API_ACCESS_KEY value:", process.env.XE_API_ACCESS_KEY ? "SET" : "NOT SET");
console.log("XE_API_ACCESS_SECRET value:", process.env.XE_API_ACCESS_SECRET ? "SET" : "NOT SET");

// Test 3: Try to require the service
try {
  console.log("3. Attempting to require xeApiService...");
  const xeApiService = require("./src/services/xeApiService");
  console.log("4. xeApiService loaded successfully");

  // Test 4: Simple async function
  async function simpleTest() {
    console.log("5. Inside async function");
    console.log("6. Test complete");
  }

  console.log("7. About to call async function");
  simpleTest()
    .then(() => {
      console.log("8. Async function completed");
    })
    .catch((error) => {
      console.log("9. Async function error:", error.message);
    });
} catch (error) {
  console.log("Error requiring service:", error.message);
}

console.log("=== End Debug Test ===");
