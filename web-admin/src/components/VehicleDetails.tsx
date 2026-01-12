/**
 * =============================================================================
 * VEHICLE DETAILS PANEL
 * =============================================================================
 * 
 * MENTOR NOTE: Shows detailed information when a vehicle is selected on the map.
 */

import React from 'react';
import { VehicleLocationUpdate } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface VehicleDetailsProps {
  vehicle: VehicleLocationUpdate | null;
  onClose: () => void;
}

export const VehicleDetails: React.FC<VehicleDetailsProps> = ({ vehicle, onClose }) => {
  if (!vehicle) return null;

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-4 w-80">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold">{vehicle.vehicleNumber}</h2>
          <p className="text-gray-500">{vehicle.licensePlate}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* Vehicle Photo */}
      <div className="mb-4">
        <img
          src={`${API_URL}/${vehicle.vehiclePhoto}`}
          alt={vehicle.vehicleNumber}
          className="w-full h-40 object-cover rounded-lg"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-vehicle.png';
          }}
        />
      </div>

      {/* Status Badge */}
      <div className="mb-4">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            vehicle.isOnline
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full mr-2 ${
              vehicle.isOnline ? 'bg-green-500' : 'bg-gray-500'
            }`}
          />
          {vehicle.isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-500">Type</span>
          <span className="font-medium capitalize">{vehicle.type}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-500">Driver</span>
          <span className="font-medium">{vehicle.driverName}</span>
        </div>

        {vehicle.companyName && (
          <div className="flex justify-between">
            <span className="text-gray-500">Company</span>
            <span className="font-medium">{vehicle.companyName}</span>
          </div>
        )}

        <hr />

        {/* Real-time data */}
        <div className="flex justify-between">
          <span className="text-gray-500">Speed</span>
          <span className="font-medium text-lg">
            {Math.round(vehicle.location.speed)} km/h
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Heading</span>
          <span className="font-medium">{Math.round(vehicle.location.heading)}°</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Last Update</span>
          <span className="font-medium text-sm">
            {formatTime(vehicle.location.timestamp)}
          </span>
        </div>

        <div className="text-xs text-gray-400">
          <p>Lat: {vehicle.location.latitude.toFixed(6)}</p>
          <p>Lng: {vehicle.location.longitude.toFixed(6)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 pt-4 border-t space-y-2">
        <button className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
          View History
        </button>
        <button className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
          View Analytics
        </button>
      </div>
    </div>
  );
};
