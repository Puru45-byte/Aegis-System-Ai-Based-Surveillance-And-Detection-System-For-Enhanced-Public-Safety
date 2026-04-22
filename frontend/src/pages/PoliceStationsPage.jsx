import React, { useState, useEffect } from 'react';
import { MapPin, Edit2, Trash2, Plus, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import axiosClient from '../api/axiosClient';

// Map Picker Component
const MapPicker = ({ center, onLocationSelect, markerPosition }) => {
  const mapRef = React.useRef(null);
  const markerRef = React.useRef(null);

  useEffect(() => {
    // Load Leaflet dynamically only when component mounts
    const loadLeaflet = async () => {
      if (typeof window !== 'undefined' && !window.L) {
        // Load Leaflet CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        // Load Leaflet JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => initMap();
        document.head.appendChild(script);
      } else {
        initMap();
      }
    };

    const initMap = () => {
      if (!mapRef.current || !window.L) return;

      const L = window.L;
      
      // Initialize map
      const map = L.map(mapRef.current).setView(center, 5);
      
      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Custom icon
      const customIcon = L.divIcon({
        html: `
          <div style="
            background: #3b82f6;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
        `,
        className: 'custom-div-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 24]
      });

      // Add marker if position exists
      if (markerPosition) {
        const marker = L.marker(markerPosition, { icon: customIcon }).addTo(map);
        markerRef.current = marker;
      }

      // Handle map clicks
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        onLocationSelect(lat.toFixed(6), lng.toFixed(6));
        
        // Remove existing marker
        if (markerRef.current) {
          map.removeLayer(markerRef.current);
        }
        
        // Add new marker
        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
        markerRef.current = marker;
      });

      // Cleanup
      return () => {
        if (mapRef.current && map) {
          map.remove();
        }
      };
    };

    loadLeaflet();
  }, [center, onLocationSelect, markerPosition]);

  return <div ref={mapRef} className="w-full h-full" />;
};

// Modal Component
const StationModal = ({ isOpen, onClose, station, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    contact_number: '',
    email: '',
    latitude: '',
    longitude: ''
  });
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // India center

  useEffect(() => {
    if (station) {
      setFormData({
        name: station.name || '',
        address: station.address || '',
        city: station.city || '',
        state: station.state || '',
        contact_number: station.contact_number || '',
        email: station.email || '',
        latitude: station.latitude?.toString() || '',
        longitude: station.longitude?.toString() || ''
      });
      if (station.latitude && station.longitude) {
        setMapCenter([parseFloat(station.latitude), parseFloat(station.longitude)]);
      }
    } else {
      setFormData({
        name: '',
        address: '',
        city: '',
        state: '',
        contact_number: '',
        email: '',
        latitude: '',
        longitude: ''
      });
    }
  }, [station]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = ['name', 'address', 'city', 'state'];
    const missingFields = requiredFields.filter(field => !formData[field] || formData[field].trim() === '');
    
    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-borderContent">
          <h2 className="text-xl font-bold text-white">
            {station ? 'Edit Police Station' : 'Add Police Station'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Section */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Station Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 bg-background border border-borderContent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="Enter station name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-4 py-2 bg-background border border-borderContent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white resize-none"
                  rows={2}
                  placeholder="Enter address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-2 bg-background border border-borderContent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full px-4 py-2 bg-background border border-borderContent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="State"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Contact Number
                </label>
                <input
                  type="tel"
                  value={formData.contact_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_number: e.target.value }))}
                  className="w-full px-4 py-2 bg-background border border-borderContent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="Enter contact number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 bg-background border border-borderContent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="Enter email"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                    className="w-full px-4 py-2 bg-background border border-borderContent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="Latitude"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                    className="w-full px-4 py-2 bg-background border border-borderContent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="Longitude"
                  />
                </div>
              </div>
            </div>

            {/* Map Section */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Click on map to select location
              </label>
              <div className="h-96 bg-background border border-borderContent rounded-lg overflow-hidden">
                <MapPicker
                  center={[20.5937, 78.9629]}
                  onLocationSelect={(lat, lng) => {
                    setFormData(prev => ({
                      ...prev,
                      latitude: lat.toString(),
                      longitude: lng.toString()
                    }));
                  }}
                  markerPosition={formData.latitude && formData.longitude ? 
                    [parseFloat(formData.latitude), parseFloat(formData.longitude)] : null}
                />
              </div>
              <div className="mt-2 text-xs text-gray-400">
                <p>💡 Click anywhere on the map to set the station location</p>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-4 mt-6 pt-6 border-t border-borderContent">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-background border border-borderContent text-white rounded-lg hover:bg-surface transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {station ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  {station ? 'Update Station' : 'Add Station'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteModal = ({ isOpen, onClose, onConfirm, stationName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Delete Station</h3>
            <p className="text-sm text-gray-400">This action cannot be undone</p>
          </div>
        </div>
        
        <p className="text-white mb-6">
          Are you sure you want to delete <strong>{stationName}</strong>?
        </p>
        
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-background border border-borderContent text-white rounded-lg hover:bg-surface transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Station Card Component
const StationCard = ({ station, onEdit, onDelete }) => {
  return (
    <div className="bg-surface rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-borderContent">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
            <MapPin className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">{station.name}</h3>
            <p className="text-sm text-gray-400 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {station.city}, {station.state}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(station)}
            className="p-2 bg-blue-500/20 text-blue-500 rounded-lg hover:bg-blue-500/30 transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(station)}
            className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="text-white">
          <span className="font-medium">Address:</span> {station.address}
        </div>
        {station.contact_number && (
          <div className="text-white">
            <span className="font-medium">Contact:</span> {station.contact_number}
          </div>
        )}
        {station.email && (
          <div className="text-white">
            <span className="font-medium">Email:</span> {station.email}
          </div>
        )}
        {station.latitude && station.longitude && (
          <div className="text-gray-400">
            <span className="font-medium">Location:</span> {station.latitude}, {station.longitude}
          </div>
        )}
      </div>
    </div>
  );
};

// Main Component
const PoliceStationsPage = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [stationToDelete, setStationToDelete] = useState(null);

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosClient.get('/police-stations');
      
      const data = response.data;
      console.log('API response:', data);
      
      if (data && data.success && data.data && data.data.police_stations) {
        setStations(Array.isArray(data.data.police_stations) ? data.data.police_stations : []);
      } else {
        console.warn('Unexpected API response format:', data);
        setStations([]);
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
      setError('Failed to load police stations');
      setStations([]); // Prevent crash by setting empty array
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setSubmitting(true);
      
      console.log('Submitting form data:', formData);
      
      const payload = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null
      };

      console.log('API payload:', payload);

      if (selectedStation) {
        // Update existing station
        console.log('Updating station:', selectedStation.id);
        const response = await axiosClient.put(`/police-stations/${selectedStation.id}`, payload);
        console.log('Update response:', response);
        alert('Police station updated successfully');
      } else {
        // Add new station
        console.log('Adding new station...');
        const response = await axiosClient.post('/police-stations', payload);
        console.log('Add response:', response);
        alert('Police station added successfully');
      }
      
      setShowModal(false);
      setSelectedStation(null);
      fetchStations();
    } catch (error) {
      console.error('Error saving station:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to save police station';
      alert(`Error: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (station) => {
    setSelectedStation(station);
    setShowModal(true);
  };

  const handleDelete = (station) => {
    setStationToDelete(station);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axiosClient.delete(`/police-stations/${stationToDelete.id}`);
      alert('Police station deleted successfully');
      setShowDeleteModal(false);
      setStationToDelete(null);
      fetchStations();
    } catch (error) {
      console.error('Error deleting station:', error);
      alert('Failed to delete police station');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedStation(null);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setStationToDelete(null);
  };

  return (
    <div className="p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Police Station Management</h1>
          <p className="text-gray-400">Manage police stations and their locations</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Add Police Station
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
          <p className="text-red-400 text-center">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && !error && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Stations Grid */}
      {!loading && !error && (
        <>
          {Array.isArray(stations) && stations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Police Stations</h3>
              <p className="text-gray-400 mb-6">Get started by adding your first police station</p>
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                Add Police Station
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.isArray(stations) && stations.map((station) => (
                <StationCard
                  key={station.id}
                  station={station}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <StationModal
        isOpen={showModal}
        onClose={closeModal}
        station={selectedStation}
        onSubmit={handleSubmit}
        isSubmitting={submitting}
      />
      
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        stationName={stationToDelete?.name}
      />
    </div>
  );
};

export default PoliceStationsPage;
