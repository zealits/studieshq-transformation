const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Platform Settings Schema
const SettingsSchema = new Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  value: {
    type: Schema.Types.Mixed,
    required: true,
  },
  type: {
    type: String,
    enum: ["string", "number", "boolean", "object"],
    required: true,
  },
  description: {
    type: String,
  },
  category: {
    type: String,
    enum: ["general", "payment", "security", "email"],
    default: "general",
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
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
SettingsSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to get a setting value
SettingsSchema.statics.getSetting = async function (key, defaultValue = null) {
  const setting = await this.findOne({ key });
  return setting ? setting.value : defaultValue;
};

// Static method to set a setting value
SettingsSchema.statics.setSetting = async function (
  key,
  value,
  type,
  description = "",
  category = "general",
  updatedBy = null
) {
  const update = {
    value,
    type,
    description,
    category,
    updatedBy,
    updatedAt: Date.now(),
  };

  return this.findOneAndUpdate({ key }, update, { upsert: true, new: true, runValidators: true });
};

const Settings = mongoose.model("Settings", SettingsSchema);

module.exports = Settings;
