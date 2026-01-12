/**
 * =============================================================================
 * FILE UPLOAD MIDDLEWARE
 * =============================================================================
 * 
 * MENTOR NOTE: Multer handles multipart/form-data for file uploads.
 * We configure it to:
 * - Store files in the 'uploads' directory
 * - Generate unique filenames using UUID
 * - Filter for image files only
 * - Limit file size to 5MB
 * 
 * In production, consider using cloud storage (S3, Cloudinary) instead
 * of local disk storage for better scalability and CDN delivery.
 */

import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Organize uploads by type
    let subDir = 'misc';
    
    if (file.fieldname.includes('license') || file.fieldname.includes('selfie')) {
      subDir = 'drivers';
    } else if (file.fieldname.includes('vehicle') || file.fieldname.includes('plate') || file.fieldname.includes('OrCr') || file.fieldname.includes('orCr')) {
      subDir = 'vehicles';
    }
    
    const fullPath = path.join(uploadDir, subDir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: uuid-originalname.ext
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

// File filter - only allow images
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
  }
};

// Create multer instance with configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

/**
 * MENTOR NOTE: Pre-configured upload handlers for different scenarios.
 * Use these in routes like: router.post('/register', driverDocumentUpload, handler)
 */

// Driver registration: license front, back, and selfie
export const driverDocumentUpload = upload.fields([
  { name: 'licenseFront', maxCount: 1 },
  { name: 'licenseBack', maxCount: 1 },
  { name: 'selfie', maxCount: 1 },
]);

// Driver registration with vehicle: all driver docs + vehicle docs
export const driverWithVehicleUpload = upload.fields([
  { name: 'licenseFront', maxCount: 1 },
  { name: 'licenseBack', maxCount: 1 },
  { name: 'selfie', maxCount: 1 },
  { name: 'vehiclePhoto', maxCount: 1 },
  { name: 'vehiclePlatePhoto', maxCount: 1 },
  { name: 'vehicleOrCr', maxCount: 1 }, // OR/CR ownership proof
]);

// Vehicle registration: vehicle photo and license plate photo
export const vehicleDocumentUpload = upload.fields([
  { name: 'vehiclePhoto', maxCount: 1 },
  { name: 'licensePlatePhoto', maxCount: 1 },
  { name: 'orCrPhoto', maxCount: 1 }, // OR/CR ownership proof
]);

// Single file upload for updates
export const singleUpload = upload.single('file');
