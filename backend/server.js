// --- DEPENDENCIES ---
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// --- MODELS ---
const Activity = require('./models/activity');
const Goal = require('./models/goal');
const Badge = require('./models/badge');
const UserStats = require('./models/userStats');
const PinnedActivity = require('./models/pinnedActivity'); // Added from second file

// --- SERVICES ---
const BadgeService = require('./services/badgeService');

// --- APP INITIALIZATION & MIDDLEWARE ---
const app = express();
app.use(cors());
app.use(express.json());

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecotrack')
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// --- TEST & DEBUG ROUTES ---
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

app.get('/api/debug/activities', async (req, res) => {
  try {
    console.log('🔍 Debug: Checking database schema...');
    
    const activities = await Activity.find();
    const activitiesWithoutCategory = activities.filter(a => !a.category);
    const activitiesWithCategory = activities.filter(a => a.category);
    
    console.log(`📊 Total activities: ${activities.length}`);
    console.log(`📊 Activities without category: ${activitiesWithoutCategory.length}`);
    console.log(`📊 Activities with category: ${activitiesWithCategory.length}`);
    
    if (activitiesWithoutCategory.length > 0) {
      console.log('📝 Sample activities without category:', activitiesWithoutCategory.slice(0, 3));
    }
    
    res.json({
      totalActivities: activities.length,
      activitiesWithoutCategory: activitiesWithoutCategory.length,
      activitiesWithCategory: activitiesWithCategory.length,
      sampleWithoutCategory: activitiesWithoutCategory.slice(0, 3),
      sampleWithCategory: activitiesWithCategory.slice(0, 3)
    });
  } catch (err) {
    console.error('❌ Debug error:', err);
    res.status(500).json({ error: 'Debug failed', details: err.message });
  }
});

app.post('/api/update-categories', async (req, res) => {
  try {
    console.log('🔄 Updating activities without categories...');
    const updateResult = await Activity.updateMany(
      { category: { $exists: false } },
      { $set: { category: 'General' } }
    );
    console.log(`✅ Updated ${updateResult.modifiedCount} activities with 'General' category`);
    res.json({
      message: `Updated ${updateResult.modifiedCount} activities with 'General' category`,
      updatedCount: updateResult.modifiedCount
    });
  } catch (err) {
    console.error('❌ Error updating categories:', err);
    res.status(500).json({ error: 'Failed to update categories', details: err.message });
  }
});


// --- ACTIVITY ROUTES ---

// GET: list all activities for a user (sorted by latest)
app.get('/api/activities/:userId', async (req, res) => {
  try {
    console.log('📖 Fetching activities for user:', req.params.userId);
    const activities = await Activity.find({ userId: req.params.userId }).sort({ date: -1 });
    console.log(`Found ${activities.length} activities`);
    res.json(activities);
  } catch (err) {
    console.error('❌ Error fetching activities:', err);
    res.status(500).json({ error: 'Failed to fetch activities', details: err.message });
  }
});

// GET: list frequent activities for a user (more than 3 times in a day)
app.get('/api/activities/:userId/frequent', async (req, res) => {
  try {
    console.log('📊 Fetching frequent activities for user:', req.params.userId);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const frequentActivities = await Activity.aggregate([
      { $match: { userId: req.params.userId, date: { $gte: startOfDay, $lte: endOfDay } } },
      { $group: {
          _id: {
            activityName: "$activityName",
            category: "$category",
            points: "$points",
            type: "$type",
            emoji: "$emoji"
          },
          count: { $sum: 1 }
        }
      },
      { $match: { count: { $gt: 3 } } },
      { $project: {
          activityName: "$_id.activityName",
          category: "$_id.category",
          points: "$_id.points",
          type: "$_id.type",
          emoji: "$_id.emoji",
          count: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]);

    console.log(`Found ${frequentActivities.length} frequent activities today`);
    res.json(frequentActivities);
  } catch (err) {
    console.error('❌ Error fetching frequent activities:', err);
    res.status(500).json({ error: 'Failed to fetch frequent activities', details: err.message });
  }
});

// POST: add a new activity
app.post('/api/activities', async (req, res) => {
  try {
    // Merged to include 'emoji' from the second file
    const { userId, activityName, points, category, type, emoji } = req.body;
    if (!activityName || points === undefined || points === null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newActivity = new Activity({
      userId,
      activityName,
      points,
      category,
      type,
      emoji: emoji || '', // Ensure emoji has a value
      date: new Date()
    });
    await newActivity.save();

    // Check for new badges
    const newBadges = await BadgeService.checkAndAwardBadges(userId);
    res.status(201).json({ activity: newActivity, newBadges });
  } catch (err) {
    console.error('❌ Error creating activity:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE: remove an activity by ID
app.delete('/api/activities/:id', async (req, res) => {
  try {
    console.log('🗑️ Deleting activity:', req.params.id);
    const deletedActivity = await Activity.findByIdAndDelete(req.params.id);
    
    if (!deletedActivity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    
    console.log('✅ Activity deleted successfully');
    res.json({ message: 'Activity deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting activity:', err);
    res.status(500).json({ error: 'Failed to delete activity', details: err.message });
  }
});

// --- PINNED ACTIVITY ROUTES (from second file) ---

// GET: Pinned activities for a user
app.get('/api/pinned-activities/:userId', async (req, res) => {
  try {
    console.log('📌 Fetching pinned activities for user:', req.params.userId);
    const pinnedActivities = await PinnedActivity.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    console.log(`Found ${pinnedActivities.length} pinned activities`);
    res.json(pinnedActivities);
  } catch (err) {
    console.error('❌ Error fetching pinned activities:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST: Pin a new activity
app.post('/api/pinned-activities', async (req, res) => {
  try {
    const { userId, activityName, points, category, emoji } = req.body;
    if (!userId || !activityName || points === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingPin = await PinnedActivity.findOne({ userId, activityName });
    if (existingPin) {
      return res.status(400).json({ error: 'Activity already pinned' });
    }

    const newPinnedActivity = new PinnedActivity({
      userId,
      activityName,
      points,
      category: category,  // Remove the || 'General' override
      emoji: emoji || ''
    });
    await newPinnedActivity.save();
    console.log('📌 Pinned activity saved:', newPinnedActivity);
    res.status(201).json(newPinnedActivity);
  } catch (err) {
    console.error('❌ Error pinning activity:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE: Unpin an activity
app.delete('/api/pinned-activities/:userId/:activityName', async (req, res) => {
  try {
    const { userId, activityName } = req.params;
    const result = await PinnedActivity.findOneAndDelete({ userId, activityName });
    if (!result) {
        return res.status(404).json({ error: 'Pinned activity not found' });
    }
    console.log('📌 Unpinned activity:', { userId, activityName });
    res.json({ message: 'Activity unpinned successfully' });
  } catch (err) {
    console.error('❌ Error unpinning activity:', err);
    res.status(500).json({ error: err.message });
  }
});


// --- GOAL ROUTES (using robust implementation from first file) ---

// Helper function to refresh goals
const refreshGoalsAutomatically = async (userId) => {
  try {
    console.log(`🔄 Refreshing goals for user: ${userId}`);
    const goals = await Goal.find({ userId, isArchived: false });
    const now = new Date();
    
    for (const goal of goals) {
      const activities = await Activity.find({
        userId: goal.userId,
        date: { $gte: goal.startDate, $lt: now }
      });
      
      goal.currentPoints = activities.reduce((sum, act) => sum + act.points, 0);
      
      if (goal.currentPoints >= goal.targetPoints) {
        goal.isCompleted = true;
        goal.wasSuccessful = true;
        goal.completionDate = now;
        goal.isArchived = true;
      } else if (now > new Date(goal.endDate)) {
        goal.isCompleted = true;
        goal.wasSuccessful = false;
        goal.completionDate = now;
        goal.isArchived = true;
      }
      
      await goal.save();
    }
    console.log('✅ Goals refreshed successfully');
  } catch (err) {
    console.error('❌ Error in automatic goal refresh:', err);
  }
};

// POST: Create a new goal
app.post('/api/goals', async (req, res) => {
  try {
    console.log('🎯 Creating new goal:', req.body);
    const { userId, targetPoints, endDate, goalType } = req.body;
    
    if (!userId || !targetPoints || !endDate || !goalType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const goal = new Goal({ 
      userId, 
      targetPoints: parseInt(targetPoints), 
      endDate: new Date(endDate),
      goalType,
      currentPoints: 0,
      startDate: new Date()
    });
    
    await goal.save();
    const { newBadges } = await BadgeService.updateStatsOnGoalCreation(userId);
    console.log('✅ Goal created successfully with badges check');
    res.status(201).json({ goal, newBadges: newBadges || [] });
  } catch (err) {
    console.error('❌ Error creating goal:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET: All active goals for a user
app.get('/api/goals/:userId', async (req, res) => {
  try {
    console.log('📖 Fetching goals for user:', req.params.userId);
    await refreshGoalsAutomatically(req.params.userId);
    const goals = await Goal.find({ userId: req.params.userId, isArchived: false }).sort({ startDate: -1 });
    console.log(`Found ${goals.length} active goals`);
    res.json(goals);
  } catch (err) {
    console.error('❌ Error fetching goals:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET: Goal history for a user
app.get('/api/goals/:userId/history', async (req, res) => {
  try {
    console.log('📚 Fetching goal history for user:', req.params.userId);
    const goalHistory = await Goal.find({ userId: req.params.userId, isArchived: true }).sort({ completionDate: -1 });
    console.log(`Found ${goalHistory.length} archived goals`);
    res.json(goalHistory);
  } catch (err) {
    console.error('❌ Error fetching goal history:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT: Update a goal
app.put('/api/goals/:id', async (req, res) => {
  try {
    console.log('🔄 Updating goal:', req.params.id, req.body);
    const goal = await Goal.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    console.log('✅ Goal updated successfully:', goal);
    res.json(goal);
  } catch (err) {
    console.error('❌ Error updating goal:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE: a goal
app.delete('/api/goals/:id', async (req, res) => {
  try {
    console.log('🗑️ Deleting goal:', req.params.id);
    const deletedGoal = await Goal.findByIdAndDelete(req.params.id);
    if (!deletedGoal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    console.log('✅ Goal deleted successfully');
    res.json({ message: 'Goal deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting goal:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT: Archive a goal
app.put('/api/goals/:id/archive', async (req, res) => {
  try {
    console.log('📦 Archiving goal:', req.params.id);
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    goal.isArchived = true;
    await goal.save();
    res.json({ message: 'Goal archived successfully', goal });
  } catch (err) {
    console.error('❌ Error archiving goal:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- BADGE, STATS, & LEADERBOARD ROUTES ---

// GET: User badges
app.get('/api/badges/:userId', async (req, res) => {
  try {
    console.log('🏆 Fetching badges for user:', req.params.userId);
    const badges = await BadgeService.getUserBadges(req.params.userId);
    console.log(`Found ${badges.length} badges`);
    res.json(badges);
  } catch (err) {
    console.error('❌ Error fetching badges:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET: User stats
app.get('/api/stats/:userId', async (req, res) => {
  try {
    console.log('📊 Fetching stats for user:', req.params.userId);
    const userStats = await BadgeService.getUserStats(req.params.userId);
    console.log('Stats fetched successfully');
    res.json(userStats);
  } catch (err) {
    console.error('❌ Error fetching stats:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET: Badge leaderboard
app.get('/api/leaderboard/badges', async (req, res) => {
  try {
    console.log('🏅 Fetching badge leaderboard');
    const leaderboard = await BadgeService.getBadgeLeaderboard();
    res.json(leaderboard);
  } catch (err) {
    console.error('❌ Error fetching leaderboard:', err);
    res.status(500).json({ error: err.message });
  }
});


// --- ERROR HANDLING MIDDLEWARE ---
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error', 
    details: err.message 
  });
});

// --- SERVER STARTUP ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Ready to accept requests`);
});

// --- SCHEDULED TASKS ---
// Set up automatic goal refresh every hour for a default user
setInterval(async () => {
  try {
    // Note: You might want to refresh for all active users, not just a default one.
    await refreshGoalsAutomatically('default_user');
    console.log('🕐 Hourly goal refresh completed');
  } catch (error) {
    console.log('⚠️ Hourly goal refresh failed:', error.message);
  }
}, 60 * 60 * 1000); // 1 hour