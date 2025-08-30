// --- DEPENDENCIES ---
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const GeminiService = require('./services/geminiService');

// --- MODELS ---
const Activity = require('./models/activity');
const Goal = require('./models/goal');
const Badge = require('./models/badge');
const UserStats = require('./models/userStats');
const PinnedActivity = require('./models/pinnedActivity'); // Added from second file
const Settings = require('./models/settings');

// --- SERVICES ---
const BadgeService = require('./services/badgeService');

// --- CARBON EMISSION FACTORS ---
// Carbon emission factors (kg CO2e per activity)
const CARBON_EMISSION_FACTORS = {
  // Transportation
  "Walked instead of driving": -0.2, // Negative because it saves emissions
  "Used Bicycle": -0.15,
  "Used Public Transport": -0.1,
  "Drove Car Alone": 0.24, // kg CO2e per km (average car)
  "Took Short Flight (<500km)": 0.12, // kg CO2e per km
  
  // Energy
  "Reduced Electricity Usage": -0.05, // per kWh saved
  "Left Lights/AC On": 0.1, // per hour
  
  // Waste
  "Recycled Waste": -0.1,
  "Composted Kitchen Waste": -0.05,
  "Used Plastic Bags": 0.02,
  
  // Food
  "Bought Local Produce": -0.1,
  "Wasted Food": 0.5, // per kg of food wasted
  
  // Water
  "Used Reusable Bottle": -0.02,
  "Used Disposable Bottles": 0.01,
  
  // Default values for categories
  "default": {
    "Transportation": 0.1,
    "Energy": 0.05,
    "Waste": 0.03,
    "Food": 0.08,
    "Water": 0.01,
    "Shopping": 0.02,
    "Home": 0.04,
    "Work": 0.03,
    "Recreation": 0.02,
    "General": 0.05
  }
};

// Helper function to estimate carbon emissions for an activity
function estimateCarbonEmission(activity) {
  const activityName = activity.activityName;
  
  // Check for exact matches first
  if (CARBON_EMISSION_FACTORS[activityName] !== undefined) {
    return CARBON_EMISSION_FACTORS[activityName];
  }
  
  // Use category-based defaults
  const category = activity.category || 'General';
  if (CARBON_EMISSION_FACTORS.default[category] !== undefined) {
    // For positive activities, use negative emissions (savings)
    return activity.points > 0 
      ? -CARBON_EMISSION_FACTORS.default[category] 
      : CARBON_EMISSION_FACTORS.default[category];
  }
  
  // Final fallback
  return activity.points > 0 ? -0.05 : 0.05;
}

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
// POST: add a new activity
app.post('/api/activities', async (req, res) => {
  try {
    console.log('➕ Adding new activity:', req.body);
    const { userId, activityName, points, category, type, emoji } = req.body;
    if (!activityName || points === undefined || points === null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const carbonEmission = estimateCarbonEmission({
      activityName,
      points,
      category: category || 'General',
      type
    });

    const newActivity = new Activity({
      userId,
      activityName,
      points,
      category: category || 'General',
      type,
      emoji: emoji || '',
      carbonEmission, 
      date: new Date()
    });
    
    console.log('💾 Saving activity to database...');
    await newActivity.save();
    console.log('✅ Activity saved successfully');

    // Update user stats and check for new badges
    console.log('🔄 Updating user stats...');
    const { userStats, newBadges } = await BadgeService.updateUserStats(userId, newActivity);
    console.log(`🎯 New badges found: ${newBadges.length}`);
    
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
    
    // Update stats and check for badges on goal creation
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

// --- BADGE ROUTES ---

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

app.get('/api/recommendations/:userId', async (req, res) => {
  try {
    console.log('🤖 Fetching Gemini recommendations for user:', req.params.userId);
    const recommendations = await GeminiService.generateRecommendations(req.params.userId);
    res.json(recommendations);
  } catch (err) {
    console.error('❌ Error fetching recommendations:', err);
    res.status(500).json({ error: 'Failed to generate recommendations', details: err.message });
  }
});

app.get('/api/recommendations/:userId/cache-status', async (req, res) => {
   try {
    const cacheStatus = GeminiService.getCacheStatus(req.params.userId);
    res.json(cacheStatus);
  } catch (err) {
    console.error('❌ Error checking cache status:', err);
    res.status(500).json({ error: 'Failed to check cache status', details: err.message });
  }
});

// Add this route to manually refresh recommendations
app.post('/api/recommendations/:userId/refresh', async (req, res) => {
  try {
    // Clear the cache to force a fresh API call
    GeminiService.clearCacheForUser(req.params.userId);
    
    // Generate new recommendations
    const recommendations = await GeminiService.generateRecommendations(req.params.userId);
    
    res.json({
      message: 'Recommendations refreshed successfully',
      recommendations
    });
  } catch (err) {
    console.error('❌ Error refreshing recommendations:', err);
    res.status(500).json({ error: 'Failed to refresh recommendations', details: err.message });
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

// User Settings
app.get('/api/settings/:userId', async (req, res) => {
  try {
    console.log('⚙️ Fetching settings for user:', req.params.userId);
    let settings = await Settings.findOne({ userId: req.params.userId });
    
    if (!settings) {
      // Create default settings if they don't exist
      settings = new Settings({ userId: req.params.userId });
      await settings.save();
      console.log('✅ Created default settings for user');
    }
    
    res.json(settings);
  } catch (err) {
    console.error('❌ Error fetching settings:', err);
    res.status(500).json({ error: 'Failed to fetch settings', details: err.message });
  }
});

// PUT: Update user settings
app.put('/api/settings/:userId', async (req, res) => {
  try {
    console.log('⚙️ Updating settings for user:', req.params.userId);
    const { notificationTime, notificationsEnabled } = req.body;
    
    const settings = await Settings.findOneAndUpdate(
      { userId: req.params.userId },
      { 
        notificationTime: notificationTime || "18:00",
        notificationsEnabled: notificationsEnabled !== undefined ? notificationsEnabled : true
      },
      { new: true, upsert: true }
    );
    
    console.log('✅ Settings updated successfully');
    res.json(settings);
  } catch (err) {
    console.error('❌ Error updating settings:', err);
    res.status(500).json({ error: 'Failed to update settings', details: err.message });
  }
});

// DELETE: Reset all user data
app.delete('/api/reset-data/:userId', async (req, res) => {
  try {
    console.log('🔄 Resetting all data for user:', req.params.userId);
    const userId = req.params.userId;
    
    // Delete all user data in parallel
    await Promise.all([
      Activity.deleteMany({ userId }),
      Goal.deleteMany({ userId }),
      Badge.deleteMany({ userId }),
      UserStats.deleteMany({ userId }),
      PinnedActivity.deleteMany({ userId }),
      Settings.deleteMany({ userId })
    ]);
    
    console.log('✅ All user data reset successfully');
    res.json({ message: 'All user data has been reset successfully' });
  } catch (err) {
    console.error('❌ Error resetting user data:', err);
    res.status(500).json({ error: 'Failed to reset user data', details: err.message });
  }
});

// Notification Scheduler

const checkAndSendNotifications = async () => {
  try {
    console.log('⏰ Checking for notifications to send...');
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // Get HH:MM
    
    // Find all users with notifications enabled and matching time
    const usersToNotify = await Settings.find({
      notificationsEnabled: true,
      notificationTime: currentTime
    });
    
    console.log(`📨 Found ${usersToNotify.length} users to notify at ${currentTime}`);
    
    for (const settings of usersToNotify) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Check if we already sent a notification today
      if (settings.lastNotificationDate && 
          new Date(settings.lastNotificationDate).toDateString() === today.toDateString()) {
        console.log(`✅ Already sent notification to user ${settings.userId} today`);
        continue;
      }
      
      // Check yesterday's activities (to see if user was active yesterday)
      const yesterdaysActivities = await Activity.countDocuments({
        userId: settings.userId,
        date: { 
          $gte: yesterday,
          $lt: today
        }
      });
      
      // Check today's activities
      const todaysActivities = await Activity.countDocuments({
        userId: settings.userId,
        date: { $gte: today }
      });
      
      let notificationMessage = '';
      
      if (yesterdaysActivities > 0 && todaysActivities === 0) {
        // User was active yesterday but not today
        notificationMessage = `Remember to add your activities for today! You were doing great yesterday with ${yesterdaysActivities} activities.`;
      } else if (yesterdaysActivities === 0 && todaysActivities === 0) {
        // User hasn't been active recently
        notificationMessage = "Don't forget to track your eco-activities today! Every small action counts 🌱";
      } else if (todaysActivities > 0) {
        // User has been active today - remind for tomorrow
        notificationMessage = "Great job tracking your activities today! Remember to add your activities tomorrow too 🎉";
      }
      
      if (notificationMessage) {
        console.log(`💡 Notification for user ${settings.userId}: ${notificationMessage}`);
        
        // Update last notification date
        await Settings.findByIdAndUpdate(settings._id, {
          lastNotificationDate: now
        });
        
        // In a real app, send push notification or store for frontend to display
        // For now, we'll store it in a simple in-memory store for the frontend to fetch
        userNotifications.set(settings.userId, {
          message: notificationMessage,
          timestamp: now,
          read: false
        });
      }
    }
  } catch (err) {
    console.error('❌ Error in notification scheduler:', err);
  }
};

// Simple in-memory store for notifications
const userNotifications = new Map();

// API endpoint to get notifications for a user
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const notification = userNotifications.get(userId);
    
    if (notification && !notification.read) {
      // Mark as read when fetched
      notification.read = true;
      res.json(notification);
    } else {
      res.json(null);
    }
  } catch (err) {
    console.error('❌ Error fetching notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications', details: err.message });
  }
});

// GET: Total carbon emissions for a user
app.get('/api/carbon/total/:userId', async (req, res) => {
  try {
    const activities = await Activity.find({ userId: req.params.userId });
    const totalCarbon = activities.reduce((sum, activity) => sum + activity.carbonEmission, 0);
    res.json({ totalCarbon: parseFloat(totalCarbon.toFixed(2)) });
  } catch (err) {
    console.error('❌ Error fetching total carbon:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET: Daily carbon emissions for a user
app.get('/api/carbon/daily/:userId', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activities = await Activity.find({ 
      userId: req.params.userId,
      date: { $gte: today }
    });
    
    const dailyCarbon = activities.reduce((sum, activity) => sum + activity.carbonEmission, 0);
    res.json({ dailyCarbon: parseFloat(dailyCarbon.toFixed(2)) });
  } catch (err) {
    console.error('❌ Error fetching daily carbon:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET: Carbon emission history for charts
app.get('/api/carbon/history/:userId', async (req, res) => {
  try {
    const activities = await Activity.find({ userId: req.params.userId }).sort({ date: 1 });
    
    // Group by day
    const dailyData = {};
    activities.forEach(activity => {
      const dateStr = activity.date.toISOString().split('T')[0];
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = 0;
      }
      dailyData[dateStr] += activity.carbonEmission;
    });
    
    // Format for chart
    const chartData = Object.entries(dailyData).map(([date, carbon]) => ({
      date,
      carbon: parseFloat(carbon.toFixed(2))
    }));
    
    res.json(chartData);
  } catch (err) {
    console.error('❌ Error fetching carbon history:', err);
    res.status(500).json({ error: err.message });
  }
});

// Schedule notification checks every minute
setInterval(checkAndSendNotifications, 60 * 1000);
setTimeout(checkAndSendNotifications, 5000);