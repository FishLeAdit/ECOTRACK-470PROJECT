const mongoose = require('mongoose');

const userStatsSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  totalActivities: { type: Number, default: 0 },
  totalPoints: { type: Number, default: 0 },
  totalPositiveActivities: { type: Number, default: 0 },
  totalNegativeActivities: { type: Number, default: 0 },
  consecutivePositiveActivities: { type: Number, default: 0 },
  maxConsecutivePositiveActivities: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  goalsCreated: { type: Number, default: 0 },
  goalsCompleted: { type: Number, default: 0 },
  lastActivityDate: { type: Date },
  lastUpdated: { type: Date, default: Date.now },
  categoryStats: {
    General: { type: Number, default: 0 },
    Transportation: { type: Number, default: 0 },
    Energy: { type: Number, default: 0 },
    Waste: { type: Number, default: 0 },
    Food: { type: Number, default: 0 },
    Water: { type: Number, default: 0 },
    Shopping: { type: Number, default: 0 },
    Home: { type: Number, default: 0 },
    Work: { type: Number, default: 0 },
    Recreation: { type: Number, default: 0 }
  }
});

module.exports = mongoose.model('UserStats', userStatsSchema);