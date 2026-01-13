/**
 * =============================================================================
 * GEOFENCE ROUTES
 * =============================================================================
 * 
 * API endpoints for managing geofences and viewing events.
 */

import { Router, Request, Response } from 'express';
import { Geofence, GeofenceEvent, Vehicle } from '../models';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

/**
 * GET /api/geofences
 * Get all geofences (public - for map display)
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const geofences = await Geofence.find({ isActive: true })
      .select('-createdBy')
      .sort({ name: 1 });

    res.json({ geofences });
  } catch (error) {
    console.error('Get geofences error:', error);
    res.status(500).json({ error: 'Failed to get geofences' });
  }
});

/**
 * GET /api/geofences/:id
 * Get single geofence details
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const geofence = await Geofence.findById(req.params.id);

    if (!geofence) {
      res.status(404).json({ error: 'Geofence not found' });
      return;
    }

    res.json({ geofence });
  } catch (error) {
    console.error('Get geofence error:', error);
    res.status(500).json({ error: 'Failed to get geofence' });
  }
});

/**
 * POST /api/geofences
 * Create a new geofence (admin only)
 */
router.post(
  '/',
  authenticate,
  authorize('admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        name,
        description,
        type,
        latitude,
        longitude,
        radius,
        alertOnEntry,
        alertOnExit,
        notifyAdmin,
        notifyDriver,
        color,
      } = req.body;

      // Validate required fields
      if (!name || latitude === undefined || longitude === undefined) {
        res.status(400).json({ error: 'Name, latitude, and longitude are required' });
        return;
      }

      // Validate coordinates
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        res.status(400).json({ error: 'Invalid coordinates' });
        return;
      }

      const geofence = new Geofence({
        name,
        description,
        type: type || 'custom',
        center: { latitude, longitude },
        radius: radius || 100,
        alertOnEntry: alertOnEntry !== false,
        alertOnExit: alertOnExit !== false,
        notifyAdmin: notifyAdmin !== false,
        notifyDriver: notifyDriver || false,
        color: color || '#3B82F6',
        createdBy: req.user!.id,
      });

      await geofence.save();

      // Broadcast new geofence to all clients
      const io = req.app.get('io');
      if (io) {
        io.emit('geofence:created', {
          geofence: {
            id: geofence._id,
            name: geofence.name,
            type: geofence.type,
            center: geofence.center,
            radius: geofence.radius,
            color: geofence.color,
          },
        });
      }

      res.status(201).json({
        message: 'Geofence created successfully',
        geofence,
      });
    } catch (error) {
      console.error('Create geofence error:', error);
      res.status(500).json({ error: 'Failed to create geofence' });
    }
  }
);

/**
 * PUT /api/geofences/:id
 * Update a geofence (admin only)
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        name,
        description,
        type,
        latitude,
        longitude,
        radius,
        isActive,
        alertOnEntry,
        alertOnExit,
        notifyAdmin,
        notifyDriver,
        color,
      } = req.body;

      const updateData: any = {};
      
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (type) updateData.type = type;
      if (latitude !== undefined && longitude !== undefined) {
        updateData.center = { latitude, longitude };
      }
      if (radius) updateData.radius = radius;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (alertOnEntry !== undefined) updateData.alertOnEntry = alertOnEntry;
      if (alertOnExit !== undefined) updateData.alertOnExit = alertOnExit;
      if (notifyAdmin !== undefined) updateData.notifyAdmin = notifyAdmin;
      if (notifyDriver !== undefined) updateData.notifyDriver = notifyDriver;
      if (color) updateData.color = color;

      const geofence = await Geofence.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );

      if (!geofence) {
        res.status(404).json({ error: 'Geofence not found' });
        return;
      }

      // Broadcast update
      const io = req.app.get('io');
      if (io) {
        io.emit('geofence:updated', { geofence });
      }

      res.json({
        message: 'Geofence updated successfully',
        geofence,
      });
    } catch (error) {
      console.error('Update geofence error:', error);
      res.status(500).json({ error: 'Failed to update geofence' });
    }
  }
);

/**
 * DELETE /api/geofences/:id
 * Delete a geofence (admin only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const geofence = await Geofence.findByIdAndDelete(req.params.id);

      if (!geofence) {
        res.status(404).json({ error: 'Geofence not found' });
        return;
      }

      // Broadcast deletion
      const io = req.app.get('io');
      if (io) {
        io.emit('geofence:deleted', { geofenceId: req.params.id });
      }

      res.json({ message: 'Geofence deleted successfully' });
    } catch (error) {
      console.error('Delete geofence error:', error);
      res.status(500).json({ error: 'Failed to delete geofence' });
    }
  }
);

/**
 * GET /api/geofences/:id/events
 * Get events for a specific geofence
 */
router.get(
  '/:id/events',
  authenticate,
  authorize('admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { limit = 50, eventType } = req.query;

      const query: any = { geofenceId: req.params.id };
      if (eventType) query.eventType = eventType;

      const events = await GeofenceEvent.find(query)
        .populate('vehicleId', 'vehicleNumber licensePlate type')
        .populate('driverId', 'name')
        .sort({ timestamp: -1 })
        .limit(Number(limit));

      res.json({ events });
    } catch (error) {
      console.error('Get geofence events error:', error);
      res.status(500).json({ error: 'Failed to get events' });
    }
  }
);

/**
 * GET /api/geofences/events/recent
 * Get recent geofence events across all geofences
 */
router.get(
  '/events/recent',
  authenticate,
  authorize('admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { limit = 50, hours = 24 } = req.query;

      const since = new Date(Date.now() - Number(hours) * 60 * 60 * 1000);

      const events = await GeofenceEvent.find({ timestamp: { $gte: since } })
        .populate('geofenceId', 'name type color')
        .populate('vehicleId', 'vehicleNumber licensePlate type')
        .populate('driverId', 'name')
        .sort({ timestamp: -1 })
        .limit(Number(limit));

      res.json({ events });
    } catch (error) {
      console.error('Get recent events error:', error);
      res.status(500).json({ error: 'Failed to get events' });
    }
  }
);

/**
 * GET /api/geofences/vehicle/:vehicleId/status
 * Check which geofences a vehicle is currently inside
 */
router.get(
  '/vehicle/:vehicleId/status',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const vehicle = await Vehicle.findById(req.params.vehicleId);
      
      if (!vehicle || !vehicle.currentLocation) {
        res.json({ insideGeofences: [] });
        return;
      }

      const geofences = await Geofence.find({ isActive: true });
      const insideGeofences: any[] = [];

      for (const geofence of geofences) {
        const distance = calculateDistance(
          vehicle.currentLocation.latitude,
          vehicle.currentLocation.longitude,
          geofence.center.latitude,
          geofence.center.longitude
        );

        if (distance <= geofence.radius) {
          insideGeofences.push({
            id: geofence._id,
            name: geofence.name,
            type: geofence.type,
            distance: Math.round(distance),
          });
        }
      }

      res.json({ insideGeofences });
    } catch (error) {
      console.error('Get vehicle geofence status error:', error);
      res.status(500).json({ error: 'Failed to get status' });
    }
  }
);

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in meters
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export default router;
