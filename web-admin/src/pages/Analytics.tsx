/**
 * ANALYTICS PAGE - View vehicle and system analytics
 */

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface Stats {
  totalDrivers: number;
  pendingDrivers: number;
  totalVehicles: number;
  pendingVehicles: number;
  activeVehicles: number;
  totalCompanies: number;
  activeAlerts: number;
}

export const Analytics: React.FC = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Analytics</h1>
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const cards = [
    { label: 'Total Drivers', value: stats?.totalDrivers || 0, icon: '👤', color: 'blue' },
    { label: 'Pending Drivers', value: stats?.pendingDrivers || 0, icon: '⏳', color: 'yellow' },
    { label: 'Total Vehicles', value: stats?.totalVehicles || 0, icon: '🚗', color: 'green' },
    { label: 'Active Vehicles', value: stats?.activeVehicles || 0, icon: '📍', color: 'emerald' },
    { label: 'Pending Vehicles', value: stats?.pendingVehicles || 0, icon: '⏳', color: 'orange' },
    { label: 'Companies', value: stats?.totalCompanies || 0, icon: '🏢', color: 'purple' },
    { label: 'Active Alerts', value: stats?.activeAlerts || 0, icon: '🚨', color: 'red' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">📊 Analytics Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map((card, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{card.icon}</span>
              <span className="text-3xl font-bold">{card.value}</span>
            </div>
            <p className="text-gray-500 text-sm">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">System Overview</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Driver Approval Rate</span>
            <span className="font-medium">
              {stats && stats.totalDrivers > 0 
                ? Math.round(((stats.totalDrivers - stats.pendingDrivers) / stats.totalDrivers) * 100)
                : 0}%
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Vehicle Approval Rate</span>
            <span className="font-medium">
              {stats && stats.totalVehicles > 0 
                ? Math.round(((stats.totalVehicles - stats.pendingVehicles) / stats.totalVehicles) * 100)
                : 0}%
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600">Active Vehicle Rate</span>
            <span className="font-medium">
              {stats && stats.totalVehicles > 0 
                ? Math.round((stats.activeVehicles / stats.totalVehicles) * 100)
                : 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
