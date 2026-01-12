/**
 * =============================================================================
 * SOS ALERT MODEL - MongoDB Schema
 * =============================================================================
 */

import mongoose, { Schema, Document } from 'mongoose';
import { UserRole, GPSLocation } from '../types';

export interface ISOSAlertDocument extends Document {
  senderId: mongoose.Types.ObjectId;
  senderRole: UserRole;
  senderName: string;
  vehicleId?: mongoose.Types.ObjectId;
  location: GPSLocation;
  message?: string;
  status: 'active' | 'acknowledged' | 'resolved';
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
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

const SOSAlertSchema = new Schema(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['driver', 'student'],
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
    location: {
      type: GPSLocationSchema,
      required: true,
    },
    message: {
      type: String,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ['active', 'acknowledged', 'resolved'],
      default: 'active',
    },
    resolvedAt: Date,
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

SOSAlertSchema.index({ status: 1, createdAt: -1 });

export const SOSAlert = mongoose.model<ISOSAlertDocument>('SOSAlert', SOSAlertSchema);
