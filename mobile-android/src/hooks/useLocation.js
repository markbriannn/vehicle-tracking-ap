/**
 * =============================================================================
 * LOCATION TRACKING HOOK
 * =============================================================================
 * 
 * MENTOR NOTE: This hook handles GPS location tracking for drivers.
 * 
 * KEY FEATURES:
 * 1. Requests location permissions
 * 2. Starts continuous location updates
 * 3. Sends updates to server via Socket.io
 * 4. Handles background tracking (when app is minimized)
 * 
 * GPS UPDATE FLOW:
 * Phone GPS → expo-location → This hook → Socket.io → Backend → Database
 *                                                   → Broadcast to clients
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import { useSocket } from './useSocket';

export function useLocation(vehicleId, isTracking = false) {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  const locationSubscription = useRef(null);
  const { sendLocationUpdate, connect, isConnected } = useSocket();

  // Request permissions
  const requestPermissions = useCallback(async () => {
    try {
      // Request foreground permission first
      const { status: foregroundStatus } = 
        await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        setErrorMsg('Location permission denied');
        return false;
      }

      // Request background permission for continuous tracking
      const { status: backgroundStatus } = 
        await Location.requestBackgroundPermissionsAsync();
      
      if (backgroundStatus !== 'granted') {
        console.warn('Background location not granted - tracking will stop when app is minimized');
      }

      setHasPermission(true);
      return true;
    } catch (error) {
      setErrorMsg('Failed to get location permissions');
      return false;
    }
  }, []);

  // Get current location once
  const getCurrentLocation = useCallback(async () => {
    if (!hasPermission) {
      const granted = await requestPermissions();
      if (!granted) return null;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(location);
      return location;
    } catch (error) {
      setErrorMsg('Failed to get current location');
      return null;
    }
  }, [hasPermission, requestPermissions]);

  /**
   * MENTOR NOTE: Start continuous location tracking
   * This is the main function for driver GPS tracking.
   * Updates are sent every 5 seconds or when the driver moves 10 meters.
   */
  const startTracking = useCallback(async () => {
    if (!hasPermission) {
      const granted = await requestPermissions();
      if (!granted) return;
    }

    // Connect to Socket.io if not connected
    if (!isConnected) {
      connect();
    }

    // Stop any existing subscription
    if (locationSubscription.current) {
      locationSubscription.current.remove();
    }

    console.log('Starting location tracking...');

    // Start watching location
    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000, // Update every 5 seconds
        distanceInterval: 10, // Or when moved 10 meters
      },
      (newLocation) => {
        console.log('Location update:', {
          lat: newLocation.coords.latitude,
          lng: newLocation.coords.longitude,
          speed: newLocation.coords.speed,
        });

        setLocation(newLocation);

        // Send to server if we have a vehicle ID
        if (vehicleId) {
          sendLocationUpdate(vehicleId, newLocation);
        }
      }
    );
  }, [hasPermission, requestPermissions, vehicleId, sendLocationUpdate, connect, isConnected]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
      console.log('Location tracking stopped');
    }
  }, []);

  // Auto-start/stop tracking based on isTracking prop
  useEffect(() => {
    if (isTracking && vehicleId) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [isTracking, vehicleId, startTracking, stopTracking]);

  // Request permissions on mount
  useEffect(() => {
    requestPermissions();
  }, [requestPermissions]);

  return {
    location,
    errorMsg,
    hasPermission,
    getCurrentLocation,
    startTracking,
    stopTracking,
    requestPermissions,
    isTracking: !!locationSubscription.current,
  };
}
