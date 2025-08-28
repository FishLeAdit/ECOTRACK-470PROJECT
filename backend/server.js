const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Activity = require('./models/activity');
const Goal = require('./models/goal');
const Badge = require('./models/badge');
const UserStats = require('./models/userStats');
const BadgeService = require('./services/badgeService');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB 
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecotrack')
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// GET: list all activities (sorted by latest)
app.get('/api/activities', async (req, res) => {
  try {
    console.log('📖 Fetching activities...');
    const activities = await Activity.find().sort({ date: -1 });
    console.log(`Found ${activities.length} activities`);
    
    activities.forEach((activity, index) => {
      console.log(`Activity ${index + 1}:`, {
        id: activity._id,
        name: activity.activityName,
        category: activity.category,
        hasCategory: !!activity.category
      });
    });
    
    res.json(activities);
  } catch (err) {
    console.error('Error fetching activities:', err);
    res.status(500).json({ error: 'Failed to fetch activities', details: err.message });
  }
});

// POST: add a new activity
app.post('/api/activities', async (req, res) => {
  try {
    const { userId, activityName, points, category, type } = req.body;
    if (!activityName || points === undefined || points === null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newActivity = new Activity({
      userId,
      activityName,
      points,
      category,
      type,
      date: new Date()
    });
    await newActivity.save();

    // Check for new badges
    const newBadges = await BadgeService.checkAndAwardBadges(userId);

    res.json({ activity: newActivity, newBadges });
  } catch (err) {
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
    res.status(500).json({ 
      error: 'Failed to delete activity', 
      details: err.message 
    });
  }
});

// Debug route: Check database schema and update existing activities
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

// Route to update existing activities without categories
app.post('/api/update-categories', async (req, res) => {
  try {
    console.log('🔄 Updating activities without categories...');
    
    const activitiesWithoutCategory = await Activity.find({ category: { $exists: false } });
    console.log(`📊 Found ${activitiesWithoutCategory.length} activities without categories`);
    
    if (activitiesWithoutCategory.length === 0) {
      return res.json({ message: 'All activities already have categories' });
    }
    
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

// Goal routes
// Create a new goal
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
    
    try {
      const { newBadges } = await BadgeService.updateStatsOnGoalCreation(userId);
      console.log('✅ Goal created successfully with badges check');
      res.status(201).json({ goal, newBadges: newBadges || [] });
    } catch (statsError) {
      console.log('⚠️ Stats update failed (non-critical):', statsError.message);
      res.status(201).json({ goal, newBadges: [] });
    }
  } catch (err) {
    console.error('❌ Error creating goal:', err);
    res.status(500).json({ error: err.message });
  }
});

// Function to refresh goals without creating new ones
const refreshGoalsAutomatically = async (userId = 'default_user') => {
  try {
    console.log(`🔄 Refreshing goals for user: ${userId}`);
    
    const goals = await Goal.find({ 
      userId: userId, 
      isArchived: false 
    });
    
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
        goal.isArchived = true; // Archive completed goals
      } else if (now > new Date(goal.endDate)) {
        goal.isCompleted = true;
        goal.wasSuccessful = false;
        goal.completionDate = now;
        goal.isArchived = true; // Archive expired goals
      }
      
      await goal.save();
    }
    
    console.log('✅ Goals refreshed successfully');
  } catch (err) {
    console.error('❌ Error in automatic goal refresh:', err);
  }
};

// Get all goals for a user
app.get('/api/goals/:userId', async (req, res) => {
  try {
    console.log('📖 Fetching goals for user:', req.params.userId);
    
    await refreshGoalsAutomatically(req.params.userId);
    
    const goals = await Goal.find({ 
      userId: req.params.userId,
      isArchived: false 
    }).sort({ startDate: -1 });
    console.log(`Found ${goals.length} active goals`);
    res.json(goals);
  } catch (err) {
    console.error('❌ Error fetching goals:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get goal history for a user
app.get('/api/goals/:userId/history', async (req, res) => {
  try {
    console.log('📚 Fetching goal history for user:', req.params.userId);
    
    const goalHistory = await Goal.find({ 
      userId: req.params.userId,
      isArchived: true 
    }).sort({ completionDate: -1 });
    
    console.log(`Found ${goalHistory.length} archived goals`);
    res.json(goalHistory);
  } catch (err) {
    console.error('❌ Error fetching goal history:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get user badges
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

// Get user stats
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

// Get badge leaderboard
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

// Update goal progress
app.put('/api/goals/:id', async (req, res) => {
  try {
    console.log('🔄 Updating goal progress:', req.params.id, req.body);
    const goal = await Goal.findById(req.params.id);
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    goal.currentPoints = req.body.currentPoints || goal.currentPoints;
    if (req.body.isCompleted) {
      goal.isCompleted = true;
      goal.wasSuccessful = req.body.wasSuccessful || false;
      goal.completionDate = req.body.completionDate || new Date();
    }
    
    await goal.save();
    
    console.log('✅ Goal updated successfully:', goal);
    res.json(goal);
  } catch (err) {
    console.error('❌ Error updating goal:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a goal
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

// Archive a goal
app.put('/api/goals/:id/archive', async (req, res) => {
  try {
    console.log('📦 Archiving goal:', req.params.id);
    const goal = await Goal.findById(req.params.id);
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    if (!goal.isCompleted) {
      return res.status(400).json({ error: 'Goal is not completed' });
    }

    goal.isArchived = true;
    goal.completionDate = goal.completionDate || new Date();
    goal.wasSuccessful = true;
    await goal.save();

    res.json({ message: 'Goal archived successfully', goal });
  } catch (err) {
    console.error('❌ Error archiving goal:', err);
    res.status(500).json({ error: err.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error', 
    details: err.message 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Ready to accept requests from frontend`);
  console.log(`🎯 Goal routes available:`);
  console.log(`   POST /api/goals`);
  console.log(`   GET /api/goals/:userId`);
  console.log(`   GET /api/goals/:userId/history`);
  console.log(`   PUT /api/goals/:id`);
  console.log(`   DELETE /api/goals/:id`);
  console.log(`   PUT /api/goals/:id/archive`);
  console.log(`📚 Goal history tracking enabled`);
});

// Set up automatic goal refresh every hour
setInterval(async () => {
  try {
    await refreshGoalsAutomatically('default_user');
    console.log('🕐 Hourly goal refresh completed');
  } catch (error) {
    console.log('⚠️ Hourly goal refresh failed:', error.message);
  }
}, 60 * 60 * 1000);

const badgeRoutes = require('./routes/badgeRoutes');
app.use('/api/badges', badgeRoutes);

// GET: list activities by user ID
app.get('/api/activities/:userId', async (req, res) => {
  try {
    const activities = await Activity.find({ userId: req.params.userId }).sort({ date: -1 });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activities', details: err.message });
  }
});