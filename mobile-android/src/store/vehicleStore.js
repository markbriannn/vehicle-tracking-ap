/**
 * =============================================================================
 * VEHICLE STORE
 * =============================================================================
 * 
 * MENTOR NOTE: Manages real-time vehicle data received via Socket.io.
 * Used by the map screen to display vehicle positions.
 */

import { create } from 'zustand';

export const useVehicleStore = create((set) => ({
  vehicles: new Map(),
  selectedVehicle: null,
  filters: {
    type: null,
    companyId: null,
  },

  // Update vehicle location (called when Socket.io receives update)
  updateVehicle: (data) =>
    set((state) => {
      const newVehicles = new Map(state.vehicles);
      newVehicles.set(data.vehicleId, {
        ...data,
        lastUpdate: new Date(),
      });
      return { vehicles: newVehicles };
    }),

  // Mark vehicle as offline
  markOffline: (vehicleId) =>
    set((state) => {
      const newVehicles = new Map(state.vehicles);
      const vehicle = newVehicles.get(vehicleId);
      if (vehicle) {
        newVehicles.set(vehicleId, { ...vehicle, isOnline: false });
      }
      return { vehicles: newVehicles };
    }),

  // Select a vehicle (for showing details)
  selectVehicle: (vehicle) => set({ selectedVehicle: vehicle }),

  // Clear selection
  clearSelection: () => set({ selectedVehicle: null }),

  // Set filters
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  // Clear all vehicles
  clearVehicles: () => set({ vehicles: new Map() }),

  // Get filtered vehicles as array
  getFilteredVehicles: () => {
    const state = useVehicleStore.getState();
    let vehicles = Array.from(state.vehicles.values());

    if (state.filters.type) {
      vehicles = vehicles.filter((v) => v.type === state.filters.type);
    }
    if (state.filters.companyId) {
      vehicles = vehicles.filter((v) => v.companyId === state.filters.companyId);
    }

    return vehicles;
  },
}));
