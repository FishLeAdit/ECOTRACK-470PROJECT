import React, { useState, useEffect } from 'react';
import axios from 'axios';

function GoalHistory({ onBack }) {
  const [goalHistory, setGoalHistory] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'successful', 'failed'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGoalHistory();
  }, []);

  const fetchGoalHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/goals/default_user/history');
      setGoalHistory(response.data);
    } catch (err) {
      console.error('❌ Error fetching goal history:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredGoals = goalHistory.filter(goal => {
    if (filter === 'all') return true;
    if (filter === 'successful') return goal.wasSuccessful;
    if (filter === 'failed') return !goal.wasSuccessful;
    return true;
  });

  const getStatusIcon = (wasSuccessful) => {
    return wasSuccessful ? '🎉' : '💔';
  };

  const getStatusColor = (wasSuccessful) => {
    return wasSuccessful ? '#27ae60' : '#e74c3c';
  };

  const getStatusText = (wasSuccessful) => {
    return wasSuccessful ? 'SUCCESS' : 'FAILED';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '24px', marginBottom: '20px' }}>⏳</div>
        <p>Loading goal history...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '30px',
        gap: '20px'
      }}>
        <button
          onClick={onBack}
          style={{
            padding: '10px 15px',
            backgroundColor: '#95a5a6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'background-color 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#7f8c8d'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#95a5a6'}
        >
          ← Back
        </button>
        <h1 style={{ margin: 0, color: '#2c3e50' }}>📚 Goal History</h1>
      </div>

      {/* Filter Controls */}
      <div style={{ 
        marginBottom: '30px',
        display: 'flex',
        gap: '15px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <span style={{ color: '#555', fontSize: '16px' }}>Filter by:</span>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '8px 16px',
            backgroundColor: filter === 'all' ? '#3498db' : '#ecf0f1',
            color: filter === 'all' ? 'white' : '#2c3e50',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.3s ease'
          }}
        >
          All Goals ({goalHistory.length})
        </button>
        <button
          onClick={() => setFilter('successful')}
          style={{
            padding: '8px 16px',
            backgroundColor: filter === 'successful' ? '#27ae60' : '#ecf0f1',
            color: filter === 'successful' ? 'white' : '#2c3e50',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.3s ease'
          }}
        >
          Successful ({goalHistory.filter(g => g.wasSuccessful).length})
        </button>
        <button
          onClick={() => setFilter('failed')}
          style={{
            padding: '8px 16px',
            backgroundColor: filter === 'failed' ? '#e74c3c' : '#ecf0f1',
            color: filter === 'failed' ? 'white' : '#2c3e50',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.3s ease'
          }}
        >
          Failed ({goalHistory.filter(g => !g.wasSuccessful).length})
        </button>
      </div>

      {/* Goal History List */}
      {filteredGoals.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#666',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          border: '2px dashed #ddd'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📚</div>
          <p style={{ fontSize: '18px', marginBottom: '10px' }}>
            {filter === 'all' ? 'No goal history yet!' : `No ${filter} goals found`}
          </p>
          <p style={{ fontSize: '14px' }}>
            {filter === 'all' 
              ? 'Complete some goals to see your history here.' 
              : `Try completing some goals to see ${filter} results.`
            }
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {filteredGoals.map((goal) => (
            <div key={goal._id} style={{
              backgroundColor: 'white',
              padding: '25px',
              borderRadius: '12px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              border: `3px solid ${getStatusColor(goal.wasSuccessful)}`,
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Status Badge */}
              <div style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                padding: '8px 12px',
                backgroundColor: getStatusColor(goal.wasSuccessful),
                color: 'white',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {getStatusIcon(goal.wasSuccessful)} {getStatusText(goal.wasSuccessful)}
              </div>

              {/* Goal Header */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ 
                  margin: '0 0 10px 0', 
                  color: '#2c3e50',
                  fontSize: '22px',
                  textTransform: 'capitalize'
                }}>
                  {goal.goalType} Goal
                </h3>
                <p style={{ 
                  margin: '0', 
                  color: '#7f8c8d',
                  fontSize: '16px'
                }}>
                  Completed on {new Date(goal.completionDate).toLocaleDateString()}
                </p>
              </div>

              {/* Goal Details */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '20px'
              }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#555', fontSize: '14px' }}>Target</h4>
                  <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#2c3e50' }}>
                    {goal.targetPoints} points
                  </p>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#555', fontSize: '14px' }}>Achieved</h4>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    color: goal.wasSuccessful ? '#27ae60' : '#e74c3c'
                  }}>
                    {goal.currentPoints} points
                  </p>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#555', fontSize: '14px' }}>Period</h4>
                  <p style={{ margin: 0, fontSize: '14px', color: '#2c3e50' }}>
                    {new Date(goal.startDate).toLocaleDateString()} - {new Date(goal.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ marginBottom: '15px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontSize: '14px', color: '#555' }}>
                    Progress: {goal.currentPoints} / {goal.targetPoints} points
                  </span>
                  <span style={{ 
                    fontSize: '14px', 
                    fontWeight: 'bold',
                    color: getStatusColor(goal.wasSuccessful)
                  }}>
                    {Math.round((goal.currentPoints / goal.targetPoints) * 100)}%
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '10px',
                  backgroundColor: '#ecf0f1',
                  borderRadius: '5px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min((goal.currentPoints / goal.targetPoints) * 100, 100)}%`,
                    height: '100%',
                    backgroundColor: getStatusColor(goal.wasSuccessful),
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              {/* Achievement Message */}
              <div style={{
                padding: '15px',
                backgroundColor: goal.wasSuccessful ? '#d5f4e6' : '#fadbd8',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <span style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: getStatusColor(goal.wasSuccessful)
                }}>
                  {goal.wasSuccessful 
                    ? `🎉 Congratulations! You achieved your ${goal.goalType} goal!` 
                    : `💪 Keep trying! You were ${goal.targetPoints - goal.currentPoints} points short of your ${goal.goalType} goal.`
                  }
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GoalHistory;
