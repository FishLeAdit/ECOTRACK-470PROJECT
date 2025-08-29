// models/settings.js
const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  notificationTime: { 
    type: String, 
    default: "18:00",
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: props => `${props.value} is not a valid time format (HH:MM)`
    }
  },
  notificationsEnabled: { type: Boolean, default: true },
  lastNotificationDate: { type: Date }, // Track when we last sent a notification
  lastActivityCheckDate: { type: Date }, // Track when we last checked activities
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

settingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Settings", settingsSchema);