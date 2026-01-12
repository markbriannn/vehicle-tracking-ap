/**
 * =============================================================================
 * MAP SCREEN - STUDENT/COMMUNITY VIEW
 * =============================================================================
 * 
 * MENTOR NOTE: This is the main screen for students/community users.
 * Shows all verified vehicles on a map with real-time updates.
 * 
 * FEATURES:
 * - Real-time vehicle positions via Socket.io
 * - Smooth marker animations
 * - Vehicle details on tap
 * - Filter by vehicle type
 * - SOS emergency button
 */

import { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import axios from 'axios';
import { useSocket } from '../hooks/useSocket';
import { useLocation } from '../hooks/useLocation';
import { useVehicleStore } from '../store/vehicleStore';
import { useAuthStore } from '../store/authStore';
import { getVehicleETA } from '../utils/eta';
import { API_URL } from '../config/api';
import { mapStyles as styles } from './styles/mapStyles';
import { colors } from '../styles';

// Vehicle type icons and colors
const VEHICLE_CONFIG = {
  bus: { icon: '🚌', color: colors.vehicleTypes.bus },
  van: { icon: '🚐', color: colors.vehicleTypes.van },
  multicab: { icon: '🚕', color: colors.vehicleTypes.multicab },
  car: { icon: '🚗', color: colors.vehicleTypes.car },
  motorcycle: { icon: '🏍️', color: colors.vehicleTypes.motorcycle },
};

export default function MapScreen() {
  const mapRef = useRef(null);
  const { connect, sendSOS } = useSocket();
  const { getCurrentLocation, location, hasPermission, requestPermissions } = useLocation();
  const { user, logout } = useAuthStore();
  const vehicles = useVehicleStore((state) => state.vehicles);
  const selectedVehicle = useVehicleStore((state) => state.selectedVehicle);
  const selectVehicle = useVehicleStore((state) => state.selectVehicle);
  const clearSelection = useVehicleStore((state) => state.clearSelection);
  
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [locationReady, setLocationReady] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [sosReason, setSOSReason] = useState('');
  const [isSendingSOS, setIsSendingSOS] = useState(false);
  const { token } = useAuthStore();

  // Calculate ETA when a vehicle is selected
  const etaInfo = useMemo(() => {
    if (!selectedVehicle || !location) return null;
    
    return getVehicleETA(
      { latitude: location.coords.latitude, longitude: location.coords.longitude },
      selectedVehicle.location
    );
  }, [selectedVehicle, location]);

  // Connect to Socket.io and get location on mount
  useEffect(() => {
    const init = async () => {
      connect();
      const loc = await getCurrentLocation();
      if (loc) {
        setLocationReady(true);
        // Center map on user location
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }, 1000);
        }
      }
    };
    init();
  }, [connect, getCurrentLocation]);

  // Get filtered vehicles
  const filteredVehicles = Array.from(vehicles.values()).filter((v) => {
    if (activeFilter && v.type !== activeFilter) return false;
    return v.isOnline; // Only show online vehicles
  });

  // Handle SOS - open modal
  const handleSOSPress = () => {
    setShowSOSModal(true);
  };

  // Send SOS with reason
  const handleSendSOS = async () => {
    if (!sosReason.trim()) {
      Alert.alert('Required', 'Please describe your emergency');
      return;
    }

    const currentLocation = await getCurrentLocation();
    if (!currentLocation) {
      Alert.alert('Error', 'Could not get your location. Please enable location services.');
      return;
    }

    setIsSendingSOS(true);
    try {
      await axios.post(
        `${API_URL}/sos/send`,
        {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          speed: 0,
          heading: 0,
          message: sosReason.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowSOSModal(false);
      setSOSReason('');
      Alert.alert(
        '✅ SOS Sent',
        'Your emergency alert has been sent to administrators. Help is on the way. Stay calm and stay safe.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send SOS. Please try again or call emergency services.');
    } finally {
      setIsSendingSOS(false);
    }
  };

  // Center map on user location
  const centerOnUser = async () => {
    const loc = await getCurrentLocation();
    if (loc && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: location?.coords?.latitude || 14.5995,
          longitude: location?.coords?.longitude || 120.9842,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={hasPermission}
        showsMyLocationButton={false}
        followsUserLocation={false}
        userLocationPriority="high"
        loadingEnabled={true}
      >
        {/* Vehicle Markers */}
        {filteredVehicles.map((vehicle) => (
          <Marker
            key={vehicle.vehicleId}
            coordinate={{
              latitude: vehicle.location.latitude,
              longitude: vehicle.location.longitude,
            }}
            onPress={() => selectVehicle(vehicle)}
            tracksViewChanges={false}
          >
            <View style={[
              styles.markerContainer,
              { backgroundColor: VEHICLE_CONFIG[vehicle.type]?.color || colors.primary }
            ]}>
              <Text style={styles.markerIcon}>
                {VEHICLE_CONFIG[vehicle.type]?.icon || '🚗'}
              </Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setShowMenu(!showMenu)}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {filteredVehicles.length} vehicles nearby
        </Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterButtonText}>
            {activeFilter ? VEHICLE_CONFIG[activeFilter]?.icon : '🔍'} Filter
          </Text>
        </TouchableOpacity>
      </View>

      {/* User Menu */}
      {showMenu && (
        <View style={styles.userMenu}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>👤 {user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>🚪 Logout</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <View style={styles.filterPanel}>
          <TouchableOpacity
            style={[styles.filterOption, !activeFilter && styles.filterOptionActive]}
            onPress={() => { setActiveFilter(null); setShowFilters(false); }}
          >
            <Text>All</Text>
          </TouchableOpacity>
          {Object.entries(VEHICLE_CONFIG).map(([type, config]) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterOption,
                activeFilter === type && styles.filterOptionActive
              ]}
              onPress={() => { setActiveFilter(type); setShowFilters(false); }}
            >
              <Text>{config.icon} {type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Center on user button */}
      <TouchableOpacity style={styles.centerButton} onPress={centerOnUser}>
        <Text style={styles.centerButtonText}>📍</Text>
      </TouchableOpacity>

      {/* SOS Button */}
      <TouchableOpacity style={styles.sosButton} onPress={handleSOSPress}>
        <Text style={styles.sosButtonText}>🚨 SOS</Text>
      </TouchableOpacity>

      {/* SOS Modal */}
      <Modal
        visible={showSOSModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSOSModal(false)}
      >
        <View style={styles.sosModalOverlay}>
          <View style={styles.sosModalContent}>
            <View style={styles.sosModalHeader}>
              <Text style={styles.sosModalIcon}>🚨</Text>
              <Text style={styles.sosModalTitle}>Emergency SOS</Text>
            </View>
            
            <Text style={styles.sosModalSubtitle}>
              Describe your emergency situation. Your location will be shared with administrators.
            </Text>

            <TextInput
              style={styles.sosReasonInput}
              placeholder="What's your emergency? (e.g., accident, harassment, medical emergency...)"
              placeholderTextColor={colors.textHint}
              value={sosReason}
              onChangeText={setSOSReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />

            <View style={styles.sosModalButtons}>
              <TouchableOpacity
                style={styles.sosModalCancelButton}
                onPress={() => {
                  setShowSOSModal(false);
                  setSOSReason('');
                }}
                disabled={isSendingSOS}
              >
                <Text style={styles.sosModalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sosModalSendButton, isSendingSOS && styles.sosModalSendButtonDisabled]}
                onPress={handleSendSOS}
                disabled={isSendingSOS}
              >
                {isSendingSOS ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.sosModalSendText}>Send SOS</Text>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.sosModalNote}>
              ⚠️ False alerts may result in account suspension
            </Text>
          </View>
        </View>
      </Modal>

      {/* Vehicle Details Modal */}
      <Modal
        visible={!!selectedVehicle}
        animationType="slide"
        transparent
        onRequestClose={clearSelection}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedVehicle && (
              <>
                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={clearSelection}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>

                {/* Vehicle Photo */}
                <Image
                  source={{ uri: `${API_URL}/${selectedVehicle.vehiclePhoto}` }}
                  style={styles.vehicleImage}
                />

                {/* Vehicle Info */}
                <View style={styles.vehicleInfo}>
                  <View style={styles.vehicleHeader}>
                    <Text style={styles.vehicleNumber}>
                      {VEHICLE_CONFIG[selectedVehicle.type]?.icon} {selectedVehicle.vehicleNumber}
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      selectedVehicle.isOnline ? styles.statusOnline : styles.statusOffline
                    ]}>
                      <Text style={styles.statusText}>
                        {selectedVehicle.isOnline ? 'Online' : 'Offline'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.licensePlate}>{selectedVehicle.licensePlate}</Text>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Type</Text>
                    <Text style={styles.infoValue}>{selectedVehicle.type}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Driver</Text>
                    <Text style={styles.infoValue}>{selectedVehicle.driverName}</Text>
                  </View>

                  {/* Route Info */}
                  {selectedVehicle.routeName && (
                    <View style={styles.routeInfoBox}>
                      <Text style={styles.routeIcon}>🛣️</Text>
                      <View style={styles.routeDetails}>
                        <Text style={styles.routeLabel}>Route</Text>
                        <Text style={styles.routeText}>{selectedVehicle.routeName}</Text>
                      </View>
                    </View>
                  )}

                  {selectedVehicle.companyName && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Company</Text>
                      <Text style={styles.infoValue}>{selectedVehicle.companyName}</Text>
                    </View>
                  )}

                  <View style={styles.speedContainer}>
                    <Text style={styles.speedLabel}>Current Speed</Text>
                    <Text style={styles.speedValue}>
                      {Math.round(selectedVehicle.location.speed)} km/h
                    </Text>
                  </View>

                  {/* ETA Display */}
                  {etaInfo && (
                    <View style={styles.etaContainer}>
                      <View style={styles.etaMain}>
                        <Text style={styles.etaIcon}>🚌</Text>
                        <View style={styles.etaInfo}>
                          <Text style={styles.etaLabel}>Estimated Arrival</Text>
                          <Text style={styles.etaTime}>{etaInfo.formatted}</Text>
                        </View>
                      </View>
                      <View style={styles.etaDistance}>
                        <Text style={styles.etaDistanceValue}>{etaInfo.distanceFormatted}</Text>
                        <Text style={styles.etaDistanceLabel}>away</Text>
                      </View>
                      {etaInfo.isEstimate && (
                        <Text style={styles.etaNote}>
                          * Based on average traffic speed
                        </Text>
                      )}
                    </View>
                  )}

                  {!location && (
                    <View style={styles.etaUnavailable}>
                      <Text style={styles.etaUnavailableText}>
                        📍 Enable location to see arrival time
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
