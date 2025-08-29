function Recommendations({ 
  recommendations, 
  loadingRecommendations, 
  onPinSuggestion,
  lastUpdate,
  cacheStatus,
  onRefresh 
}) {
  if (loadingRecommendations) {
    return (
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>💡 AI Recommendations</h2>
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          <p>Generating personalized recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#2c3e50', margin: 0 }}>💡 AI Recommendations</h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {lastUpdate && (
            <small style={{ color: '#666' }}>
              Updated: {lastUpdate.toLocaleTimeString()}
              {cacheStatus.expiresIn && ` • Refreshes in: ${cacheStatus.expiresIn}`}
            </small>
          )}
          <button
            onClick={onRefresh}
            disabled={loadingRecommendations}
            style={{
              padding: '8px 12px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              opacity: loadingRecommendations ? 0.7 : 1
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>
      
      {/* General Advice */}
      <div style={{
        backgroundColor: '#e3f2fd',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '25px',
        borderLeft: '4px solid #2196f3'
      }}>
        <h3 style={{ color: '#0d47a1', marginTop: 0, marginBottom: '15px' }}>
          🌟 Personalized Advice
        </h3>
        <div style={{ whiteSpace: 'pre-line', lineHeight: '1.6', color: '#37474f' }}>
          {recommendations.generalAdvice}
        </div>
      </div>
      
      {/* Suggested Activities */}
      {recommendations.activitySuggestions.length > 0 && (
        <div>
          <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>📌 Suggested Activities to Pin</h3>
          <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
            {recommendations.activitySuggestions.map((activity, index) => (
              <div key={index} style={{
                padding: '15px',
                backgroundColor: '#f5f5f5',
                border: '2px dashed #9e9e9e',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>{activity.emoji}</span>
                  <div>
                    <strong>{activity.activityName}</strong>
                    <div style={{ color: activity.points >= 0 ? '#27ae60' : '#c0392b', fontWeight: 'bold' }}>
                      {activity.points >= 0 ? `+${activity.points}` : activity.points} points
                    </div>
                    <small style={{ color: '#666' }}>{activity.category}</small>
                  </div>
                </div>
                <button
                  onClick={() => onPinSuggestion(activity)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Pin
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Recommendations;