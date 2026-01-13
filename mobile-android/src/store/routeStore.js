/**
 * =============================================================================
 * ROUTE STORE
 * =============================================================================
 * 
 * Manages selected route state for drivers
 */

import { create } from 'zustand';

export const useRouteStore = create((set, get) => ({
  // Selected route
  startTerminal: null,
  endTerminal: null,
  routeCoordinates: [], // Array of {latitude, longitude} for polyline
  routeInfo: null, // { distance, duration, summary }
  isLoadingRoute: false,
  
  // Set start terminal
  setStartTerminal: (terminal) => set({ startTerminal: terminal }),
  
  // Set end terminal
  setEndTerminal: (terminal) => set({ endTerminal: terminal }),
  
  // Set route coordinates (polyline)
  setRouteCoordinates: (coords) => set({ routeCoordinates: coords }),
  
  // Set route info
  setRouteInfo: (info) => set({ routeInfo: info }),
  
  // Set loading state
  setIsLoadingRoute: (loading) => set({ isLoadingRoute: loading }),
  
  // Clear route
  clearRoute: () => set({
    startTerminal: null,
    endTerminal: null,
    routeCoordinates: [],
    routeInfo: null,
  }),
  
  // Get route name string
  getRouteName: () => {
    const { startTerminal, endTerminal } = get();
    if (startTerminal && endTerminal) {
      return `${startTerminal.name} → ${endTerminal.name}`;
    }
    return null;
  },
}));
