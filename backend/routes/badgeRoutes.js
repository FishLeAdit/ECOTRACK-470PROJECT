const express = require('express');
const router = express.Router();
const BadgeService = require('../services/badgeService'); 

// Get user's badges
router.get('/:userId', async (req, res) => {
  try {
    const badges = await BadgeService.getUserBadges(req.params.userId);
    res.json(badges);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get recently earned badges
router.get('/:userId/recent', async (req, res) => {
  try {
    const badges = await Badge.find({ 
      userId: req.params.userId 
    })
    .sort({ earnedDate: -1 })
    .limit(3); // Get the 3 most recent badges
    
    res.json(badges);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user stats
router.get('/:userId/stats', async (req, res) => {
  try {
    const stats = await BadgeService.getUserStats(req.params.userId);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;