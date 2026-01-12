/**
 * =============================================================================
 * WEB ADMIN TYPE DEFINITIONS
 * =============================================================================
 */

export type VehicleType = 'bus' | 'van' | 'multicab' | 'car' | 'motorcycle';
export type UserRole = 'driver' | 'company' | 'admin' | 'student';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface GPSLocation {
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: Date;
  accuracy?: number;
}

export interface User {
  _id: string;
  email: string;
  role: UserRole;
  name: string;
  phone: string;
  verificationStatus: VerificationStatus;
  isActive: boolean;
  documents?: {
    licenseFront: string;
    licenseBack: string;
    selfie: string;
  };
  assignedVehicle?: Vehicle;
  companyId?: string;
  companyName?: string;
  createdAt: string;
}

export interface Vehicle {
  _id: string;
  vehicleNumber: string;
  licensePlate: string;
  type: VehicleType;
  documents: {
    vehiclePhoto: string;
    licensePlatePhoto: string;
  };
  driverId?: User;
  companyId?: { _id: string; companyName: string };
  verificationStatus: VerificationStatus;
  isActive: boolean;
  currentLocation?: GPSLocation;
  lastSeen?: string;
  routeName?: string;
  createdAt: string;
}

export interface VehicleLocationUpdate {
  vehicleId: string;
  vehicleNumber: string;
  licensePlate: string;
  type: VehicleType;
  driverName: string;
  companyName?: string;
  location: GPSLocation;
  vehiclePhoto: string;
  isOnline: boolean;
}

export interface SOSAlert {
  _id: string;
  senderId: User;
  senderRole: UserRole;
  senderName: string;
  vehicleId?: Vehicle;
  location: GPSLocation;
  message?: string;
  status: 'active' | 'acknowledged' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
}

export interface DashboardStats {
  totalDrivers: number;
  pendingDrivers: number;
  totalVehicles: number;
  pendingVehicles: number;
  activeVehicles: number;
  totalCompanies: number;
  activeAlerts: number;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}
