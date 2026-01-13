/**
 * =============================================================================
 * LIVE MAP PAGE
 * =============================================================================
 * 
 * MENTOR NOTE: Full-screen map view with real-time vehicle tracking.
 * This is where admins monitor all vehicles in real-time.
 */

import React, { useState, useEffect } from 'react';
import { Map } from '../components/Map';
import { VehicleDetails } from '../components/VehicleDetails';
import { AlertPanel } from '../components/AlertPanel';
import { useSocket, useVehicleStore } from '../hooks/useSocket';
import { VehicleLocationUpdate } from '../types';
import { useApi } from '../hooks/useApi';

interface Geofence {
  _id: string;
  name: string;
  type: string;
  center: { latitude: number; longitude: number };
  radius: number;
  color: string;
  isActive: boolean;
}

export const LiveMap: React.FC = () => {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleLocationUpdate | null>(null);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [showGeofences, setShowGeofences] = useState(true);
  const { connect, disconnect } = useSocket();
  const vehicleCount = useVehicleStore((state) => state.vehicles.size);
  const api = useApi();

  // Connect to Socket.io when component mounts
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  // Fetch geofences
  useEffect(() => {
    const fetchGeofences = async () => {
      try {
        const response = await api.get('/geofences');
        setGeofences(response.data.geofences || []);
      } catch (error) {
        console.error('Failed to fetch geofences:', error);
      }
    };
    fetchGeofences();
  }, []);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Live Vehicle Map</h1>
          <p className="text-sm text-gray-500">
            {vehicleCount} vehicles being tracked • {geofences.length} geofence zones
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Geofence toggle */}
          <button
            onClick={() => setShowGeofences(!showGeofences)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              showGeofences 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            📍 {showGeofences ? 'Hide' : 'Show'} Geofences
          </button>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm">Live</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <Map
          onVehicleSelect={setSelectedVehicle}
          selectedVehicleId={selectedVehicle?.vehicleId}
          geofences={geofences}
          showGeofences={showGeofences}
        />

        {/* Vehicle Details Panel */}
        {selectedVehicle && (
          <div className="absolute top-4 left-4 z-10">
            <VehicleDetails
              vehicle={selectedVehicle}
              onClose={() => setSelectedVehicle(null)}
            />
          </div>
        )}

        {/* Geofence Legend */}
        {showGeofences && geofences.length > 0 && (
          <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg max-w-xs z-10">
            <h4 className="text-sm font-semibold mb-2">📍 Geofence Zones</h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {geofences.map((geofence) => (
                <div key={geofence._id} className="flex items-center gap-2 text-sm">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: geofence.color || '#3B82F6' }}
                  />
                  <span className="truncate">{geofence.name}</span>
                  <span className="text-gray-400 text-xs">{geofence.radius}m</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SOS Alert Panel */}
        <AlertPanel />
      </div>
    </div>
  );
};
