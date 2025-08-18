// First, create a new file ActivityLog.js in your components folder:
import React from 'react';

function ActivityLog({ activities, handleDelete, pinnedCustomActivities, pinCustomActivity, unpinCustomActivity, positiveActivities, negativeActivities, categories, selectedCategoryFilter, setSelectedCategoryFilter }) {
  return (
    <div>
      <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>📋 Activity Log</h2>
      
      {/* Category Filter */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ color: '#555', fontSize: '14px' }}>Filter by category:</span>
        <select
          value={selectedCategoryFilter}
          onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '2px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
        >
          <option value="All">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
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
            .map((a) => {
              // Only show pin button for custom activities (not in predefined lists and not already pinned)
              const isPredefined = positiveActivities.some(p => p.activity === a.activityName) ||
                                   negativeActivities.some(n => n.activity === a.activityName);
              const isPinned = pinnedCustomActivities.some(p => p.activityName === a.activityName);

              return (
                <li key={a._id} style={{
                  background: a.points >= 0 ? '#e8f5e8' : '#f8d7da',
                  color: a.points >= 0 ? '#2c3e50' : '#721c24',
                  marginBottom: '15px',
                  padding: '20px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: `2px solid ${a.points >= 0 ? '#27ae60' : '#c0392b'}`
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '20px', marginRight: '10px' }}>
                        {a.points >= 0 ? '🌟' : '⚠️'}
                      </span>
                      <strong style={{ fontSize: '16px' }}>{a.activityName}</strong>
                    </div>
                    <div style={{ marginBottom: '5px' }}>
                      <span style={{ color: a.points >= 0 ? '#27ae60' : '#c0392b', fontSize: '18px', fontWeight: 'bold' }}>
                        {a.points >= 0 ? `+${a.points}` : `${a.points}`} points
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                      <small style={{ color: '#666', fontSize: '12px' }}>
                        📅 {new Date(a.date).toLocaleString()}
                      </small>
                      {a.category && (
                        <span style={{
                          backgroundColor: a.points >= 0 ? '#27ae60' : '#c0392b',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          textTransform: 'uppercase'
                        }}>
                          🏷️ {a.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
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
                        marginBottom: '8px'
                      }}
                    >
                      🗑️ Delete
                    </button>
                    {/* Pin button for custom activities */}
                    {!isPredefined && !isPinned && (
                      <button
                        onClick={() => pinCustomActivity({
                          activityName: a.activityName,
                          points: a.points,
                          category: a.category,
                          emoji: a.emoji || '✨'
                        })}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: '#f1c40f',
                          color: '#2c3e50',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        📌 Pin
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}

export default ActivityLog;