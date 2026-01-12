/**
 * =============================================================================
 * SOCKET.IO HOOK FOR MOBILE
 * =============================================================================
 * 
 * MENTOR NOTE: This hook manages the Socket.io connection for the mobile app.
 * 
 * For DRIVERS: Sends GPS updates to the server
 * For STUDENTS: Receives vehicle location updates
 * 
 * The hook handles:
 * - Connection/disconnection
 * - Joining appropriate rooms
 * - Sending/receiving events
 * - Auto-reconnection
 * - Real-time verification notifications
 * - Offline GPS buffering (stores locations when offline, syncs when back online)
 */

import { useEffect, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/api';
import { useVehicleStore } from '../store/vehicleStore';
import { useAuthStore } from '../store/authStore';
import { useOfflineBuffer } from './useOfflineBuffer';

export function useSocket() {
  const socketRef = useRef(null);
  const { updateVehicle, markOffline } = useVehicleStore();
  const { user, refreshUser } = useAuthStore();
  const { isOnline, bufferCount, isSyncing, bufferLocation, syncBufferedLocations, setOnlineStatus } = useOfflineBuffer();

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    console.log('Connecting to Socket.io...');

    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setOnlineStatus(true); // Update online status
      
      // Join appropriate room based on user role
      if (user?.role === 'driver') {
        socket.emit('join:room', { room: 'drivers-room', userId: user.id || user._id });
      } else {
        // Students/community join public map room
        socket.emit('join:room', { room: 'public-map', userId: user?.id || user?._id });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setOnlineStatus(false); // Update online status
    });

    // Receive vehicle location updates
    socket.on('vehicle:location', (data) => {
      updateVehicle(data);
    });

    // Vehicle went offline
    socket.on('vehicle:offline', (data) => {
      markOffline(data.vehicleId);
    });

    // Listen for user verification (driver approved/rejected)
    socket.on('user:verified', (data) => {
      const currentUserId = user?.id || user?._id;
      if (data.userId === currentUserId) {
        Alert.alert(
          data.status === 'approved' ? '✅ Approved!' : '❌ Rejected',
          data.message,
          [{ text: 'OK', onPress: () => refreshUser && refreshUser() }]
        );
      }
    });

    // Listen for vehicle verification
    socket.on('vehicle:verified', (data) => {
      const currentUserId = user?.id || user?._id;
      if (data.driverId === currentUserId) {
        Alert.alert(
          data.status === 'approved' ? '✅ Vehicle Approved!' : '❌ Vehicle Rejected',
          data.message,
          [{ text: 'OK', onPress: () => refreshUser && refreshUser() }]
        );
      }
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }, [user, updateVehicle, markOffline, refreshUser]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  /**
   * MENTOR NOTE: Send GPS update to server
   * Called by driver app every 5-10 seconds with current location
   * If offline, buffers the location for later sync
   */
  const sendLocationUpdate = useCallback((vehicleId, location) => {
    // If offline or socket not connected, buffer the location
    if (!isOnline || !socketRef.current?.connected) {
      console.log('📴 Offline - buffering location');
      bufferLocation(vehicleId, location);
      return;
    }

    // Try to sync any buffered locations first
    if (bufferCount > 0) {
      syncBufferedLocations();
    }

    socketRef.current.emit('vehicle:update', {
      vehicleId,
      driverId: user?._id,
      location: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        speed: location.coords.speed || 0,
        heading: location.coords.heading || 0,
        accuracy: location.coords.accuracy,
        timestamp: new Date(),
      },
    });
  }, [user, isOnline, bufferLocation, bufferCount, syncBufferedLocations]);

  /**
   * MENTOR NOTE: Send SOS alert
   * Triggered when user presses the emergency button
   */
  const sendSOS = useCallback((location, message, vehicleId) => {
    if (!socketRef.current?.connected) {
      console.warn('Socket not connected for SOS');
      return false;
    }

    socketRef.current.emit('sos:send', {
      senderId: user?._id,
      senderName: user?.name,
      senderRole: user?.role,
      vehicleId,
      location: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        speed: location.coords.speed || 0,
        heading: location.coords.heading || 0,
        timestamp: new Date(),
      },
      message,
    });

    return true;
  }, [user]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    sendLocationUpdate,
    sendSOS,
    isConnected: socketRef.current?.connected || false,
    isOnline,
    bufferCount,
    isSyncing,
  };
}
