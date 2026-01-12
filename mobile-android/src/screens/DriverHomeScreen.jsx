/**
 * =============================================================================
 * DRIVER HOME SCREEN
 * =============================================================================
 * 
 * MENTOR NOTE: Main screen for drivers after login.
 * 
 * FEATURES:
 * - Start/stop GPS tracking
 * - View assigned vehicle info
 * - See verification status
 * - SOS emergency button
 * - Real-time speed display
 * 
 * GPS TRACKING FLOW:
 * Driver taps "Start Tracking" → Location hook starts watching GPS →
 * Every 5 seconds, location is sent via Socket.io → Backend updates DB →
 * Backend broadcasts to all map clients
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
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useLocation } from '../hooks/useLocation';
import { useSocket } from '../hooks/useSocket';
import axios from 'axios';
import { API_URL } from '../config/api';
import { driverHomeStyles as styles } from './styles/driverHomeStyles';
import { colors } from '../styles';

export default function DriverHomeScreen({ navigation }) {
  const { user, token, logout, refreshUser } = useAuthStore();
  const [vehicle, setVehicle] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [isSavingRoute, setIsSavingRoute] = useState(false);
  const { location, startTracking, stopTracking, hasPermission } = useLocation(
    vehicle?._id,
    isTracking
  );
  const { connect, isOnline, bufferCount, isSyncing } = useSocket();

  // Refresh user data on mount to get latest verification status
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Pull to refresh
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshUser();
    // Re-fetch vehicle
    if (user?.assignedVehicle) {
      try {
        const response = await axios.get(`${API_URL}/vehicles/${user.assignedVehicle}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setVehicle(response.data.vehicle);
        setRouteName(response.data.vehicle.routeName || '');
      } catch (error) {
        console.error('Failed to fetch vehicle:', error);
      }
    }
    setRefreshing(false);
  }, [refreshUser, user, token]);

  // Fetch assigned vehicle
  useEffect(() => {
    const fetchVehicle = async () => {
      if (user?.assignedVehicle) {
        try {
          const response = await axios.get(`${API_URL}/vehicles/${user.assignedVehicle}`, {
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

  // Save route name
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
      console.error('Failed to update route:', error);
      Alert.alert('Error', 'Failed to update route');
    } finally {
      setIsSavingRoute(false);
    }
  };

  // Connect to socket on mount
  useEffect(() => {
    connect();
  }, [connect]);

  // Check if driver can start tracking
  const canStartTracking = () => {
    // Driver must be approved
    if (user?.verificationStatus !== 'approved') return false;
    // Must have a vehicle assigned
    if (!vehicle) return false;
    // Vehicle must be approved
    if (vehicle.verificationStatus !== 'approved') return false;
    // Must have location permission
    if (!hasPermission) return false;
    return true;
  };

  // Toggle tracking
  const toggleTracking = () => {
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
      stopTracking();
      setIsTracking(false);
    } else {
      startTracking();
      setIsTracking(true);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return colors.success;
      case 'pending': return colors.warning;
      case 'rejected': return colors.danger;
      default: return colors.gray[500];
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name} 👋</Text>
          <Text style={styles.role}>Driver</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Verification Status */}
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Account Status</Text>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(user?.verificationStatus) },
            ]}
          />
          <Text style={styles.statusText}>
            {user?.verificationStatus?.toUpperCase()}
          </Text>
        </View>
        {user?.verificationStatus === 'pending' && (
          <Text style={styles.statusHint}>
            Your account is being reviewed by admin
          </Text>
        )}
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
          
          {/* Route Info */}
          <View style={styles.routeContainer}>
            <View style={styles.routeInfo}>
              <Text style={styles.routeLabel}>📍 Route:</Text>
              <Text style={styles.routeValue}>
                {vehicle.routeName || 'Not set'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.editRouteButton}
              onPress={() => setShowRouteModal(true)}
            >
              <Text style={styles.editRouteText}>✏️ Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(vehicle.verificationStatus) },
              ]}
            />
            <Text style={styles.statusText}>
              Vehicle: {vehicle.verificationStatus?.toUpperCase()}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.vehicleCard}>
          <Text style={styles.cardTitle}>Vehicle Loading...</Text>
          <Text style={styles.statusHint}>
            Your vehicle was registered during signup. If this persists, please contact support.
          </Text>
        </View>
      )}

      {/* Tracking Status */}
      <View style={styles.trackingCard}>
        <Text style={styles.cardTitle}>GPS Tracking</Text>
        
        {/* Show requirements if not ready to track */}
        {!canStartTracking() && (
          <View style={styles.requirementsBox}>
            <Text style={styles.requirementsTitle}>⚠️ Requirements to Start Tracking:</Text>
            {user?.verificationStatus !== 'approved' && (
              <Text style={styles.requirementItem}>
                ❌ Your account must be approved (currently: {user?.verificationStatus})
              </Text>
            )}
            {!vehicle && (
              <Text style={styles.requirementItem}>
                ❌ You need to register a vehicle first
              </Text>
            )}
            {vehicle && vehicle.verificationStatus !== 'approved' && (
              <Text style={styles.requirementItem}>
                ❌ Your vehicle must be approved (currently: {vehicle.verificationStatus})
              </Text>
            )}
          </View>
        )}

        {isTracking && location && (
          <View style={styles.locationInfo}>
            <View style={styles.speedDisplay}>
              <Text style={styles.speedValue}>
                {Math.round(location.coords.speed * 3.6 || 0)}
              </Text>
              <Text style={styles.speedUnit}>km/h</Text>
            </View>
            <Text style={styles.locationText}>
              📍 {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
            </Text>
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
            <View style={[styles.pulsingDot, !isOnline && styles.offlineDot]} />
            <Text style={styles.trackingIndicatorText}>
              {isOnline ? 'Broadcasting location...' : '📴 Offline - Buffering locations'}
            </Text>
          </View>
        )}

        {/* Offline Buffer Status */}
        {bufferCount > 0 && (
          <View style={styles.bufferStatus}>
            <Text style={styles.bufferText}>
              {isSyncing 
                ? `🔄 Syncing ${bufferCount} buffered locations...` 
                : `📦 ${bufferCount} locations buffered (will sync when online)`}
            </Text>
          </View>
        )}
      </View>

      {/* Route Edit Modal */}
      <Modal
        visible={showRouteModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowRouteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Route</Text>
            <Text style={styles.modalSubtitle}>
              Set your route name so students can find you easily
            </Text>
            
            <TextInput
              style={styles.routeInput}
              placeholder="e.g., Route A - SM to Terminal"
              value={routeName}
              onChangeText={setRouteName}
              maxLength={100}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setRouteName(vehicle?.routeName || '');
                  setShowRouteModal(false);
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSaveRoute}
                disabled={isSavingRoute}
              >
                <Text style={styles.modalButtonSaveText}>
                  {isSavingRoute ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
