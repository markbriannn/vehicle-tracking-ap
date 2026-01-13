/**
 * =============================================================================
 * DRIVER HOME SCREEN
 * =============================================================================
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Modal,
  RefreshControl,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { useAuthStore } from '../store/authStore';
import { useGeofenceStore } from '../store/geofenceStore';
import { useLocation } from '../hooks/useLocation';
import { useSocket } from '../hooks/useSocket';
import OfflineMapManager from '../components/OfflineMapManager';
import axios from 'axios';
import { API_URL } from '../config/api';
import { driverHomeStyles as styles } from './styles/driverHomeStyles';
import { colors } from '../styles';

const { width } = Dimensions.get('window');

export default function DriverHomeScreen({ navigation }) {
  const { user, token, logout, refreshUser } = useAuthStore();
  const { insideGeofences, recentEvents, geofences, setGeofences } = useGeofenceStore();
  const [vehicle, setVehicle] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showAccuracyModal, setShowAccuracyModal] = useState(false);
  const [showOfflineMapManager, setShowOfflineMapManager] = useState(false);
  const [showGeofenceHistory, setShowGeofenceHistory] = useState(false);
  const [showFullMap, setShowFullMap] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [isSavingRoute, setIsSavingRoute] = useState(false);
  const { location, startTracking, stopTracking, hasPermission, isBackgroundTracking, trackingStats = { totalDistance: 0, duration: 0, updateCount: 0 } } = useLocation(
    vehicle?._id,
    false // Don't auto-start, we control it manually
  );
  const { connect, sendLocationUpdate, isConnected, isOnline, bufferCount, isSyncing, syncProgress, forceSync, getBufferHealth } = useSocket();

  // Get vehicle ID properly (could be object or string)
  const getVehicleId = (assignedVehicle) => {
    if (!assignedVehicle) return null;
    if (typeof assignedVehicle === 'string') return assignedVehicle;
    if (typeof assignedVehicle === 'object') return assignedVehicle._id || assignedVehicle.id;
    return null;
  };

  // Pull to refresh
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await refreshUser();
      const vehicleId = getVehicleId(user?.assignedVehicle);
      if (vehicleId) {
        const response = await axios.get(`${API_URL}/vehicles/${vehicleId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setVehicle(response.data.vehicle);
        setRouteName(response.data.vehicle.routeName || '');
      }
    } catch (error) {
      console.error('Failed to refresh:', error);
    }
    setRefreshing(false);
  }, [refreshUser, user?.assignedVehicle, token, refreshing]);

  useEffect(() => {
    refreshUser();
  }, []);

  // Fetch geofences on mount
  useEffect(() => {
    const fetchGeofences = async () => {
      try {
        const response = await axios.get(`${API_URL}/geofences`);
        setGeofences(response.data.geofences || []);
      } catch (error) {
        console.error('Failed to fetch geofences:', error);
      }
    };
    fetchGeofences();
  }, []);

  useEffect(() => {
    const fetchVehicle = async () => {
      const vehicleId = getVehicleId(user?.assignedVehicle);
      if (vehicleId) {
        try {
          const response = await axios.get(`${API_URL}/vehicles/${vehicleId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setVehicle(response.data.vehicle);
          setRouteName(response.data.vehicle.routeName || '');
        } catch (error) {
          console.error('Failed to fetch vehicle:', error);
        }
      }
    };
    fetchVehicle();
  }, [user, token]);

  const handleSaveRoute = async () => {
    if (!vehicle) return;
    setIsSavingRoute(true);
    try {
      await axios.put(
        `${API_URL}/vehicles/${vehicle._id}/route`,
        { routeName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVehicle({ ...vehicle, routeName });
      setShowRouteModal(false);
      Alert.alert('Success', 'Route updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update route');
    } finally {
      setIsSavingRoute(false);
    }
  };

  useEffect(() => {
    connect();
  }, [connect]);

  const canStartTracking = () => {
    if (user?.verificationStatus !== 'approved') return false;
    if (!vehicle) return false;
    if (vehicle.verificationStatus !== 'approved') return false;
    if (!hasPermission) return false;
    return true;
  };

  const toggleTracking = async () => {
    if (!vehicle) {
      Alert.alert('No Vehicle', 'You need an assigned vehicle to start tracking');
      return;
    }
    if (vehicle.verificationStatus !== 'approved') {
      Alert.alert('Pending Verification', 'Your vehicle is not yet verified');
      return;
    }
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Location permission is needed for tracking');
      return;
    }
    if (isTracking) {
      await stopTracking();
      setIsTracking(false);
    } else {
      await startTracking(sendLocationUpdate, connect, isConnected);
      setIsTracking(true);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return colors.success;
      case 'pending': return colors.warning;
      case 'rejected': return colors.danger;
      default: return colors.gray[500];
    }
  };

  // GPS Accuracy helpers
  const getAccuracyColor = (accuracy) => {
    if (!accuracy) return '#9CA3AF';
    if (accuracy <= 10) return '#22C55E'; // Green - Excellent
    if (accuracy <= 25) return '#84CC16'; // Lime - Good
    if (accuracy <= 50) return '#EAB308'; // Yellow - Fair
    if (accuracy <= 100) return '#F97316'; // Orange - Poor
    return '#EF4444'; // Red - Very Poor
  };

  const getAccuracyLabel = (accuracy) => {
    if (!accuracy) return 'No Signal';
    if (accuracy <= 10) return 'Excellent';
    if (accuracy <= 25) return 'Good';
    if (accuracy <= 50) return 'Fair';
    if (accuracy <= 100) return 'Poor';
    return 'Very Poor';
  };

  const accuracy = location?.coords?.accuracy;
  const accuracyColor = getAccuracyColor(accuracy);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexShrink: 1, marginRight: 16 }}>
          <Text style={styles.greeting}>Hello, {user?.name} 👋</Text>
          <Text style={styles.role}>Driver</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {isTracking ? (
            <TouchableOpacity 
              onPress={() => setShowAccuracyModal(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: accuracyColor,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                marginRight: 8,
              }}
            >
              <View style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: 'white',
                marginRight: 6,
              }} />
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                {isOnline ? 'LIVE' : 'OFFLINE'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              onPress={onRefresh} 
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: '#D1D5DB',
                marginRight: 8,
              }}
            >
              <Text style={{ color: '#374151', fontSize: 13 }}>Refresh</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mini Map - Shows when tracking */}
      {isTracking && location && (
        <View style={{ marginHorizontal: 16, marginBottom: 16, borderRadius: 16, overflow: 'hidden', elevation: 3 }}>
          <TouchableOpacity onPress={() => setShowFullMap(true)} activeOpacity={0.9}>
            <MapView
              style={{ width: width - 32, height: 200 }}
              region={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
              showsUserLocation={false}
              showsMyLocationButton={false}
            >
              {/* Geofence circles */}
              {geofences.map((geofence) => (
                <Circle
                  key={geofence._id || geofence.id}
                  center={{
                    latitude: geofence.center.latitude,
                    longitude: geofence.center.longitude,
                  }}
                  radius={geofence.radius}
                  fillColor={`${geofence.color || '#3B82F6'}30`}
                  strokeColor={geofence.color || '#3B82F6'}
                  strokeWidth={2}
                />
              ))}
              {/* Geofence markers */}
              {geofences.map((geofence) => (
                <Marker
                  key={`marker-${geofence._id || geofence.id}`}
                  coordinate={{
                    latitude: geofence.center.latitude,
                    longitude: geofence.center.longitude,
                  }}
                  title={geofence.name}
                  description={geofence.type}
                >
                  <View style={{
                    backgroundColor: geofence.color || '#3B82F6',
                    paddingHorizontal: 6,
                    paddingVertical: 3,
                    borderRadius: 4,
                    borderWidth: 1,
                    borderColor: 'white',
                  }}>
                    <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                      {geofence.type === 'terminal' ? '🚏' : '📍'}
                    </Text>
                  </View>
                </Marker>
              ))}
              {/* Driver location */}
              <Marker
                coordinate={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                }}
                title="Your Location"
              >
                <Text style={{ fontSize: 28 }}>🚗</Text>
              </Marker>
            </MapView>
          </TouchableOpacity>
          {/* Tap to expand hint */}
          <View style={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'rgba(0,0,0,0.6)',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
          }}>
            <Text style={{ color: 'white', fontSize: 10 }}>Tap to expand</Text>
          </View>
          {/* Stats overlay - like VPN notification style */}
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
            paddingVertical: 10,
            paddingHorizontal: 12,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ color: '#9CA3AF', fontSize: 10 }}>SPEED</Text>
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                  {Math.round((location.coords.speed || 0) * 3.6)} km/h
                </Text>
              </View>
              <View style={{ width: 1, height: 30, backgroundColor: '#4B5563' }} />
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ color: '#9CA3AF', fontSize: 10 }}>DISTANCE</Text>
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                  {((trackingStats?.totalDistance || 0) / 1000).toFixed(2)} km
                </Text>
              </View>
              <View style={{ width: 1, height: 30, backgroundColor: '#4B5563' }} />
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ color: '#9CA3AF', fontSize: 10 }}>TIME</Text>
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                  {Math.round((trackingStats?.duration || 0) / 60000)} min
                </Text>
              </View>
              <View style={{ width: 1, height: 30, backgroundColor: '#4B5563' }} />
              <TouchableOpacity 
                onPress={() => setShowAccuracyModal(true)}
                style={{ alignItems: 'center', flex: 1 }}
              >
                <Text style={{ color: '#9CA3AF', fontSize: 10 }}>ACCURACY</Text>
                <Text style={{ color: accuracyColor, fontWeight: 'bold', fontSize: 16 }}>
                  ±{Math.round(accuracy || 0)}m
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Verification Status */}
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Account Status</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(user?.verificationStatus) }]} />
          <Text style={styles.statusText}>{user?.verificationStatus?.toUpperCase()}</Text>
        </View>
      </View>

      {/* Vehicle Info */}
      {vehicle ? (
        <View style={styles.vehicleCard}>
          <Text style={styles.cardTitle}>Assigned Vehicle</Text>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleNumber}>{vehicle.vehicleNumber}</Text>
            <Text style={styles.vehiclePlate}>{vehicle.licensePlate}</Text>
            <Text style={styles.vehicleType}>{vehicle.type}</Text>
          </View>
          <View style={styles.routeContainer}>
            <View style={styles.routeInfo}>
              <Text style={styles.routeLabel}>📍 Route:</Text>
              <Text style={styles.routeValue}>{vehicle.routeName || 'Not set'}</Text>
            </View>
            <TouchableOpacity style={styles.editRouteButton} onPress={() => setShowRouteModal(true)}>
              <Text style={styles.editRouteText}>✏️ Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(vehicle.verificationStatus) }]} />
            <Text style={styles.statusText}>Vehicle: {vehicle.verificationStatus?.toUpperCase()}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.vehicleCard}>
          <Text style={styles.cardTitle}>No Vehicle Assigned</Text>
          <Text style={styles.statusHint}>
            {user?.assignedVehicle 
              ? `Vehicle ID: ${user.assignedVehicle} (loading failed)`
              : 'Register as a new driver with vehicle info.'}
          </Text>
        </View>
      )}

      {/* GPS Tracking */}
      <View style={styles.trackingCard}>
        <Text style={styles.cardTitle}>GPS Tracking</Text>
        
        {!canStartTracking() && (
          <View style={styles.requirementsBox}>
            <Text style={styles.requirementsTitle}>⚠️ Requirements:</Text>
            {user?.verificationStatus !== 'approved' && (
              <Text style={styles.requirementItem}>❌ Account must be approved</Text>
            )}
            {!vehicle && (
              <Text style={styles.requirementItem}>❌ Need to register a vehicle</Text>
            )}
            {vehicle && vehicle.verificationStatus !== 'approved' && (
              <Text style={styles.requirementItem}>❌ Vehicle must be approved</Text>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.trackingButton,
            isTracking ? styles.trackingButtonStop : styles.trackingButtonStart,
            !canStartTracking() && !isTracking && styles.trackingButtonDisabled,
          ]}
          onPress={toggleTracking}
          disabled={!canStartTracking() && !isTracking}
        >
          <Text style={[
            styles.trackingButtonText,
            !canStartTracking() && !isTracking && styles.trackingButtonTextDisabled,
          ]}>
            {isTracking ? '⏹ Stop Tracking' : '▶ Start Tracking'}
          </Text>
        </TouchableOpacity>

        {isTracking && (
          <View style={styles.trackingIndicator}>
            <View style={[styles.pulsingDot, { backgroundColor: accuracyColor }]} />
            <Text style={styles.trackingIndicatorText}>
              {isOnline ? 'Broadcasting location...' : '📴 Offline - Buffering'}
            </Text>
          </View>
        )}

        {isBackgroundTracking && (
          <View style={{ backgroundColor: '#E0F2FE', padding: 10, borderRadius: 8, marginTop: 8 }}>
            <Text style={{ color: '#0369A1', fontSize: 12, textAlign: 'center' }}>
              🔄 Background tracking active - continues when app is minimized
            </Text>
          </View>
        )}

        {bufferCount > 0 && (
          <TouchableOpacity 
            style={styles.bufferStatus}
            onPress={() => {
              const health = getBufferHealth();
              Alert.alert(
                'Buffer Status',
                `${health.details.count} locations buffered\n${health.details.percentFull}% full\nLast sync: ${health.details.lastSync || 'Never'}\n\nStatus: ${health.message}`,
                [
                  { text: 'OK' },
                  { text: 'Force Sync', onPress: forceSync },
                ]
              );
            }}
          >
            <Text style={styles.bufferText}>
              {isSyncing 
                ? `🔄 Syncing ${syncProgress?.synced || 0}/${syncProgress?.total || bufferCount}...` 
                : `📦 ${bufferCount} buffered (tap for details)`}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Geofence Status Section */}
      {isTracking && (
        <View style={styles.trackingCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={styles.cardTitle}>📍 Geofence Status</Text>
            {recentEvents.length > 0 && (
              <TouchableOpacity onPress={() => setShowGeofenceHistory(true)}>
                <Text style={{ color: '#3B82F6', fontSize: 13 }}>History</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {insideGeofences.length > 0 ? (
            <View>
              <Text style={{ fontSize: 13, color: '#059669', marginBottom: 8 }}>
                ✅ Currently inside:
              </Text>
              {insideGeofences.map((geofence, index) => (
                <View 
                  key={geofence.id || index}
                  style={{
                    backgroundColor: geofence.color || '#3B82F6',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                    marginBottom: 6,
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '600' }}>
                    {geofence.name}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                    {geofence.type === 'terminal' ? '🚏 Terminal' : 
                     geofence.type === 'school' ? '🏫 School' : 
                     geofence.type === 'checkpoint' ? '🚧 Checkpoint' : '📍 Zone'}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={{ 
              backgroundColor: '#F3F4F6', 
              padding: 16, 
              borderRadius: 8, 
              alignItems: 'center' 
            }}>
              <Text style={{ color: '#6B7280', fontSize: 13 }}>
                🚗 Not inside any geofence zone
              </Text>
              <Text style={{ color: '#9CA3AF', fontSize: 11, marginTop: 4 }}>
                You'll be notified when entering/exiting zones
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Offline Maps Section */}
      <View style={styles.trackingCard}>
        <Text style={styles.cardTitle}>📦 Offline Maps</Text>
        <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>
          Download map tiles for offline use when you have poor connectivity.
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: '#3B82F6',
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
          }}
          onPress={() => setShowOfflineMapManager(true)}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>
            📥 Manage Offline Maps
          </Text>
        </TouchableOpacity>
      </View>

      {/* Offline Map Manager Modal */}
      <OfflineMapManager
        visible={showOfflineMapManager}
        onClose={() => setShowOfflineMapManager(false)}
        currentLocation={location}
      />

      {/* Accuracy Details Modal */}
      <Modal visible={showAccuracyModal} transparent animationType="fade" onRequestClose={() => setShowAccuracyModal(false)}>
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setShowAccuracyModal(false)}
        >
          <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 20, width: width - 60 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
              GPS Signal Details
            </Text>
            
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: accuracyColor,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 8,
              }}>
                <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>
                  {accuracy ? `±${Math.round(accuracy)}m` : '—'}
                </Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: accuracyColor }}>
                {getAccuracyLabel(accuracy)}
              </Text>
            </View>

            <View style={{ backgroundColor: '#F3F4F6', borderRadius: 12, padding: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#6B7280' }}>Latitude</Text>
                <Text style={{ fontWeight: '600' }}>{location?.coords?.latitude?.toFixed(6) || '—'}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#6B7280' }}>Longitude</Text>
                <Text style={{ fontWeight: '600' }}>{location?.coords?.longitude?.toFixed(6) || '—'}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#6B7280' }}>Speed</Text>
                <Text style={{ fontWeight: '600' }}>{Math.round((location?.coords?.speed || 0) * 3.6)} km/h</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#6B7280' }}>Heading</Text>
                <Text style={{ fontWeight: '600' }}>{Math.round(location?.coords?.heading || 0)}°</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#6B7280' }}>Connection</Text>
                <Text style={{ fontWeight: '600', color: isOnline ? '#22C55E' : '#EF4444' }}>
                  {isOnline ? '🟢 Online' : '🔴 Offline'}
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              onPress={() => setShowAccuracyModal(false)}
              style={{ marginTop: 16, backgroundColor: '#3B82F6', padding: 12, borderRadius: 8 }}
            >
              <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Route Edit Modal */}
      <Modal visible={showRouteModal} animationType="slide" transparent onRequestClose={() => setShowRouteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Route</Text>
            <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 16 }}>
              Set your route name so passengers can find you
            </Text>
            <TextInput
              style={styles.routeInput}
              placeholder="e.g., Route A - SM to Terminal"
              value={routeName}
              onChangeText={setRouteName}
              maxLength={100}
            />
            
            {/* Mini Map showing current location */}
            {location && (
              <View style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 16, height: 150 }}>
                <MapView
                  style={{ flex: 1 }}
                  region={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                >
                  <Marker
                    coordinate={{
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude,
                    }}
                  >
                    <View style={{
                      backgroundColor: '#3B82F6',
                      padding: 8,
                      borderRadius: 20,
                      borderWidth: 3,
                      borderColor: 'white',
                    }}>
                      <Text style={{ fontSize: 14 }}>📍</Text>
                    </View>
                  </Marker>
                </MapView>
                <View style={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                }}>
                  <Text style={{ color: 'white', fontSize: 11 }}>Your current location</Text>
                </View>
              </View>
            )}
            
            {!location && (
              <View style={{ 
                backgroundColor: '#F3F4F6', 
                borderRadius: 12, 
                padding: 20, 
                marginBottom: 16,
                alignItems: 'center',
              }}>
                <Text style={{ color: '#6B7280', fontSize: 13 }}>
                  📍 Start tracking to see your location
                </Text>
              </View>
            )}

            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity 
                style={{ flex: 1, padding: 14, backgroundColor: '#F3F4F6', borderRadius: 8, marginRight: 8, alignItems: 'center' }} 
                onPress={() => setShowRouteModal(false)}
              >
                <Text style={{ color: '#374151', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ flex: 1, padding: 14, backgroundColor: '#3B82F6', borderRadius: 8, alignItems: 'center' }} 
                onPress={handleSaveRoute} 
                disabled={isSavingRoute}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>{isSavingRoute ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Geofence History Modal */}
      <Modal visible={showGeofenceHistory} transparent animationType="slide" onRequestClose={() => setShowGeofenceHistory(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>📍 Geofence History</Text>
              <TouchableOpacity onPress={() => setShowGeofenceHistory(false)}>
                <Text style={{ fontSize: 24, color: '#6B7280' }}>×</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={{ padding: 16 }}>
              {recentEvents.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                  <Text style={{ color: '#6B7280' }}>No geofence events yet</Text>
                </View>
              ) : (
                recentEvents.map((event, index) => (
                  <View 
                    key={index}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 12,
                      borderBottomWidth: index < recentEvents.length - 1 ? 1 : 0,
                      borderBottomColor: '#F3F4F6',
                    }}
                  >
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: event.type === 'entry' ? '#D1FAE5' : '#FEE2E2',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12,
                    }}>
                      <Text style={{ fontSize: 18 }}>
                        {event.type === 'entry' ? '📍' : '🚗'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '600', color: '#374151' }}>
                        {event.type === 'entry' ? 'Entered' : 'Exited'} {event.geofence?.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                        {new Date(event.timestamp).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Full Screen Map Modal */}
      <Modal visible={showFullMap} animationType="slide" onRequestClose={() => setShowFullMap(false)}>
        <View style={{ flex: 1 }}>
          <MapView
            style={{ flex: 1 }}
            initialRegion={{
              latitude: location?.coords?.latitude || 10.3,
              longitude: location?.coords?.longitude || 124.8,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            }}
            showsUserLocation={false}
            showsMyLocationButton={false}
          >
            {/* Geofence circles */}
            {geofences.map((geofence) => (
              <Circle
                key={`full-${geofence._id || geofence.id}`}
                center={{
                  latitude: geofence.center.latitude,
                  longitude: geofence.center.longitude,
                }}
                radius={geofence.radius}
                fillColor={`${geofence.color || '#3B82F6'}30`}
                strokeColor={geofence.color || '#3B82F6'}
                strokeWidth={2}
              />
            ))}
            {/* Geofence markers with labels */}
            {geofences.map((geofence) => (
              <Marker
                key={`full-marker-${geofence._id || geofence.id}`}
                coordinate={{
                  latitude: geofence.center.latitude,
                  longitude: geofence.center.longitude,
                }}
                title={geofence.name}
                description={`${geofence.type} • ${geofence.radius}m radius`}
              >
                <View style={{
                  backgroundColor: geofence.color || '#3B82F6',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: 'white',
                }}>
                  <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>
                    {geofence.type === 'terminal' ? '🚏 ' : '📍 '}{geofence.name}
                  </Text>
                </View>
              </Marker>
            ))}
            {/* Driver location */}
            {location && (
              <Marker
                coordinate={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                }}
                title="Your Location"
              >
                <View style={{
                  backgroundColor: '#3B82F6',
                  padding: 8,
                  borderRadius: 20,
                  borderWidth: 3,
                  borderColor: 'white',
                }}>
                  <Text style={{ fontSize: 20 }}>🚗</Text>
                </View>
              </Marker>
            )}
          </MapView>
          
          {/* Header overlay */}
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(255,255,255,0.95)',
            paddingTop: 50,
            paddingBottom: 16,
            paddingHorizontal: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <View>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#374151' }}>
                📍 Geofence Zones
              </Text>
              <Text style={{ fontSize: 13, color: '#6B7280' }}>
                {geofences.length} zones • {insideGeofences.length} active
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => setShowFullMap(false)}
              style={{
                backgroundColor: '#F3F4F6',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: '#374151', fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>

          {/* Legend */}
          <View style={{
            position: 'absolute',
            bottom: 30,
            left: 16,
            right: 16,
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 12,
            elevation: 4,
          }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
              Geofence Legend:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {geofences.map((geofence) => (
                <View 
                  key={`legend-${geofence._id || geofence.id}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginRight: 16,
                    backgroundColor: '#F9FAFB',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                  }}
                >
                  <View style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: geofence.color || '#3B82F6',
                    marginRight: 6,
                  }} />
                  <Text style={{ fontSize: 11, color: '#374151' }}>{geofence.name}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
