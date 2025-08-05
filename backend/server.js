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
    
    const { activity, points } = req.body; // Original frontend format
    
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
      category: 'General'
    };
    
    console.log('📝 Mapped activity data:', activityData);

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