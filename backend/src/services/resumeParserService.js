const axios = require("axios");

class ResumeParserService {
  constructor() {
    this.apiUrl = process.env.RESUME_PARSER_API_URL || "https://resumeparser.aiiventure.com";
    this.username = process.env.RESUME_PARSER_USERNAME || "prerna";
    this.password = process.env.RESUME_PARSER_PASSWORD || "12345678";
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Authenticate with the resume parser API and get access token
   */
  async authenticate() {
    try {
      console.log("Authenticating with resume parser API...");

      const response = await axios.post(
        `${this.apiUrl}/auth/login`,
        {
          username: this.username,
          password: this.password,
        },
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data && response.data.access_token) {
        this.accessToken = response.data.access_token;
        this.tokenExpiry = Date.now() + response.data.expires_in * 1000;

        console.log("Successfully authenticated with resume parser API");
        console.log("Token expires in:", response.data.expires_in, "seconds");

        return {
          success: true,
          accessToken: this.accessToken,
          expiresIn: response.data.expires_in,
          user: response.data.user,
        };
      } else {
        throw new Error("No access token received from API");
      }
    } catch (error) {
      console.error("Resume parser authentication failed:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  /**
   * Check if the current token is valid and not expired
   */
  isTokenValid() {
    return this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry;
  }

  /**
   * Get a valid access token (authenticate if needed)
   */
  async getValidToken() {
    if (!this.isTokenValid()) {
      console.log("Token expired or not available, re-authenticating...");
      const authResult = await this.authenticate();
      if (!authResult.success) {
        throw new Error("Failed to authenticate with resume parser API");
      }
    }
    return this.accessToken;
  }

  /**
   * Parse a resume file using the API
   * @param {Buffer} fileBuffer - The resume file buffer
   * @param {string} filename - The original filename
   * @param {string} mimetype - The file MIME type
   */
  async parseResume(fileBuffer, filename, mimetype) {
    try {
      console.log(`Parsing resume: ${filename} (${mimetype}, ${fileBuffer.length} bytes)`);

      // Validate file buffer
      if (!fileBuffer || fileBuffer.length === 0) {
        throw new Error("File buffer is empty or invalid");
      }

      // Ensure we have a valid token
      const token = await this.getValidToken();
      console.log("Using access token for parsing");

      // Create form data for file upload
      const FormData = require("form-data");
      const formData = new FormData();
      formData.append("file", fileBuffer, {
        filename: filename,
        contentType: mimetype,
      });

      console.log(`Sending request to ${this.apiUrl}/parse-resume`);
      console.log(`Form data headers:`, formData.getHeaders());

      // Make the API call to parse the resume
      const response = await axios.post(`${this.apiUrl}/parse-resume`, formData, {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
          ...formData.getHeaders(),
        },
        timeout: 60000, // Increased to 60 seconds
        maxContentLength: 50 * 1024 * 1024, // 50MB max content length
        maxBodyLength: 50 * 1024 * 1024, // 50MB max body length
      });

      console.log("API response status:", response.status);
      console.log("API response data:", response.data);

      if (response.data && response.data.success) {
        console.log("Resume parsed successfully");
        console.log("Parsed data:", JSON.stringify(response.data.parsed_data, null, 2));

        return {
          success: true,
          filename: response.data.filename,
          parsedData: response.data.parsed_data,
        };
      } else {
        console.error("API returned unsuccessful response:", response.data);
        throw new Error(`Resume parsing failed: ${response.data?.detail || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Resume parsing failed:");
      console.error("Error message:", error.message);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Error headers:", error.response?.headers);

      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  /**
   * Test the API connection
   */
  async testConnection() {
    try {
      const authResult = await this.authenticate();
      return authResult;
    } catch (error) {
      console.error("Resume parser API test failed:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Create a singleton instance
const resumeParserService = new ResumeParserService();

module.exports = resumeParserService;
