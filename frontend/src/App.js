import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [activities, setActivities] = useState([]);
  const [customActivity, setCustomActivity] = useState('');
  const [customPoints, setCustomPoints] = useState('');
  const [customEmoji, setCustomEmoji] = useState('');
  const [customCategory, setCustomCategory] = useState('General');
  const [totalScore, setTotalScore] = useState(0);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

  // Available categories
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

  //predefined positive activities
  const [positiveActivities, setPositiveActivities] = useState([
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

  // predefined negative activities
  const [negativeActivities, setNegativeActivities] = useState([
    { activity: "Drove Car Alone", points: -5, emoji: "🚗", category: "Transportation" },
    { activity: "Used Plastic Bags", points: -2, emoji: "🛍️", category: "Shopping" },
    { activity: "Wasted Food", points: -3, emoji: "🗑️", category: "Food" },
    { activity: "Left Lights/AC On", points: -4, emoji: "💡", category: "Energy" },
    { activity: "Took Short Flight (<500km)", points: -8, emoji: "✈️", category: "Transportation" },
    { activity: "Used Disposable Bottles", points: -2, emoji: "🥤", category: "Water" }
  ]);

  // localstorage custom activities
  useEffect(() => {
    const savedPositive = localStorage.getItem('customPositiveActivities');
    const savedNegative = localStorage.getItem('customNegativeActivities');
    
    if (savedPositive) {
      setPositiveActivities(prev => [...prev, ...JSON.parse(savedPositive)]);
    }
    if (savedNegative) {
      setNegativeActivities(prev => [...prev, ...JSON.parse(savedNegative)]);
    }
  }, []);

  // activities from backend
  const fetchActivities = () => {
    axios.get('http://localhost:5000/api/activities')
      .then(res => {
        console.log('✅ Activities fetched:', res.data);
        console.log('📥 Sample activity data:', res.data[0]);
        console.log('📥 Categories in activities:', res.data.map(a => ({ id: a._id, category: a.category, activity: a.activityName || a.activity })));
        setActivities(res.data);
        calculateScore(res.data);
      })
      .catch(err => {
        console.error('❌ Error fetching activities:', err);
        alert('Error fetching activities: ' + (err.response?.data?.error || err.message));
      });
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  // add predefined activity
  const logPredefined = async (activity, points, category) => {
    try {
      const payload = { 
        activity: activity, 
        points: points,
        category: category
      };
      console.log('📤 Sending predefined activity:', payload);
      console.log('📤 Category being sent:', category);
      
      const response = await axios.post('http://localhost:5000/api/activities', payload);
      console.log('✅ Predefined activity added successfully');
      console.log('📥 Response from server:', response.data);
      fetchActivities();
    } catch (err) {
      console.error('❌ Error adding predefined activity:', err);
      alert("Error adding activity: " + (err.response?.data?.error || err.message));
    }
  };



  // add custom activity and option to save as predefined
  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    if (!customActivity || !customPoints) return alert("Please fill all fields");

    try {
      const payload = { 
        activity: customActivity, 
        points: parseInt(customPoints),
        category: customCategory
      };
      console.log('📤 Sending custom activity:', payload);
      console.log('📤 Custom category being sent:', customCategory);
      
      const response = await axios.post('http://localhost:5000/api/activities', payload);
      console.log('✅ Custom activity added successfully');
      console.log('📥 Response from server:', response.data);
      
      // Ask user if they want to save this as a predefined activity
      const shouldSave = window.confirm(
        `Would you like to save "${customActivity}" as a quick-access button for future use?`
      );
      
      if (shouldSave) {
        const newActivity = {
          activity: customActivity,
          points: parseInt(customPoints),
          emoji: customEmoji || (parseInt(customPoints) > 0 ? '✨' : '⚠️'),
          category: customCategory,
          isCustom: true
        };
        
        if (parseInt(customPoints) > 0) {
          const updatedPositive = [...positiveActivities, newActivity];
          setPositiveActivities(updatedPositive);
          
          // CUSTPOSACT
          const customPositive = updatedPositive.filter(a => a.isCustom);
          localStorage.setItem('customPositiveActivities', JSON.stringify(customPositive));
        } else {
          const updatedNegative = [...negativeActivities, newActivity];
          setNegativeActivities(updatedNegative);
          
          // CUSTNEGACT
          const customNegative = updatedNegative.filter(a => a.isCustom);
          localStorage.setItem('customNegativeActivities', JSON.stringify(customNegative));
        }
        
        alert('Activity saved as a quick-access button!');
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
      console.log('✅ Activity deleted successfully');
      fetchActivities();
    } catch (err) {
      console.error('❌ Error deleting activity:', err);
      alert("Error deleting activity: " + (err.response?.data?.error || err.message));
    }
  };

  // Remove custom predefined activity
  const removeCustomActivity = (activityToRemove, isPositive) => {
    if (!activityToRemove.isCustom) return;
    
    const confirmDelete = window.confirm(
      `Remove "${activityToRemove.activity}" from quick-access buttons?`
    );
    
    if (confirmDelete) {
      if (isPositive) {
        const updated = positiveActivities.filter(a => a !== activityToRemove);
        setPositiveActivities(updated);
        const customOnly = updated.filter(a => a.isCustom);
        localStorage.setItem('customPositiveActivities', JSON.stringify(customOnly));
      } else {
        const updated = negativeActivities.filter(a => a !== activityToRemove);
        setNegativeActivities(updated);
        const customOnly = updated.filter(a => a.isCustom);
        localStorage.setItem('customNegativeActivities', JSON.stringify(customOnly));
      }
    }
  };

  // Calculate total score
  const calculateScore = (data) => {
    const sum = data.reduce((acc, curr) => acc + curr.points, 0);
    setTotalScore(sum);
  };

  // Activity box component
  const ActivityBox = ({ activity, points, emoji, category, isCustom, isPositive, onClick, onRemove }) => (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => onClick(activity, points)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '160px',
          height: '120px',
          padding: '15px',
          margin: '5px',
          backgroundColor: isPositive ? '#27ae60' : '#c0392b',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease',
          fontSize: '12px',
          fontWeight: 'bold',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        }}
      >
        <div style={{ 
          fontSize: '24px', 
          marginBottom: '8px',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
        }}>
          {emoji}
        </div>
        <div style={{ 
          fontSize: '11px', 
          lineHeight: '1.2',
          marginBottom: '4px',
          textShadow: '0 1px 2px rgba(0,0,0,0.3)'
        }}>
          {activity}
        </div>
        <div style={{ 
          fontSize: '9px', 
          color: 'rgba(255,255,255,0.9)',
          marginBottom: '4px',
          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
          backgroundColor: 'rgba(255,255,255,0.15)',
          padding: '1px 6px',
          borderRadius: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontWeight: 'bold'
        }}>
          {category || 'General'}
        </div>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: 'bold',
          backgroundColor: 'rgba(255,255,255,0.2)',
          padding: '2px 8px',
          borderRadius: '10px',
          textShadow: '0 1px 2px rgba(0,0,0,0.3)'
        }}>
          {points > 0 ? `+${points}` : points}
        </div>
      </button>
      
      {isCustom && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={{
            position: 'absolute',
            top: '0px',
            right: '0px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}
          title="Remove custom activity"
        >
          ×
        </button>
      )}
    </div>
  );

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto', fontFamily: 'Arial, sans-serif', padding: '0 20px' }}>
      <h1 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '10px' }}>🌍 EcoTrack</h1>
      <p style={{ textAlign: 'center', color: '#7f8c8d', marginBottom: '30px' }}>
        Track your daily environmental impact
      </p>

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
          fontSize: '28px',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          {totalScore}
        </span>
      </div>

      {/* Positive Activities */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ 
          color: '#27ae60', 
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          fontSize: '24px'
        }}>
          🌟 Positive Activities
        </h2>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '10px', 
          justifyContent: 'flex-start'
        }}>
          {positiveActivities.map((p, idx) => (
            <ActivityBox
              key={`positive-${idx}`}
              activity={p.activity}
              points={p.points}
              emoji={p.emoji}
              category={p.category}
              isCustom={p.isCustom}
              isPositive={true}
              onClick={() => logPredefined(p.activity, p.points, p.category)}
              onRemove={() => removeCustomActivity(p, true)}
            />
          ))}
        </div>
      </div>

      {/* Negative Activities */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ 
          color: '#c0392b', 
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          fontSize: '24px'
        }}>
          ⚠️ Negative Activities
        </h2>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '10px', 
          justifyContent: 'flex-start'
        }}>
          {negativeActivities.map((n, idx) => (
            <ActivityBox
              key={`negative-${idx}`}
              activity={n.activity}
              points={n.points}
              emoji={n.emoji}
              category={n.category}
              isCustom={n.isCustom}
              isPositive={false}
              onClick={() => logPredefined(n.activity, n.points, n.category)}
              onRemove={() => removeCustomActivity(n, false)}
            />
          ))}
        </div>
      </div>

      {/* custom activity form */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '25px',
        borderRadius: '15px',
        marginBottom: '40px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ 
          color: '#2c3e50', 
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center'
        }}>
          ✨ Add Custom Activity
        </h2>
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
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '2px solid #ddd', 
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
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
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '2px solid #ddd', 
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          <div style={{ flex: '1', minWidth: '100px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontSize: '14px' }}>
              Category
            </label>
            <select
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '2px solid #ddd', 
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
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
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '2px solid #ddd', 
                borderRadius: '8px',
                fontSize: '14px',
                textAlign: 'center',
                boxSizing: 'border-box'
              }}
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
              fontWeight: 'bold',
              transition: 'background-color 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#2980b9'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#3498db'}
          >
            Add Activity
          </button>
        </form>
        <p style={{ 
          marginTop: '15px', 
          fontSize: '12px', 
          color: '#666',
          fontStyle: 'italic'
        }}>
          💡 Tip: After adding, you'll be asked if you want to save this as a quick-access button!
        </p>
      </div>

      {/* Activity Log */}
      <div>
        <h2 style={{ 
          color: '#2c3e50', 
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center'
        }}>
          📋 Activity Log
        </h2>
        
        {/* Category Filter */}
        <div style={{ 
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <span style={{ color: '#555', fontSize: '14px' }}>Filter by category:</span>
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            style={{ 
              padding: '8px 12px', 
              border: '2px solid #ddd', 
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value="All">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <span style={{ 
            color: '#666', 
            fontSize: '12px',
            marginLeft: 'auto'
          }}>
            Showing {activities.filter(a => selectedCategoryFilter === 'All' || a.category === selectedCategoryFilter).length} of {activities.length} activities
          </span>
        </div>
        {activities.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#666',
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            border: '2px dashed #ddd'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>🌱</div>
            <p style={{ fontSize: '18px', marginBottom: '10px' }}>No activities logged yet!</p>
            <p style={{ fontSize: '14px' }}>Start by clicking on an activity above to begin tracking your environmental impact.</p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {activities
              .filter(a => selectedCategoryFilter === 'All' || a.category === selectedCategoryFilter)
              .map((a) => (
              <li key={a._id} style={{
                background: a.points >= 0 ? 'linear-gradient(135deg, #e8f5e8, #d4edda)' : 'linear-gradient(135deg, #f8d7da, #f5c6cb)',
                color: a.points >= 0 ? '#2c3e50' : '#721c24',
                marginBottom: '15px',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: `2px solid ${a.points >= 0 ? '#27ae60' : '#c0392b'}`,
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '20px', marginRight: '10px' }}>
                      {a.points >= 0 ? '🌟' : '⚠️'}
                    </span>
                    <strong style={{ fontSize: '16px' }}>{a.activityName || a.activity}</strong>
                  </div>
                  <div style={{ marginBottom: '5px' }}>
                    <span style={{ 
                      color: a.points >= 0 ? '#27ae60' : '#c0392b',
                      fontSize: '18px',
                      fontWeight: 'bold'
                    }}>
                      {a.points >= 0 ? `+${a.points}` : `${a.points}`} points
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                    <small style={{ color: '#666', fontSize: '12px' }}>
                      📅 {new Date(a.date).toLocaleString()}
                      {a.type && ` • ${a.type}`}
                    </small>
                    {a.category && (
                      <span style={{
                        backgroundColor: a.points >= 0 ? '#27ae60' : '#c0392b',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        🏷️ {a.category}
                      </span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(a._id)}
                  style={{
                    marginLeft: '15px',
                    padding: '8px 12px',
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'background-color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#c0392b'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#e74c3c'}
                >
                  🗑️ Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>


    </div>
  );
}

export default App;