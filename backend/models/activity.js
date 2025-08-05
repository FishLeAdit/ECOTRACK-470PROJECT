const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  activityName: { type: String, required: true },
  type: { type: String, enum: ["Positive", "Negative"], required: true },
  points: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  category: { type: String, default: "General" }

});

module.exports = mongoose.model("Activity", activitySchema);
