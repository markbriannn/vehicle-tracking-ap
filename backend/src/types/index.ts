/**
 * =============================================================================
 * VEHICLE TRACKING SYSTEM - TYPE DEFINITIONS
 * =============================================================================
 * 
 * MENTOR NOTE: These TypeScript interfaces define the shape of our data.
 * Having strong types helps catch errors at compile time and makes the
 * codebase self-documenting. Each interface maps to a MongoDB model.
 */

// Vehicle types supported by the system
export type VehicleType = 'bus' | 'van' | 'multicab' | 'car' | 'motorcycle';

// User roles for access control
export type UserRole = 'driver' | 'company' | 'admin' | 'student';

// Verification status workflow: pending → approved/rejected
export type VerificationStatus = 'pending' | 'approved' | 'rejected';

// GPS coordinates with timestamp
export interface GPSLocation {
  latitude: number;
  longitude: number;
  speed: number; // km/h
  heading: number; // degrees 0-360
  timestamp: Date;
  accuracy?: number; // meters
}

// Driver document uploads
export interface DriverDocuments {
  licenseFront: string; // file path
  licenseBack: string;
  selfie: string;
}

// Vehicle document uploads
export interface VehicleDocuments {
  vehiclePhoto: string;
  licensePlatePhoto: string;
}

// User interface (drivers, companies, admins, students)
export interface IUser {
  _id: string;
  email: string;
  password: string;
  role: UserRole;
  name: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  verificationStatus: VerificationStatus;
  // Driver-specific fields
  documents?: DriverDocuments;
  assignedVehicle?: string; // vehicle ID
  companyId?: string; // if driver belongs to a company
  // Company-specific fields
  companyName?: string;
  companyAddress?: string;
  companyLicense?: string;
}

// Vehicle interface
export interface IVehicle {
  _id: string;
  vehicleNumber: string; // internal tracking number
  licensePlate: string;
  type: VehicleType;
  documents: VehicleDocuments;
  driverId?: string;
  companyId?: string;
  verificationStatus: VerificationStatus;
  isActive: boolean;
  currentLocation?: GPSLocation;
  lastSeen?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Route information (future expansion)
  routeId?: string;
  routeName?: string;
}

// SOS Alert interface
export interface ISOSAlert {
  _id: string;
  senderId: string;
  senderRole: UserRole;
  senderName: string;
  vehicleId?: string;
  location: GPSLocation;
  message?: string;
  status: 'active' | 'acknowledged' | 'resolved';
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

// GPS History for analytics
export interface IGPSHistory {
  _id: string;
  vehicleId: string;
  driverId: string;
  location: GPSLocation;
  createdAt: Date;
}

/**
 * =============================================================================
 * SOCKET.IO EVENT TYPES
 * =============================================================================
 * 
 * MENTOR NOTE: These types define the payload structure for Socket.io events.
 * This ensures type safety when emitting and receiving real-time updates.
 */

// Payload sent by driver app every 5-10 seconds
export interface VehicleUpdatePayload {
  vehicleId: string;
  driverId: string;
  location: GPSLocation;
}

// Broadcast to all clients watching the map
export interface VehicleLocationBroadcast {
  vehicleId: string;
  vehicleNumber: string;
  licensePlate: string;
  type: VehicleType;
  driverName: string;
  companyName?: string;
  routeName?: string;
  location: GPSLocation;
  vehiclePhoto: string;
  isOnline: boolean;
}

// SOS alert payload
export interface SOSAlertPayload {
  alertId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  vehicleId?: string;
  vehiclePlate?: string;
  location: GPSLocation;
  message?: string;
  timestamp: Date;
}

// Socket event names as constants for type safety
export const SOCKET_EVENTS = {
  // Client → Server
  VEHICLE_UPDATE: 'vehicle:update',
  SOS_SEND: 'sos:send',
  JOIN_ROOM: 'join:room',
  LEAVE_ROOM: 'leave:room',
  
  // Server → Client
  VEHICLE_LOCATION: 'vehicle:location',
  VEHICLE_OFFLINE: 'vehicle:offline',
  SOS_ALERT: 'sos:alert',
  SOS_RESOLVED: 'sos:resolved',
  
  // Connection events
  CONNECT: 'connection',
  DISCONNECT: 'disconnect',
} as const;

// Room names for Socket.io
export const SOCKET_ROOMS = {
  ADMIN: 'admin-room',
  PUBLIC_MAP: 'public-map',
  DRIVERS: 'drivers-room',
} as const;
