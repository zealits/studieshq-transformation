const Settings = require("../models/Settings");

/**
 * Initialize default platform settings
 */
const initializeSettings = async () => {
  try {
    console.log("Initializing platform settings...");

    // Define default settings
    const defaultSettings = [
      {
        key: "platformFee",
        value: 10,
        type: "number",
        description: "Platform fee percentage charged to both client and freelancer",
        category: "payment",
      },
      {
        key: "platformName",
        value: "StudiesHQ",
        type: "string",
        description: "Platform name",
        category: "general",
      },
      {
        key: "siteDescription",
        value: "Connecting freelancers with clients for successful projects",
        type: "string",
        description: "Platform description",
        category: "general",
      },
      {
        key: "supportEmail",
        value: "support@studieshq.com",
        type: "string",
        description: "Support email address",
        category: "general",
      },
      {
        key: "maxMilestones",
        value: 10,
        type: "number",
        description: "Maximum number of milestones per project",
        category: "general",
      },
      {
        key: "minWithdrawalAmount",
        value: 10,
        type: "number",
        description: "Minimum withdrawal amount in USD",
        category: "payment",
      },
      {
        key: "autoReleasePayment",
        value: false,
        type: "boolean",
        description: "Automatically release payments after milestone completion",
        category: "payment",
      },
      {
        key: "emailNotifications",
        value: true,
        type: "boolean",
        description: "Enable email notifications",
        category: "email",
      },
      {
        key: "maintenanceMode",
        value: false,
        type: "boolean",
        description: "Enable maintenance mode",
        category: "general",
      },
    ];

    // Initialize settings if they don't exist
    for (const setting of defaultSettings) {
      const existingSetting = await Settings.findOne({ key: setting.key });

      if (!existingSetting) {
        await Settings.setSetting(setting.key, setting.value, setting.type, setting.description, setting.category);
        console.log(`✓ Initialized setting: ${setting.key} = ${setting.value}`);
      } else {
        console.log(`✓ Setting already exists: ${setting.key} = ${existingSetting.value}`);
      }
    }

    console.log("Platform settings initialization completed");
  } catch (error) {
    console.error("Error initializing platform settings:", error);
  }
};

module.exports = initializeSettings;
