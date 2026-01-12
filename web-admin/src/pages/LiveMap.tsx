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

export const LiveMap: React.FC = () => {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleLocationUpdate | null>(null);
  const { connect, disconnect } = useSocket();
  const vehicleCount = useVehicleStore((state) => state.vehicles.size);

  // Connect to Socket.io when component mounts
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Live Vehicle Map</h1>
          <p className="text-sm text-gray-500">
            {vehicleCount} vehicles being tracked
          </p>
        </div>
        <div className="flex items-center gap-4">
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

        {/* SOS Alert Panel */}
        <AlertPanel />
      </div>
    </div>
  );
};
