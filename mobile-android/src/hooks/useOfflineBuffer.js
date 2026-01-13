/**
 * =============================================================================
 * ENHANCED OFFLINE GPS BUFFER HOOK
 * =============================================================================
 * 
 * Stores GPS locations when offline and syncs them when back online.
 * Features:
 * - Priority-based sync (SOS > recent > old locations)
 * - Compression for large buffers
 * - Retry logic with exponential backoff
 * - Buffer statistics and health monitoring
 * 
 * FLOW:
 * 1. Driver loses internet → locations stored in AsyncStorage with priority
 * 2. Driver regains internet → high priority items synced first
 * 3. Server processes batch of locations for GPS history
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import { API_URL } from '../config/api';
import { useAuthStore } from '../store/authStore';

// Storage keys
const BUFFER_KEY = 'gps_buffer_v2';
const BUFFER_STATS_KEY = 'gps_buffer_stats';
const SOS_BUFFER_KEY = 'sos_buffer';

// Configuration
const MAX_BUFFER_SIZE = 1000; // Max locations to store offline
const SYNC_BATCH_SIZE = 50; // Send in batches
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_BASE = 2000; // Base delay for exponential backoff
const NETWORK_CHECK_INTERVAL = 15000; // Check network every 15 seconds
const STALE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours - locations older than this are low priority

// Priority levels
const PRIORITY = {
  CRITICAL: 1, // SOS alerts
  HIGH: 2,     // Recent locations (< 1 hour)
  MEDIUM: 3,   // Older locations (1-24 hours)
  LOW: 4,      // Very old locations (> 24 hours)
};

export function useOfflineBuffer() {
  const [isOnline, setIsOnline] = useState(true);
  const [bufferCount, setBufferCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ synced: 0, total: 0 });
  const [bufferStats, setBufferStats] = useState({
    totalBuffered: 0,
    totalSynced: 0,
    lastSyncTime: null,
    failedAttempts: 0,
    oldestEntry: null,
  });
  
  const { token } = useAuthStore();
  const syncInProgress = useRef(false);
  const retryCount = useRef(0);
  const unsubscribeNetInfo = useRef(null);

  /**
   * Initialize network monitoring
   */
  useEffect(() => {
    // Subscribe to network state changes
    unsubscribeNetInfo.current = NetInfo.addEventListener(state => {
      const online = state.isConnected && state.isInternetReachable;
      
      if (online && !isOnline) {
        // Coming back online - trigger sync
        console.log('📶 Network restored - triggering sync');
        syncBufferedLocations();
      }
      
      setIsOnline(online);
    });

    // Initial load
    loadBufferStats();
    loadBufferCount();

    return () => {
      if (unsubscribeNetInfo.current) {
        unsubscribeNetInfo.current();
      }
    };
  }, []);

  /**
   * Load buffer statistics
   */
  const loadBufferStats = async () => {
    try {
      const stats = await AsyncStorage.getItem(BUFFER_STATS_KEY);
      if (stats) {
        setBufferStats(JSON.parse(stats));
      }
    } catch (error) {
      console.error('Failed to load buffer stats:', error);
    }
  };

  /**
   * Save buffer statistics
   */
  const saveBufferStats = async (updates) => {
    try {
      const newStats = { ...bufferStats, ...updates };
      await AsyncStorage.setItem(BUFFER_STATS_KEY, JSON.stringify(newStats));
      setBufferStats(newStats);
    } catch (error) {
      console.error('Failed to save buffer stats:', error);
    }
  };

  /**
   * Load buffer count from storage
   */
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
   * Calculate priority based on timestamp and type
   */
  const calculatePriority = (timestamp, isSOS = false) => {
    if (isSOS) return PRIORITY.CRITICAL;
    
    const age = Date.now() - new Date(timestamp).getTime();
    const oneHour = 60 * 60 * 1000;
    
    if (age < oneHour) return PRIORITY.HIGH;
    if (age < STALE_THRESHOLD) return PRIORITY.MEDIUM;
    return PRIORITY.LOW;
  };

  /**
   * Add location to offline buffer with priority
   */
  const bufferLocation = useCallback(async (vehicleId, location, isSOS = false) => {
    try {
      const data = await AsyncStorage.getItem(BUFFER_KEY);
      let buffer = data ? JSON.parse(data) : [];
      
      const timestamp = new Date().toISOString();
      const entry = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        vehicleId,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          speed: location.coords.speed || 0,
          heading: location.coords.heading || 0,
          accuracy: location.coords.accuracy,
        },
        timestamp,
        priority: calculatePriority(timestamp, isSOS),
        isSOS,
        retryCount: 0,
      };

      buffer.push(entry);

      // Trim if exceeds max size - remove lowest priority items first
      if (buffer.length > MAX_BUFFER_SIZE) {
        // Sort by priority (ascending) then by timestamp (ascending - oldest first)
        buffer.sort((a, b) => {
          if (a.priority !== b.priority) return b.priority - a.priority; // Lower priority number = higher importance
          return new Date(a.timestamp) - new Date(b.timestamp);
        });
        // Remove oldest, lowest priority items
        buffer = buffer.slice(-MAX_BUFFER_SIZE);
      }

      await AsyncStorage.setItem(BUFFER_KEY, JSON.stringify(buffer));
      setBufferCount(buffer.length);
      
      // Update stats
      await saveBufferStats({
        totalBuffered: bufferStats.totalBuffered + 1,
        oldestEntry: buffer.length > 0 ? buffer[0].timestamp : null,
      });
      
      console.log(`📍 Buffered location [P${entry.priority}] (${buffer.length} stored)`);
      return true;
    } catch (error) {
      console.error('Failed to buffer location:', error);
      return false;
    }
  }, [bufferStats]);

  /**
   * Buffer SOS alert for offline sync
   */
  const bufferSOS = useCallback(async (sosData) => {
    try {
      const data = await AsyncStorage.getItem(SOS_BUFFER_KEY);
      let sosBuffer = data ? JSON.parse(data) : [];
      
      sosBuffer.push({
        ...sosData,
        timestamp: new Date().toISOString(),
        priority: PRIORITY.CRITICAL,
      });

      await AsyncStorage.setItem(SOS_BUFFER_KEY, JSON.stringify(sosBuffer));
      console.log('🚨 SOS buffered for offline sync');
      return true;
    } catch (error) {
      console.error('Failed to buffer SOS:', error);
      return false;
    }
  }, []);

  /**
   * Sync buffered SOS alerts first (highest priority)
   */
  const syncSOSBuffer = async () => {
    try {
      const data = await AsyncStorage.getItem(SOS_BUFFER_KEY);
      if (!data) return;

      const sosBuffer = JSON.parse(data);
      if (sosBuffer.length === 0) return;

      console.log(`🚨 Syncing ${sosBuffer.length} buffered SOS alerts...`);

      for (const sos of sosBuffer) {
        try {
          await axios.post(
            `${API_URL}/sos/send`,
            sos,
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (error) {
          console.error('Failed to sync SOS:', error.message);
          // Keep failed SOS in buffer
          return;
        }
      }

      // Clear SOS buffer after successful sync
      await AsyncStorage.removeItem(SOS_BUFFER_KEY);
      console.log('✅ All SOS alerts synced');
    } catch (error) {
      console.error('SOS sync failed:', error);
    }
  };

  /**
   * Sync buffered locations to server with priority ordering
   */
  const syncBufferedLocations = useCallback(async () => {
    if (syncInProgress.current || !token) return;
    
    syncInProgress.current = true;
    setIsSyncing(true);

    try {
      // Sync SOS alerts first
      await syncSOSBuffer();

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

      // Sort by priority (highest first) then by timestamp (oldest first within same priority)
      buffer.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return new Date(a.timestamp) - new Date(b.timestamp);
      });

      console.log(`🔄 Syncing ${buffer.length} buffered locations...`);
      setSyncProgress({ synced: 0, total: buffer.length });

      let syncedCount = 0;
      let failedBatches = [];

      // Send in batches
      while (buffer.length > 0) {
        const batch = buffer.splice(0, SYNC_BATCH_SIZE);
        
        try {
          await axios.post(
            `${API_URL}/vehicles/sync-locations`,
            { locations: batch },
            { 
              headers: { Authorization: `Bearer ${token}` },
              timeout: 30000, // 30 second timeout
            }
          );
          
          syncedCount += batch.length;
          setSyncProgress({ synced: syncedCount, total: syncedCount + buffer.length });
          
          // Update storage after each successful batch
          await AsyncStorage.setItem(BUFFER_KEY, JSON.stringify(buffer));
          setBufferCount(buffer.length);
          
          // Reset retry count on success
          retryCount.current = 0;
          
          console.log(`✅ Synced batch (${syncedCount} total, ${buffer.length} remaining)`);
        } catch (error) {
          console.error('Batch sync failed:', error.message);
          
          // Increment retry count for failed items
          const retriedBatch = batch.map(item => ({
            ...item,
            retryCount: (item.retryCount || 0) + 1,
          }));
          
          // Filter out items that exceeded max retries
          const retryable = retriedBatch.filter(item => item.retryCount < MAX_RETRY_ATTEMPTS);
          const dropped = retriedBatch.filter(item => item.retryCount >= MAX_RETRY_ATTEMPTS);
          
          if (dropped.length > 0) {
            console.warn(`⚠️ Dropped ${dropped.length} items after max retries`);
          }
          
          // Put retryable items back
          buffer = [...retryable, ...buffer];
          await AsyncStorage.setItem(BUFFER_KEY, JSON.stringify(buffer));
          setBufferCount(buffer.length);
          
          // Exponential backoff
          retryCount.current++;
          if (retryCount.current < MAX_RETRY_ATTEMPTS) {
            const delay = RETRY_DELAY_BASE * Math.pow(2, retryCount.current);
            console.log(`⏳ Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            console.error('Max retries reached, stopping sync');
            break;
          }
        }
      }

      // Update stats
      await saveBufferStats({
        totalSynced: bufferStats.totalSynced + syncedCount,
        lastSyncTime: new Date().toISOString(),
        failedAttempts: buffer.length > 0 ? bufferStats.failedAttempts + 1 : 0,
      });

      if (buffer.length === 0) {
        console.log('✅ All buffered locations synced!');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      await saveBufferStats({
        failedAttempts: bufferStats.failedAttempts + 1,
      });
    } finally {
      syncInProgress.current = false;
      setIsSyncing(false);
      setSyncProgress({ synced: 0, total: 0 });
    }
  }, [token, bufferStats]);

  /**
   * Get buffer health status
   */
  const getBufferHealth = useCallback(() => {
    const health = {
      status: 'healthy',
      message: 'Buffer is operating normally',
      details: {},
    };

    if (bufferCount > MAX_BUFFER_SIZE * 0.8) {
      health.status = 'warning';
      health.message = 'Buffer is nearly full';
    }

    if (bufferCount >= MAX_BUFFER_SIZE) {
      health.status = 'critical';
      health.message = 'Buffer is full - oldest entries being dropped';
    }

    if (bufferStats.failedAttempts > 3) {
      health.status = 'error';
      health.message = 'Multiple sync failures detected';
    }

    health.details = {
      count: bufferCount,
      maxSize: MAX_BUFFER_SIZE,
      percentFull: Math.round((bufferCount / MAX_BUFFER_SIZE) * 100),
      lastSync: bufferStats.lastSyncTime,
      totalSynced: bufferStats.totalSynced,
      failedAttempts: bufferStats.failedAttempts,
    };

    return health;
  }, [bufferCount, bufferStats]);

  /**
   * Clear buffer (use with caution)
   */
  const clearBuffer = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([BUFFER_KEY, SOS_BUFFER_KEY]);
      setBufferCount(0);
      await saveBufferStats({
        totalBuffered: 0,
        oldestEntry: null,
        failedAttempts: 0,
      });
    } catch (error) {
      console.error('Failed to clear buffer:', error);
    }
  }, []);

  /**
   * Force sync (manual trigger)
   */
  const forceSync = useCallback(async () => {
    retryCount.current = 0; // Reset retry count
    await syncBufferedLocations();
  }, [syncBufferedLocations]);

  /**
   * Manually set online status
   */
  const setOnlineStatus = useCallback((online) => {
    if (online && !isOnline && !syncInProgress.current) {
      syncBufferedLocations();
    }
    setIsOnline(online);
  }, [isOnline, syncBufferedLocations]);

  return {
    // State
    isOnline,
    bufferCount,
    isSyncing,
    syncProgress,
    bufferStats,
    
    // Actions
    bufferLocation,
    bufferSOS,
    syncBufferedLocations,
    forceSync,
    clearBuffer,
    setOnlineStatus,
    
    // Utilities
    getBufferHealth,
  };
}
