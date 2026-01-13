/**
 * =============================================================================
 * GEOFENCE STORE - Zustand State Management
 * =============================================================================
 * 
 * Tracks geofence status for the current driver/vehicle.
 */

import { create } from 'zustand';

export const useGeofenceStore = create((set, get) => ({
  // List of geofences the vehicle is currently inside
  insideGeofences: [],
  
  // Recent geofence events (entry/exit)
  recentEvents: [],
  
  // All available geofences (for map display)
  geofences: [],

  // Add a geofence event
  addEvent: (event) => {
    set((state) => ({
      recentEvents: [event, ...state.recentEvents].slice(0, 20), // Keep last 20
    }));
  },

  // Update which geofences the vehicle is inside
  setInsideGeofences: (geofences) => {
    set({ insideGeofences: geofences });
  },

  // Set all geofences (from API)
  setGeofences: (geofences) => {
    set({ geofences });
  },

  // Handle geofence entry
  handleEntry: (geofence) => {
    const { insideGeofences, addEvent } = get();
    
    // Add to inside list if not already there
    if (!insideGeofences.find(g => g.id === geofence.id)) {
      set({
        insideGeofences: [...insideGeofences, geofence],
      });
    }
    
    // Add event
    addEvent({
      type: 'entry',
      geofence,
      timestamp: new Date().toISOString(),
    });
  },

  // Handle geofence exit
  handleExit: (geofence) => {
    const { insideGeofences, addEvent } = get();
    
    // Remove from inside list
    set({
      insideGeofences: insideGeofences.filter(g => g.id !== geofence.id),
    });
    
    // Add event
    addEvent({
      type: 'exit',
      geofence,
      timestamp: new Date().toISOString(),
    });
  },

  // Clear all data
  clear: () => {
    set({
      insideGeofences: [],
      recentEvents: [],
    });
  },
}));
