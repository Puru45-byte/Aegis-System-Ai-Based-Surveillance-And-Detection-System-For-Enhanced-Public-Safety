import React, { useState, useEffect } from 'react';

const PoliceStationsPage = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/police-stations');
      const data = await response.json();
      if (data.success) {
        setStations(data.data);
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-background min-h-screen">
      <h1 className="text-3xl font-bold text-textMain mb-8">Police Station Management</h1>
      
      {loading ? (
        <div className="text-textMuted">Loading...</div>
      ) : (
        <div>
          <p className="text-textMuted">Found {stations.length} stations</p>
          {stations.map(station => (
            <div key={station.id} className="bg-surface p-4 mb-4 rounded-lg border border-borderContent">
              <h3 className="text-textMain font-semibold">{station.name}</h3>
              <p className="text-textMuted">{station.address}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PoliceStationsPage;
