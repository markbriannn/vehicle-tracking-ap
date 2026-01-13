/**
 * =============================================================================
 * OFFLINE MAP CACHE UTILITY
 * =============================================================================
 * 
 * Caches map tiles for offline use on common routes.
 * Uses expo-file-system for persistent storage.
 * 
 * FEATURES:
 * - Cache map tiles for specific regions/routes
 * - Automatic cache management (size limits, expiry)
 * - Background downloading
 * - Cache statistics and health monitoring
 */

import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration
const CACHE_DIR = `${FileSystem.cacheDirectory}map_tiles/`;
const CACHE_INDEX_KEY = 'map_cache_index';
const MAX_CACHE_SIZE_MB = 100; // Maximum cache size in MB
const TILE_EXPIRY_DAYS = 30; // Tiles expire after 30 days
const ZOOM_LEVELS = [14, 15, 16, 17]; // Zoom levels to cache

// Google Maps tile URL template (for reference - actual implementation may vary)
// Note: You may need to use a different tile provider that allows caching
const TILE_URL_TEMPLATE = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';

/**
 * Convert lat/lng to tile coordinates
 */
const latLngToTile = (lat, lng, zoom) => {
  const n = Math.pow(2, zoom);
  const x = Math.floor((lng + 180) / 360 * n);
  const latRad = lat * Math.PI / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return { x, y, z: zoom };
};

/**
 * Get all tiles needed to cover a bounding box at a specific zoom level
 */
const getTilesForBounds = (bounds, zoom) => {
  const { north, south, east, west } = bounds;
  
  const topLeft = latLngToTile(north, west, zoom);
  const bottomRight = latLngToTile(south, east, zoom);
  
  const tiles = [];
  for (let x = topLeft.x; x <= bottomRight.x; x++) {
    for (let y = topLeft.y; y <= bottomRight.y; y++) {
      tiles.push({ x, y, z: zoom });
    }
  }
  
  return tiles;
};

/**
 * Calculate bounding box around a route with padding
 */
const getRouteBounds = (routePoints, paddingKm = 1) => {
  if (!routePoints || routePoints.length === 0) {
    return null;
  }

  let north = -90, south = 90, east = -180, west = 180;
  
  routePoints.forEach(point => {
    if (point.latitude > north) north = point.latitude;
    if (point.latitude < south) south = point.latitude;
    if (point.longitude > east) east = point.longitude;
    if (point.longitude < west) west = point.longitude;
  });

  // Add padding (rough conversion: 1 degree ≈ 111km)
  const paddingDeg = paddingKm / 111;
  
  return {
    north: north + paddingDeg,
    south: south - paddingDeg,
    east: east + paddingDeg,
    west: west - paddingDeg,
  };
};

/**
 * Offline Map Cache Manager
 */
class OfflineMapCache {
  constructor() {
    this.cacheIndex = {};
    this.isInitialized = false;
  }

  /**
   * Initialize cache directory and load index
   */
  async initialize() {
    try {
      // Ensure cache directory exists
      const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      }

      // Load cache index
      const indexData = await AsyncStorage.getItem(CACHE_INDEX_KEY);
      if (indexData) {
        this.cacheIndex = JSON.parse(indexData);
      }

      this.isInitialized = true;
      console.log('📦 Map cache initialized');
      
      // Clean expired tiles
      await this.cleanExpiredTiles();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize map cache:', error);
      return false;
    }
  }

  /**
   * Save cache index to storage
   */
  async saveCacheIndex() {
    try {
      await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(this.cacheIndex));
    } catch (error) {
      console.error('Failed to save cache index:', error);
    }
  }

  /**
   * Get tile cache key
   */
  getTileKey(x, y, z) {
    return `${z}_${x}_${y}`;
  }

  /**
   * Get tile file path
   */
  getTilePath(x, y, z) {
    return `${CACHE_DIR}${this.getTileKey(x, y, z)}.png`;
  }

  /**
   * Check if tile is cached and valid
   */
  async isTileCached(x, y, z) {
    const key = this.getTileKey(x, y, z);
    const entry = this.cacheIndex[key];
    
    if (!entry) return false;
    
    // Check if expired
    const expiryTime = entry.cachedAt + (TILE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    if (Date.now() > expiryTime) {
      return false;
    }
    
    // Verify file exists
    const fileInfo = await FileSystem.getInfoAsync(this.getTilePath(x, y, z));
    return fileInfo.exists;
  }

  /**
   * Download and cache a single tile
   */
  async cacheTile(x, y, z) {
    const key = this.getTileKey(x, y, z);
    const filePath = this.getTilePath(x, y, z);
    
    try {
      // Check if already cached
      if (await this.isTileCached(x, y, z)) {
        return { success: true, cached: true };
      }

      // Download tile
      const url = TILE_URL_TEMPLATE
        .replace('{x}', x)
        .replace('{y}', y)
        .replace('{z}', z);

      const downloadResult = await FileSystem.downloadAsync(url, filePath);
      
      if (downloadResult.status === 200) {
        // Update index
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        this.cacheIndex[key] = {
          x, y, z,
          cachedAt: Date.now(),
          size: fileInfo.size || 0,
        };
        
        return { success: true, cached: false, size: fileInfo.size };
      } else {
        return { success: false, error: `HTTP ${downloadResult.status}` };
      }
    } catch (error) {
      console.error(`Failed to cache tile ${key}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cache tiles for a specific region
   */
  async cacheRegion(bounds, options = {}) {
    const {
      zoomLevels = ZOOM_LEVELS,
      onProgress = () => {},
      maxTiles = 500,
    } = options;

    if (!this.isInitialized) {
      await this.initialize();
    }

    // Calculate all tiles needed
    let allTiles = [];
    for (const zoom of zoomLevels) {
      const tiles = getTilesForBounds(bounds, zoom);
      allTiles = [...allTiles, ...tiles];
    }

    // Limit total tiles
    if (allTiles.length > maxTiles) {
      console.warn(`Region requires ${allTiles.length} tiles, limiting to ${maxTiles}`);
      allTiles = allTiles.slice(0, maxTiles);
    }

    console.log(`📥 Caching ${allTiles.length} tiles for region...`);

    let cached = 0;
    let skipped = 0;
    let failed = 0;
    let totalSize = 0;

    for (let i = 0; i < allTiles.length; i++) {
      const tile = allTiles[i];
      const result = await this.cacheTile(tile.x, tile.y, tile.z);
      
      if (result.success) {
        if (result.cached) {
          skipped++;
        } else {
          cached++;
          totalSize += result.size || 0;
        }
      } else {
        failed++;
      }

      // Report progress
      onProgress({
        current: i + 1,
        total: allTiles.length,
        cached,
        skipped,
        failed,
        totalSize,
      });

      // Small delay to avoid overwhelming the server
      if (!result.cached) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    // Save index
    await this.saveCacheIndex();

    const result = {
      success: true,
      totalTiles: allTiles.length,
      cached,
      skipped,
      failed,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    };

    console.log(`✅ Region cached: ${cached} new, ${skipped} existing, ${failed} failed`);
    return result;
  }

  /**
   * Cache tiles along a route
   */
  async cacheRoute(routePoints, routeName, options = {}) {
    const bounds = getRouteBounds(routePoints, options.paddingKm || 0.5);
    
    if (!bounds) {
      return { success: false, error: 'Invalid route points' };
    }

    console.log(`📍 Caching route: ${routeName}`);
    
    const result = await this.cacheRegion(bounds, options);
    
    // Store route metadata
    const routeKey = `route_${routeName.replace(/\s+/g, '_').toLowerCase()}`;
    await AsyncStorage.setItem(routeKey, JSON.stringify({
      name: routeName,
      bounds,
      cachedAt: Date.now(),
      tileCount: result.totalTiles,
    }));

    return result;
  }

  /**
   * Cache area around current location
   */
  async cacheCurrentArea(latitude, longitude, radiusKm = 2, options = {}) {
    const paddingDeg = radiusKm / 111;
    
    const bounds = {
      north: latitude + paddingDeg,
      south: latitude - paddingDeg,
      east: longitude + paddingDeg,
      west: longitude - paddingDeg,
    };

    console.log(`📍 Caching ${radiusKm}km radius around current location`);
    return await this.cacheRegion(bounds, options);
  }

  /**
   * Get cached tile URI for MapView
   */
  getCachedTileUri(x, y, z) {
    const key = this.getTileKey(x, y, z);
    if (this.cacheIndex[key]) {
      return this.getTilePath(x, y, z);
    }
    return null;
  }

  /**
   * Clean expired tiles
   */
  async cleanExpiredTiles() {
    const now = Date.now();
    const expiryMs = TILE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    let cleaned = 0;
    let freedBytes = 0;

    for (const [key, entry] of Object.entries(this.cacheIndex)) {
      if (now - entry.cachedAt > expiryMs) {
        try {
          const filePath = `${CACHE_DIR}${key}.png`;
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          
          if (fileInfo.exists) {
            freedBytes += fileInfo.size || 0;
            await FileSystem.deleteAsync(filePath, { idempotent: true });
          }
          
          delete this.cacheIndex[key];
          cleaned++;
        } catch (error) {
          console.error(`Failed to clean tile ${key}:`, error);
        }
      }
    }

    if (cleaned > 0) {
      await this.saveCacheIndex();
      console.log(`🧹 Cleaned ${cleaned} expired tiles (${(freedBytes / 1024 / 1024).toFixed(2)} MB)`);
    }

    return { cleaned, freedMB: (freedBytes / 1024 / 1024).toFixed(2) };
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    let totalSize = 0;
    let tileCount = Object.keys(this.cacheIndex).length;
    let oldestTile = null;
    let newestTile = null;

    for (const entry of Object.values(this.cacheIndex)) {
      totalSize += entry.size || 0;
      
      if (!oldestTile || entry.cachedAt < oldestTile) {
        oldestTile = entry.cachedAt;
      }
      if (!newestTile || entry.cachedAt > newestTile) {
        newestTile = entry.cachedAt;
      }
    }

    return {
      tileCount,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      maxSizeMB: MAX_CACHE_SIZE_MB,
      percentUsed: Math.round((totalSize / (MAX_CACHE_SIZE_MB * 1024 * 1024)) * 100),
      oldestTile: oldestTile ? new Date(oldestTile).toISOString() : null,
      newestTile: newestTile ? new Date(newestTile).toISOString() : null,
      expiryDays: TILE_EXPIRY_DAYS,
    };
  }

  /**
   * Clear all cached tiles
   */
  async clearCache() {
    try {
      await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      this.cacheIndex = {};
      await this.saveCacheIndex();
      console.log('🗑️ Map cache cleared');
      return { success: true };
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enforce cache size limit
   */
  async enforceSizeLimit() {
    const stats = await this.getCacheStats();
    
    if (stats.percentUsed < 90) {
      return { cleaned: 0 };
    }

    console.log('⚠️ Cache size limit reached, cleaning oldest tiles...');

    // Sort tiles by age (oldest first)
    const sortedTiles = Object.entries(this.cacheIndex)
      .sort((a, b) => a[1].cachedAt - b[1].cachedAt);

    let cleaned = 0;
    let freedBytes = 0;
    const targetSize = MAX_CACHE_SIZE_MB * 1024 * 1024 * 0.7; // Clean to 70%

    let currentSize = parseFloat(stats.totalSizeMB) * 1024 * 1024;

    for (const [key, entry] of sortedTiles) {
      if (currentSize <= targetSize) break;

      try {
        const filePath = `${CACHE_DIR}${key}.png`;
        await FileSystem.deleteAsync(filePath, { idempotent: true });
        
        currentSize -= entry.size || 0;
        freedBytes += entry.size || 0;
        delete this.cacheIndex[key];
        cleaned++;
      } catch (error) {
        console.error(`Failed to delete tile ${key}:`, error);
      }
    }

    await this.saveCacheIndex();
    console.log(`🧹 Cleaned ${cleaned} tiles to enforce size limit`);

    return { cleaned, freedMB: (freedBytes / 1024 / 1024).toFixed(2) };
  }
}

// Export singleton instance
export const mapCache = new OfflineMapCache();

// Export utility functions
export { latLngToTile, getTilesForBounds, getRouteBounds };
