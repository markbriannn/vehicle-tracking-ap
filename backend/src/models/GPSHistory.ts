/**
 * =============================================================================
 * GPS HISTORY MODEL - MongoDB Schema
 * =============================================================================
 */

import mongoose, { Schema, Document } from 'mongoose';
import { GPSLocation } from '../types';

export interface IGPSHistoryDocument extends Document {
  vehicleId: mongoose.Types.ObjectId;
  driverId: mongoose.Types.ObjectId;
  location: GPSLocation;
  createdAt: Date;
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

const GPSHistorySchema = new Schema(
  {
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    location: {
      type: GPSLocationSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

GPSHistorySchema.index({ vehicleId: 1, createdAt: -1 });
GPSHistorySchema.index({ driverId: 1, createdAt: -1 });
GPSHistorySchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 }
);

export const GPSHistory = mongoose.model<IGPSHistoryDocument>('GPSHistory', GPSHistorySchema);
