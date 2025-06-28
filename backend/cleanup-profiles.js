const mongoose = require("mongoose");
const Profile = require("./src/models/Profile");

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/studieshq", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function cleanupProfiles() {
  try {
    console.log("Starting profile cleanup...");

    // Find all profiles
    const profiles = await Profile.find({});
    console.log(`Found ${profiles.length} profiles`);

    let updatedCount = 0;

    for (const profile of profiles) {
      let needsUpdate = false;

      // Check and clean identity proof
      if (profile.verificationDocuments?.identityProof) {
        if (
          profile.verificationDocuments.identityProof.type === "" ||
          profile.verificationDocuments.identityProof.type === " "
        ) {
          profile.verificationDocuments.identityProof.type = undefined;
          needsUpdate = true;
        }
        if (
          profile.verificationDocuments.identityProof.documentUrl === "" ||
          profile.verificationDocuments.identityProof.documentUrl === " "
        ) {
          profile.verificationDocuments.identityProof.documentUrl = undefined;
          needsUpdate = true;
        }
      }

      // Check and clean address proof
      if (profile.verificationDocuments?.addressProof) {
        if (
          profile.verificationDocuments.addressProof.type === "" ||
          profile.verificationDocuments.addressProof.type === " "
        ) {
          profile.verificationDocuments.addressProof.type = undefined;
          needsUpdate = true;
        }
        if (
          profile.verificationDocuments.addressProof.documentUrl === "" ||
          profile.verificationDocuments.addressProof.documentUrl === " "
        ) {
          profile.verificationDocuments.addressProof.documentUrl = undefined;
          needsUpdate = true;
        }
      }

      // Clean up incomplete experience entries
      if (profile.experience && profile.experience.length > 0) {
        const validExperience = profile.experience.filter((exp) => {
          // Remove experiences that don't have required fields
          return exp.title && exp.company && exp.from;
        });

        if (validExperience.length !== profile.experience.length) {
          profile.experience = validExperience;
          needsUpdate = true;
          console.log(`Cleaned incomplete experience entries for profile ${profile._id}`);
        }
      }

      // Clean up incomplete education entries
      if (profile.education && profile.education.length > 0) {
        const validEducation = profile.education.filter((edu) => {
          // Remove education entries that don't have required fields
          return edu.institution && edu.degree && edu.fieldOfStudy && edu.from;
        });

        if (validEducation.length !== profile.education.length) {
          profile.education = validEducation;
          needsUpdate = true;
          console.log(`Cleaned incomplete education entries for profile ${profile._id}`);
        }
      }

      if (needsUpdate) {
        try {
          await profile.save({ validateModifiedOnly: true });
          updatedCount++;
          console.log(`Updated profile ${profile._id}`);
        } catch (error) {
          console.error(`Failed to update profile ${profile._id}:`, error.message);
        }
      }
    }

    console.log(`Cleanup completed. Updated ${updatedCount} profiles.`);
    process.exit(0);
  } catch (error) {
    console.error("Cleanup failed:", error);
    process.exit(1);
  }
}

cleanupProfiles();
