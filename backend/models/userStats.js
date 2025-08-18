const mongoose = require("mongoose");

const userStatsSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  
  // Streak tracking
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastActivityDate: { type: Date },
  
  // Positive activity tracking
  consecutivePositiveActivities: { type: Number, default: 0 },
  maxConsecutivePositiveActivities: { type: Number, default: 0 },
  
  // Achievement counters
  totalActivities: { type: Number, default: 0 },
  totalPositiveActivities: { type: Number, default: 0 },
  totalNegativeActivities: { type: Number, default: 0 },
  totalPoints: { type: Number, default: 0 },
  
  // Goal-related stats
  goalsCompleted: { type: Number, default: 0 },
  goalsCreated: { type: Number, default: 0 },
  
  // Category-specific stats
  categoryStats: {
    Transportation: { type: Number, default: 0 },
    Energy: { type: Number, default: 0 },
    Waste: { type: Number, default: 0 },
    Food: { type: Number, default: 0 },
    Water: { type: Number, default: 0 },
    Shopping: { type: Number, default: 0 },
    Home: { type: Number, default: 0 },
    Work: { type: Number, default: 0 },
    Recreation: { type: Number, default: 0 },
    General: { type: Number, default: 0 }
  },
  
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model("UserStats", userStatsSchema);