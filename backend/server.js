const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Activity = require('./models/Activity'); // import model

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
    
    // Debug: Log categories for each activity
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

// POST: add a new activity - FIXED to work with original frontend
app.post('/api/activities', async (req, res) => {
  try {
    console.log('📝 Raw request body:', req.body);
    console.log('📝 Category from request:', req.body.category);
    console.log('📝 Category type:', typeof req.body.category);
    console.log('📝 Category length:', req.body.category ? req.body.category.length : 'undefined');
    
    const { activity, points, category } = req.body; // Updated to include category
    console.log('📝 Destructured category:', category);
    console.log('📝 Destructured category type:', typeof category);
    console.log('📝 Destructured category truthy check:', !!category);
    
    // Validation
    if (!activity || points === undefined || points === null) {
      console.log('❌ Validation failed - missing fields');
      return res.status(400).json({ 
        error: 'Missing required fields', 
        details: 'Activity name and points are required' 
      });
    }

    // Map to your database schema
    const activityData = {
      userId: 'default_user', // Default user for now
      activityName: activity.trim(),
      type: points > 0 ? 'Positive' : 'Negative',
      points: parseInt(points),
      category: category !== undefined && category !== null ? category : 'General' // Use provided category or default to 'General'
    };
    
    console.log('📝 Mapped activity data:', activityData);
    console.log('📝 Final category value:', activityData.category);
    console.log('📝 Category assignment logic:', {
      category,
      isUndefined: category === undefined,
      isNull: category === null,
      finalCategory: category !== undefined && category !== null ? category : 'General'
    });

    const newActivity = new Activity(activityData);
    const savedActivity = await newActivity.save();
    
    console.log('✅ Activity saved successfully:', savedActivity);
    res.status(201).json(savedActivity);
    
  } catch (err) {
    console.error('❌ Error adding activity:', err);
    res.status(400).json({ 
      error: 'Failed to add activity', 
      details: err.message 
    });
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
    
    // Check if activities have category field
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
    
    // Find activities without categories
    const activitiesWithoutCategory = await Activity.find({ category: { $exists: false } });
    console.log(`📊 Found ${activitiesWithoutCategory.length} activities without categories`);
    
    if (activitiesWithoutCategory.length === 0) {
      return res.json({ message: 'All activities already have categories' });
    }
    
    // Update all activities without categories to have 'General' category
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
});