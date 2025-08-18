const express = require("express");
const router = express.Router();
const Goal = require("../models/goal");

// Create a new goal
router.post("/goals", async (req, res) => {
  try {
    const { userId, targetPoints, endDate } = req.body;
    const goal = new Goal({ userId, targetPoints, endDate });
    await goal.save();
    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all goals for a user
router.get("/goals/:userId", async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.params.userId });
    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update progress (used when logging activities)
router.put("/goals/:id", async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ error: "Goal not found" });

    goal.currentPoints = req.body.currentPoints || goal.currentPoints;
    await goal.save();
    res.json(goal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
