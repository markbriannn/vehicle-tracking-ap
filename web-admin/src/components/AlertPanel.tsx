/**
 * =============================================================================
 * SOS ALERT PANEL
 * =============================================================================
 * 
 * MENTOR NOTE: Displays active SOS alerts with real-time updates.
 * When a new alert comes in via Socket.io, it appears here immediately.
 * Admins can acknowledge and resolve alerts from this panel.
 * 
 * "View on Map" centers the map on the alert location (live tracking).
 * "Resolve" marks the alert as resolved and removes it from the map.
 */

import React from 'react';
import { useVehicleStore } from '../hooks/useSocket';
import { useAlerts } from '../hooks/useApi';

export const AlertPanel: React.FC = () => {
  const realtimeAlerts = useVehicleStore((state) => state.alerts);
  const removeAlert = useVehicleStore((state) => state.removeAlert);
  const selectAlert = useVehicleStore((state) => state.selectAlert);
  const selectedAlertId = useVehicleStore((state) => state.selectedAlertId);
  const { resolveAlert } = useAlerts();

  const handleResolve = async (alertId: string) => {
    try {
      await resolveAlert(alertId);
      removeAlert(alertId);
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const handleViewOnMap = (alertId: string) => {
    // Select the alert to center map on it
    selectAlert(alertId);
  };

  if (realtimeAlerts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-h-96 overflow-y-auto pointer-events-none">
      {realtimeAlerts.map((alert) => (
        <div
          key={alert._id}
          className={`border-l-4 border-red-500 p-4 mb-2 rounded-r-lg shadow-lg pointer-events-auto transition-all ${
            selectedAlertId === alert._id 
              ? 'bg-red-100 ring-2 ring-red-500' 
              : 'bg-red-50 animate-pulse'
          }`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-2xl">🚨</span>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-bold text-red-800">
                SOS Alert!
              </h3>
              <p className="text-sm text-red-700 mt-1">
                <strong>{alert.senderName}</strong> ({alert.senderRole})
              </p>
              {alert.message && (
                <p className="text-sm text-red-600 mt-1 italic">
                  "{alert.message}"
                </p>
              )}
              <p className="text-xs text-red-500 mt-2">
                📍 {alert.location.latitude.toFixed(4)}, {alert.location.longitude.toFixed(4)}
              </p>
              <p className="text-xs text-red-400">
                {new Date(alert.createdAt).toLocaleString()}
              </p>
              
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleResolve(alert._id)}
                  className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                >
                  ✓ Resolve
                </button>
                <button
                  onClick={() => handleViewOnMap(alert._id)}
                  className={`px-3 py-1 text-white text-sm rounded ${
                    selectedAlertId === alert._id
                      ? 'bg-yellow-500 hover:bg-yellow-600'
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {selectedAlertId === alert._id ? '📍 Tracking' : '🗺️ View on Map'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
