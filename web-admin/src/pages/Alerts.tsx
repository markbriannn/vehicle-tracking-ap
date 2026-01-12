/**
 * SOS ALERTS PAGE - View and manage emergency alerts
 */

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface Alert {
  _id: string;
  senderId: { name: string; email: string; phone: string };
  senderRole: string;
  vehicleId?: { vehicleNumber: string; licensePlate: string };
  location: { latitude: number; longitude: number };
  message?: string;
  status: string;
  createdAt: string;
  resolvedAt?: string;
}

export const Alerts: React.FC = () => {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

  const fetchAlerts = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/alerts?status=${filter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(res.data.alerts);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await axios.put(`${API_URL}/admin/alerts/${alertId}/resolve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAlerts();
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800';
      case 'acknowledged': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">🚨 SOS Alerts</h1>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="active">Active</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500">Loading...</div>
        ) : alerts.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500">
            No {filter} alerts
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert._id}
              className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${
                alert.status === 'active' ? 'border-red-500' : 'border-green-500'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🚨</span>
                    <div>
                      <p className="font-bold text-lg">{alert.senderId?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500 capitalize">{alert.senderRole}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${getStatusColor(alert.status)}`}>
                      {alert.status}
                    </span>
                  </div>

                  {alert.message && (
                    <p className="text-gray-700 mb-3 italic">"{alert.message}"</p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Phone:</span>
                      <p className="font-medium">{alert.senderId?.phone || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Vehicle:</span>
                      <p className="font-medium">
                        {alert.vehicleId?.vehicleNumber || '-'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Location:</span>
                      <p className="font-medium">
                        {alert.location.latitude.toFixed(4)}, {alert.location.longitude.toFixed(4)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Time:</span>
                      <p className="font-medium">{new Date(alert.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => window.open(
                      `https://www.google.com/maps?q=${alert.location.latitude},${alert.location.longitude}`,
                      '_blank'
                    )}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                  >
                    📍 View Map
                  </button>
                  {alert.status === 'active' && (
                    <button
                      onClick={() => handleResolve(alert._id)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                    >
                      ✓ Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
