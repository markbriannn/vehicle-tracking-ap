/**
 * =============================================================================
 * VEHICLE MODEL - MongoDB Schema
 * =============================================================================
 */

import mongoose, { Schema, Document } from 'mongoose';
import { VehicleType, GPSLocation } from '../types';

export interface IVehicleDocument extends Document {
  vehicleNumber: string;
  licensePlate: string;
  type: VehicleType;
  documents: {
    vehiclePhoto: string;
    licensePlatePhoto: string;
    orCrPhoto?: string; // OR/CR - Official Receipt / Certificate of Registration (ownership proof)
  };
  driverId?: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  isActive: boolean;
  currentLocation?: GPSLocation;
  lastSeen?: Date;
  routeId?: string;
  routeName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GPSLocationSchema = new Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    speed: { type: Number, default: 0 },
    heading: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now },
    accuracy: { type: Number },
  },
  { _id: false }
);

const VehicleSchema = new Schema(
  {
    vehicleNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    licensePlate: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['bus', 'van', 'multicab', 'car', 'motorcycle'],
      required: true,
    },
    documents: {
      vehiclePhoto: { type: String, required: true },
      licensePlatePhoto: { type: String, required: true },
      orCrPhoto: { type: String }, // OR/CR - Official Receipt / Certificate of Registration (ownership proof)
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    currentLocation: GPSLocationSchema,
    lastSeen: {
      type: Date,
    },
    routeId: String,
    routeName: String,
  },
  {
    timestamps: true,
  }
);

VehicleSchema.index({ verificationStatus: 1, isActive: 1 });
VehicleSchema.index({ companyId: 1 });
VehicleSchema.index({ driverId: 1 });
VehicleSchema.index({ type: 1 });
VehicleSchema.index({ lastSeen: 1 });

export const Vehicle = mongoose.model<IVehicleDocument>('Vehicle', VehicleSchema);
