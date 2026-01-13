/**
 * =============================================================================
 * GEOFENCE EVENT MODEL - MongoDB Schema
 * =============================================================================
 * 
 * Logs vehicle entry/exit events for geofences.
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IGeofenceEventDocument extends Document {
  geofenceId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  driverId?: mongoose.Types.ObjectId;
  eventType: 'entry' | 'exit';
  location: {
    latitude: number;
    longitude: number;
    speed?: number;
  };
  timestamp: Date;
  createdAt: Date;
}

const GeofenceEventSchema = new Schema(
  {
    geofenceId: {
      type: Schema.Types.ObjectId,
      ref: 'Geofence',
      required: true,
    },
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    eventType: {
      type: String,
      enum: ['entry', 'exit'],
      required: true,
    },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      speed: { type: Number, default: 0 },
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
GeofenceEventSchema.index({ geofenceId: 1, timestamp: -1 });
GeofenceEventSchema.index({ vehicleId: 1, timestamp: -1 });
GeofenceEventSchema.index({ eventType: 1, timestamp: -1 });

export const GeofenceEvent = mongoose.model<IGeofenceEventDocument>('GeofenceEvent', GeofenceEventSchema);
