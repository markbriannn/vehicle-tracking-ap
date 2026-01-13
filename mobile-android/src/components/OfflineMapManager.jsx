/**
 * =============================================================================
 * OFFLINE MAP MANAGER COMPONENT
 * =============================================================================
 * 
 * UI component for managing offline map downloads.
 * Shows cache status, saved routes, and download controls.
 */

import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useOfflineMap } from '../hooks/useOfflineMap';
import { colors } from '../styles';

export default function OfflineMapManager({ visible, onClose, currentLocation }) {
  const {
    isInitialized,
    isDownloading,
    downloadProgress,
    cacheStats,
    savedRoutes,
    error,
    downloadCurrentArea,
    clearCache,
    cleanExpired,
    refreshStats,
    removeRouteFromList,
  } = useOfflineMap();

  const [selectedRadius, setSelectedRadius] = useState(2);

  const handleDownloadCurrentArea = async () => {
    if (!currentLocation) {
      Alert.alert('Location Required', 'Please enable location services to download maps for your area.');
      return;
    }

    const result = await downloadCurrentArea(
      currentLocation.coords.latitude,
      currentLocation.coords.longitude,
      selectedRadius
    );

    if (result) {
      Alert.alert(
        '✅ Download Complete',
        `Downloaded ${result.cached} new tiles (${result.totalSizeMB} MB)\n${result.skipped} tiles already cached`
      );
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will delete all downloaded map tiles. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearCache();
            Alert.alert('Cache Cleared', 'All offline map tiles have been deleted.');
          },
        },
      ]
    );
  };

  const handleCleanExpired = async () => {
    const result = await cleanExpired();
    Alert.alert(
      'Cleanup Complete',
      `Removed ${result.cleaned} expired tiles (${result.freedMB} MB freed)`
    );
  };

  const handleRemoveRoute = (routeName) => {
    Alert.alert(
      'Remove Route',
      `Remove "${routeName}" from saved routes?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeRouteFromList(routeName),
        },
      ]
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>📦 Offline Maps</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Cache Stats */}
            {cacheStats && (
              <View style={styles.statsCard}>
                <Text style={styles.sectionTitle}>Cache Status</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{cacheStats.tileCount}</Text>
                    <Text style={styles.statLabel}>Tiles</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{cacheStats.totalSizeMB} MB</Text>
                    <Text style={styles.statLabel}>Size</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{cacheStats.percentUsed}%</Text>
                    <Text style={styles.statLabel}>Used</Text>
                  </View>
                </View>
                
                {/* Progress bar */}
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${cacheStats.percentUsed}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {cacheStats.totalSizeMB} / {cacheStats.maxSizeMB} MB
                </Text>
              </View>
            )}

            {/* Download Current Area */}
            <View style={styles.downloadCard}>
              <Text style={styles.sectionTitle}>Download Area</Text>
              <Text style={styles.description}>
                Download map tiles around your current location for offline use.
              </Text>

              {/* Radius selector */}
              <View style={styles.radiusSelector}>
                <Text style={styles.radiusLabel}>Radius:</Text>
                {[1, 2, 5].map((radius) => (
                  <TouchableOpacity
                    key={radius}
                    style={[
                      styles.radiusOption,
                      selectedRadius === radius && styles.radiusOptionActive,
                    ]}
                    onPress={() => setSelectedRadius(radius)}
                  >
                    <Text
                      style={[
                        styles.radiusText,
                        selectedRadius === radius && styles.radiusTextActive,
                      ]}
                    >
                      {radius} km
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Download button */}
              <TouchableOpacity
                style={[styles.downloadButton, isDownloading && styles.downloadButtonDisabled]}
                onPress={handleDownloadCurrentArea}
                disabled={isDownloading || !currentLocation}
              >
                {isDownloading ? (
                  <View style={styles.downloadingContent}>
                    <ActivityIndicator color={colors.white} size="small" />
                    <Text style={styles.downloadButtonText}>
                      {downloadProgress?.status || 'Downloading...'}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.downloadButtonText}>
                    📥 Download {selectedRadius}km Area
                  </Text>
                )}
              </TouchableOpacity>

              {/* Download progress */}
              {isDownloading && downloadProgress && (
                <View style={styles.downloadProgress}>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        styles.progressBarActive,
                        { width: `${downloadProgress.percent || 0}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressDetail}>
                    {downloadProgress.cached || 0} downloaded, {downloadProgress.skipped || 0} cached
                  </Text>
                </View>
              )}

              {!currentLocation && (
                <Text style={styles.warningText}>
                  ⚠️ Enable location to download maps
                </Text>
              )}
            </View>

            {/* Saved Routes */}
            <View style={styles.routesCard}>
              <Text style={styles.sectionTitle}>Saved Areas</Text>
              
              {savedRoutes.length === 0 ? (
                <Text style={styles.emptyText}>
                  No offline areas saved yet. Download an area to get started.
                </Text>
              ) : (
                savedRoutes.map((route, index) => (
                  <View key={index} style={styles.routeItem}>
                    <View style={styles.routeInfo}>
                      <Text style={styles.routeName}>
                        {route.type === 'area' ? '📍' : '🛣️'} {route.name}
                      </Text>
                      <Text style={styles.routeMeta}>
                        {route.tileCount} tiles • {formatDate(route.cachedAt)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveRoute(route.name)}
                    >
                      <Text style={styles.removeText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>

            {/* Cache Management */}
            <View style={styles.managementCard}>
              <Text style={styles.sectionTitle}>Cache Management</Text>
              
              <TouchableOpacity style={styles.managementButton} onPress={handleCleanExpired}>
                <Text style={styles.managementButtonText}>🧹 Clean Expired Tiles</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.managementButton} onPress={refreshStats}>
                <Text style={styles.managementButtonText}>🔄 Refresh Stats</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.managementButton, styles.dangerButton]}
                onPress={handleClearCache}
              >
                <Text style={[styles.managementButtonText, styles.dangerText]}>
                  🗑️ Clear All Cache
                </Text>
              </TouchableOpacity>
            </View>

            {/* Info */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>ℹ️ About Offline Maps</Text>
              <Text style={styles.infoText}>
                • Downloaded tiles are stored locally on your device{'\n'}
                • Tiles expire after {cacheStats?.expiryDays || 30} days{'\n'}
                • Maximum cache size: {cacheStats?.maxSizeMB || 100} MB{'\n'}
                • Maps work offline after downloading
              </Text>
            </View>

            {/* Error display */}
            {error && (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray[800],
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 20,
    color: colors.gray[500],
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 12,
  },
  statsCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 4,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressBarActive: {
    backgroundColor: colors.success,
  },
  progressText: {
    fontSize: 12,
    color: colors.gray[500],
    textAlign: 'center',
    marginTop: 8,
  },
  downloadCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 16,
  },
  radiusSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  radiusLabel: {
    fontSize: 14,
    color: colors.gray[600],
    marginRight: 12,
  },
  radiusOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[200],
    marginRight: 8,
  },
  radiusOptionActive: {
    backgroundColor: colors.primary,
  },
  radiusText: {
    fontSize: 14,
    color: colors.gray[600],
  },
  radiusTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  downloadButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  downloadButtonDisabled: {
    backgroundColor: colors.gray[400],
  },
  downloadButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  downloadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  downloadProgress: {
    marginTop: 12,
  },
  progressDetail: {
    fontSize: 12,
    color: colors.gray[500],
    textAlign: 'center',
    marginTop: 8,
  },
  warningText: {
    fontSize: 13,
    color: colors.warning,
    textAlign: 'center',
    marginTop: 12,
  },
  routesCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
    paddingVertical: 16,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[800],
  },
  routeMeta: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 4,
  },
  removeButton: {
    padding: 8,
  },
  removeText: {
    fontSize: 16,
    color: colors.gray[400],
  },
  managementCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  managementButton: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  managementButtonText: {
    fontSize: 14,
    color: colors.gray[700],
    textAlign: 'center',
  },
  dangerButton: {
    borderColor: colors.danger,
  },
  dangerText: {
    color: colors.danger,
  },
  infoCard: {
    backgroundColor: colors.info + '20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.info,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: colors.gray[600],
    lineHeight: 20,
  },
  errorCard: {
    backgroundColor: colors.danger + '20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: colors.danger,
  },
});
