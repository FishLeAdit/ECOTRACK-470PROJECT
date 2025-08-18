const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  targetPoints: { type: Number, required: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  currentPoints: { type: Number, default: 0 },
  goalType: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
  isCompleted: { type: Boolean, default: false },
  completionDate: { type: Date },
  wasSuccessful: { type: Boolean },
  isArchived: { type: Boolean, default: false }
});

module.exports = mongoose.model("Goal", goalSchema);
