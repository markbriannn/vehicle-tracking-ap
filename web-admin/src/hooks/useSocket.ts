/**
 * =============================================================================
 * SOCKET.IO HOOK
 * =============================================================================
 * 
 * MENTOR NOTE: This hook manages the Socket.io connection for real-time updates.
 */

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { create } from 'zustand';
import { VehicleLocationUpdate, SOSAlert } from '../types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

// Store for real-time vehicle data
interface VehicleStore {
  vehicles: Map<string, VehicleLocationUpdate>;
  alerts: SOSAlert[];
  selectedAlertId: string | null;
  updateVehicle: (data: VehicleLocationUpdate) => void;
  markOffline: (vehicleId: string) => void;
  addAlert: (alert: SOSAlert) => void;
  updateAlertLocation: (alertId: string, location: { latitude: number; longitude: number }) => void;
  removeAlert: (alertId: string) => void;
  selectAlert: (alertId: string | null) => void;
  clearVehicles: () => void;
}

export const useVehicleStore = create<VehicleStore>((set) => ({
  vehicles: new Map(),
  alerts: [],
  selectedAlertId: null,
  
  updateVehicle: (data: VehicleLocationUpdate) =>
    set((state) => {
      const newVehicles = new Map(state.vehicles);
      newVehicles.set(data.vehicleId, data);
      return { vehicles: newVehicles };
    }),
  
  markOffline: (vehicleId: string) =>
    set((state) => {
      const newVehicles = new Map(state.vehicles);
      const vehicle = newVehicles.get(vehicleId);
      if (vehicle) {
        const updatedVehicle: VehicleLocationUpdate = { ...vehicle, isOnline: false };
        newVehicles.set(vehicleId, updatedVehicle);
      }
      return { vehicles: newVehicles };
    }),
  
  addAlert: (alert: SOSAlert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts.filter(a => a._id !== alert._id)].slice(0, 50),
    })),

  updateAlertLocation: (alertId: string, location: { latitude: number; longitude: number }) =>
    set((state) => ({
      alerts: state.alerts.map(a => 
        a._id === alertId 
          ? { ...a, location: { ...a.location, ...location } }
          : a
      ),
    })),
  
  removeAlert: (alertId: string) =>
    set((state) => ({
      alerts: state.alerts.filter((a) => a._id !== alertId),
      selectedAlertId: state.selectedAlertId === alertId ? null : state.selectedAlertId,
    })),

  selectAlert: (alertId: string | null) =>
    set({ selectedAlertId: alertId }),
  
  clearVehicles: () => set({ vehicles: new Map() }),
}));

// Socket connection hook
export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { updateVehicle, markOffline, addAlert, updateAlertLocation, removeAlert } = useVehicleStore();

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    console.log('Connecting to Socket.io server...');
    
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit('join:room', { room: 'admin-room' });
    });

    socket.on('disconnect', (reason: string) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('vehicle:location', (data: VehicleLocationUpdate) => {
      updateVehicle(data);
    });

    socket.on('vehicle:offline', (data: { vehicleId: string }) => {
      markOffline(data.vehicleId);
    });

    socket.on('sos:alert', (data: SOSAlert) => {
      console.log('SOS ALERT RECEIVED:', data);
      addAlert(data);
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('🚨 SOS Alert!', {
          body: `${data.senderName} needs help!`,
        });
      }
    });

    // Listen for SOS location updates (real-time tracking)
    socket.on('sos:location', (data: { alertId: string; location: { latitude: number; longitude: number } }) => {
      console.log('SOS location update:', data);
      updateAlertLocation(data.alertId, data.location);
    });

    // Listen for SOS resolved
    socket.on('sos:resolved', (data: { alertId: string }) => {
      console.log('SOS resolved:', data);
      removeAlert(data.alertId);
    });

    socket.on('error', (error: Error) => {
      console.error('Socket error:', error);
    });
  }, [updateVehicle, markOffline, addAlert, updateAlertLocation, removeAlert]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { connect, disconnect, socket: socketRef.current };
}
