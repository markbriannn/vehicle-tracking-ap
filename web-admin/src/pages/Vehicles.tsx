/**
 * VEHICLES PAGE - View and manage all vehicles
 */

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface Vehicle {
  _id: string;
  vehicleNumber: string;
  licensePlate: string;
  type: string;
  verificationStatus: string;
  isActive: boolean;
  driverId?: { name: string; email: string };
  companyId?: { companyName: string };
  lastSeen?: string;
}

export const Vehicles: React.FC = () => {
  const { token } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', status: '' });

  useEffect(() => {
    fetchVehicles();
  }, [filter]);

  const fetchVehicles = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.type) params.append('type', filter.type);
      if (filter.status) params.append('status', filter.status);
      
      const res = await axios.get(`${API_URL}/admin/vehicles?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVehicles(res.data.vehicles);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bus': return '🚌';
      case 'van': return '🚐';
      case 'multicab': return '🚕';
      default: return '🚗';
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Vehicles</h1>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={filter.type}
          onChange={(e) => setFilter({ ...filter, type: e.target.value })}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All Types</option>
          <option value="bus">Bus</option>
          <option value="van">Van</option>
          <option value="multicab">Multicab</option>
        </select>
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : vehicles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No vehicles found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {vehicles.map((vehicle) => (
                <tr key={vehicle._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{vehicle.vehicleNumber}</p>
                      <p className="text-sm text-gray-500">{vehicle.licensePlate}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xl mr-2">{getTypeIcon(vehicle.type)}</span>
                    <span className="capitalize">{vehicle.type}</span>
                  </td>
                  <td className="px-6 py-4">
                    {vehicle.driverId ? (
                      <div>
                        <p className="font-medium">{vehicle.driverId.name}</p>
                        <p className="text-sm text-gray-500">{vehicle.driverId.email}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {vehicle.companyId?.companyName || <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded ${getStatusColor(vehicle.verificationStatus)}`}>
                      {vehicle.verificationStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {vehicle.lastSeen ? new Date(vehicle.lastSeen).toLocaleString() : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
