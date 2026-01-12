/**
 * =============================================================================
 * DASHBOARD PAGE
 * =============================================================================
 * 
 * MENTOR NOTE: Main dashboard showing system overview and key metrics.
 */

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDashboard, usePendingVerifications } from '../hooks/useApi';
import { useVehicleStore } from '../hooks/useSocket';

export const Dashboard: React.FC = () => {
  const { stats, loading, fetchStats } = useDashboard();
  const { data: pending, fetchPending } = usePendingVerifications();
  const vehicleCount = useVehicleStore((state) => state.vehicles.size);
  const alertCount = useVehicleStore((state) => state.alerts.length);

  useEffect(() => {
    fetchStats();
    fetchPending();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats, fetchPending]);

  const statCards = [
    { label: 'Total Vehicles', value: stats?.totalVehicles || 0, icon: '🚗', color: 'blue' },
    { label: 'Active Now', value: vehicleCount, icon: '📍', color: 'green' },
    { label: 'Total Drivers', value: stats?.totalDrivers || 0, icon: '👤', color: 'purple' },
    { label: 'Companies', value: stats?.totalCompanies || 0, icon: '🏢', color: 'orange' },
    { label: 'Pending Verifications', value: (stats?.pendingDrivers || 0) + (stats?.pendingVehicles || 0), icon: '⏳', color: 'yellow' },
    { label: 'Active Alerts', value: alertCount, icon: '🚨', color: 'red' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className={`bg-white rounded-xl p-6 shadow-sm border-l-4 border-${stat.color}-500`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{stat.label}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
              <span className="text-4xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Verifications */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Pending Verifications</h2>
            <Link to="/verifications" className="text-blue-500 text-sm hover:underline">
              View All
            </Link>
          </div>
          
          {pending?.pendingDrivers.length === 0 && pending?.pendingVehicles.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No pending verifications</p>
          ) : (
            <div className="space-y-3">
              {pending?.pendingDrivers.slice(0, 3).map((driver) => (
                <div key={driver._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">👤</span>
                    <div>
                      <p className="font-medium">{driver.name}</p>
                      <p className="text-xs text-gray-500">Driver</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                    Pending
                  </span>
                </div>
              ))}
              {pending?.pendingVehicles.slice(0, 3).map((vehicle) => (
                <div key={vehicle._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🚗</span>
                    <div>
                      <p className="font-medium">{vehicle.vehicleNumber}</p>
                      <p className="text-xs text-gray-500">{vehicle.licensePlate}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/map"
              className="p-4 bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition"
            >
              <span className="text-2xl block mb-2">🗺️</span>
              <span className="text-sm font-medium">Live Map</span>
            </Link>
            <Link
              to="/verifications"
              className="p-4 bg-yellow-50 rounded-lg text-center hover:bg-yellow-100 transition"
            >
              <span className="text-2xl block mb-2">✅</span>
              <span className="text-sm font-medium">Verify</span>
            </Link>
            <Link
              to="/alerts"
              className="p-4 bg-red-50 rounded-lg text-center hover:bg-red-100 transition"
            >
              <span className="text-2xl block mb-2">🚨</span>
              <span className="text-sm font-medium">Alerts</span>
            </Link>
            <Link
              to="/analytics"
              className="p-4 bg-green-50 rounded-lg text-center hover:bg-green-100 transition"
            >
              <span className="text-2xl block mb-2">📈</span>
              <span className="text-sm font-medium">Analytics</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
