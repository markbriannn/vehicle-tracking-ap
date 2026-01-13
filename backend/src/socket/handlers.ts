/**
 * =============================================================================
 * SOCKET.IO EVENT HANDLERS
 * =============================================================================
 * 
 * MENTOR NOTE: This is the heart of real-time tracking. Socket.io enables
 * bidirectional communication between:
 * - Driver apps → Backend (sending GPS updates)
 * - Backend → Admin dashboard (broadcasting vehicle locations)
 * - Backend → Student/community apps (broadcasting vehicle locations)
 * 
 * KEY CONCEPTS:
 * 1. Rooms: We use rooms to organize clients (admin-room, public-map, drivers-room)
 * 2. Events: Named messages that carry data (vehicle:update, sos:alert, etc.)
 * 3. Broadcasting: Sending to all clients in a room except the sender
 * 
 * GPS UPDATE FLOW:
 * Driver App → vehicle:update event → Backend processes → 
 * Updates DB → Broadcasts to admin-room & public-map → 
 * All connected clients receive vehicle:location event
 */

import { Server, Socket } from 'socket.io';
import { Vehicle, GPSHistory, User, Geofence, GeofenceEvent } from '../models';
import {
  SOCKET_EVENTS,
  SOCKET_ROOMS,
  VehicleUpdatePayload,
  VehicleLocationBroadcast,
} from '../types';

// Store vehicle's last known geofence status to detect entry/exit
const vehicleGeofenceStatus: Map<string, Set<string>> = new Map();

/**
 * Initialize Socket.io event handlers
 */
export function initializeSocketHandlers(io: Server): void {
  io.on(SOCKET_EVENTS.CONNECT, (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    /**
     * JOIN ROOM
     * Clients join rooms based on their role:
     * - Admins join 'admin-room' to receive all updates + SOS alerts
     * - Students/public join 'public-map' to receive vehicle locations
     * - Drivers join 'drivers-room' for driver-specific broadcasts
     */
    socket.on(SOCKET_EVENTS.JOIN_ROOM, (data: { room: string; userId?: string }) => {
      const { room, userId } = data;
      
      // Validate room name
      const validRooms = Object.values(SOCKET_ROOMS);
      if (!validRooms.includes(room as any)) {
        socket.emit('error', { message: 'Invalid room' });
        return;
      }

      socket.join(room);
      console.log(`Client ${socket.id} joined room: ${room}`);

      // Store user info on socket for later use
      if (userId) {
        (socket as any).userId = userId;
      }
    });

    /**
     * LEAVE ROOM
     */
    socket.on(SOCKET_EVENTS.LEAVE_ROOM, (data: { room: string }) => {
      socket.leave(data.room);
      console.log(`Client ${socket.id} left room: ${data.room}`);
    });

    /**
     * VEHICLE UPDATE
     * 
     * MENTOR NOTE: This is the main GPS tracking event. Driver apps send this
     * every 5-10 seconds with their current location. The flow is:
     * 
     * 1. Validate the incoming data
     * 2. Update the vehicle's currentLocation in MongoDB
     * 3. Save to GPSHistory for analytics
     * 4. Broadcast to all clients watching the map
     * 
     * We use Promise.all for parallel DB operations to minimize latency.
     */
    socket.on(
      SOCKET_EVENTS.VEHICLE_UPDATE,
      async (payload: VehicleUpdatePayload) => {
        try {
          const { vehicleId, driverId, location } = payload;

          // Validate payload
          if (!vehicleId || !location || !location.latitude || !location.longitude) {
            socket.emit('error', { message: 'Invalid vehicle update payload' });
            return;
          }

          // Update vehicle location in database
          const vehicle = await Vehicle.findByIdAndUpdate(
            vehicleId,
            {
              currentLocation: {
                ...location,
                timestamp: new Date(),
              },
              lastSeen: new Date(),
            },
            { new: true }
          ).populate('driverId', 'name').populate('companyId', 'companyName');

          if (!vehicle) {
            socket.emit('error', { message: 'Vehicle not found' });
            return;
          }

          // Only broadcast if vehicle is verified and active
          if (vehicle.verificationStatus !== 'approved' || !vehicle.isActive) {
            return;
          }

          // Save to GPS history (async, don't wait)
          GPSHistory.create({
            vehicleId,
            driverId,
            location: {
              ...location,
              timestamp: new Date(),
            },
          }).catch(err => console.error('GPS history save error:', err));

          /**
           * MENTOR NOTE: Broadcast the location update to all connected clients.
           * We send to both admin-room and public-map so everyone sees the update.
           * The payload includes all info needed to display the vehicle on the map.
           */
          const broadcast: VehicleLocationBroadcast = {
            vehicleId: vehicle._id.toString(),
            vehicleNumber: vehicle.vehicleNumber,
            licensePlate: vehicle.licensePlate,
            type: vehicle.type,
            driverName: (vehicle.driverId as any)?.name || 'Unknown',
            companyName: (vehicle.companyId as any)?.companyName,
            routeName: vehicle.routeName,
            location: vehicle.currentLocation!,
            vehiclePhoto: vehicle.documents.vehiclePhoto,
            isOnline: true,
          };

          // Broadcast to admin room
          io.to(SOCKET_ROOMS.ADMIN).emit(SOCKET_EVENTS.VEHICLE_LOCATION, broadcast);
          
          // Broadcast to public map
          io.to(SOCKET_ROOMS.PUBLIC_MAP).emit(SOCKET_EVENTS.VEHICLE_LOCATION, broadcast);

          // Check geofences (async, don't block the response)
          checkGeofences(io, vehicleId, driverId, location).catch(err => 
            console.error('Geofence check error:', err)
          );

        } catch (error) {
          console.error('Vehicle update error:', error);
          socket.emit('error', { message: 'Failed to process vehicle update' });
        }
      }
    );

    /**
     * DISCONNECT
     * Clean up when a client disconnects
     */
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}

/**
 * Mark vehicle as offline and broadcast
 * Called by cron job when vehicle hasn't sent updates
 */
export async function markVehicleOffline(io: Server, vehicleId: string): Promise<void> {
  try {
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return;

    const broadcast: Partial<VehicleLocationBroadcast> = {
      vehicleId: vehicle._id.toString(),
      vehicleNumber: vehicle.vehicleNumber,
      licensePlate: vehicle.licensePlate,
      isOnline: false,
    };

    io.to(SOCKET_ROOMS.ADMIN).emit(SOCKET_EVENTS.VEHICLE_OFFLINE, broadcast);
    io.to(SOCKET_ROOMS.PUBLIC_MAP).emit(SOCKET_EVENTS.VEHICLE_OFFLINE, broadcast);
  } catch (error) {
    console.error('Mark offline error:', error);
  }
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in meters
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Check if vehicle entered or exited any geofences
 * Broadcasts alerts to admin room when events occur
 */
async function checkGeofences(
  io: Server,
  vehicleId: string,
  driverId: string | undefined,
  location: { latitude: number; longitude: number; speed?: number }
): Promise<void> {
  try {
    // Get all active geofences
    const geofences = await Geofence.find({ isActive: true });
    if (geofences.length === 0) return;

    // Get vehicle info for alerts
    const vehicle = await Vehicle.findById(vehicleId)
      .populate('driverId', 'name')
      .select('vehicleNumber licensePlate type');
    
    if (!vehicle) return;

    // Get previous geofence status for this vehicle
    const previousGeofences = vehicleGeofenceStatus.get(vehicleId) || new Set<string>();
    const currentGeofences = new Set<string>();

    // Check each geofence
    for (const geofence of geofences) {
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        geofence.center.latitude,
        geofence.center.longitude
      );

      const isInside = distance <= geofence.radius;
      const geofenceId = geofence._id.toString();

      if (isInside) {
        currentGeofences.add(geofenceId);

        // Check for ENTRY event
        if (!previousGeofences.has(geofenceId) && geofence.alertOnEntry) {
          // Vehicle just entered this geofence
          await createGeofenceEvent(io, 'entry', geofence, vehicle, driverId, location);
        }
      } else {
        // Check for EXIT event
        if (previousGeofences.has(geofenceId) && geofence.alertOnExit) {
          // Vehicle just exited this geofence
          await createGeofenceEvent(io, 'exit', geofence, vehicle, driverId, location);
        }
      }
    }

    // Update vehicle's geofence status
    vehicleGeofenceStatus.set(vehicleId, currentGeofences);

  } catch (error) {
    console.error('Geofence check error:', error);
  }
}

/**
 * Create geofence event and broadcast alert
 */
async function createGeofenceEvent(
  io: Server,
  eventType: 'entry' | 'exit',
  geofence: any,
  vehicle: any,
  driverId: string | undefined,
  location: { latitude: number; longitude: number; speed?: number }
): Promise<void> {
  try {
    // Save event to database
    const event = await GeofenceEvent.create({
      geofenceId: geofence._id,
      vehicleId: vehicle._id,
      driverId,
      eventType,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        speed: location.speed || 0,
      },
      timestamp: new Date(),
    });

    const alertData = {
      eventId: event._id.toString(),
      eventType,
      geofence: {
        id: geofence._id.toString(),
        name: geofence.name,
        type: geofence.type,
        color: geofence.color,
      },
      vehicle: {
        id: vehicle._id.toString(),
        vehicleNumber: vehicle.vehicleNumber,
        licensePlate: vehicle.licensePlate,
        type: vehicle.type,
        driverName: vehicle.driverId?.name || 'Unknown',
      },
      location,
      timestamp: new Date().toISOString(),
      message: `${vehicle.vehicleNumber} ${eventType === 'entry' ? 'entered' : 'exited'} ${geofence.name}`,
    };

    // Broadcast to admin room
    if (geofence.notifyAdmin) {
      io.to(SOCKET_ROOMS.ADMIN).emit('geofence:alert', alertData);
    }

    // Broadcast to driver if enabled
    if (geofence.notifyDriver && driverId) {
      io.to('drivers-room').emit('geofence:alert', alertData);
    }

    console.log(`📍 Geofence ${eventType}: ${vehicle.vehicleNumber} ${eventType === 'entry' ? '→' : '←'} ${geofence.name}`);

  } catch (error) {
    console.error('Create geofence event error:', error);
  }
}
