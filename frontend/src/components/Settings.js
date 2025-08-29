import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Settings({ onBack }) {
  const [settings, setSettings] = useState({
    notificationTime: '18:00',
    notificationsEnabled: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/settings/default_user');
      setSettings(response.data);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setMessage('Error loading settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await axios.put('http://localhost:5000/api/settings/default_user', settings);
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setMessage('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTimeChange = (e) => {
    setSettings({ ...settings, notificationTime: e.target.value });
  };

  const handleToggleNotifications = (e) => {
    setSettings({ ...settings, notificationsEnabled: e.target.checked });
  };

  

  const resetAllData = async () => {
    try {
      setResetLoading(true);
      await axios.delete('http://localhost:5000/api/reset-data/default_user');
      setMessage('All data has been reset successfully!');
      setResetConfirm(false);
      // Refresh the app by reloading the page
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      console.error('Error resetting data:', err);
      setMessage('Error resetting data');
      setResetLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '24px', marginBottom: '20px' }}>⏳</div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px', gap: '20px' }}>
        <button
          onClick={onBack}
          style={{
            padding: '10px 15px',
            backgroundColor: '#95a5a6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ← Back
        </button>
        <h1 style={{ margin: 0, color: '#2c3e50' }}>⚙️ Settings</h1>
      </div>

      {/* Message */}
      {message && (
        <div style={{
          padding: '15px',
          backgroundColor: message.includes('Error') ? '#f8d7da' : '#d4edda',
          color: message.includes('Error') ? '#721c24' : '#155724',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}

      {/* Notification Settings */}
      <div style={{ marginBottom: '40px', backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>🔔 Daily Reminders</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={handleToggleNotifications}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '16px', color: '#2c3e50' }}>Enable daily reminders</span>
          </label>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#555', fontSize: '14px' }}>
            Reminder Time
          </label>
          <input
            type="time"
            value={settings.notificationTime}
            onChange={handleTimeChange}
            disabled={!settings.notificationsEnabled}
            style={{
              padding: '12px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              fontSize: '16px',
              width: '100%',
              maxWidth: '200px',
              opacity: settings.notificationsEnabled ? 1 : 0.6
            }}
          />
          <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
            You'll receive reminders at this time based on your activity:
            <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
              <li>✅ If you logged activities today: Encouragement for tomorrow</li>
              <li>❌ If you didn't log today: Reminder to add activities</li>
              <li>📈 If you were active yesterday: Motivation to continue</li>
            </ul>
          </p>
        </div>

        <button
          onClick={saveSettings}
          disabled={saving}
          style={{
            padding: '12px 24px',
            backgroundColor: saving ? '#95a5a6' : '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      

      {/* Data Management */}
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>🗑️ Data Management</h2>
        
        {!resetConfirm ? (
          <div>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              This will permanently delete all your activities, goals, badges, and settings. This action cannot be undone.
            </p>
            <button
              onClick={() => setResetConfirm(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              Reset All Data
            </button>
          </div>
        ) : (
          <div>
            <p style={{ color: '#e74c3c', fontWeight: 'bold', marginBottom: '15px' }}>
              ⚠️ Are you sure you want to reset all data?
            </p>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              This will delete everything and start fresh. This cannot be undone!
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={resetAllData}
                disabled={resetLoading}
                style={{
                  padding: '12px 24px',
                  backgroundColor: resetLoading ? '#95a5a6' : '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: resetLoading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                {resetLoading ? 'Resetting...' : 'Yes, Reset Everything'}
              </button>
              <button
                onClick={() => setResetConfirm(false)}
                disabled={resetLoading}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: resetLoading ? 'not-allowed' : 'pointer',
                  fontSize: '16px'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings;