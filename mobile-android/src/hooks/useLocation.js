/**
 * =============================================================================
 * LOCATION TRACKING HOOK WITH BACKGROUND SUPPORT
 * =============================================================================
 * 
 * MENTOR NOTE: This hook handles GPS location tracking for drivers.
 * 
 * KEY FEATURES:
 * 1. Requests location permissions
 * 2. Starts continuous location updates
 * 3. Sends updates to server via Socket.io
 * 4. BACKGROUND TRACKING - continues when app is minimized
 * 
 * GPS UPDATE FLOW:
 * Phone GPS → expo-location → This hook → Socket.io → Backend → Database
 *                                                   → Broadcast to clients
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Background task name
const BACKGROUND_LOCATION_TASK = 'background-location-task';
const BACKGROUND_LOCATION_KEY = 'background_locations';

/**
 * Define the background task OUTSIDE of the component
 * This runs even when the app is in the background
 */
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Background location error:', error);
    return;
  }

  if (data) {
    const { locations } = data;
    
    // Store locations for later sync (since we can't use hooks here)
    try {
      const stored = await AsyncStorage.getItem(BACKGROUND_LOCATION_KEY);
      let buffer = stored ? JSON.parse(stored) : [];
      
      // Get vehicle ID from storage
      const vehicleId = await AsyncStorage.getItem('tracking_vehicle_id');
      
      if (vehicleId && locations.length > 0) {
        const newLocations = locations.map(loc => ({
          vehicleId,
          location: {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            speed: loc.coords.speed || 0,
            heading: loc.coords.heading || 0,
            accuracy: loc.coords.accuracy,
          },
          timestamp: new Date().toISOString(),
        }));
        
        buffer = [...buffer, ...newLocations];
        
        // Keep max 500 locations
        if (buffer.length > 500) {
          buffer = buffer.slice(-500);
        }
        
        await AsyncStorage.setItem(BACKGROUND_LOCATION_KEY, JSON.stringify(buffer));
        console.log(`📍 Background: stored ${locations.length} location(s), total: ${buffer.length}`);
      }
    } catch (e) {
      console.error('Failed to store background location:', e);
    }
  }
});

export function useLocation(vehicleId, isTracking = false) {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isBackgroundTracking, setIsBackgroundTracking] = useState(false);
  const locationSubscription = useRef(null);
  const syncInterval = useRef(null);

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
   * Get background locations that were stored while app was in background
   */
  const getBackgroundLocations = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(BACKGROUND_LOCATION_KEY);
      if (stored) {
        const locations = JSON.parse(stored);
        // Clear after reading
        await AsyncStorage.removeItem(BACKGROUND_LOCATION_KEY);
        return locations;
      }
      return [];
    } catch (e) {
      console.error('Failed to get background locations:', e);
      return [];
    }
  }, []);

  /**
   * Start continuous location tracking with background support
   */
  const startTracking = useCallback(async (sendLocationUpdate, connect, isConnected) => {
    if (!hasPermission) {
      const granted = await requestPermissions();
      if (!granted) return;
    }

    // Connect to Socket.io if not connected
    if (!isConnected && connect) {
      connect();
    }

    // Store vehicle ID for background task
    if (vehicleId) {
      await AsyncStorage.setItem('tracking_vehicle_id', vehicleId);
    }

    // Stop any existing subscription
    if (locationSubscription.current) {
      locationSubscription.current.remove();
    }

    console.log('Starting location tracking with background support...');

    // Start foreground tracking
    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (newLocation) => {
        console.log('Location update:', {
          lat: newLocation.coords.latitude,
          lng: newLocation.coords.longitude,
          speed: newLocation.coords.speed,
        });

        setLocation(newLocation);

        if (vehicleId && sendLocationUpdate) {
          sendLocationUpdate(vehicleId, newLocation);
        }
      }
    );

    // Start background tracking
    try {
      const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
      
      if (!isTaskRegistered) {
        await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Every 10 seconds in background
          distanceInterval: 20, // Or every 20 meters
          foregroundService: {
            notificationTitle: 'VehicleTrack',
            notificationBody: 'Tracking your location in background',
            notificationColor: '#4CAF50',
          },
          pausesUpdatesAutomatically: false,
          showsBackgroundLocationIndicator: true,
        });
        console.log('✅ Background location tracking started');
        setIsBackgroundTracking(true);
      }
    } catch (e) {
      console.warn('Background tracking not available:', e.message);
    }

    // Periodically sync background locations when app is in foreground
    syncInterval.current = setInterval(async () => {
      const bgLocations = await getBackgroundLocations();
      if (bgLocations.length > 0 && sendLocationUpdate) {
        console.log(`🔄 Syncing ${bgLocations.length} background locations`);
        // Send each location
        for (const loc of bgLocations) {
          if (loc.vehicleId) {
            sendLocationUpdate(loc.vehicleId, {
              coords: loc.location,
              timestamp: loc.timestamp,
            });
          }
        }
      }
    }, 15000); // Check every 15 seconds

  }, [hasPermission, requestPermissions, vehicleId, getBackgroundLocations]);

  // Stop tracking
  const stopTracking = useCallback(async () => {
    // Stop foreground tracking
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
      console.log('Foreground location tracking stopped');
    }

    // Stop background tracking
    try {
      const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
      if (isTaskRegistered) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        console.log('Background location tracking stopped');
        setIsBackgroundTracking(false);
      }
    } catch (e) {
      console.warn('Error stopping background tracking:', e.message);
    }

    // Clear sync interval
    if (syncInterval.current) {
      clearInterval(syncInterval.current);
      syncInterval.current = null;
    }

    // Clear stored vehicle ID
    await AsyncStorage.removeItem('tracking_vehicle_id');
  }, []);

  // Request permissions on mount
  useEffect(() => {
    requestPermissions();
  }, [requestPermissions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncInterval.current) {
        clearInterval(syncInterval.current);
      }
    };
  }, []);

  return {
    location,
    errorMsg,
    hasPermission,
    getCurrentLocation,
    startTracking,
    stopTracking,
    requestPermissions,
    isTracking: !!locationSubscription.current,
    isBackgroundTracking,
    getBackgroundLocations,
  };
}
