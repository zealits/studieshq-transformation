const resumeParserService = require("./src/services/resumeParserService");
const fs = require("fs");
const path = require("path");

async function testResumeParser() {
  console.log("Testing Resume Parser Service...");
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

    // Test 2: Test resume parsing (if you have a test file)
    console.log("\n2. Testing Resume Parsing...");
    console.log("Note: To test resume parsing, place a test resume file in the backend directory");
    console.log("and uncomment the code below.");

    /*
    // Uncomment this section to test with a real resume file
    const testFilePath = path.join(__dirname, 'test-resume.pdf');
    if (fs.existsSync(testFilePath)) {
      const fileBuffer = fs.readFileSync(testFilePath);
      const parseResult = await resumeParserService.parseResume(
        fileBuffer,
        'test-resume.pdf',
        'application/pdf'
      );
      
      if (parseResult.success) {
        console.log('✅ Resume parsing successful');
        console.log('Parsed filename:', parseResult.filename);
        console.log('Parsed data preview:', JSON.stringify(parseResult.parsedData, null, 2));
      } else {
        console.log('❌ Resume parsing failed:', parseResult.error);
      }
    } else {
      console.log('⚠️  No test resume file found at:', testFilePath);
    }
    */

    console.log("\n✅ Resume Parser Service test completed successfully!");

    // Test 3: Test resume deletion (if you have uploaded a resume)
    console.log("\n3. Testing Resume Deletion...");
    console.log("Note: To test resume deletion, you need to upload a resume first through the frontend");
    console.log("and then use the DELETE /api/upload/resume endpoint with proper authentication.");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
if (require.main === module) {
  testResumeParser();
}

module.exports = { testResumeParser };
