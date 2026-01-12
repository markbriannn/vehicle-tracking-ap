/**
 * =============================================================================
 * REAL-TIME MAP COMPONENT
 * =============================================================================
 * 
 * MENTOR NOTE: This component displays all vehicles on a Google Map.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useVehicleStore } from '../hooks/useSocket';
import { VehicleLocationUpdate } from '../types';

// Vehicle type icons
const VEHICLE_ICONS: Record<string, string> = {
  bus: '🚌',
  van: '🚐',
  multicab: '🚕',
  car: '🚗',
  motorcycle: '🏍️',
};

// Colors for vehicle types
const VEHICLE_COLORS: Record<string, string> = {
  bus: '#FF6B6B',
  van: '#4ECDC4',
  multicab: '#FFE66D',
  car: '#95E1D3',
  motorcycle: '#DDA0DD',
};

interface MapProps {
  onVehicleSelect?: (vehicle: VehicleLocationUpdate) => void;
  selectedVehicleId?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
}

export const Map: React.FC<MapProps> = ({
  onVehicleSelect,
  selectedVehicleId,
  center = { lat: 14.5995, lng: 120.9842 },
  zoom = 13,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const sosMarkersRef = useRef<Record<string, any>>({});
  const infoWindowRef = useRef<any>(null);
  
  const vehicles = useVehicleStore((state) => state.vehicles);
  const alerts = useVehicleStore((state) => state.alerts);
  const selectedAlertId = useVehicleStore((state) => state.selectedAlertId);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Center map on selected alert
  const centerOnAlert = useCallback((alertId: string) => {
    const alert = alerts.find(a => a._id === alertId);
    if (alert && googleMapRef.current) {
      googleMapRef.current.panTo({
        lat: alert.location.latitude,
        lng: alert.location.longitude,
      });
      googleMapRef.current.setZoom(16);
    }
  }, [alerts]);

  // Watch for selected alert changes
  useEffect(() => {
    if (selectedAlertId) {
      centerOnAlert(selectedAlertId);
    }
  }, [selectedAlertId, centerOnAlert]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || googleMapRef.current) return;

    if (typeof window === 'undefined' || !(window as any).google?.maps) {
      console.error('Google Maps not loaded. Add your API key to index.html');
      return;
    }

    const google = (window as any).google;

    googleMapRef.current = new google.maps.Map(mapRef.current, {
      center,
      zoom,
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
      ],
    });

    infoWindowRef.current = new google.maps.InfoWindow();
    setMapLoaded(true);

    return () => {
      Object.values(markersRef.current).forEach((marker: any) => marker.setMap(null));
      markersRef.current = {};
    };
  }, [center, zoom]);

  // Update markers when vehicle data changes
  useEffect(() => {
    if (!googleMapRef.current || !mapLoaded) return;

    const google = (window as any).google;

    vehicles.forEach((vehicle, vehicleId) => {
      const position = {
        lat: vehicle.location.latitude,
        lng: vehicle.location.longitude,
      };

      let marker = markersRef.current[vehicleId];

      if (!marker) {
        marker = new google.maps.Marker({
          position,
          map: googleMapRef.current,
          title: vehicle.vehicleNumber,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: vehicle.isOnline 
              ? VEHICLE_COLORS[vehicle.type] || '#4285F4'
              : '#999999',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
          label: {
            text: VEHICLE_ICONS[vehicle.type] || '🚗',
            fontSize: '16px',
          },
        });

        marker.addListener('click', () => {
          if (infoWindowRef.current && googleMapRef.current) {
            infoWindowRef.current.setContent(createInfoContent(vehicle));
            infoWindowRef.current.open(googleMapRef.current, marker);
          }
          onVehicleSelect?.(vehicle);
        });

        markersRef.current[vehicleId] = marker;
      } else {
        animateMarker(marker, position);
        
        marker.setIcon({
          path: google.maps.SymbolPath.CIRCLE,
          scale: selectedVehicleId === vehicleId ? 16 : 12,
          fillColor: vehicle.isOnline 
            ? VEHICLE_COLORS[vehicle.type] || '#4285F4'
            : '#999999',
          fillOpacity: 1,
          strokeColor: selectedVehicleId === vehicleId ? '#000' : '#fff',
          strokeWeight: selectedVehicleId === vehicleId ? 3 : 2,
        });
      }
    });
  }, [vehicles, mapLoaded, selectedVehicleId, onVehicleSelect]);

  // Update SOS alert markers
  useEffect(() => {
    if (!googleMapRef.current || !mapLoaded) return;

    const google = (window as any).google;
    const currentAlertIds = new Set(alerts.map(a => a._id));

    // Remove markers for resolved alerts
    Object.keys(sosMarkersRef.current).forEach(alertId => {
      if (!currentAlertIds.has(alertId)) {
        sosMarkersRef.current[alertId].setMap(null);
        delete sosMarkersRef.current[alertId];
      }
    });

    // Add/update markers for active alerts
    alerts.forEach((alert) => {
      const position = {
        lat: alert.location.latitude,
        lng: alert.location.longitude,
      };

      let marker = sosMarkersRef.current[alert._id];

      if (!marker) {
        // Create SOS marker with pulsing animation
        marker = new google.maps.Marker({
          position,
          map: googleMapRef.current,
          title: `SOS: ${alert.senderName}`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 18,
            fillColor: '#FF0000',
            fillOpacity: 0.8,
            strokeColor: '#FFFFFF',
            strokeWeight: 3,
          },
          label: {
            text: '🚨',
            fontSize: '20px',
          },
          zIndex: 1000, // Show above vehicles
          animation: google.maps.Animation.BOUNCE,
        });

        marker.addListener('click', () => {
          if (infoWindowRef.current && googleMapRef.current) {
            infoWindowRef.current.setContent(createSOSInfoContent(alert));
            infoWindowRef.current.open(googleMapRef.current, marker);
          }
        });

        sosMarkersRef.current[alert._id] = marker;

        // Stop bouncing after 3 seconds
        setTimeout(() => {
          if (sosMarkersRef.current[alert._id]) {
            sosMarkersRef.current[alert._id].setAnimation(null);
          }
        }, 3000);
      } else {
        // Update position (for real-time tracking)
        animateMarker(marker, position);
        
        // Highlight if selected
        marker.setIcon({
          path: google.maps.SymbolPath.CIRCLE,
          scale: selectedAlertId === alert._id ? 22 : 18,
          fillColor: '#FF0000',
          fillOpacity: 0.8,
          strokeColor: selectedAlertId === alert._id ? '#FFFF00' : '#FFFFFF',
          strokeWeight: selectedAlertId === alert._id ? 4 : 3,
        });
      }
    });
  }, [alerts, mapLoaded, selectedAlertId]);

  // Create SOS info window content
  const createSOSInfoContent = (alert: any): string => {
    return `
      <div style="padding: 8px; min-width: 220px; border-left: 4px solid #FF0000;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #FF0000;">
          🚨 SOS ALERT
        </h3>
        <p style="margin: 4px 0;"><strong>From:</strong> ${alert.senderName}</p>
        <p style="margin: 4px 0;"><strong>Role:</strong> ${alert.senderRole}</p>
        ${alert.message ? `<p style="margin: 4px 0; font-style: italic; color: #666;">"${alert.message}"</p>` : ''}
        <p style="margin: 4px 0; font-size: 12px; color: #888;">
          📍 ${alert.location.latitude.toFixed(5)}, ${alert.location.longitude.toFixed(5)}
        </p>
        <p style="margin: 4px 0; font-size: 12px; color: #888;">
          🕐 ${new Date(alert.createdAt).toLocaleString()}
        </p>
      </div>
    `;
  };

  // Smooth marker animation
  const animateMarker = (marker: any, newPosition: { lat: number; lng: number }) => {
    const startPosition = marker.getPosition();
    if (!startPosition) {
      marker.setPosition(newPosition);
      return;
    }

    const startLat = startPosition.lat();
    const startLng = startPosition.lng();
    const deltaLat = newPosition.lat - startLat;
    const deltaLng = newPosition.lng - startLng;

    const duration = 500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      marker.setPosition({
        lat: startLat + deltaLat * easeProgress,
        lng: startLng + deltaLng * easeProgress,
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  // Create info window content
  const createInfoContent = (vehicle: VehicleLocationUpdate): string => {
    return `
      <div style="padding: 8px; min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px;">
          ${VEHICLE_ICONS[vehicle.type]} ${vehicle.vehicleNumber}
        </h3>
        <p style="margin: 4px 0;"><strong>Plate:</strong> ${vehicle.licensePlate}</p>
        <p style="margin: 4px 0;"><strong>Driver:</strong> ${vehicle.driverName}</p>
        ${vehicle.companyName ? `<p style="margin: 4px 0;"><strong>Company:</strong> ${vehicle.companyName}</p>` : ''}
        <p style="margin: 4px 0;"><strong>Speed:</strong> ${Math.round(vehicle.location.speed)} km/h</p>
        <p style="margin: 4px 0;">
          <strong>Status:</strong> 
          <span style="color: ${vehicle.isOnline ? 'green' : 'red'}">
            ${vehicle.isOnline ? '● Online' : '○ Offline'}
          </span>
        </p>
      </div>
    `;
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg">
        <h4 className="text-sm font-semibold mb-2">Vehicle Types</h4>
        <div className="space-y-1">
          {Object.entries(VEHICLE_ICONS).map(([type, icon]) => (
            <div key={type} className="flex items-center gap-2 text-sm">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: VEHICLE_COLORS[type] }}
              />
              <span>{icon} {type.charAt(0).toUpperCase() + type.slice(1)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Vehicle count */}
      <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded-lg shadow-lg">
        <span className="text-sm font-medium">
          {vehicles.size} vehicles on map
        </span>
      </div>
    </div>
  );
};
