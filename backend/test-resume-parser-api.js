const resumeParserService = require("./src/services/resumeParserService");
const fs = require("fs");
const path = require("path");

async function testResumeParserAPI() {
  console.log("Testing Resume Parser API...");
  console.log("=====================================");

  try {
    // Test 1: Test API connection
    console.log("\n1. Testing API Connection...");
    const connectionTest = await resumeParserService.testConnection();

    if (connectionTest.success) {
      console.log("✅ API Connection successful");
      console.log("User:", connectionTest.user.username);
      console.log("Subscription:", connectionTest.user.subscription_tier);
      console.log("API Calls Limit:", connectionTest.user.api_calls_limit);
      console.log("API Calls Used:", connectionTest.user.api_calls_used);
    } else {
      console.log("❌ API Connection failed:", connectionTest.error);
      return;
    }

    // Test 2: Test with a sample PDF file (if available)
    console.log("\n2. Testing Resume Parsing...");
    const testFilePath = path.join(__dirname, "test-resume.pdf");

    if (fs.existsSync(testFilePath)) {
      console.log("Found test resume file:", testFilePath);

      try {
        const fileBuffer = fs.readFileSync(testFilePath);
        console.log("File size:", fileBuffer.length, "bytes");

        const parseResult = await resumeParserService.parseResume(fileBuffer, "test-resume.pdf", "application/pdf");

        if (parseResult.success) {
          console.log("✅ Resume parsing successful");
          console.log("Parsed filename:", parseResult.filename);
          console.log("Parsed data preview:", JSON.stringify(parseResult.parsedData, null, 2));
        } else {
          console.log("❌ Resume parsing failed:", parseResult.error);
        }
      } catch (error) {
        console.error("❌ Error during parsing test:", error.message);
      }
    } else {
      console.log("⚠️  No test resume file found at:", testFilePath);
      console.log('To test resume parsing, place a PDF file named "test-resume.pdf" in the backend directory');
    }

    console.log("\n✅ Resume Parser API test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
if (require.main === module) {
  testResumeParserAPI();
}

module.exports = { testResumeParserAPI };

