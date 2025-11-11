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
   * Analyze a GitHub profile using the API
   * @param {string} profileUrl - GitHub profile URL
   * @param {number} repoCount - Number of repositories to analyze
   */
  async analyzeGithubProfile(profileUrl, repoCount = 5) {
    try {
      if (!profileUrl || typeof profileUrl !== "string") {
        throw new Error("A valid GitHub profile URL is required for analysis");
      }

      const normalizedRepoCount = Number.isInteger(repoCount) && repoCount > 0 ? Math.min(repoCount, 50) : 5;

      console.log(`Analyzing GitHub profile: ${profileUrl} (top ${normalizedRepoCount} repositories)`);

      // Ensure we have a valid token
      const token = await this.getValidToken();
      console.log("Using access token for GitHub analysis");

      // Prepare API URL (uses www subdomain)
      let analysisApiUrl = this.apiUrl;
      if (!analysisApiUrl.includes("www.")) {
        analysisApiUrl = analysisApiUrl.replace("resumeparser", "www.resumeparser");
      }

      const payload = {
        profile_url: profileUrl,
        repo_count: normalizedRepoCount,
      };

      console.log(`Sending GitHub analysis request to ${analysisApiUrl}/analyze-github-profile`);

      const response = await axios.post(`${analysisApiUrl}/analyze-github-profile`, payload, {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      });

      console.log("GitHub analysis response status:", response.status);
      console.log("GitHub analysis response data:", response.data);

      if (response.data && response.data.success) {
        console.log("GitHub profile analyzed successfully");
        return {
          success: true,
          report: response.data.report || null,
          repoCount: normalizedRepoCount,
        };
      }

      console.error("GitHub analysis API returned unsuccessful response:", response.data);
      throw new Error(`GitHub analysis failed: ${response.data?.message || "Unknown error"}`);
    } catch (error) {
      console.error("GitHub profile analysis failed:");
      console.error("Error message:", error.message);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  /**
   * Transform user and profile data to the API format
   * @param {Object} user - User document
   * @param {Object} profile - Profile document
   */
  transformUserDataToApiFormat(user, profile) {
    // Format phone number
    let phone = "";
    if (profile?.phone) {
      if (typeof profile.phone === "string") {
        phone = profile.phone;
      } else if (profile.phone.number) {
        phone = `${profile.phone.countryCode || "+91"} ${profile.phone.number}`;
      }
    }

    // Format social links
    const social = {
      github: profile?.social?.github || "",
      linkedin: profile?.social?.linkedin || "",
      portfolio: profile?.website || profile?.social?.portfolio || "",
    };

    // Format education
    const education = [];
    if (profile?.education && Array.isArray(profile.education)) {
      profile.education.forEach((edu) => {
        education.push({
          name: edu.institution || "",
          qualification: `${edu.degree || ""} ${edu.fieldOfStudy || ""}`.trim() || "",
          category: this.getEducationCategory(edu.degree),
          start: edu.from ? new Date(edu.from).getFullYear().toString() : "",
          end: edu.current ? "Present" : edu.to ? new Date(edu.to).getFullYear().toString() : "",
        });
      });
    }

    // Format skills
    const skills = profile?.skills && Array.isArray(profile.skills) ? profile.skills : [];

    // Format projects (from portfolioItems)
    const projects = [];
    if (profile?.portfolioItems && Array.isArray(profile.portfolioItems)) {
      profile.portfolioItems.forEach((item) => {
        projects.push({
          title: item.title || "",
          description: item.description || "",
          project_skills: this.extractSkillsFromText(item.description || ""),
        });
      });
    }

    // Format experience
    const experience = [];
    if (profile?.experience && Array.isArray(profile.experience)) {
      profile.experience.forEach((exp) => {
        experience.push({
          company_name: exp.company || "",
          designation: exp.title || "",
          description: exp.description || "",
          experiance_skills: this.extractSkillsFromText(exp.description || ""),
          start: exp.from ? new Date(exp.from).getFullYear().toString() : "",
          end: exp.current ? "Present" : exp.to ? new Date(exp.to).getFullYear().toString() : "",
        });
      });
    }

    // Calculate total experience years
    let totalExperienceYears = 0;
    if (profile?.experience && Array.isArray(profile.experience)) {
      profile.experience.forEach((exp) => {
        const startDate = exp.from ? new Date(exp.from) : null;
        const endDate = exp.current ? new Date() : exp.to ? new Date(exp.to) : null;
        if (startDate && endDate) {
          const years = (endDate - startDate) / (1000 * 60 * 60 * 24 * 365.25);
          totalExperienceYears += Math.max(0, years);
        }
      });
    }
    totalExperienceYears = Math.round(totalExperienceYears * 100) / 100; // Round to 2 decimal places

    return {
      name: user.name || "",
      phone: phone,
      mail: user.email || "",
      social: social,
      education: education,
      skills: skills,
      projects: projects,
      experience: experience,
      certifications: profile?.certificates
        ? profile.certificates.map((cert) => cert.name || "").filter((name) => name)
        : [],
      achievements: [],
      total_experience_years: totalExperienceYears,
    };
  }

  /**
   * Get education category from degree
   */
  getEducationCategory(degree) {
    if (!degree) return "";
    const degreeLower = degree.toLowerCase();
    if (degreeLower.includes("phd") || degreeLower.includes("doctorate")) return "Doctorate";
    if (degreeLower.includes("master") || degreeLower.includes("m.") || degreeLower.includes("ms")) return "Graduate";
    if (
      degreeLower.includes("bachelor") ||
      degreeLower.includes("b.") ||
      degreeLower.includes("be") ||
      degreeLower.includes("btech")
    )
      return "Undergraduate";
    if (degreeLower.includes("diploma") || degreeLower.includes("certificate")) return "Diploma";
    return "Undergraduate";
  }

  /**
   * Extract skills from text (simple keyword matching)
   */
  extractSkillsFromText(text) {
    if (!text) return [];
    // Common tech skills keywords
    const skillKeywords = [
      "Python",
      "Java",
      "JavaScript",
      "React",
      "Node.js",
      "Django",
      "Flask",
      "FastAPI",
      "Machine Learning",
      "Deep Learning",
      "NLP",
      "Computer Vision",
      "TensorFlow",
      "PyTorch",
      "Docker",
      "AWS",
      "Azure",
      "MongoDB",
      "PostgreSQL",
      "MySQL",
    ];
    const foundSkills = [];
    const textLower = text.toLowerCase();
    skillKeywords.forEach((skill) => {
      if (textLower.includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    });
    return foundSkills;
  }

  /**
   * Register a candidate in the resume parser API
   * @param {Object} user - User document
   * @param {Object} profile - Profile document
   */
  async registerCandidate(user, profile) {
    try {
      console.log(`Registering candidate: ${user.name} (${user.email})`);

      // Ensure we have a valid token
      const token = await this.getValidToken();

      // Transform user/profile data to API format
      const candidateData = this.transformUserDataToApiFormat(user, profile);

      console.log("Candidate data to register:", JSON.stringify(candidateData, null, 2));

      // Make the API call to register candidate
      // Use www.resumeparser.aiiventure.com for candidate registration
      let registerApiUrl = this.apiUrl;
      if (!registerApiUrl.includes("www.")) {
        registerApiUrl = registerApiUrl.replace("resumeparser", "www.resumeparser");
      }
      const response = await axios.post(`${registerApiUrl}/register-json`, candidateData, {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      });

      console.log("Register candidate API response status:", response.status);
      console.log("Register candidate API response data:", response.data);

      if (response.data && response.data.success) {
        console.log("Candidate registered successfully");
        console.log("Candidate ID:", response.data.candidate_id);

        return {
          success: true,
          candidateId: response.data.candidate_id,
          vectorIds: response.data.vector_ids,
          message: response.data.message,
        };
      } else {
        console.error("API returned unsuccessful response:", response.data);
        throw new Error(`Candidate registration failed: ${response.data?.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Candidate registration failed:");
      console.error("Error message:", error.message);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  /**
   * Update a candidate in the resume parser API
   * @param {string} candidateId - The candidate ID from the API
   * @param {Object} user - User document
   * @param {Object} profile - Profile document
   */
  async updateCandidate(candidateId, user, profile) {
    try {
      console.log(`Updating candidate: ${candidateId} (${user.name})`);

      // Ensure we have a valid token
      const token = await this.getValidToken();

      // Transform user/profile data to API format
      const candidateData = this.transformUserDataToApiFormat(user, profile);

      console.log("Candidate data to update:", JSON.stringify(candidateData, null, 2));

      // Make the API call to update candidate
      // Use www.resumeparser.aiiventure.com for candidate updates
      let updateApiUrl = this.apiUrl;
      if (!updateApiUrl.includes("www.")) {
        updateApiUrl = updateApiUrl.replace("resumeparser", "www.resumeparser");
      }
      const response = await axios.put(`${updateApiUrl}/candidate/${candidateId}`, candidateData, {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      });

      console.log("Update candidate API response status:", response.status);
      console.log("Update candidate API response data:", response.data);

      if (response.data && response.data.success) {
        console.log("Candidate updated successfully");

        return {
          success: true,
          candidateId: response.data.candidate_id,
          vectorIds: response.data.vector_ids,
          message: response.data.message,
        };
      } else {
        console.error("API returned unsuccessful response:", response.data);
        throw new Error(`Candidate update failed: ${response.data?.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Candidate update failed:");
      console.error("Error message:", error.message);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  /**
   * Register a project in the resume parser API
   * @param {string} projectDescription - Project description
   * @param {Array<string>} projectSkills - Array of project skills
   * @param {string} projectHeading - Project heading/title
   * @param {Date|string} applicationDeadline - Application deadline (Date object or ISO string)
   */
  async registerProject(projectDescription, projectSkills, projectHeading = null, applicationDeadline = null) {
    try {
      console.log(`Registering project with description: ${projectDescription.substring(0, 50)}...`);

      // Ensure we have a valid token
      const token = await this.getValidToken();

      // Format deadline to ISO 8601 string if provided
      let formattedDeadline = null;
      if (applicationDeadline) {
        if (applicationDeadline instanceof Date) {
          formattedDeadline = applicationDeadline.toISOString();
        } else if (typeof applicationDeadline === "string") {
          // If it's already a string, try to parse and format it
          const date = new Date(applicationDeadline);
          if (!isNaN(date.getTime())) {
            formattedDeadline = date.toISOString();
          } else {
            formattedDeadline = applicationDeadline; // Use as-is if parsing fails
          }
        }
      }

      // Prepare project data
      const projectData = {
        project_description: projectDescription,
        project_skills: projectSkills || [],
      };

      // Add optional fields if provided
      if (projectHeading) {
        projectData.project_heading = projectHeading;
      }
      if (formattedDeadline) {
        projectData.application_deadline = formattedDeadline;
      }

      console.log("Project data to register:", JSON.stringify(projectData, null, 2));

      // Make the API call to register project
      const response = await axios.post(`${this.apiUrl}/register-project`, projectData, {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      });

      console.log("Register project API response status:", response.status);
      console.log("Register project API response data:", response.data);

      if (response.data && response.data.success) {
        console.log("Project registered successfully");
        console.log("Project ID:", response.data.project_id);

        return {
          success: true,
          projectId: response.data.project_id,
          vectorIds: response.data.vector_ids,
          message: response.data.message,
        };
      } else {
        console.error("API returned unsuccessful response:", response.data);
        throw new Error(`Project registration failed: ${response.data?.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Project registration failed:");
      console.error("Error message:", error.message);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  /**
   * Get relevant projects for a candidate
   * @param {string} candidateId - The candidate ID from the API
   * @param {number} topK - Number of top projects to return (default: 100)
   */
  async getRelevantProjects(candidateId, topK = 100) {
    try {
      console.log(`Fetching relevant projects for candidate: ${candidateId} (top_k: ${topK})`);

      // Ensure we have a valid token
      const token = await this.getValidToken();

      // Make the API call to get relevant projects
      const response = await axios.get(`${this.apiUrl}/candidate/${candidateId}/relevant-projects`, {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          top_k: topK,
        },
        timeout: 30000,
      });

      console.log("Get relevant projects API response status:", response.status);
      console.log("Get relevant projects API response data:", response.data);

      if (response.data && response.data.success) {
        console.log("Relevant projects fetched successfully");
        console.log(`Total projects matched: ${response.data.total_projects_matched}`);
        console.log(`Valid projects: ${response.data.total_valid_projects}`);

        return {
          success: true,
          candidateId: response.data.candidate_id,
          candidateName: response.data.candidate_name,
          totalProjectsMatched: response.data.total_projects_matched,
          totalValidProjects: response.data.total_valid_projects,
          projects: response.data.projects || [],
        };
      } else {
        console.error("API returned unsuccessful response:", response.data);
        throw new Error(`Failed to fetch relevant projects: ${response.data?.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Get relevant projects failed:");
      console.error("Error message:", error.message);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  /**
   * Get ranked candidates for a project
   * @param {string} projectId - The project ID from the API
   * @param {number} topK - Number of top candidates to return (default: 100)
   * @param {Object} filters - Optional filters (has_leadership, highest_education, seniority_level)
   */
  async getRankedCandidates(projectId, topK = 100, filters = {}) {
    try {
      console.log(`Fetching ranked candidates for project: ${projectId} (top_k: ${topK})`);

      // Ensure we have a valid token
      const token = await this.getValidToken();

      // Prepare request data
      const requestData = {
        project_id: projectId,
        top_k: topK,
        filters: {
          has_leadership: filters.has_leadership || null,
          highest_education: filters.highest_education || null,
          seniority_level: filters.seniority_level || null,
        },
      };

      console.log("Request data:", JSON.stringify(requestData, null, 2));

      // Make the API call to get ranked candidates
      const response = await axios.post(`${this.apiUrl}/get-ranked-candidates`, requestData, {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      });

      console.log("Get ranked candidates API response status:", response.status);
      console.log("Get ranked candidates API response data:", response.data);

      if (response.data && response.data.success) {
        console.log("Ranked candidates fetched successfully");
        console.log(`Total candidates returned: ${response.data.combined_ranked_results?.length || 0}`);

        return {
          success: true,
          projectId: response.data.project_id,
          projectDescription: response.data.project_description,
          requiredSkills: response.data.required_skills || [],
          filtersApplied: response.data.filters_applied || {},
          topK: response.data.top_k,
          resultsCount: response.data.results_count || {},
          rankedCandidates: response.data.combined_ranked_results || [],
        };
      } else {
        console.error("API returned unsuccessful response:", response.data);
        throw new Error(`Failed to fetch ranked candidates: ${response.data?.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Get ranked candidates failed:");
      console.error("Error message:", error.message);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

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
