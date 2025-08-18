const express = require("express");
const router = express.Router();
const Activity = require("../models/activity");
const BadgeService = require ("../services/badgeService")

// GET all activities for a user
router.get("/:userId", async (req, res) => {
  try {
    const activities = await Activity.find({ userId: req.params.userId });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new activity
router.post("/", async (req, res) => {
  try {
    const newActivity = new Activity(req.body);
    await newActivity.save();
    const result = await BadgeService.updateUserStats(req.body.userId || 'default_user', newActivity);
    res.json({
      activity: newActivity,
      newBadges: result.newBadges,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE an activity
router.delete("/:id", async (req, res) => {
  try {
    await Activity.findByIdAndDelete(req.params.id);
    res.json({ message: "Activity deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
