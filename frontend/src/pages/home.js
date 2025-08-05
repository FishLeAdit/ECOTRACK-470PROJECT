import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Home() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/activities')
      .then(res => setActivities(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h1>Eco Activities</h1>
      <ul>
        {activities.map((a, i) => (
          <li key={i}>{a.activity} - {a.points} pts</li>
        ))}
      </ul>
    </div>
  );
}

export default Home;
