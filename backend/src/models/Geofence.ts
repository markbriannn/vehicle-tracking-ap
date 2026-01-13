/**
 * =============================================================================
 * GEOFENCE MODEL - MongoDB Schema
 * =============================================================================
 * 
 * Defines geographic zones for tracking vehicle entry/exit events.
 * Supports circular geofences (center point + radius).
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IGeofenceDocument extends Document {
  name: string;
  description?: string;
  type: 'terminal' | 'school' | 'restricted' | 'checkpoint' | 'custom';
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number; // in meters
  isActive: boolean;
  alertOnEntry: boolean;
  alertOnExit: boolean;
  notifyAdmin: boolean;
  notifyDriver: boolean;
  color?: string; // for map display
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GeofenceSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['terminal', 'school', 'restricted', 'checkpoint', 'custom'],
      default: 'custom',
    },
    center: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    radius: {
      type: Number,
      required: true,
      default: 100, // 100 meters default
      min: 10,
      max: 10000,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    alertOnEntry: {
      type: Boolean,
      default: true,
    },
    alertOnExit: {
      type: Boolean,
      default: true,
    },
    notifyAdmin: {
      type: Boolean,
      default: true,
    },
    notifyDriver: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      default: '#3B82F6', // Blue
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Index for geospatial queries
GeofenceSchema.index({ 'center.latitude': 1, 'center.longitude': 1 });
GeofenceSchema.index({ isActive: 1 });
GeofenceSchema.index({ type: 1 });

export const Geofence = mongoose.model<IGeofenceDocument>('Geofence', GeofenceSchema);
