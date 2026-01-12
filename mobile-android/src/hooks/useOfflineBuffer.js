/**
 * =============================================================================
 * OFFLINE GPS BUFFER HOOK
 * =============================================================================
 * 
 * Stores GPS locations when offline and syncs them when back online.
 * Uses socket connection status to detect online/offline state.
 * 
 * FLOW:
 * 1. Driver loses internet → locations stored in AsyncStorage
 * 2. Driver regains internet → buffered locations sent to server
 * 3. Server processes batch of locations for GPS history
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config/api';
import { useAuthStore } from '../store/authStore';

const BUFFER_KEY = 'gps_buffer';
const MAX_BUFFER_SIZE = 500; // Max locations to store offline
const SYNC_BATCH_SIZE = 50; // Send in batches of 50
const NETWORK_CHECK_INTERVAL = 10000; // Check network every 10 seconds

export function useOfflineBuffer() {
  const [isOnline, setIsOnline] = useState(true);
  const [bufferCount, setBufferCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const { token } = useAuthStore();
  const syncInProgress = useRef(false);
  const networkCheckInterval = useRef(null);
  const wasOffline = useRef(false);

  // Check network by making a simple HEAD request
  const checkNetwork = useCallback(async () => {
    try {
      // Try to reach the API server with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      await fetch(`${API_URL}/health`, { 
        method: 'HEAD',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // We're online
      if (wasOffline.current && !syncInProgress.current) {
        // Coming back online, trigger sync
        syncBufferedLocations();
      }
      wasOffline.current = false;
      setIsOnline(true);
    } catch (error) {
      // We're offline
      wasOffline.current = true;
      setIsOnline(false);
    }
  }, []);

  // Monitor network status with periodic checks
  useEffect(() => {
    // Initial check
    checkNetwork();
    loadBufferCount();
    
    // Periodic check
    networkCheckInterval.current = setInterval(checkNetwork, NETWORK_CHECK_INTERVAL);

    return () => {
      if (networkCheckInterval.current) {
        clearInterval(networkCheckInterval.current);
      }
    };
  }, [checkNetwork]);

  // Load buffer count from storage
  const loadBufferCount = async () => {
    try {
      const data = await AsyncStorage.getItem(BUFFER_KEY);
      if (data) {
        const buffer = JSON.parse(data);
        setBufferCount(buffer.length);
      }
    } catch (error) {
      console.error('Failed to load buffer count:', error);
    }
  };

  /**
   * Add location to offline buffer
   */
  const bufferLocation = useCallback(async (vehicleId, location) => {
    try {
      const data = await AsyncStorage.getItem(BUFFER_KEY);
      let buffer = data ? JSON.parse(data) : [];

      // Add new location
      buffer.push({
        vehicleId,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          speed: location.coords.speed || 0,
          heading: location.coords.heading || 0,
          accuracy: location.coords.accuracy,
        },
        timestamp: new Date().toISOString(),
      });

      // Trim if exceeds max size (remove oldest)
      if (buffer.length > MAX_BUFFER_SIZE) {
        buffer = buffer.slice(-MAX_BUFFER_SIZE);
      }

      await AsyncStorage.setItem(BUFFER_KEY, JSON.stringify(buffer));
      setBufferCount(buffer.length);
      
      console.log(`📍 Buffered location (${buffer.length} stored)`);
      return true;
    } catch (error) {
      console.error('Failed to buffer location:', error);
      return false;
    }
  }, []);

  /**
   * Sync buffered locations to server
   */
  const syncBufferedLocations = useCallback(async () => {
    if (syncInProgress.current || !token) return;
    
    syncInProgress.current = true;
    setIsSyncing(true);

    try {
      const data = await AsyncStorage.getItem(BUFFER_KEY);
      if (!data) {
        syncInProgress.current = false;
        setIsSyncing(false);
        return;
      }

      let buffer = JSON.parse(data);
      if (buffer.length === 0) {
        syncInProgress.current = false;
        setIsSyncing(false);
        return;
      }

      console.log(`🔄 Syncing ${buffer.length} buffered locations...`);

      // Send in batches
      while (buffer.length > 0) {
        const batch = buffer.splice(0, SYNC_BATCH_SIZE);
        
        try {
          await axios.post(
            `${API_URL}/vehicles/sync-locations`,
            { locations: batch },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          // Update storage after each successful batch
          await AsyncStorage.setItem(BUFFER_KEY, JSON.stringify(buffer));
          setBufferCount(buffer.length);
          
          console.log(`✅ Synced batch, ${buffer.length} remaining`);
        } catch (error) {
          // If batch fails, put it back and stop
          buffer = [...batch, ...buffer];
          await AsyncStorage.setItem(BUFFER_KEY, JSON.stringify(buffer));
          setBufferCount(buffer.length);
          console.error('Batch sync failed:', error.message);
          break;
        }
      }

      if (buffer.length === 0) {
        console.log('✅ All buffered locations synced!');
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      syncInProgress.current = false;
      setIsSyncing(false);
    }
  }, [token]);

  /**
   * Clear buffer (use with caution)
   */
  const clearBuffer = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(BUFFER_KEY);
      setBufferCount(0);
    } catch (error) {
      console.error('Failed to clear buffer:', error);
    }
  }, []);

  /**
   * Manually set online status (can be called from socket connection status)
   */
  const setOnlineStatus = useCallback((online) => {
    if (online && wasOffline.current && !syncInProgress.current) {
      syncBufferedLocations();
    }
    wasOffline.current = !online;
    setIsOnline(online);
  }, [syncBufferedLocations]);

  return {
    isOnline,
    bufferCount,
    isSyncing,
    bufferLocation,
    syncBufferedLocations,
    clearBuffer,
    setOnlineStatus,
  };
}
