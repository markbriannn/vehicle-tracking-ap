/**
 * =============================================================================
 * OFFLINE MAP HOOK
 * =============================================================================
 * 
 * React hook for managing offline map caching.
 * Provides easy-to-use interface for caching routes and regions.
 */

import { useState, useEffect, useCallback } from 'react';
import { mapCache } from '../utils/offlineMapCache';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVED_ROUTES_KEY = 'offline_saved_routes';

export function useOfflineMap() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [cacheStats, setCacheStats] = useState(null);
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [error, setError] = useState(null);

  /**
   * Initialize map cache on mount
   */
  useEffect(() => {
    const init = async () => {
      try {
        await mapCache.initialize();
        setIsInitialized(true);
        await refreshStats();
        await loadSavedRoutes();
      } catch (err) {
        setError('Failed to initialize offline maps');
        console.error(err);
      }
    };
    init();
  }, []);

  /**
   * Load saved routes from storage
   */
  const loadSavedRoutes = async () => {
    try {
      const data = await AsyncStorage.getItem(SAVED_ROUTES_KEY);
      if (data) {
        setSavedRoutes(JSON.parse(data));
      }
    } catch (err) {
      console.error('Failed to load saved routes:', err);
    }
  };

  /**
   * Save route to list
   */
  const saveRouteToList = async (route) => {
    try {
      const updated = [...savedRoutes.filter(r => r.name !== route.name), route];
      await AsyncStorage.setItem(SAVED_ROUTES_KEY, JSON.stringify(updated));
      setSavedRoutes(updated);
    } catch (err) {
      console.error('Failed to save route:', err);
    }
  };

  /**
   * Remove route from list
   */
  const removeRouteFromList = async (routeName) => {
    try {
      const updated = savedRoutes.filter(r => r.name !== routeName);
      await AsyncStorage.setItem(SAVED_ROUTES_KEY, JSON.stringify(updated));
      setSavedRoutes(updated);
    } catch (err) {
      console.error('Failed to remove route:', err);
    }
  };

  /**
   * Refresh cache statistics
   */
  const refreshStats = async () => {
    try {
      const stats = await mapCache.getCacheStats();
      setCacheStats(stats);
    } catch (err) {
      console.error('Failed to get cache stats:', err);
    }
  };

  /**
   * Download map tiles for current location
   */
  const downloadCurrentArea = useCallback(async (latitude, longitude, radiusKm = 2) => {
    if (!isInitialized || isDownloading) return null;

    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: 0, status: 'Starting...' });
    setError(null);

    try {
      const result = await mapCache.cacheCurrentArea(latitude, longitude, radiusKm, {
        onProgress: (progress) => {
          setDownloadProgress({
            ...progress,
            status: `Downloading tiles (${progress.current}/${progress.total})`,
            percent: Math.round((progress.current / progress.total) * 100),
          });
        },
      });

      await refreshStats();
      
      // Save as "Current Location" route
      await saveRouteToList({
        name: 'Current Location',
        type: 'area',
        center: { latitude, longitude },
        radiusKm,
        cachedAt: Date.now(),
        tileCount: result.cached + result.skipped,
      });

      return result;
    } catch (err) {
      setError('Failed to download map tiles');
      console.error(err);
      return null;
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  }, [isInitialized, isDownloading]);

  /**
   * Download map tiles for a route
   */
  const downloadRoute = useCallback(async (routePoints, routeName) => {
    if (!isInitialized || isDownloading) return null;
    if (!routePoints || routePoints.length < 2) {
      setError('Route must have at least 2 points');
      return null;
    }

    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: 0, status: 'Calculating tiles...' });
    setError(null);

    try {
      const result = await mapCache.cacheRoute(routePoints, routeName, {
        paddingKm: 0.5,
        onProgress: (progress) => {
          setDownloadProgress({
            ...progress,
            status: `Downloading tiles (${progress.current}/${progress.total})`,
            percent: Math.round((progress.current / progress.total) * 100),
          });
        },
      });

      await refreshStats();

      // Save route info
      await saveRouteToList({
        name: routeName,
        type: 'route',
        points: routePoints,
        cachedAt: Date.now(),
        tileCount: result.cached + result.skipped,
      });

      return result;
    } catch (err) {
      setError('Failed to download route tiles');
      console.error(err);
      return null;
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  }, [isInitialized, isDownloading]);

  /**
   * Download map tiles for a bounding box
   */
  const downloadRegion = useCallback(async (bounds, regionName) => {
    if (!isInitialized || isDownloading) return null;

    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: 0, status: 'Starting...' });
    setError(null);

    try {
      const result = await mapCache.cacheRegion(bounds, {
        onProgress: (progress) => {
          setDownloadProgress({
            ...progress,
            status: `Downloading tiles (${progress.current}/${progress.total})`,
            percent: Math.round((progress.current / progress.total) * 100),
          });
        },
      });

      await refreshStats();

      // Save region info
      await saveRouteToList({
        name: regionName || 'Custom Region',
        type: 'region',
        bounds,
        cachedAt: Date.now(),
        tileCount: result.cached + result.skipped,
      });

      return result;
    } catch (err) {
      setError('Failed to download region tiles');
      console.error(err);
      return null;
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  }, [isInitialized, isDownloading]);

  /**
   * Clear all cached tiles
   */
  const clearCache = useCallback(async () => {
    try {
      await mapCache.clearCache();
      await AsyncStorage.removeItem(SAVED_ROUTES_KEY);
      setSavedRoutes([]);
      await refreshStats();
      return { success: true };
    } catch (err) {
      setError('Failed to clear cache');
      console.error(err);
      return { success: false };
    }
  }, []);

  /**
   * Clean expired tiles
   */
  const cleanExpired = useCallback(async () => {
    try {
      const result = await mapCache.cleanExpiredTiles();
      await refreshStats();
      return result;
    } catch (err) {
      console.error(err);
      return { cleaned: 0 };
    }
  }, []);

  /**
   * Cancel current download (not fully implemented - would need AbortController)
   */
  const cancelDownload = useCallback(() => {
    // Note: Full cancellation would require AbortController support in the cache
    setIsDownloading(false);
    setDownloadProgress(null);
  }, []);

  return {
    // State
    isInitialized,
    isDownloading,
    downloadProgress,
    cacheStats,
    savedRoutes,
    error,

    // Actions
    downloadCurrentArea,
    downloadRoute,
    downloadRegion,
    clearCache,
    cleanExpired,
    cancelDownload,
    refreshStats,
    removeRouteFromList,
  };
}
