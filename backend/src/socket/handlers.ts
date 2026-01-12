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
import { Vehicle, GPSHistory, User } from '../models';
import {
  SOCKET_EVENTS,
  SOCKET_ROOMS,
  VehicleUpdatePayload,
  VehicleLocationBroadcast,
} from '../types';

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
