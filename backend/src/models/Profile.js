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
    type: String,
  },
  location: {
    type: String,
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
  skills: [String],

  // Freelancer specific fields
  hourlyRate: {
    type: Number,
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
  next();
});

// Create Profile model
const Profile = mongoose.model("Profile", ProfileSchema);

module.exports = Profile;
