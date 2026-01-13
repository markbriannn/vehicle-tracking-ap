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
import MapView, { Marker } from 'react-native-maps';
import { useAuthStore } from '../store/authStore';
import { useLocation } from '../hooks/useLocation';
import { useSocket } from '../hooks/useSocket';
import axios from 'axios';
import { API_URL } from '../config/api';
import { driverHomeStyles as styles } from './styles/driverHomeStyles';
import { colors } from '../styles';

const { width } = Dimensions.get('window');

export default function DriverHomeScreen({ navigation }) {
  const { user, token, logout, refreshUser } = useAuthStore();
  const [vehicle, setVehicle] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showAccuracyModal, setShowAccuracyModal] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [isSavingRoute, setIsSavingRoute] = useState(false);
  const { location, startTracking, stopTracking, hasPermission, isBackgroundTracking, trackingStats = { totalDistance: 0, duration: 0, updateCount: 0 } } = useLocation(
    vehicle?._id,
    false // Don't auto-start, we control it manually
  );
  const { connect, sendLocationUpdate, isConnected, isOnline, bufferCount, isSyncing } = useSocket();

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
          <MapView
            style={{ width: width - 32, height: 200 }}
            region={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            showsUserLocation={false}
            showsMyLocationButton={false}
          >
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
          <View style={styles.bufferStatus}>
            <Text style={styles.bufferText}>
              {isSyncing ? `🔄 Syncing ${bufferCount}...` : `📦 ${bufferCount} buffered`}
            </Text>
          </View>
        )}
      </View>

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
    </ScrollView>
  );
}
