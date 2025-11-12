const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Education Schema
const EducationSchema = new Schema({
  institution: {
    type: String,
    required: true,
  },
  degree: {
    type: String,
    required: true,
  },
  fieldOfStudy: {
    type: String,
    required: true,
  },
  from: {
    type: Date,
    required: true,
  },
  to: {
    type: Date,
  },
  current: {
    type: Boolean,
    default: false,
  },
  description: {
    type: String,
  },
});

// Experience Schema
const ExperienceSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  company: {
    type: String,
    required: true,
  },
  location: {
    type: String,
  },
  from: {
    type: Date,
    required: true,
  },
  to: {
    type: Date,
  },
  current: {
    type: Boolean,
    default: false,
  },
  description: {
    type: String,
  },
});

// GitHub analysis schemas
const GithubLanguageSchema = new Schema(
  {
    language: String,
    percentage: Number,
  },
  { _id: false }
);

const GithubRepositoriesSummarySchema = new Schema(
  {
    totalRepositoriesAnalyzed: Number,
    totalUserRepositories: Number,
    totalStarsAnalyzed: Number,
    totalForksAnalyzed: Number,
    primaryLanguage: String,
    note: String,
    languageOverview: [GithubLanguageSchema],
  },
  { _id: false }
);

const GithubProfileInfoSchema = new Schema(
  {
    username: String,
    name: String,
    bio: String,
    company: String,
    location: String,
    email: String,
    blog: String,
    twitterUsername: String,
    avatarUrl: String,
    profileUrl: String,
    followers: Number,
    following: Number,
    publicRepos: Number,
    publicGists: Number,
    createdAt: Date,
    updatedAt: Date,
  },
  { _id: false }
);

const GithubAnalysisSchema = new Schema(
  {
    profileUrl: String,
    repoCount: {
      type: Number,
      default: 5,
    },
    analyzedAt: Date,
    profileInfo: {
      type: GithubProfileInfoSchema,
      default: null,
    },
    repositoriesSummary: {
      type: GithubRepositoriesSummarySchema,
      default: null,
    },
  },
  { _id: false }
);

// Verification Documents Schema
const VerificationDocumentSchema = new Schema({
  type: {
    type: String,
    required: false, // Made optional to allow incomplete documents
    validate: {
      validator: function (v) {
        // Allow null, undefined, or empty/whitespace string
        if (!v || typeof v !== "string" || v.trim() === "") {
          return true;
        }
        // Validate non-empty strings against allowed values
        const validValues = [
          "electricity_bill",
          "gas_bill",
          "water_bill",
          "bank_statement",
          "rent_agreement",
          "passport",
          "driving_license",
          "national_id",
          "aadhar_card",
          "pan_card",
        ];
        return validValues.includes(v.trim());
      },
      message: "Invalid document type provided",
    },
  },
  documentUrl: {
    type: String,
    required: false, // Made optional to allow incomplete documents
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  verifiedAt: {
    type: Date,
  },
  rejectionReason: {
    type: String,
  },
});

// Profile Schema
const ProfileSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  bio: {
    type: String,
  },
  phone: {
    countryCode: {
      type: String,
      default: "+91",
    },
    number: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
    },
  },
  address: {
    line1: {
      type: String,
    },
    line2: {
      type: String,
    },
    country: {
      type: String,
    },
    countryCode: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    stateCode: {
      type: String,
    },
    postalCode: {
      type: String,
    },
  },
  website: {
    type: String,
  },
  social: {
    twitter: {
      type: String,
    },
    facebook: {
      type: String,
    },
    linkedin: {
      type: String,
    },
    instagram: {
      type: String,
    },
    github: {
      type: String,
    },
  },
  // LinkedIn OAuth verification
  linkedinVerification: {
    isVerified: {
      type: Boolean,
      default: false,
    },
    linkedinId: {
      type: String, // LinkedIn 'sub' identifier
    },
    verifiedAt: {
      type: Date,
    },
    profileData: {
      name: String,
      givenName: String,
      familyName: String,
      email: String,
      emailVerified: Boolean,
      picture: String,
      locale: String,
    },
  },
  skills: [String],

  githubAnalysis: {
    type: GithubAnalysisSchema,
    default: null,
  },

  // Freelancer specific fields
  hourlyRate: {
    min: {
      type: Number,
      default: 0,
    },
    max: {
      type: Number,
      default: 0,
    },
  },
  title: {
    type: String,
  },
  availability: {
    type: String,
    enum: ["Full-time", "Part-time", "Not Available", "As Needed"],
  },
  education: [EducationSchema],
  experience: [ExperienceSchema],
  portfolioItems: [
    {
      title: String,
      description: String,
      imageUrl: String,
      projectUrl: String,
    },
  ],
  languages: [
    {
      language: String,
      proficiency: {
        type: String,
        enum: ["Basic", "Conversational", "Fluent", "Native"],
      },
    },
  ],
  certificates: [
    {
      name: String,
      issuer: String,
      date: Date,
      url: String,
    },
  ],

  // Test score
  testScore: {
    score: {
      type: Number,
      default: null,
    },
    maxScore: {
      type: Number,
      default: null,
    },
    breakdown: {
      mcq: {
        type: Number,
        default: null,
      },
      theory: {
        type: Number,
        default: null,
      },
    },
    evaluatedAt: {
      type: Date,
      default: null,
    },
  },

  // Client specific fields
  company: {
    type: String,
  },
  industry: {
    type: String,
  },
  companySize: {
    type: String,
  },
  companyWebsite: {
    type: String,
  },
  itinEin: {
    type: String,
  },

  // Verification status
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationStatus: {
    type: String,
    enum: ["pending", "verified", "rejected"],
    default: "pending",
  },
  verificationDate: {
    type: Date,
  },

  // Verification Documents
  verificationDocuments: {
    addressProof: VerificationDocumentSchema,
    identityProof: VerificationDocumentSchema,
  },

  // Common fields
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
ProfileSchema.pre("save", function (next) {
  this.updatedAt = Date.now();

  // Clean up empty strings in verification documents to prevent validation errors
  if (this.verificationDocuments) {
    if (this.verificationDocuments.identityProof) {
      // Clean up type field
      if (
        this.verificationDocuments.identityProof.type === "" ||
        this.verificationDocuments.identityProof.type === " " ||
        (typeof this.verificationDocuments.identityProof.type === "string" &&
          this.verificationDocuments.identityProof.type.trim() === "")
      ) {
        this.verificationDocuments.identityProof.type = undefined;
      }
      // Clean up documentUrl field
      if (
        this.verificationDocuments.identityProof.documentUrl === "" ||
        this.verificationDocuments.identityProof.documentUrl === " " ||
        (typeof this.verificationDocuments.identityProof.documentUrl === "string" &&
          this.verificationDocuments.identityProof.documentUrl.trim() === "")
      ) {
        this.verificationDocuments.identityProof.documentUrl = undefined;
      }
    }
    if (this.verificationDocuments.addressProof) {
      // Clean up type field
      if (
        this.verificationDocuments.addressProof.type === "" ||
        this.verificationDocuments.addressProof.type === " " ||
        (typeof this.verificationDocuments.addressProof.type === "string" &&
          this.verificationDocuments.addressProof.type.trim() === "")
      ) {
        this.verificationDocuments.addressProof.type = undefined;
      }
      // Clean up documentUrl field
      if (
        this.verificationDocuments.addressProof.documentUrl === "" ||
        this.verificationDocuments.addressProof.documentUrl === " " ||
        (typeof this.verificationDocuments.addressProof.documentUrl === "string" &&
          this.verificationDocuments.addressProof.documentUrl.trim() === "")
      ) {
        this.verificationDocuments.addressProof.documentUrl = undefined;
      }
    }
  }

  next();
});

// Add a method to check if all documents are verified
ProfileSchema.methods.checkVerificationStatus = function () {
  const addressProof = this.verificationDocuments?.addressProof;
  const identityProof = this.verificationDocuments?.identityProof;

  if (addressProof?.status === "approved" && identityProof?.status === "approved") {
    this.isVerified = true;
    this.verificationStatus = "verified";
    this.verificationDate = new Date();
  } else {
    this.isVerified = false;
    this.verificationStatus = "pending";
  }
};

// Create Profile model
const Profile = mongoose.model("Profile", ProfileSchema);

module.exports = Profile;
