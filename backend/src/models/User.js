const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// User Schema
const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    avatar: {
      type: String,
    },
    avatarSource: {
      type: String,
      enum: ["default", "linkedin", "manual"],
      default: "default",
    },
    resume: {
      filename: {
        type: String,
      },
      originalname: {
        type: String,
      },
      mimetype: {
        type: String,
      },
      size: {
        type: Number,
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
    // parsedResumeData: {
    //   name: {
    //     type: String,
    //   },
    //   phone: {
    //     type: String,
    //   },
    //   mail: {
    //     type: String,
    //   },
    //   location: {
    //     type: String,
    //   },
    //   social: {
    //     github: {
    //       type: String,
    //     },
    //     linkedin: {
    //       type: String,
    //     },
    //     portfolio: {
    //       type: String,
    //     },
    //   },
    //   education: [
    //     {
    //       name: {
    //         type: String,
    //       },
    //       qualification: {
    //         type: String,
    //       },
    //       category: {
    //         type: String,
    //       },
    //       start: {
    //         type: String,
    //       },
    //       end: {
    //         type: String,
    //       },
    //     },
    //   ],
    //   skills: [
    //     {
    //       type: String,
    //     },
    //   ],
    //   projects: [
    //     {
    //       title: {
    //         type: String,
    //       },
    //       description: {
    //         type: String,
    //       },
    //       project_skills: [
    //         {
    //           type: String,
    //         },
    //       ],
    //       project_link: {
    //         type: String,
    //       },
    //     },
    //   ],
    //   experience: [
    //     {
    //       company_name: {
    //         type: String,
    //       },
    //       designation: {
    //         type: String,
    //       },
    //       description: {
    //         type: String,
    //       },
    //       experiance_skills: [
    //         {
    //           type: String,
    //         },
    //       ],
    //       location: {
    //         type: String,
    //       },
    //       start: {
    //         type: String,
    //       },
    //       end: {
    //         type: String,
    //       },
    //     },
    //   ],
    //   certifications: [
    //     {
    //       type: String,
    //     },
    //   ],
    //   achievements: [
    //     {
    //       type: String,
    //     },
    //   ],
    //   total_experience_years: {
    //     type: Number,
    //   },
    // },
    // resumeParsedAt: {
    //   type: Date,
    // },
    role: {
      type: String,
      enum: ["client", "freelancer", "admin", "freelancer_company", "project_sponsor_company"],
      default: function () {
        // For company users, set role based on companyType
        if (this.userType === "company") {
          return this.companyType;
        }
        // For individual users, default to freelancer
        return "freelancer";
      },
    },
    userType: {
      type: String,
      enum: ["individual", "company"],
      default: "individual",
    },
    companyType: {
      type: String,
      default: null,
      validate: {
        validator: function (value) {
          // If userType is 'individual', companyType should be null or undefined
          if (this.userType === "individual") {
            return value === null || value === undefined || value === "";
          }
          // If userType is 'company', companyType must be one of the valid enum values
          if (this.userType === "company") {
            return value && ["freelancer_company", "project_sponsor_company"].includes(value);
          }
          return true;
        },
        message:
          "Company type is required for company users and must be either freelancer_company or project_sponsor_company",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    verificationDocuments: {
      identityProof: {
        type: {
          type: String,
          enum: ["Passport", "Driver's License", "National ID", "Other"],
        },
        status: {
          type: String,
          enum: ["pending", "verified", "rejected"],
          default: "pending",
        },
        uploadDate: Date,
        documentUrl: String,
      },
      addressProof: {
        type: {
          type: String,
          enum: ["Utility Bill", "Bank Statement", "Government Document", "Other"],
        },
        status: {
          type: String,
          enum: ["pending", "verified", "rejected"],
          default: "pending",
        },
        uploadDate: Date,
        documentUrl: String,
      },
    },
    status: {
      type: String,
      enum: ["active", "suspended", "pending"],
      default: "active",
    },
    verificationToken: String,
    verificationTokenExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    lastLogin: {
      type: Date,
    },
    firstLogin: {
      type: Boolean,
      default: true,
    },
    requirePasswordChange: {
      type: Boolean,
      default: false,
    },
    temporaryPassword: {
      type: String,
    },
    // Company-specific fields (only populated for companies)
    company: {
      businessName: {
        type: String,
      },
      registrationNumber: {
        type: String,
      },
      businessType: {
        type: String,
      },
      industry: {
        type: String,
      },
      address: {
        street: {
          type: String,
        },
        city: {
          type: String,
        },
        state: {
          type: String,
        },
        country: {
          type: String,
        },
        zipCode: {
          type: String,
        },
      },
      verificationStatus: {
        type: String,
        enum: ["pending", "verified", "rejected"],
        default: "pending",
      },
      documents: [
        {
          type: {
            type: String,
            enum: ["business_license", "tax_certificate", "incorporation_certificate", "other"],
          },
          url: {
            type: String,
          },
          uploadedAt: {
            type: Date,
            default: Date.now,
          },
          status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
          },
          verifiedAt: {
            type: Date,
          },
          rejectionReason: {
            type: String,
          },
        },
      ],
      taxId: {
        type: String,
      },
      website: {
        type: String,
      },
      phoneNumber: {
        type: String,
      },
      phone: {
        type: Schema.Types.Mixed,
        required: false,
        default: undefined,
        validate: {
          validator: function(v) {
            // Allow undefined, null, or valid phone object
            if (v === undefined || v === null) {
              return true;
            }
            if (typeof v === 'object' && v !== null) {
              // Validate phone object structure
              return true; // Accept any object structure
            }
            return false;
          },
          message: 'Phone must be an object or undefined/null'
        },
      },
      companySize: {
        type: String,
        validate: {
          validator: function (v) {
            // Allow null, undefined, or empty string
            if (!v || v === null || v === undefined || v === "") {
              return true;
            }
            // Validate non-empty strings against allowed values
            const validValues = ["1-10", "11-50", "51-200", "201-500", "500+"];
            return validValues.includes(v);
          },
          message: "Company size must be one of: 1-10, 11-50, 51-200, 201-500, 500+",
        },
        default: null,
      },
      description: {
        type: String,
      },
      logo: {
        type: String,
      },
      countrySpecificFields: {
        type: Map,
        of: Schema.Types.Mixed,
        default: {},
      },
    },
    // Company freelancer fields
    companyFreelancer: {
      companyId: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      companyName: {
        type: String,
      },
      role: {
        type: String,
        enum: ["member", "manager", "admin"],
        default: "member",
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
    },
    companyFreelancerName: {
      type: String,
    },
    candidateId: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Update the updatedAt field before saving
UserSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  
  // Remove companySize if it's empty/null to avoid validation errors
  // This ensures the field is truly optional
  if (this.company && (this.company.companySize === "" || this.company.companySize === null)) {
    delete this.company.companySize;
  }
  
  // Handle phone field - ensure it's never undefined (which causes casting errors)
  // If phone is undefined/null or empty, delete it completely
  if (this.company) {
    // Check if phone is undefined, null, or an empty/invalid object
    if (
      this.company.phone === undefined || 
      this.company.phone === null ||
      (typeof this.company.phone === 'object' && 
       this.company.phone !== null && 
       Object.keys(this.company.phone).length === 0)
    ) {
      // Delete the phone field completely to avoid casting errors
      delete this.company.phone;
    } else if (typeof this.company.phone === 'object' && this.company.phone !== null) {
      // Ensure phone object has required structure if it exists
      if (!this.company.phone.countryCode) {
        this.company.phone.countryCode = "+91";
      }
      if (this.company.phone.isVerified === undefined) {
        this.company.phone.isVerified = false;
      }
    }
  }
  
  next();
});

// Create User model
const User = mongoose.model("User", UserSchema);

module.exports = User;
