/**
 * =============================================================================
 * VEHICLE DETAILS PANEL
 * =============================================================================
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { VehicleLocationUpdate } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface VehicleDetailsProps {
  vehicle: VehicleLocationUpdate | null;
  onClose: () => void;
}

export const VehicleDetails: React.FC<VehicleDetailsProps> = ({ vehicle, onClose }) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  // Memoize the image URL to prevent flickering on re-renders
  const imageUrl = useMemo(() => {
    if (!vehicle?.vehiclePhoto) return null;
    return `${API_URL}/${vehicle.vehiclePhoto}`;
  }, [vehicle?.vehicleId]); // Only change when vehicle ID changes, not on location updates

  if (!vehicle) return null;

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const handleViewHistory = () => {
    navigate(`/analytics?vehicleId=${vehicle.vehicleId}&tab=history`);
  };

  const handleViewAnalytics = () => {
    navigate(`/analytics?vehicleId=${vehicle.vehicleId}`);
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
          className="text-gray-400 hover:text-gray-600 text-xl"
        >
          ✕
        </button>
      </div>

      {/* Vehicle Photo - Only render once, don't re-render on location updates */}
      <div className="mb-4">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={vehicle.vehicleNumber}
            className="w-full h-40 object-cover rounded-lg"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-40 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-4xl">🚗</span>
          </div>
        )}
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

        {vehicle.routeName && (
          <div className="flex justify-between">
            <span className="text-gray-500">Route</span>
            <span className="font-medium text-blue-600">{vehicle.routeName}</span>
          </div>
        )}

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
        <button 
          onClick={handleViewHistory}
          className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition cursor-pointer"
        >
          View History
        </button>
        <button 
          onClick={handleViewAnalytics}
          className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition cursor-pointer"
        >
          View Analytics
        </button>
      </div>
    </div>
  );
};
