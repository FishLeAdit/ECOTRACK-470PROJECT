import React, { useEffect, useState } from 'react';
import axios from 'axios';
import GoalHistory from './components/GoalHistory';
import BadgeNotification from './components/BadgeNotification';
import BadgeDisplay from './components/BadgeDisplay';
import ProgressCharts from './components/ProgressCharts';
import ActivityLog from './components/ActivityLog';
import Recommendations from './components/Recommendations';
import Settings from './components/Settings';

function PinnedFrequentActivities({ pinnedCustomActivities, frequentActivities, logPredefined }) {
  const combinedActivities = [
    ...pinnedCustomActivities,
    ...frequentActivities.filter(
      (freq) => !pinnedCustomActivities.some((pin) => pin.activityName === freq.activityName)
    )
  ].slice(0, 10);

  return (
    <div style={{ marginBottom: '40px' }}>
      <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>Pinned & Frequent Activities</h2>
      {combinedActivities.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '30px',
          color: '#666',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          border: '2px dashed #ddd'
        }}>
          <div style={{ fontSize: '36px', marginBottom: '15px' }}>📌</div>
          <p style={{ fontSize: '16px', marginBottom: '10px' }}>No pinned or frequent activities yet!</p>
          <p style={{ fontSize: '14px' }}>Pin activities from the Activity Log or perform activities multiple times to see them here.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {combinedActivities.map((activity, index) => {
            const isPinned = pinnedCustomActivities.some(
              (pin) => pin.activityName === activity.activityName
            );
            return (
              <button
                key={index}
                onClick={() => logPredefined(activity.activityName, activity.points, activity.category)}
                style={{
                  padding: '15px',
                  backgroundColor: activity.points >= 0 ? '#e8f5e8' : '#f8d7da',
                  border: `2px solid ${activity.points >= 0 ? '#27ae60' : '#c0392b'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <span style={{ fontSize: '20px' }}>{activity.emoji}</span>
                <div>
                  <strong>{activity.activityName}</strong>
                  <div style={{ color: activity.points >= 0 ? '#27ae60' : '#c0392b', fontWeight: 'bold' }}>
                    {activity.points >= 0 ? `+${activity.points}` : activity.points} points
                  </div>
                  <small style={{ color: '#666' }}>{activity.category}</small>
                  {isPinned && (
                    <span style={{
                      backgroundColor: '#f1c40f',
                      color: '#2c3e50',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      marginLeft: '5px'
                    }}>
                      📌 Pinned
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function App() {
  // State declarations
  const [activities, setActivities] = useState([]);
  const [frequentActivities, setFrequentActivities] = useState([]);
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
    goalType: 'daily',
    endDate: getEndDateForGoalType('daily')
  });
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState('main');
  const [newBadges, setNewBadges] = useState([]);
  const [showBadgeNotification, setShowBadgeNotification] = useState(false);
  const [pinnedCustomActivities, setPinnedCustomActivities] = useState([]);
  const [completedGoal, setCompletedGoal] = useState(null);
  const [showGoalCompleteNotification, setShowGoalCompleteNotification] = useState(false);
  const [recommendations, setRecommendations] = useState({
    generalAdvice: '',
    activitySuggestions: []
  });
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [lastRecommendationUpdate, setLastRecommendationUpdate] = useState(null);
  const [cacheStatus, setCacheStatus] = useState({});
  const [notification, setNotification] = useState(null);
  const [showNotification, setShowNotification] = useState(false);

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

  // Helper to get end date based on goal type
  function getEndDateForGoalType(goalType) {
    const today = new Date();
    if (goalType === 'daily') {
      today.setDate(today.getDate() + 1);
    } else if (goalType === 'weekly') {
      today.setDate(today.getDate() + 7);
    } else if (goalType === 'monthly') {
      today.setMonth(today.getMonth() + 1);
    }
    return today.toISOString().split('T')[0];
  }

  // Fetch data on component mount
  useEffect(() => {
    fetchActivities();
    fetchFrequentActivities();
    fetchGoals();
    fetchPinnedActivities();
    fetchRecommendations();
  }, []);

  useEffect(() => {
    // Request notification permission on app load
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }, []);

  // Add useEffect to check for notifications
  useEffect(() => {
    checkForNotifications();
    
    // Check for notifications every 30 seconds
    const notificationInterval = setInterval(checkForNotifications, 30000);
    
    return () => clearInterval(notificationInterval);
  }, []);

  // Fetch pinned activities from backend
  const fetchPinnedActivities = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/pinned-activities/default_user');
      setPinnedCustomActivities(response.data);
    } catch (err) {
      console.error('Error fetching pinned activities:', err);
      alert('Error fetching pinned activities: ' + (err.response?.data?.error || err.message));
    }
  };

  // Fetch activities from backend
  const fetchActivities = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/activities/default_user');
      setActivities(response.data);
      calculateScore(response.data);
    } catch (err) {
      console.error('Error fetching activities:', err);
      alert('Error fetching activities: ' + (err.response?.data?.error || err.message));
    }
  };

  // Fetch frequent activities from backend
  const fetchFrequentActivities = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/activities/default_user/frequent');
      setFrequentActivities(response.data);
    } catch (err) {
      console.error('Error fetching frequent activities:', err);
      alert('Error fetching frequent activities: ' + (err.response?.data?.error || err.message));
    }
  };

  // Fetch goals from backend
  const fetchGoals = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/goals/default_user');
      setGoals(response.data);
    } catch (err) {
      console.error('Error fetching goals:', err);
      alert('Failed to load goals');
    }
  };

  // Calculate total score
  const calculateScore = (data) => {
    const sum = data.reduce((acc, curr) => acc + curr.points, 0);
    setTotalScore(sum);
  };

  // Add browser notification function
  const showBrowserNotification = (message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('EcoTrack Reminder', {
        body: message,
        icon: '/favicon.ico' // Add a favicon to your public folder
      });
    }
  };

  // Check for notifications
  const checkForNotifications = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/notifications/default_user');
      if (response.data && response.data.message) {
        setNotification(response.data);
        setShowNotification(true);
        showBrowserNotification(response.data.message);
        
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
      }
    } catch (err) {
      console.error('Error checking notifications:', err);
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
      if (response.data.newBadges && response.data.newBadges.length > 0) {
        setNewBadges(response.data.newBadges);
        setShowBadgeNotification(true);
      }
      await updateGoalsProgress(points);
      await fetchActivities();
      await fetchFrequentActivities();
      await fetchGoals();
      await fetchPinnedActivities();
    } catch (err) {
      console.error('Error adding predefined activity:', err);
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
        type: parseInt(customPoints) > 0 ? 'Positive' : 'Negative',
        emoji: customEmoji || ''
      };
      const response = await axios.post('http://localhost:5000/api/activities', payload);
      if (response.data.newBadges && response.data.newBadges.length > 0) {
        setNewBadges(response.data.newBadges);
        setShowBadgeNotification(true);
      }
      await updateGoalsProgress(Number(customPoints));
      await fetchActivities();
      await fetchFrequentActivities();
      await fetchGoals();
      await fetchPinnedActivities();
      setCustomActivity('');
      setCustomPoints('');
      setCustomEmoji('');
      setCustomCategory('General');
    } catch (err) {
      console.error('Error adding custom activity:', err);
      alert("Error adding custom activity: " + (err.response?.data?.error || err.message));
    }
  };

  // Pin custom activity
  const pinCustomActivity = async (activity) => {
    try {
      const payload = {
        userId: 'default_user',
        activityName: activity.activityName,
        points: activity.points,
        category: activity.category,
        emoji: activity.emoji || ''
      };
      const response = await axios.post('http://localhost:5000/api/pinned-activities', payload);
      setPinnedCustomActivities((prev) => {
        if (prev.some(item => item.activityName === activity.activityName)) {
          return prev;
        }
        const newPinned = [...prev, response.data];
        return newPinned.slice(0, 10);
      });
      await fetchPinnedActivities();
    } catch (err) {
      console.error('Error pinning activity:', err);
      alert('Error pinning activity: ' + (err.response?.data?.error || err.message));
    }
  };

  // Unpin custom activity
  const unpinCustomActivity = async (activityName) => {
    try {
      await axios.delete(`http://localhost:5000/api/pinned-activities/default_user/${encodeURIComponent(activityName)}`);
      setPinnedCustomActivities((prev) => {
        return prev.filter(a => a.activityName !== activityName);
      });
      await fetchPinnedActivities();
    } catch (err) {
      console.error('Error unpinning activity:', err);
      alert('Error unpinning activity: ' + (err.response?.data?.error || err.message));
    }
  };

  // Update all active goals' progress after activity is logged
  const updateGoalsProgress = async (pointsEarned) => {
    try {
      const response = await axios.get('http://localhost:5000/api/goals/default_user');
      const updatedGoals = response.data;
      const completedGoals = [];

      for (const goal of updatedGoals) {
        if (!goal.isCompleted && !goal.isArchived) {
          const newPoints = goal.currentPoints + pointsEarned;
          const isCompleted = newPoints >= goal.targetPoints;

          await axios.put(`http://localhost:5000/api/goals/${goal._id}`, {
            currentPoints: newPoints,
            isCompleted: isCompleted,
            wasSuccessful: isCompleted,
            completionDate: isCompleted ? new Date() : goal.completionDate
          });

          if (isCompleted) {
            await axios.put(`http://localhost:5000/api/goals/${goal._id}/archive`);
            completedGoals.push({ ...goal, currentPoints: newPoints });
          }
        }
      }

      if (completedGoals.length > 0) {
        const showNextNotification = async (index = 0) => {
          if (index >= completedGoals.length) {
            await fetchGoals();
            return;
          }

          const goal = completedGoals[index];
          setCompletedGoal(goal);
          setShowGoalCompleteNotification(true);

          setTimeout(() => {
            setShowGoalCompleteNotification(false);
            setCompletedGoal(null);
            showNextNotification(index + 1);
          }, 3000);
        };

        showNextNotification();
      } else {
        await fetchGoals();
      }
    } catch (err) {
      console.error('Error updating goals:', err);
      alert("Error updating goals: " + (err.response?.data?.error || err.message));
    }
  };

  // Handle goal modal open/close
  const openGoalModal = () => {
    setShowGoalModal(true);
    setNewGoal({
      targetPoints: '',
      goalType: 'daily',
      endDate: getEndDateForGoalType('daily')
    });
  };

  const closeGoalModal = () => {
    setShowGoalModal(false);
    setNewGoal({
      targetPoints: '',
      goalType: 'daily',
      endDate: getEndDateForGoalType('daily')
    });
  };

  // Handle goal submission
  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    if (!newGoal.targetPoints || !newGoal.endDate) return alert("Please fill all fields");
    try {
      const payload = { 
        userId: 'default_user',
        targetPoints: parseInt(newGoal.targetPoints),
        endDate: newGoal.endDate,
        goalType: newGoal.goalType
      };
      const response = await axios.post('http://localhost:5000/api/goals', payload);
      if (response.data.newBadges && response.data.newBadges.length > 0) {
        setNewBadges(response.data.newBadges);
        setShowBadgeNotification(true);
      }
      await fetchGoals();
      closeGoalModal();
    } catch (err) {
      console.error('Error adding goal:', err);
      alert("Error adding goal: " + (err.response?.data?.error || err.message));
    }
  };

  // Delete activity
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/activities/${id}`);
      await fetchActivities();
      await fetchFrequentActivities();
      await fetchGoals();
      await fetchPinnedActivities();
    } catch (err) {
      console.error('Error deleting activity:', err);
      alert("Error deleting activity: " + (err.response?.data?.error || err.message));
    }
  };

  // Delete goal
  const deleteGoal = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/goals/${id}`);
      await fetchGoals();
    } catch (err) {
      console.error('Error deleting goal:', err);
      alert("Error deleting goal: " + (err.response?.data?.error || err.message));
    }
  };

  // Fetch Recommendations
  const fetchRecommendations = async () => {
    setLoadingRecommendations(true);
    try {
      const response = await axios.get('http://localhost:5000/api/recommendations/default_user');
      setRecommendations(response.data);
      setLastRecommendationUpdate(new Date());

      const statusResponse = await axios.get('http://localhost:5000/api/recommendations/status/default_user/cache-status');
      setCacheStatus(statusResponse.data);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setRecommendations({
        generalAdvice: "We're having trouble generating recommendations right now. Keep tracking your eco-activities!",
        activitySuggestions: []
      });
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Manual Refresh Function
  const refreshRecommendations = async () => {
    setLoadingRecommendations(true);
    try {
      const response = await axios.post('http://localhost:5000/api/recommendations/default_user/refresh');
      setRecommendations(response.data.recommendations);
      setLastRecommendationUpdate(new Date());

      const statusResponse = await axios.get('http://localhost:5000/api/recommendations/default_user/cache-status');
      setCacheStatus(statusResponse.data);
      alert('Recommendations refreshed successfully');
    } catch (err) {
      console.error("Error refreshing recommendations:", err);
      alert("Error refreshing recommendations: " + (err.response?.data?.error || err.message));
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Pin Suggested Activities
  const pinSuggestedActivity = async (activity) => {
    try {
      await pinCustomActivity(activity);
      setRecommendations(prev => ({
        ...prev,
        activitySuggestions: prev.activitySuggestions.filter(a => 
          a.activityName !== activity.activityName
        )
      }));
    } catch (err) {
      console.error('Error pinning suggested activity:', err);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px', fontFamily: 'Arial, sans-serif' }}>
      {/* Hamburger Menu */}
      <div style={{ position: 'fixed', top: '20px', left: '20px', zIndex: 1000 }}>
        <button
          onClick={() => setShowHamburgerMenu(!showHamburgerMenu)}
          style={{
            padding: '10px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ☰
        </button>
        {showHamburgerMenu && (
          <div style={{
            position: 'absolute',
            top: '50px',
            left: '0',
            backgroundColor: 'white',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            borderRadius: '8px',
            padding: '15px',
            zIndex: 1000
          }}>
            <button
              onClick={() => {
                setCurrentPage('main');
                setShowHamburgerMenu(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px',
                border: 'none',
                background: currentPage === 'main' ? '#3498db' : 'transparent',
                color: currentPage === 'main' ? 'white' : '#2c3e50',
                textAlign: 'left',
                fontSize: '16px',
                cursor: 'pointer',
                borderRadius: '4px',
                marginBottom: '5px'
              }}
            >
              🏠 Dashboard
            </button>
            <button
              onClick={() => {
                setCurrentPage('history');
                setShowHamburgerMenu(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px',
                border: 'none',
                background: currentPage === 'history' ? '#3498db' : 'transparent',
                color: currentPage === 'history' ? 'white' : '#2c3e50',
                textAlign: 'left',
                fontSize: '16px',
                cursor: 'pointer',
                borderRadius: '4px',
                marginBottom: '5px'
              }}
            >
              📜 Goal History
            </button>
            <button
              onClick={() => {
                setCurrentPage('activityLog');
                setShowHamburgerMenu(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px',
                border: 'none',
                background: currentPage === 'activityLog' ? '#3498db' : 'transparent',
                color: currentPage === 'activityLog' ? 'white' : '#2c3e50',
                textAlign: 'left',
                fontSize: '16px',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
            >
              📋 Activity Log
            </button>
            <button
              onClick={() => {
                setCurrentPage('settings');
                setShowHamburgerMenu(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px',
                border: 'none',
                background: currentPage === 'settings' ? '#3498db' : 'transparent',
                color: currentPage === 'settings' ? 'white' : '#2c3e50',
                textAlign: 'left',
                fontSize: '16px',
                cursor: 'pointer',
                borderRadius: '4px',
                marginBottom: '5px'
              }}
            >
              ⚙️ Settings
            </button>
          </div>
        )}
      </div>

      {/* Goal Modal */}
      {showGoalModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>🎯 Set New Goal</h2>
            <form onSubmit={handleGoalSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontSize: '14px' }}>
                  Target Points
                </label>
                <input
                  type="number"
                  value={newGoal.targetPoints}
                  onChange={(e) => setNewGoal({ ...newGoal, targetPoints: e.target.value })}
                  placeholder="Enter points (e.g., 50)"
                  style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontSize: '14px' }}>
                  Goal Type
                </label>
                <select
                  value={newGoal.goalType}
                  onChange={(e) => {
                    const goalType = e.target.value;
                    setNewGoal({ ...newGoal, goalType, endDate: getEndDateForGoalType(goalType) });
                  }}
                  style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '14px' }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontSize: '14px' }}>
                  End Date
                </label>
                <input
                  type="date"
                  value={newGoal.endDate}
                  onChange={(e) => setNewGoal({ ...newGoal, endDate: e.target.value })}
                  style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  Set Goal
                </button>
                <button
                  type="button"
                  onClick={closeGoalModal}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {currentPage === 'settings' ? (
        <Settings onBack={() => setCurrentPage('main')} />
      ) : currentPage === 'history' ? (
        <GoalHistory onBack={() => setCurrentPage('main')} />
      ) : currentPage === 'activityLog' ? (
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
      ) : (
        <div>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{ color: '#2c3e50', fontSize: '28px', marginBottom: '10px' }}>
              🌍 EcoTrack Dashboard
            </h1>
            <p style={{ color: '#7f8c8d', fontSize: '16px' }}>
              Your Total Eco Points: <strong style={{ color: totalScore >= 0 ? '#27ae60' : '#e74c3c' }}>{totalScore}</strong>
            </p>
          </div>

          {/* Pinned and Frequent Activities */}
          <PinnedFrequentActivities 
            pinnedCustomActivities={pinnedCustomActivities}
            frequentActivities={frequentActivities}
            logPredefined={logPredefined}
          />

          {/* Activities Section */}
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>🌟 Activities</h2>
            
            {/* Positive Actions */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#27ae60', marginBottom: '15px' }}>Positive Actions</h3>
              <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                {positiveActivities.map((activity, index) => {
                  const isPinned = pinnedCustomActivities.some(
                    (pin) => pin.activityName === activity.activity
                  );
                  
                  return (
                    <button
                      key={index}
                      onClick={() => logPredefined(activity.activity, activity.points, activity.category)}
                      style={{
                        padding: '15px',
                        backgroundColor: '#e8f5e8',
                        border: '2px solid #27ae60',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>{activity.emoji}</span>
                      <div>
                        <strong>{activity.activity}</strong>
                        <div style={{ color: '#27ae60', fontWeight: 'bold' }}>
                          +{activity.points} points
                        </div>
                        <small style={{ color: '#666' }}>{activity.category}</small>
                        {isPinned && (
                          <span style={{
                            backgroundColor: '#f1c40f',
                            color: '#2c3e50',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '10px',
                            marginLeft: '5px'
                          }}>
                            📌 Pinned
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
                
                {/* Pinned positive custom activities */}
                {pinnedCustomActivities
                  .filter(pin => pin.points > 0 && !positiveActivities.some(pa => pa.activity === pin.activityName))
                  .map((activity, index) => {
                    const isPinned = true;
                    
                    return (
                      <button
                        key={`pinned-${index}`}
                        onClick={() => logPredefined(activity.activityName, activity.points, activity.category)}
                        style={{
                          padding: '15px',
                          backgroundColor: '#e8f5e8',
                          border: '2px solid #27ae60',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                      >
                        <span style={{ fontSize: '20px' }}>{activity.emoji || '✨'}</span>
                        <div>
                          <strong>{activity.activityName}</strong>
                          <div style={{ color: '#27ae60', fontWeight: 'bold' }}>
                            +{activity.points} points
                          </div>
                          <small style={{ color: '#666' }}>{activity.category}</small>
                          {isPinned && (
                            <span style={{
                              backgroundColor: '#f1c40f',
                              color: '#2c3e50',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '10px',
                              marginLeft: '5px'
                            }}>
                              📌 Pinned
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
            
            {/* Negative Actions */}
            <div>
              <h3 style={{ color: '#c0392b', marginBottom: '15px' }}>Negative Actions</h3>
              <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                {negativeActivities.map((activity, index) => {
                  const isPinned = pinnedCustomActivities.some(
                    (pin) => pin.activityName === activity.activity
                  );
                  
                  return (
                    <button
                      key={index}
                      onClick={() => logPredefined(activity.activity, activity.points, activity.category)}
                      style={{
                        padding: '15px',
                        backgroundColor: '#f8d7da',
                        border: '2px solid #c0392b',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>{activity.emoji}</span>
                      <div>
                        <strong>{activity.activity}</strong>
                        <div style={{ color: '#c0392b', fontWeight: 'bold' }}>
                          {activity.points} points
                        </div>
                        <small style={{ color: '#666' }}>{activity.category}</small>
                        {isPinned && (
                          <span style={{
                            backgroundColor: '#f1c40f',
                            color: '#2c3e50',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '10px',
                            marginLeft: '5px'
                          }}>
                            📌 Pinned
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
                
                {/* Pinned negative custom activities */}
                {pinnedCustomActivities
                  .filter(pin => pin.points < 0 && !negativeActivities.some(na => na.activity === pin.activityName))
                  .map((activity, index) => {
                    const isPinned = true;
                    
                    return (
                      <button
                        key={`pinned-neg-${index}`}
                        onClick={() => logPredefined(activity.activityName, activity.points, activity.category)}
                        style={{
                          padding: '15px',
                          backgroundColor: '#f8d7da',
                          border: '2px solid #c0392b',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                      >
                        <span style={{ fontSize: '20px' }}>{activity.emoji || '⚠️'}</span>
                        <div>
                          <strong>{activity.activityName}</strong>
                          <div style={{ color: '#c0392b', fontWeight: 'bold' }}>
                            {activity.points} points
                          </div>
                          <small style={{ color: '#666' }}>{activity.category}</small>
                          {isPinned && (
                            <span style={{
                              backgroundColor: '#f1c40f',
                              color: '#2c3e50',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '10px',
                              marginLeft: '5px'
                            }}>
                              📌 Pinned
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Custom Activity Form */}
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>✏️ Log Custom Activity</h2>
            <form onSubmit={handleCustomSubmit} style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontSize: '14px' }}>
                  Activity Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Used reusable bag"
                  value={customActivity}
                  onChange={(e) => setCustomActivity(e.target.value)}
                  style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontSize: '14px' }}>
                  Points
                </label>
                <input
                  type="number"
                  placeholder="e.g., 5 or -5"
                  value={customPoints}
                  onChange={(e) => setCustomPoints(e.target.value)}
                  style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
              <div style={{ maxWidth: '150px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontSize: '14px' }}>
                  Category
                </label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '14px' }}
                >
                  {categories.map((cat, index) => (
                    <option key={index} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div style={{ maxWidth: '100px' }}>
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
                onClick={openGoalModal}
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
            {goals.filter(goal => !goal.isArchived).length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '30px',
                color: '#666',
                backgroundColor: '#f8f9fa',
                borderRadius: '12px',
                border: '2px dashed #ddd'
              }}>
                <div style={{ fontSize: '36px', marginBottom: '15px' }}>🎯</div>
                <p style={{ fontSize: '16px', marginBottom: '10px' }}>No active goals!</p>
                <p style={{ fontSize: '14px' }}>Set daily, weekly, or monthly eco-point targets to track your progress.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                {goals
                  .filter(goal => !goal.isArchived)
                  .map((goal) => {
                    const progress = Math.min((goal.currentPoints / goal.targetPoints) * 100, 100);
                    const isCompleted = goal.isCompleted;
                    const isExpired = new Date() > new Date(goal.endDate) && !isCompleted;
                    
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

          {/* Gemini Recommendations */}
          <Recommendations
            recommendations={recommendations}
            loadingRecommendations={loadingRecommendations}
            onPinSuggestion={pinSuggestedActivity}
            lastUpdate={lastRecommendationUpdate}
            cacheStatus={cacheStatus}
            onRefresh={refreshRecommendations}
          />

          {/* Badge Display */}
          <BadgeDisplay userId="default_user" showStats={true} />

          {/* Visualization */}
          <ProgressCharts userId="default_user" />

          {/* Notification Display */}
          {showNotification && notification && (
            <div style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              backgroundColor: '#27ae60',
              color: 'white',
              padding: '15px 20px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 10000,
              maxWidth: '300px',
              animation: 'slideInRight 0.3s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>🔔</span>
                <div>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4' }}>
                    {notification.message}
                  </p>
                  <small style={{ opacity: 0.8, fontSize: '12px' }}>
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </small>
                </div>
                <button
                  onClick={() => setShowNotification(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    fontSize: '18px',
                    cursor: 'pointer',
                    padding: '0',
                    marginLeft: '10px'
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
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

      {/* Goal Completion Notification */}
      {showGoalCompleteNotification && completedGoal && (
        <div style={{
          position: 'fixed',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#27ae60',
          color: 'white',
          padding: '32px 40px',
          borderRadius: '18px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          zIndex: 3000,
          textAlign: 'center',
          fontSize: '22px',
          fontWeight: 'bold',
          animation: 'fadeInScale 0.5s'
        }}>
          🎉 Congratulations!<br />
          You completed your <span style={{ textTransform: 'capitalize' }}>{completedGoal.goalType}</span> goal of <b>{completedGoal.targetPoints} points</b>!
        </div>
      )}
    </div>
  );
}

export default App;