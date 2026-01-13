/**
 * =============================================================================
 * ROUTE SELECTOR COMPONENT
 * =============================================================================
 * 
 * Allows drivers to select start and end terminals for their route
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouteStore } from '../store/routeStore';
import { useGeofenceStore } from '../store/geofenceStore';
import { getRoute } from '../utils/directions';
import { colors } from '../styles';

export default function RouteSelector({ visible, onClose, onRouteSelected }) {
  const { geofences } = useGeofenceStore();
  const {
    startTerminal,
    endTerminal,
    setStartTerminal,
    setEndTerminal,
    setRouteCoordinates,
    setRouteInfo,
    setIsLoadingRoute,
    isLoadingRoute,
    clearRoute,
  } = useRouteStore();

  const [selectingFor, setSelectingFor] = useState(null); // 'start' or 'end'
  const [showTerminalPicker, setShowTerminalPicker] = useState(false);

  // Filter only terminals from geofences
  const terminals = geofences.filter(g => g.type === 'terminal');

  const handleSelectTerminal = (terminal) => {
    if (selectingFor === 'start') {
      setStartTerminal(terminal);
    } else {
      setEndTerminal(terminal);
    }
    setShowTerminalPicker(false);
    setSelectingFor(null);
  };

  const handleConfirmRoute = async () => {
    if (!startTerminal || !endTerminal) {
      Alert.alert('Select Route', 'Please select both start and end terminals');
      return;
    }

    if (startTerminal._id === endTerminal._id) {
      Alert.alert('Invalid Route', 'Start and end terminals must be different');
      return;
    }

    setIsLoadingRoute(true);

    try {
      const routeData = await getRoute(
        { latitude: startTerminal.center.latitude, longitude: startTerminal.center.longitude },
        { latitude: endTerminal.center.latitude, longitude: endTerminal.center.longitude }
      );

      setRouteCoordinates(routeData.coordinates);
      setRouteInfo({
        distance: routeData.distance,
        duration: routeData.duration,
        summary: routeData.summary,
        isFallback: routeData.isFallback,
      });

      const routeName = `${startTerminal.name} → ${endTerminal.name}`;
      onRouteSelected?.(routeName, routeData);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to calculate route. Please try again.');
    } finally {
      setIsLoadingRoute(false);
    }
  };

  const handleClearRoute = () => {
    clearRoute();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>🛣️ Select Route</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Choose your start and end terminals to display the route on the map
          </Text>

          {/* Start Terminal */}
          <View style={styles.section}>
            <Text style={styles.label}>📍 Start Terminal</Text>
            <TouchableOpacity
              style={[styles.selector, startTerminal && { borderColor: startTerminal.color }]}
              onPress={() => {
                setSelectingFor('start');
                setShowTerminalPicker(true);
              }}
            >
              {startTerminal ? (
                <View style={styles.selectedTerminal}>
                  <View style={[styles.colorDot, { backgroundColor: startTerminal.color }]} />
                  <Text style={styles.terminalName}>{startTerminal.name}</Text>
                </View>
              ) : (
                <Text style={styles.placeholder}>Select start terminal...</Text>
              )}
              <Text style={styles.arrow}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Swap Button */}
          {startTerminal && endTerminal && (
            <TouchableOpacity
              style={styles.swapButton}
              onPress={() => {
                const temp = startTerminal;
                setStartTerminal(endTerminal);
                setEndTerminal(temp);
              }}
            >
              <Text style={styles.swapText}>⇅ Swap</Text>
            </TouchableOpacity>
          )}

          {/* End Terminal */}
          <View style={styles.section}>
            <Text style={styles.label}>🏁 End Terminal</Text>
            <TouchableOpacity
              style={[styles.selector, endTerminal && { borderColor: endTerminal.color }]}
              onPress={() => {
                setSelectingFor('end');
                setShowTerminalPicker(true);
              }}
            >
              {endTerminal ? (
                <View style={styles.selectedTerminal}>
                  <View style={[styles.colorDot, { backgroundColor: endTerminal.color }]} />
                  <Text style={styles.terminalName}>{endTerminal.name}</Text>
                </View>
              ) : (
                <Text style={styles.placeholder}>Select end terminal...</Text>
              )}
              <Text style={styles.arrow}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Route Preview */}
          {startTerminal && endTerminal && (
            <View style={styles.routePreview}>
              <Text style={styles.routePreviewTitle}>Route Preview:</Text>
              <Text style={styles.routePreviewText}>
                {startTerminal.name} → {endTerminal.name}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            {(startTerminal || endTerminal) && (
              <TouchableOpacity style={styles.clearButton} onPress={handleClearRoute}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.confirmButton,
                (!startTerminal || !endTerminal) && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirmRoute}
              disabled={!startTerminal || !endTerminal || isLoadingRoute}
            >
              {isLoadingRoute ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.confirmButtonText}>Show Route on Map</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Terminal Picker Modal */}
      <Modal
        visible={showTerminalPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTerminalPicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>
                Select {selectingFor === 'start' ? 'Start' : 'End'} Terminal
              </Text>
              <TouchableOpacity onPress={() => setShowTerminalPicker(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.terminalList}>
              {terminals.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No terminals available</Text>
                  <Text style={styles.emptySubtext}>
                    Terminals will appear here once added by admin
                  </Text>
                </View>
              ) : (
                terminals.map((terminal) => {
                  const isSelected =
                    (selectingFor === 'start' && startTerminal?._id === terminal._id) ||
                    (selectingFor === 'end' && endTerminal?._id === terminal._id);
                  const isOtherSelected =
                    (selectingFor === 'start' && endTerminal?._id === terminal._id) ||
                    (selectingFor === 'end' && startTerminal?._id === terminal._id);

                  return (
                    <TouchableOpacity
                      key={terminal._id}
                      style={[
                        styles.terminalItem,
                        isSelected && styles.terminalItemSelected,
                        isOtherSelected && styles.terminalItemDisabled,
                      ]}
                      onPress={() => !isOtherSelected && handleSelectTerminal(terminal)}
                      disabled={isOtherSelected}
                    >
                      <View style={[styles.terminalColor, { backgroundColor: terminal.color }]} />
                      <View style={styles.terminalInfo}>
                        <Text
                          style={[
                            styles.terminalItemName,
                            isOtherSelected && styles.terminalItemNameDisabled,
                          ]}
                        >
                          🚏 {terminal.name}
                        </Text>
                        <Text style={styles.terminalItemRadius}>{terminal.radius}m radius</Text>
                      </View>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                      {isOtherSelected && (
                        <Text style={styles.otherLabel}>
                          {selectingFor === 'start' ? 'End' : 'Start'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
  },
  closeButton: {
    fontSize: 24,
    color: '#6B7280',
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
  },
  selectedTerminal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  terminalName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  placeholder: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  arrow: {
    fontSize: 12,
    color: '#6B7280',
  },
  swapButton: {
    alignSelf: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  swapText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  routePreview: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  routePreviewTitle: {
    fontSize: 12,
    color: '#166534',
    marginBottom: 4,
  },
  routePreviewText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#166534',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    backgroundColor: '#3B82F6',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  // Picker styles
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  terminalList: {
    padding: 16,
  },
  terminalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 10,
  },
  terminalItemSelected: {
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  terminalItemDisabled: {
    opacity: 0.5,
  },
  terminalColor: {
    width: 16,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
  },
  terminalInfo: {
    flex: 1,
  },
  terminalItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  terminalItemNameDisabled: {
    color: '#9CA3AF',
  },
  terminalItemRadius: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  checkmark: {
    fontSize: 18,
    color: '#4F46E5',
    fontWeight: 'bold',
  },
  otherLabel: {
    fontSize: 11,
    color: '#6B7280',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9CA3AF',
  },
};
