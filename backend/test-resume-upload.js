const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

// Test resume upload functionality
async function testResumeUpload() {
  try {
    console.log("Testing resume upload functionality...");

    // Create a test PDF file (dummy content)
    const testContent = "This is a test resume content for testing purposes.";
    const testFilePath = path.join(__dirname, "test-resume.txt");
    fs.writeFileSync(testFilePath, testContent);

    // Create form data
    const formData = new FormData();
    formData.append("resume", fs.createReadStream(testFilePath));

    // Test the upload endpoint
    const response = await axios.post("http://localhost:5000/api/upload/resume", formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: "Bearer YOUR_TEST_TOKEN_HERE", // Replace with actual token
      },
    });

    console.log("Upload response:", response.data);

    // Clean up test file
    fs.unlinkSync(testFilePath);
  } catch (error) {
    console.error("Test failed:", error.response?.data || error.message);
  }
}

// Test file serving
async function testResumeDownload() {
  try {
    console.log("Testing resume download functionality...");

    const response = await axios.get("http://localhost:5000/api/upload/files/resumes/test-filename.pdf");
    console.log("Download test response status:", response.status);
  } catch (error) {
    console.error("Download test failed:", error.response?.data || error.message);
  }
}

// Run tests
if (require.main === module) {
  console.log("Resume upload test script");
  console.log("Make sure the backend server is running on port 5000");
  console.log("Update the authorization token before running the test");
}

module.exports = { testResumeUpload, testResumeDownload };

