/**
 * ANALYTICS PAGE - View vehicle analytics and route history
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
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

interface Vehicle {
  id: string;
  vehicleNumber: string;
  licensePlate: string;
  type: string;
  routeName?: string;
  driverName: string;
}

interface VehicleAnalytics {
  totalDistance: number;
  maxSpeed: number;
  idleTime: number;
  totalPoints: number;
}

interface HistoryPoint {
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: string;
}

export const Analytics: React.FC = () => {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const [stats, setStats] = useState<Stats | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(searchParams.get('vehicleId') || '');
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'history'>(
    searchParams.get('tab') === 'history' ? 'history' : 'overview'
  );
  const [vehicleAnalytics, setVehicleAnalytics] = useState<VehicleAnalytics | null>(null);
  const [historyPoints, setHistoryPoints] = useState<HistoryPoint[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (selectedVehicleId) {
      fetchVehicleAnalytics();
      fetchVehicleHistory();
    }
  }, [selectedVehicleId, dateRange]);

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

  const fetchVehicles = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/vehicles/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVehicles(res.data.vehicles);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
    }
  };

  const fetchVehicleAnalytics = async () => {
    if (!selectedVehicleId) return;
    setLoadingAnalytics(true);
    try {
      const res = await axios.get(`${API_URL}/admin/analytics/vehicle/${selectedVehicleId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate: dateRange.start, endDate: dateRange.end }
      });
      setVehicleAnalytics(res.data.analytics);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchVehicleHistory = async () => {
    if (!selectedVehicleId) return;
    try {
      const res = await axios.get(`${API_URL}/admin/history/vehicle/${selectedVehicleId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate: dateRange.start, endDate: dateRange.end }
      });
      setHistoryPoints(res.data.points);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const selectedVehicle = useMemo(() => 
    vehicles.find(v => v.id === selectedVehicleId),
    [vehicles, selectedVehicleId]
  );

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Analytics</h1>
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const overviewCards = [
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

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'overview' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'analytics' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Vehicle Analytics
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'history' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Route History
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {overviewCards.map((card, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{card.icon}</span>
                  <span className="text-3xl font-bold">{card.value}</span>
                </div>
                <p className="text-gray-500 text-sm">{card.label}</p>
              </div>
            ))}
          </div>

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
        </>
      )}

      {/* Analytics & History Tabs - Vehicle Selection */}
      {(activeTab === 'analytics' || activeTab === 'history') && (
        <>
          {/* Vehicle & Date Selection */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Vehicle</label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">-- Select a vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.vehicleNumber} - {v.licensePlate} ({v.driverName})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="border rounded-lg px-3 py-2"
                />
              </div>
            </div>
          </div>

          {!selectedVehicleId && (
            <div className="bg-gray-50 rounded-xl p-12 text-center text-gray-500">
              <span className="text-4xl mb-4 block">🚗</span>
              <p>Select a vehicle to view {activeTab === 'analytics' ? 'analytics' : 'route history'}</p>
            </div>
          )}
        </>
      )}

      {/* Analytics Tab Content */}
      {activeTab === 'analytics' && selectedVehicleId && (
        <div className="space-y-6">
          {/* Vehicle Info */}
          {selectedVehicle && (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-4">
                <span className="text-3xl">
                  {selectedVehicle.type === 'bus' ? '🚌' : 
                   selectedVehicle.type === 'van' ? '🚐' : '🚗'}
                </span>
                <div>
                  <h3 className="font-bold text-lg">{selectedVehicle.vehicleNumber}</h3>
                  <p className="text-gray-500">{selectedVehicle.licensePlate} • {selectedVehicle.driverName}</p>
                  {selectedVehicle.routeName && (
                    <p className="text-blue-600 text-sm">📍 {selectedVehicle.routeName}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Analytics Cards */}
          {loadingAnalytics ? (
            <div className="text-center py-8 text-gray-500">Loading analytics...</div>
          ) : vehicleAnalytics ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-3xl mb-2">📏</div>
                <div className="text-2xl font-bold">{vehicleAnalytics.totalDistance} km</div>
                <p className="text-gray-500 text-sm">Total Distance</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-3xl mb-2">⚡</div>
                <div className="text-2xl font-bold">{vehicleAnalytics.maxSpeed} km/h</div>
                <p className="text-gray-500 text-sm">Max Speed</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-3xl mb-2">⏸️</div>
                <div className="text-2xl font-bold">{vehicleAnalytics.idleTime} min</div>
                <p className="text-gray-500 text-sm">Idle Time</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-3xl mb-2">📍</div>
                <div className="text-2xl font-bold">{vehicleAnalytics.totalPoints}</div>
                <p className="text-gray-500 text-sm">GPS Points</p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
              No analytics data for selected period
            </div>
          )}
        </div>
      )}

      {/* History Tab Content */}
      {activeTab === 'history' && selectedVehicleId && (
        <div className="space-y-6">
          {/* Vehicle Info */}
          {selectedVehicle && (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">
                    {selectedVehicle.type === 'bus' ? '🚌' : 
                     selectedVehicle.type === 'van' ? '🚐' : '🚗'}
                  </span>
                  <div>
                    <h3 className="font-bold text-lg">{selectedVehicle.vehicleNumber}</h3>
                    <p className="text-gray-500">{selectedVehicle.licensePlate}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{historyPoints.length}</div>
                  <p className="text-gray-500 text-sm">GPS Points</p>
                </div>
              </div>
            </div>
          )}

          {/* History Table */}
          {historyPoints.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">#</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Time</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Location</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Speed</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Heading</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {historyPoints.map((point, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-500">{i + 1}</td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(point.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-600">
                          {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`font-medium ${point.speed > 60 ? 'text-red-600' : 'text-green-600'}`}>
                            {Math.round(point.speed)} km/h
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{Math.round(point.heading)}°</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
              No history data for selected period
            </div>
          )}
        </div>
      )}
    </div>
  );
};
