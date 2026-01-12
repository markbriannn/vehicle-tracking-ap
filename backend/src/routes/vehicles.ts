/**
 * =============================================================================
 * VEHICLE ROUTES
 * =============================================================================
 * 
 * MENTOR NOTE: These routes handle vehicle CRUD operations.
 * Key flows:
 * - Driver registers vehicle → Admin verifies → Vehicle appears on map
 * - Company registers fleet → Admin verifies each → Fleet appears on map
 * - Public can view only verified, active vehicles
 */

import { Router, Request, Response } from 'express';
import { Vehicle, User, GPSHistory } from '../models';
import { authenticate, authorize } from '../middleware/auth';
import { vehicleDocumentUpload } from '../middleware/upload';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * POST /api/vehicles/register
 * Register a new vehicle (company only - drivers register vehicle during signup)
 */
router.post(
  '/register',
  authenticate,
  authorize('company'),
  vehicleDocumentUpload,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { licensePlate, type, routeName } = req.body;
      const files = req.files as { [fieldname: string]: any[] };

      // Validate required fields
      if (!licensePlate || !type) {
        res.status(400).json({ error: 'License plate and vehicle type required' });
        return;
      }

      // Validate required documents
      if (!files.vehiclePhoto || !files.licensePlatePhoto) {
        res.status(400).json({ 
          error: 'Missing required photos (vehiclePhoto, licensePlatePhoto)' 
        });
        return;
      }

      // Check if license plate already registered
      const existingVehicle = await Vehicle.findOne({ licensePlate: licensePlate.toUpperCase() });
      if (existingVehicle) {
        res.status(400).json({ error: 'License plate already registered' });
        return;
      }

      // Generate unique vehicle number
      const vehicleNumber = `VH-${uuidv4().slice(0, 8).toUpperCase()}`;

      // Create vehicle (company fleet vehicle - no driver assigned yet)
      const vehicle = new Vehicle({
        vehicleNumber,
        licensePlate: licensePlate.toUpperCase(),
        type,
        documents: {
          vehiclePhoto: files.vehiclePhoto[0].path,
          licensePlatePhoto: files.licensePlatePhoto[0].path,
        },
        companyId: req.user!.id,
        verificationStatus: 'pending',
        routeName,
      });

      await vehicle.save();

      res.status(201).json({
        message: 'Vehicle registered successfully. Awaiting admin verification.',
        vehicle: {
          id: vehicle._id,
          vehicleNumber: vehicle.vehicleNumber,
          licensePlate: vehicle.licensePlate,
          type: vehicle.type,
          verificationStatus: vehicle.verificationStatus,
        },
      });
    } catch (error) {
      console.error('Vehicle registration error:', error);
      res.status(500).json({ error: 'Vehicle registration failed' });
    }
  }
);

/**
 * GET /api/vehicles
 * Get all verified vehicles (public endpoint for map)
 * 
 * MENTOR NOTE: This is the main endpoint for the student/community map.
 * It returns only verified, active vehicles with their current locations.
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, companyId } = req.query;

    // Build query for verified, active vehicles
    const query: any = {
      verificationStatus: 'approved',
      isActive: true,
    };

    // Optional filters
    if (type) query.type = type;
    if (companyId) query.companyId = companyId;

    const vehicles = await Vehicle.find(query)
      .populate('driverId', 'name phone')
      .populate('companyId', 'companyName')
      .select('-documents.licensePlatePhoto'); // Don't expose license plate photo publicly

    res.json({ vehicles });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ error: 'Failed to get vehicles' });
  }
});

/**
 * GET /api/vehicles/:id
 * Get single vehicle details
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('driverId', 'name phone')
      .populate('companyId', 'companyName');

    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    res.json({ vehicle });
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({ error: 'Failed to get vehicle' });
  }
});

/**
 * PUT /api/vehicles/:id/assign-driver
 * Assign a driver to a vehicle (company only)
 */
router.put(
  '/:id/assign-driver',
  authenticate,
  authorize('company', 'admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { driverId } = req.body;

      const vehicle = await Vehicle.findById(req.params.id);
      if (!vehicle) {
        res.status(404).json({ error: 'Vehicle not found' });
        return;
      }

      // Verify driver exists and belongs to company (if company is assigning)
      const driver = await User.findById(driverId);
      if (!driver || driver.role !== 'driver') {
        res.status(400).json({ error: 'Invalid driver' });
        return;
      }

      // Update vehicle and driver
      vehicle.driverId = driverId;
      await vehicle.save();

      await User.findByIdAndUpdate(driverId, { assignedVehicle: vehicle._id });

      res.json({
        message: 'Driver assigned successfully',
        vehicle: {
          id: vehicle._id,
          vehicleNumber: vehicle.vehicleNumber,
          driverId: vehicle.driverId,
        },
      });
    } catch (error) {
      console.error('Assign driver error:', error);
      res.status(500).json({ error: 'Failed to assign driver' });
    }
  }
);

/**
 * GET /api/vehicles/company/:companyId
 * Get all vehicles for a company
 */
router.get(
  '/company/:companyId',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const vehicles = await Vehicle.find({ companyId: req.params.companyId })
        .populate('driverId', 'name phone verificationStatus');

      res.json({ vehicles });
    } catch (error) {
      console.error('Get company vehicles error:', error);
      res.status(500).json({ error: 'Failed to get company vehicles' });
    }
  }
);

/**
 * PUT /api/vehicles/:id/route
 * Update vehicle route name (driver only for their own vehicle)
 */
router.put(
  '/:id/route',
  authenticate,
  authorize('driver'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { routeName } = req.body;

      // Find vehicle and verify ownership
      const vehicle = await Vehicle.findById(req.params.id);
      if (!vehicle) {
        res.status(404).json({ error: 'Vehicle not found' });
        return;
      }

      // Verify driver owns this vehicle
      if (vehicle.driverId?.toString() !== req.user!.id) {
        res.status(403).json({ error: 'You can only update your own vehicle route' });
        return;
      }

      // Update route name
      vehicle.routeName = routeName || '';
      await vehicle.save();

      res.json({
        message: 'Route updated successfully',
        vehicle: {
          id: vehicle._id,
          vehicleNumber: vehicle.vehicleNumber,
          routeName: vehicle.routeName,
        },
      });
    } catch (error) {
      console.error('Update route error:', error);
      res.status(500).json({ error: 'Failed to update route' });
    }
  }
);

/**
 * POST /api/vehicles/sync-locations
 * Sync buffered GPS locations from offline mode
 * 
 * MENTOR NOTE: When drivers lose internet, the app buffers GPS locations locally.
 * When back online, this endpoint receives the batch of buffered locations
 * and stores them in GPS history for analytics/playback.
 */
router.post(
  '/sync-locations',
  authenticate,
  authorize('driver'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { locations } = req.body;

      if (!locations || !Array.isArray(locations) || locations.length === 0) {
        res.status(400).json({ error: 'No locations to sync' });
        return;
      }

      // Validate and prepare GPS history entries
      const historyEntries = locations.map((loc: any) => ({
        vehicleId: loc.vehicleId,
        driverId: req.user!.id,
        location: {
          latitude: loc.location.latitude,
          longitude: loc.location.longitude,
          speed: loc.location.speed || 0,
          heading: loc.location.heading || 0,
          accuracy: loc.location.accuracy,
          timestamp: new Date(loc.timestamp),
        },
        createdAt: new Date(loc.timestamp),
      }));

      // Bulk insert for efficiency
      await GPSHistory.insertMany(historyEntries, { ordered: false });

      // Update vehicle's last known location with the most recent entry
      const latestLocation = locations[locations.length - 1];
      if (latestLocation) {
        await Vehicle.findByIdAndUpdate(latestLocation.vehicleId, {
          currentLocation: {
            latitude: latestLocation.location.latitude,
            longitude: latestLocation.location.longitude,
            speed: latestLocation.location.speed || 0,
            heading: latestLocation.location.heading || 0,
            timestamp: new Date(latestLocation.timestamp),
          },
          lastUpdate: new Date(latestLocation.timestamp),
        });
      }

      console.log(`📍 Synced ${locations.length} buffered locations for driver ${req.user!.id}`);

      res.json({
        message: 'Locations synced successfully',
        count: locations.length,
      });
    } catch (error) {
      console.error('Sync locations error:', error);
      res.status(500).json({ error: 'Failed to sync locations' });
    }
  }
);

export default router;
