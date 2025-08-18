import React, { useEffect, useState } from 'react';
import axios from 'axios';

function BadgeDisplay(props) {
  const { userId = 'default_user', showStats = true } = props;
  const [badges, setBadges] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllBadges, setShowAllBadges] = useState(false);

  // Rarity colors
  const rarityColors = {
    common: '#95a5a6',
    rare: '#3498db',
    epic: '#9b59b6',
    legendary: '#f39c12'
  };

  const rarityGlow = {
    common: '0 0 10px rgba(149, 165, 166, 0.5)',
    rare: '0 0 15px rgba(52, 152, 219, 0.6)',
    epic: '0 0 20px rgba(155, 89, 182, 0.7)',
    legendary: '0 0 25px rgba(243, 156, 18, 0.8)'
  };

  useEffect(() => {
    fetchBadgesAndStats();
  }, [userId]);

  const fetchBadgesAndStats = async () => {
    try {
      setLoading(true);
      const [badgesResponse, statsResponse] = await Promise.all([
        axios.get(`http://localhost:5000/api/badges/${userId}`),
        axios.get(`http://localhost:5000/api/stats/${userId}`)
      ]);
      
      setBadges(badgesResponse.data);
      setUserStats(statsResponse.data);
    } catch (error) {
      console.error('Error fetching badges and stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px',
        color: '#666'
      }}>
        <div style={{ fontSize: '24px' }}>🏆</div>
        <span style={{ marginLeft: '10px' }}>Loading badges...</span>
      </div>
    );
  }

  const displayedBadges = showAllBadges ? badges : badges.slice(0, 6);
  const badgesByRarity = badges.reduce((acc, badge) => {
    acc[badge.badgeRarity] = (acc[badge.badgeRarity] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{
      backgroundColor: '#f8f9fa',
      borderRadius: '15px',
      padding: '25px',
      marginBottom: '30px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{
          color: '#2c3e50',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          fontSize: '24px'
        }}>
          🏆 Your Badges ({badges.length})
        </h2>
        
        {badges.length > 6 && (
          <button
            onClick={() => setShowAllBadges(!showAllBadges)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'background-color 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#2980b9'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#3498db'}
          >
            {showAllBadges ? 'Show Less' : 'Show All'}
          </button>
        )}
      </div>

      {/* Stats Overview */}
      {showStats && userStats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '15px',
          marginBottom: '25px',
          padding: '15px',
          backgroundColor: 'white',
          borderRadius: '10px',
          border: '2px solid #ecf0f1'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', color: '#e67e22', marginBottom: '5px' }}>🔥</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50' }}>
              {userStats.currentStreak}
            </div>
            <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Current Streak</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', color: '#27ae60', marginBottom: '5px' }}>🌟</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50' }}>
              {userStats.consecutivePositiveActivities}
            </div>
            <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Positive Streak</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', color: '#3498db', marginBottom: '5px' }}>💯</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50' }}>
              {userStats.totalPoints}
            </div>
            <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Total Points</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', color: '#9b59b6', marginBottom: '5px' }}>🎯</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50' }}>
              {userStats.goalsCompleted}
            </div>
            <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Goals Done</div>
          </div>
        </div>
      )}

      {/* Badge Rarity Summary */}
      {badges.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          {Object.entries(badgesByRarity).map(([rarity, count]) => (
            <div key={rarity} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: `2px solid ${rarityColors[rarity]}`,
              boxShadow: rarityGlow[rarity]
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: rarityColors[rarity]
              }}></div>
              <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'capitalize' }}>
                {rarity}: {count}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Badges Grid */}
      {badges.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#666',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '2px dashed #ddd'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>🏆</div>
          <p style={{ fontSize: '18px', marginBottom: '10px' }}>No badges earned yet!</p>
          <p style={{ fontSize: '14px' }}>Start logging eco-activities to earn your first badges.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px'
        }}>
          {displayedBadges.map((badge) => (
            <div
              key={badge._id}
              style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '12px',
                textAlign: 'center',
                border: `3px solid ${rarityColors[badge.badgeRarity]}`,
                boxShadow: rarityGlow[badge.badgeRarity],
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = `${rarityGlow[badge.badgeRarity]}, 0 8px 16px rgba(0,0,0,0.2)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = rarityGlow[badge.badgeRarity];
              }}
            >
              {/* Rarity indicator */}
              <div style={{
                position: 'absolute',
                top: '0',
                right: '0',
                padding: '4px 8px',
                backgroundColor: rarityColors[badge.badgeRarity],
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                borderBottomLeftRadius: '8px'
              }}>
                {badge.badgeRarity}
              </div>

              {/* Badge Icon */}
              <div style={{
                fontSize: '48px',
                marginBottom: '10px',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
              }}>
                {badge.badgeIcon}
              </div>

              {/* Badge Name */}
              <h3 style={{
                margin: '0 0 8px 0',
                color: '#2c3e50',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                {badge.badgeName}
              </h3>

              {/* Badge Description */}
              <p style={{
                margin: '0 0 12px 0',
                color: '#7f8c8d',
                fontSize: '12px',
                lineHeight: '1.4'
              }}>
                {badge.badgeDescription}
              </p>

              {/* Related Value */}
              {badge.relatedValue && (
                <div style={{
                  backgroundColor: rarityColors[badge.badgeRarity],
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  display: 'inline-block',
                  marginBottom: '8px'
                }}>
                  {badge.relatedValue}
                </div>
              )}

              {/* Earned Date */}
              <div style={{
                fontSize: '10px',
                color: '#95a5a6',
                marginTop: '8px'
              }}>
                Earned: {new Date(badge.earnedDate).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Show more indicator */}
      {!showAllBadges && badges.length > 6 && (
        <div style={{
          textAlign: 'center',
          marginTop: '15px',
          color: '#7f8c8d',
          fontSize: '14px'
        }}>
          ... and {badges.length - 6} more badges
        </div>
      )}
    </div>
  );
};

export default BadgeDisplay;