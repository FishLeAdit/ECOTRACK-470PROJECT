import React, { useEffect, useState } from 'react';
import axios from 'axios';
import GoalHistory from './components/GoalHistory';
import BadgeNotification from './components/BadgeNotification';
import BadgeDisplay from './components/BadgeDisplay';
import ProgressCharts from './components/ProgressCharts';
import ActivityLog from './components/ActivityLog';

function App() {
  // State declarations
  const [activities, setActivities] = useState([]);
  const [customActivity, setCustomActivity] = useState('');
  const [customPoints, setCustomPoints] = useState('');
  const [customEmoji, setCustomEmoji] = useState('');
  const [customCategory, setCustomCategory] = useState('General');
  const [totalScore, setTotalScore] = useState(0);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [goals, setGoals] = useState([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    targetPoints: '',
    goalType: 'daily'
  });
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState('main');
  const [newBadges, setNewBadges] = useState([]);
  const [showBadgeNotification, setShowBadgeNotification] = useState(false);
  const [pinnedCustomActivities, setPinnedCustomActivities] = useState([]);

  // Categories
  const categories = [
    'General',
    'Transportation',
    'Energy',
    'Waste',
    'Food',
    'Water',
    'Shopping',
    'Home',
    'Work',
    'Recreation'
  ];

  // Predefined activities
  const [positiveActivities] = useState([
    { activity: "Walked instead of driving", points: 4, emoji: "🚶", category: "Transportation" },
    { activity: "Used Bicycle", points: 5, emoji: "🚴", category: "Transportation" },
    { activity: "Used Public Transport", points: 3, emoji: "🚌", category: "Transportation" },
    { activity: "Recycled Waste", points: 3, emoji: "♻️", category: "Waste" },
    { activity: "Planted a Tree", points: 10, emoji: "🌱", category: "General" },
    { activity: "Used Reusable Bottle", points: 2, emoji: "💧", category: "Water" },
    { activity: "Reduced Electricity Usage", points: 4, emoji: "💡", category: "Energy" },
    { activity: "Bought Local Produce", points: 2, emoji: "🥬", category: "Food" },
    { activity: "Composted Kitchen Waste", points: 3, emoji: "🗂️", category: "Waste" }
  ]);

  const [negativeActivities] = useState([
    { activity: "Drove Car Alone", points: -5, emoji: "🚗", category: "Transportation" },
    { activity: "Used Plastic Bags", points: -2, emoji: "🛍️", category: "Shopping" },
    { activity: "Wasted Food", points: -3, emoji: "🗑️", category: "Food" },
    { activity: "Left Lights/AC On", points: -4, emoji: "💡", category: "Energy" },
    { activity: "Took Short Flight (<500km)", points: -8, emoji: "✈️", category: "Transportation" },
    { activity: "Used Disposable Bottles", points: -2, emoji: "🥤", category: "Water" }
  ]);

  // Fetch data on component mount
  useEffect(() => {
    fetchActivities();
    fetchGoals();
  }, []);

  // Fetch activities from backend
  const fetchActivities = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/activities/default_user');
      setActivities(response.data);
      calculateScore(response.data);
    } catch (err) {
      console.error('❌ Error fetching activities:', err);
      alert('Error fetching activities: ' + (err.response?.data?.error || err.message));
    }
  };

  // Calculate total score
  const calculateScore = (data) => {
    const sum = data.reduce((acc, curr) => acc + curr.points, 0);
    setTotalScore(sum);
  };

  // Fetch goals from backend
  const fetchGoals = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/goals/default_user');
      setGoals(response.data);
    } catch (err) {
      console.error('❌ Error fetching goals:', err);
    }
  };

  // Log predefined activity
  const logPredefined = async (activity, points, category) => {
    try {
      const payload = { 
        userId: 'default_user',
        activityName: activity, 
        points: points,
        category: category,
        type: points > 0 ? 'Positive' : 'Negative'
      };
      
      const response = await axios.post('http://localhost:5000/api/activities', payload);
      
      // Check for new badges
      if (response.data.newBadges && response.data.newBadges.length > 0) {
        setNewBadges(response.data.newBadges);
        setShowBadgeNotification(true);
      }
      
      fetchActivities();
    } catch (err) {
      console.error('❌ Error adding predefined activity:', err);
      alert("Error adding activity: " + (err.response?.data?.error || err.message));
    }
  };

  // Handle custom activity submission
  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    if (!customActivity || !customPoints) return alert("Please fill all fields");

    try {
      const payload = { 
        userId: 'default_user',
        activityName: customActivity, 
        points: parseInt(customPoints),
        category: customCategory,
        type: parseInt(customPoints) > 0 ? 'Positive' : 'Negative'
      };
      
      const response = await axios.post('http://localhost:5000/api/activities', payload);
      
      // Check for new badges
      if (response.data.newBadges && response.data.newBadges.length > 0) {
        setNewBadges(response.data.newBadges);
        setShowBadgeNotification(true);
      }
      
      setCustomActivity('');
      setCustomPoints('');
      setCustomEmoji('');
      setCustomCategory('General');
      fetchActivities();
    } catch (err) {
      console.error('❌ Error adding custom activity:', err);
      alert("Error adding custom activity: " + (err.response?.data?.error || err.message));
    }
  };

  // Delete activity
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/activities/${id}`);
      fetchActivities();
    } catch (err) {
      console.error('❌ Error deleting activity:', err);
      alert("Error deleting activity: " + (err.response?.data?.error || err.message));
    }
  };

  // Create new goal
  const createGoal = async (e) => {
    e.preventDefault();
    if (!newGoal.targetPoints) return alert("Please fill all fields");

    try {
      // Calculate end date based on goal type
      let endDate;
      const now = new Date();
      
      switch (newGoal.goalType) {
        case 'daily':
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;
        case 'weekly':
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
          break;
        case 'monthly':
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
          break;
        default:
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      }

      const payload = {
        userId: 'default_user',
        targetPoints: parseInt(newGoal.targetPoints),
        endDate: endDate.toISOString(),
        goalType: newGoal.goalType
      };

      const response = await axios.post('http://localhost:5000/api/goals', payload);
      
      // Check for new badges
      if (response.data.newBadges && response.data.newBadges.length > 0) {
        setNewBadges(response.data.newBadges);
        setShowBadgeNotification(true);
      }
      
      setNewGoal({ targetPoints: '', goalType: 'daily' });
      setShowGoalModal(false);
      fetchGoals();
    } catch (err) {
      console.error('❌ Error creating goal:', err);
      alert("Error creating goal: " + (err.response?.data?.error || err.message));
    }
  };

  // Delete goal
  const deleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/goals/${goalId}`);
      fetchGoals();
    } catch (err) {
      console.error('❌ Error deleting goal:', err);
      alert("Error deleting goal: " + (err.response?.data?.error || err.message));
    }
  };

  // Pin a custom activity (fix: use correct property names)
  const pinCustomActivity = (activityObj) => {
    // Accept both activityName or activity for compatibility
    const name = activityObj.activityName || activityObj.activity;
    // Prevent duplicates
    if (!pinnedCustomActivities.some(a => (a.activityName || a.activity) === name)) {
      // Normalize object for pinned list
      setPinnedCustomActivities([
        ...pinnedCustomActivities,
        {
          activityName: name,
          points: activityObj.points,
          emoji: activityObj.emoji,
          category: activityObj.category
        }
      ]);
    }
  };

  // Unpin a custom activity
  const unpinCustomActivity = (activityName) => {
    setPinnedCustomActivities(pinnedCustomActivities.filter(a => a.activityName !== activityName));
  };

  // Activity box component
  const ActivityBox = ({ activity, points, emoji, category, onClick }) => (
    <button
      onClick={() => onClick(activity, points, category)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '160px',
        height: '120px',
        padding: '15px',
        margin: '5px',
        backgroundColor: points > 0 ? '#27ae60' : '#c0392b',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        transition: 'all 0.3s ease',
        fontSize: '12px',
        fontWeight: 'bold',
        textAlign: 'center'
      }}
    >
      <div style={{ fontSize: '24px', marginBottom: '8px' }}>{emoji}</div>
      <div style={{ fontSize: '11px', marginBottom: '4px' }}>{activity}</div>
      <div style={{ fontSize: '9px', marginBottom: '4px' }}>{category || 'General'}</div>
      <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
        {points > 0 ? `+${points}` : points}
      </div>
    </button>
  );

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto', fontFamily: 'Arial, sans-serif', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <button
          onClick={() => setShowHamburgerMenu(!showHamburgerMenu)}
          style={{
            padding: '10px',
            backgroundColor: '#34495e',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '18px'
          }}
        >
          ☰
        </button>
        
        <div style={{ textAlign: 'center', flex: 1 }}>
          <h1 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>🌍 EcoTrack</h1>
          <p style={{ margin: 0, color: '#7f8c8d' }}>Track your daily environmental impact</p>
        </div>
        
        <div style={{ width: '50px' }}></div>
      </div>

      {/* Hamburger Menu */}
      {showHamburgerMenu && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000
        }} onClick={() => setShowHamburgerMenu(false)}>
          <div style={{
            position: 'absolute',
            top: '80px',
            left: '20px',
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            minWidth: '200px'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50' }}>Menu</h3>
            <button
              onClick={() => {
                setCurrentPage('main');
                setShowHamburgerMenu(false);
              }}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: currentPage === 'main' ? '#3498db' : '#ecf0f1',
                color: currentPage === 'main' ? 'white' : '#2c3e50',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                marginBottom: '10px'
              }}
            >
              🏠 Main Dashboard
            </button>
            <button
              onClick={() => {
                setCurrentPage('history');
                setShowHamburgerMenu(false);
              }}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: currentPage === 'history' ? '#3498db' : '#ecf0f1',
                color: currentPage === 'history' ? 'white' : '#2c3e50',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                marginBottom: '10px'
              }}
            >
              📚 Goal History
            </button>
            <button
              onClick={() => {
                setCurrentPage('log');
                setShowHamburgerMenu(false);
              }}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: currentPage === 'log' ? '#3498db' : '#ecf0f1',
                color: currentPage === 'log' ? 'white' : '#2c3e50',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              📋 Activity Log
            </button>
          </div>
        </div>
      )}

      {/* Modal for Adding Goal */}
      {showGoalModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'white',
            padding: '30px 25px',
            borderRadius: '14px',
            minWidth: 320,
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowGoalModal(false)}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                background: 'none',
                border: 'none',
                fontSize: 20,
                cursor: 'pointer',
                color: '#888'
              }}
              aria-label="Close"
            >✖️</button>
            <h2 style={{ marginTop: 0, color: '#2c3e50', marginBottom: 18 }}>Add New Goal</h2>
            <form onSubmit={createGoal}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, color: '#555', fontSize: 14 }}>Target Points</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newGoal.targetPoints}
                  onChange={e => setNewGoal({ ...newGoal, targetPoints: e.target.value })}
                  style={{ width: '100%', padding: 10, border: '2px solid #ddd', borderRadius: 8, fontSize: 15 }}
                />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', marginBottom: 6, color: '#555', fontSize: 14 }}>Goal Type</label>
                <select
                  value={newGoal.goalType}
                  onChange={e => setNewGoal({ ...newGoal, goalType: e.target.value })}
                  style={{ width: '100%', padding: 10, border: '2px solid #ddd', borderRadius: 8, fontSize: 15 }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '12px 0',
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Add Goal
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Page Content */}
      {currentPage === 'main' ? (
        <>
          

          {/* Score Tracker */}
          <div style={{
            background: 'linear-gradient(135deg, #74b9ff, #0984e3)',
            padding: '20px',
            borderRadius: '15px',
            textAlign: 'center',
            marginBottom: '30px',
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'white',
            boxShadow: '0 6px 20px rgba(116, 185, 255, 0.3)'
          }}>
            🌍 Your Eco Score: 
            <span style={{ 
              color: totalScore >= 0 ? '#00ff88' : '#ff6b6b', 
              marginLeft: '15px',
              fontSize: '28px'
            }}>
              {totalScore}
            </span>
          </div>

          {/* Pinned Custom Activities */}
          {pinnedCustomActivities.length > 0 && (
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ color: '#f1c40f', marginBottom: '20px' }}>📌 Pinned Custom Activities</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {pinnedCustomActivities.map((p, idx) => (
                  <div key={`pinned-${idx}`} style={{ position: 'relative' }}>
                    <ActivityBox
                      activity={p.activityName}
                      points={p.points}
                      emoji={p.emoji || '✨'}
                      category={p.category}
                      onClick={logPredefined}
                    />
                    <button
                      onClick={() => unpinCustomActivity(p.activityName)}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        cursor: 'pointer',
                        fontSize: 14,
                        lineHeight: '24px',
                        padding: 0
                      }}
                      title="Unpin"
                    >✖️</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Positive Activities */}
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ color: '#27ae60', marginBottom: '20px' }}>🌟 Positive Activities</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {positiveActivities.map((p, idx) => (
                <ActivityBox
                  key={`positive-${idx}`}
                  activity={p.activity}
                  points={p.points}
                  emoji={p.emoji}
                  category={p.category}
                  onClick={logPredefined}
                />
              ))}
            </div>
          </div>

          {/* Negative Activities */}
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ color: '#c0392b', marginBottom: '20px' }}>⚠️ Negative Activities</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {negativeActivities.map((n, idx) => (
                <ActivityBox
                  key={`negative-${idx}`}
                  activity={n.activity}
                  points={n.points}
                  emoji={n.emoji}
                  category={n.category}
                  onClick={logPredefined}
                />
              ))}
            </div>
          </div>

          {/* Custom Activity Form */}
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '25px',
            borderRadius: '15px',
            marginBottom: '40px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>✨ Add Custom Activity</h2>
            <form onSubmit={handleCustomSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'end' }}>
              <div style={{ flex: '2', minWidth: '200px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontSize: '14px' }}>
                  Activity Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Used solar energy"
                  value={customActivity}
                  onChange={(e) => setCustomActivity(e.target.value)}
                  style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
              
              <div style={{ flex: '1', minWidth: '100px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontSize: '14px' }}>
                  Points
                </label>
                <input
                  type="number"
                  placeholder="Points"
                  value={customPoints}
                  onChange={(e) => setCustomPoints(e.target.value)}
                  style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
              
              <div style={{ flex: '1', minWidth: '100px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontSize: '14px' }}>
                  Category
                </label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '14px' }}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div style={{ flex: '1', minWidth: '100px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontSize: '14px' }}>
                  Emoji (optional)
                </label>
                <input
                  type="text"
                  placeholder="🌱"
                  value={customEmoji}
                  onChange={(e) => setCustomEmoji(e.target.value)}
                  maxLength="2"
                  style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '14px', textAlign: 'center' }}
                />
              </div>
              
              <button 
                type="submit"
                style={{ 
                  padding: '12px 20px', 
                  backgroundColor: '#3498db', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Add Activity
              </button>
            </form>
          </div>

          {/* Goals Section */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: '#2c3e50', margin: 0 }}>🎯 Goals & Progress</h2>
              <button
                onClick={() => setShowGoalModal(true)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#e67e22',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                + Add Goal
              </button>
            </div>
            {goals.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '30px',
                color: '#666',
                backgroundColor: '#f8f9fa',
                borderRadius: '12px',
                border: '2px dashed #ddd'
              }}>
                <div style={{ fontSize: '36px', marginBottom: '15px' }}>🎯</div>
                <p style={{ fontSize: '16px', marginBottom: '10px' }}>No goals set yet!</p>
                <p style={{ fontSize: '14px' }}>Set daily, weekly, or monthly eco-point targets to track your progress.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                {goals.map((goal) => {
                  const progress = Math.min((goal.currentPoints / goal.targetPoints) * 100, 100);
                  const isCompleted = goal.currentPoints >= goal.targetPoints;
                  const isExpired = new Date() > new Date(goal.endDate);
                  
                  return (
                    <div key={goal._id} style={{
                      backgroundColor: 'white',
                      padding: '20px',
                      borderRadius: '12px',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                      border: `2px solid ${isCompleted ? '#27ae60' : isExpired ? '#e74c3c' : '#f39c12'}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                        <div>
                          <h3 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>{goal.goalType} Goal</h3>
                          <p style={{ margin: '0', color: '#7f8c8d' }}>
                            Due: {new Date(goal.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteGoal(goal._id)}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          🗑️
                        </button>
                      </div>

                      <div style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '14px', color: '#555' }}>
                            Progress: {goal.currentPoints} / {goal.targetPoints} points
                          </span>
                          <span style={{ fontSize: '14px', fontWeight: 'bold', color: isCompleted ? '#27ae60' : '#f39c12' }}>
                            {Math.round(progress)}%
                          </span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '8px',
                          backgroundColor: '#ecf0f1',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${progress}%`,
                            height: '100%',
                            backgroundColor: isCompleted ? '#27ae60' : '#f39c12'
                          }} />
                        </div>
                      </div>

                      <div style={{
                        padding: '8px 12px',
                        backgroundColor: isCompleted ? '#d5f4e6' : isExpired ? '#fadbd8' : '#fef9e7',
                        borderRadius: '6px',
                        textAlign: 'center'
                      }}>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: isCompleted ? '#27ae60' : isExpired ? '#e74c3c' : '#f39c12'
                        }}>
                          {isCompleted ? '🎉 Goal Completed!' : isExpired ? '⏰ Goal Expired' : '🚀 In Progress'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Badge Display */}
          <BadgeDisplay userId="default_user" showStats={true} />

          {/* Visualization */}
          <ProgressCharts userId="default_user" />
        </>
      ) : currentPage === 'history' ? (
        <GoalHistory onBack={() => setCurrentPage('main')} />
      ) : (
        <ActivityLog 
          activities={activities}
          handleDelete={handleDelete}
          pinnedCustomActivities={pinnedCustomActivities}
          pinCustomActivity={pinCustomActivity}
          unpinCustomActivity={unpinCustomActivity}
          positiveActivities={positiveActivities}
          negativeActivities={negativeActivities}
          categories={categories}
          selectedCategoryFilter={selectedCategoryFilter}
          setSelectedCategoryFilter={setSelectedCategoryFilter}
        />
      )}

      {/* Badge Notification */}
      {showBadgeNotification && (
        <BadgeNotification 
          badges={newBadges} 
          onClose={() => {
            setShowBadgeNotification(false);
            setNewBadges([]);
          }} 
        />
      )}
    </div>
  );
}

export default App;