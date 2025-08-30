import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

function ProgressCharts({ userId }) {
  const [categoryData, setCategoryData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [carbonHistory, setCarbonHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#48DBFB', '#F368E0', '#1DD1A1'];

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [activitiesRes, carbonRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/activities/${userId}`),
          axios.get(`http://localhost:5000/api/carbon/history/${userId}`)
        ]);
        
        const activities = activitiesRes.data;
        
        // Process category data
        const categoryMap = {};
        activities.forEach(activity => {
          const category = activity.category || 'General';
          if (!categoryMap[category]) {
            categoryMap[category] = {
              category,
              points: 0,
              count: 0,
              carbon: 0
            };
          }
          categoryMap[category].points += activity.points;
          categoryMap[category].count += 1;
          categoryMap[category].carbon += activity.carbonEmission || 0;
        });
        
        setCategoryData(Object.values(categoryMap));
        
        // Process daily data
        const dailyMap = {};
        activities.forEach(activity => {
          const date = new Date(activity.date).toISOString().split('T')[0];
          if (!dailyMap[date]) {
            dailyMap[date] = {
              date,
              points: 0,
              count: 0,
              carbon: 0
            };
          }
          dailyMap[date].points += activity.points;
          dailyMap[date].count += 1;
          dailyMap[date].carbon += activity.carbonEmission || 0;
        });
        
        // Convert to array and sort by date
        const dailyArray = Object.values(dailyMap).sort((a, b) => 
          new Date(a.date) - new Date(b.date)
        );
        
        setDailyData(dailyArray);
        
        // Set carbon history
        setCarbonHistory(carbonRes.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching chart data:', err);
        setLoading(false);
      }
    };

    fetchChartData();
  }, [userId]);

  if (loading) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px',
        color: '#666'
      }}>
        <p>Loading charts...</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '40px' }}>
      <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>📊 Progress & Carbon Analytics</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        
        {/* Points by Category */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>Points by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="points" fill="#3498db" name="Points" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Activities by Category */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>Activities by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, count }) => `${category}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                nameKey="category"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Daily Points Trend */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>Daily Points Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="points" fill="#27ae60" name="Points" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Carbon Emission History */}
        {carbonHistory.length > 0 && (
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>Carbon Emission History</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={carbonHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis label={{ value: 'kg CO₂e', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Area type="monotone" dataKey="carbon" stroke="#e74c3c" fill="#fadbd8" name="Carbon Emissions" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {/* Carbon by Category */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>Carbon Impact by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="carbon" fill="#e74c3c" name="Carbon (kg CO₂e)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Daily Carbon Trend */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>Daily Carbon Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis label={{ value: 'kg CO₂e', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="carbon" fill="#e74c3c" name="Carbon (kg CO₂e)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
      </div>
      
      {categoryData.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#666',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          border: '2px dashed #ddd'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>📊</div>
          <p style={{ fontSize: '18px', marginBottom: '10px' }}>No data available for charts!</p>
          <p style={{ fontSize: '14px' }}>Start logging activities to see your progress visualized.</p>
        </div>
      )}
    </div>
  );
}

export default ProgressCharts;