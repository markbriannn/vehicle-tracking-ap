/**
 * =============================================================================
 * USER MODEL - MongoDB Schema
 * =============================================================================
 * 
 * MENTOR NOTE: This model handles all user types (driver, company, admin, student).
 */

import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '../types';

export interface IUserDocument extends Document {
  email: string;
  password: string;
  role: UserRole;
  name: string;
  firstName?: string;
  middleInitial?: string;
  lastName?: string;
  suffix?: string;
  phone: string;
  isActive: boolean;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  documents?: {
    licenseFront?: string;
    licenseBack?: string;
    selfie?: string;
  };
  assignedVehicle?: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId;
  companyName?: string;
  companyAddress?: string;
  companyLicense?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['driver', 'company', 'admin', 'student'],
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    middleInitial: {
      type: String,
      trim: true,
      maxlength: 1,
    },
    lastName: {
      type: String,
      trim: true,
    },
    suffix: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    documents: {
      licenseFront: String,
      licenseBack: String,
      selfie: String,
    },
    assignedVehicle: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    companyName: String,
    companyAddress: String,
    companyLicense: String,
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save middleware to hash passwords.
 */
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Instance method to compare passwords during login.
 */
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.index({ role: 1, verificationStatus: 1 });
UserSchema.index({ companyId: 1 });

export const User = mongoose.model<IUserDocument>('User', UserSchema);
