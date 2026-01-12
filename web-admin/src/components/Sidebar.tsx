/**
 * =============================================================================
 * SIDEBAR NAVIGATION
 * =============================================================================
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/map', label: 'Live Map', icon: '🗺️' },
  { path: '/vehicles', label: 'Vehicles', icon: '🚗' },
  { path: '/drivers', label: 'Drivers', icon: '👤' },
  { path: '/companies', label: 'Companies', icon: '🏢' },
  { path: '/verifications', label: 'Verifications', icon: '✅' },
  { path: '/alerts', label: 'SOS Alerts', icon: '🚨' },
  { path: '/analytics', label: 'Analytics', icon: '📈' },
];

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="w-64 bg-gray-900 text-white h-screen flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">🚗 VehicleTrack</h1>
        <p className="text-xs text-gray-400">Admin Dashboard</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium">{user?.name}</p>
            <p className="text-xs text-gray-400">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
};
