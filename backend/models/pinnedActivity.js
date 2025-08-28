const mongoose = require("mongoose");

const pinnedActivitySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  activityName: { type: String, required: true },
  points: { type: Number, required: true },
  category: { type: String, default: "General" },
  emoji: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("PinnedActivity", pinnedActivitySchema);