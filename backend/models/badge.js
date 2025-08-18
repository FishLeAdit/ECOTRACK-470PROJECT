const mongoose = require("mongoose");

const badgeSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  badgeId: { type: String, required: true }, // Unique identifier for badge type
  badgeName: { type: String, required: true },
  badgeDescription: { type: String, required: true },
  badgeIcon: { type: String, required: true }, // Emoji or icon
  badgeCategory: { 
    type: String, 
    enum: ['streak', 'achievement', 'milestone', 'special'], 
    required: true 
  },
  badgeRarity: { 
    type: String, 
    enum: ['common', 'rare', 'epic', 'legendary'], 
    default: 'common' 
  },
  earnedDate: { type: Date, default: Date.now },
  relatedValue: { type: Number }, // Associated value (e.g., streak count, points earned)
  isVisible: { type: Boolean, default: true }
});

// Compound index to prevent duplicate badges
badgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

module.exports = mongoose.model("Badge", badgeSchema);