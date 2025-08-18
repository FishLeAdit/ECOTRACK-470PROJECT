import React, { useEffect, useState } from 'react';

const BadgeNotification = ({ badges = [], onClose }) => {
  const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const rarityColors = {
    common: '#95a5a6',
    rare: '#3498db',
    epic: '#9b59b6',
    legendary: '#f39c12'
  };

  const rarityEmojis = {
    common: '🌟',
    rare: '💎',
    epic: '👑',
    legendary: '🔥'
  };

  useEffect(() => {
    if (badges.length > 0) {
      setCurrentBadgeIndex(0);
      setIsVisible(true);
    }
  }, [badges]);

  useEffect(() => {
    if (!isVisible || badges.length === 0) return;

    const timer = setTimeout(() => {
      if (currentBadgeIndex < badges.length - 1) {
        setCurrentBadgeIndex(currentBadgeIndex + 1);
      } else {
        // All badges shown, close notification
        setIsVisible(false);
        setTimeout(() => {
          onClose && onClose();
        }, 300);
      }
    }, 3000); // Show each badge for 3 seconds

    return () => clearTimeout(timer);
  }, [currentBadgeIndex, badges.length, isVisible, onClose]);

  if (!isVisible || badges.length === 0) return null;

  const currentBadge = badges[currentBadgeIndex];
  const progress = `${currentBadgeIndex + 1}/${badges.length}`;

  return (
    <div
      style={{
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        animation: 'fadeIn 0.3s ease-in'
      }}
      onClick={() => {
        setIsVisible(false);
        setTimeout(() => onClose && onClose(), 300);
      }}
    >
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes badgePop {
            0% { transform: scale(0.5) rotate(-5deg); opacity: 0; }
            50% { transform: scale(1.1) rotate(2deg); opacity: 1; }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
          }
          
          @keyframes sparkle {
            0%, 100% { transform: scale(1); opacity: 0.7; }
            50% { transform: scale(1.2); opacity: 1; }
          }
          
          .badge-container {
            animation: badgePop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          }
          
          .sparkle {
            animation: sparkle 1s ease-in-out infinite;
          }
        `}
      </style>

      <div
        className="badge-container"
        style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '400px',
          width: '90%',
          position: 'relative',
          border: `4px solid ${rarityColors[currentBadge.badgeRarity]}`,
          boxShadow: `0 0 30px ${rarityColors[currentBadge.badgeRarity]}40, 0 10px 30px rgba(0,0,0,0.3)`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose && onClose(), 300);
          }}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#95a5a6',
            transition: 'color 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.color = '#e74c3c'}
          onMouseLeave={(e) => e.target.style.color = '#95a5a6'}
        >
          ×
        </button>

        {/* Progress indicator */}
        {badges.length > 1 && (
          <div style={{
            position: 'absolute',
            top: '15px',
            left: '15px',
            backgroundColor: rarityColors[currentBadge.badgeRarity],
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {progress}
          </div>
        )}

        {/* Celebration Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <span className="sparkle" style={{ fontSize: '24px', marginRight: '10px' }}>🎉</span>
          <h2 style={{
            color: rarityColors[currentBadge.badgeRarity],
            margin: 0,
            fontSize: '28px',
            fontWeight: 'bold'
          }}>
            BADGE EARNED!
          </h2>
          <span className="sparkle" style={{ fontSize: '24px', marginLeft: '10px' }}>🎉</span>
        </div>

        {/* Rarity Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: rarityColors[currentBadge.badgeRarity],
          color: 'white',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          marginBottom: '20px',
          letterSpacing: '1px'
        }}>
          <span style={{ marginRight: '5px' }}>{rarityEmojis[currentBadge.badgeRarity]}</span>
          {currentBadge.badgeRarity} BADGE
        </div>

        {/* Badge Icon */}
        <div style={{
          fontSize: '80px',
          marginBottom: '20px',
          filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))'
        }}>
          {currentBadge.badgeIcon}
        </div>

        {/* Badge Name */}
        <h3 style={{
          color: '#2c3e50',
          fontSize: '24px',
          fontWeight: 'bold',
          margin: '0 0 10px 0'
        }}>
          {currentBadge.badgeName}
        </h3>

        {/* Badge Description */}
        <p style={{
          color: '#7f8c8d',
          fontSize: '16px',
          lineHeight: '1.4',
          margin: '0 0 20px 0'
        }}>
          {currentBadge.badgeDescription}
        </p>

        {/* Related Value */}
        {currentBadge.relatedValue && (
          <div style={{
            backgroundColor: `${rarityColors[currentBadge.badgeRarity]}20`,
            color: rarityColors[currentBadge.badgeRarity],
            padding: '8px 16px',
            borderRadius: '16px',
            fontSize: '18px',
            fontWeight: 'bold',
            display: 'inline-block',
            marginBottom: '20px',
            border: `2px solid ${rarityColors[currentBadge.badgeRarity]}`
          }}>
            Achievement Value: {currentBadge.relatedValue}
          </div>
        )}

        {/* Continue button */}
        <button
          onClick={() => {
            if (currentBadgeIndex < badges.length - 1) {
              setCurrentBadgeIndex(currentBadgeIndex + 1);
            } else {
              setIsVisible(false);
              setTimeout(() => onClose && onClose(), 300);
            }
          }}
          style={{
            backgroundColor: rarityColors[currentBadge.badgeRarity],
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '25px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: `0 4px 12px ${rarityColors[currentBadge.badgeRarity]}40`
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = `0 6px 16px ${rarityColors[currentBadge.badgeRarity]}60`;
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = `0 4px 12px ${rarityColors[currentBadge.badgeRarity]}40`;
          }}
        >
          {currentBadgeIndex < badges.length - 1 ? 'Next Badge' : 'Awesome!'}
        </button>

        {/* Progress dots */}
        {badges.length > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '6px',
            marginTop: '20px'
          }}>
            {badges.map((_, index) => (
              <div
                key={index}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: index === currentBadgeIndex 
                    ? rarityColors[currentBadge.badgeRarity]
                    : '#ddd',
                  transition: 'background-color 0.3s ease'
                }}
              />
            ))}
          </div>
        )}

        {/* Decorative sparkles */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '30px',
          fontSize: '16px',
          opacity: '0.6'
        }} className="sparkle">✨</div>
        <div style={{
          position: 'absolute',
          top: '40px',
          right: '40px',
          fontSize: '12px',
          opacity: '0.6'
        }} className="sparkle">⭐</div>
        <div style={{
          position: 'absolute',
          bottom: '30px',
          left: '25px',
          fontSize: '14px',
          opacity: '0.6'
        }} className="sparkle">✨</div>
        <div style={{
          position: 'absolute',
          bottom: '50px',
          right: '30px',
          fontSize: '10px',
          opacity: '0.6'
        }} className="sparkle">💫</div>
      </div>
    </div>
  );
};

export default BadgeNotification;