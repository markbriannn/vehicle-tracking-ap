/**
 * =============================================================================
 * ADMIN ROUTES
 * =============================================================================
 * 
 * MENTOR NOTE: Admin-only routes for managing the system.
 * Key responsibilities:
 * - Verify/reject drivers, vehicles, and companies
 * - View all users and vehicles (including pending)
 * - Manage SOS alerts
 * - Access analytics data
 */

import { Router, Request, Response } from 'express';
import { User, Vehicle, SOSAlert, GPSHistory } from '../models';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, authorize('admin'));

/**
 * GET /api/admin/dashboard
 * Get dashboard statistics
 */
router.get('/dashboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalDrivers,
      pendingDrivers,
      totalVehicles,
      pendingVehicles,
      activeVehicles,
      totalCompanies,
      totalStudents,
      activeAlerts,
    ] = await Promise.all([
      User.countDocuments({ role: 'driver' }),
      User.countDocuments({ role: 'driver', verificationStatus: 'pending' }),
      Vehicle.countDocuments(),
      Vehicle.countDocuments({ verificationStatus: 'pending' }),
      Vehicle.countDocuments({ 
        verificationStatus: 'approved', 
        isActive: true,
        lastSeen: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Active in last 5 min
      }),
      User.countDocuments({ role: 'company' }),
      User.countDocuments({ role: 'student' }),
      SOSAlert.countDocuments({ status: 'active' }),
    ]);

    res.json({
      stats: {
        totalDrivers,
        pendingDrivers,
        totalVehicles,
        pendingVehicles,
        activeVehicles,
        totalCompanies,
        totalStudents,
        activeAlerts,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
});

/**
 * GET /api/admin/pending
 * Get all pending verifications
 */
router.get('/pending', async (req: Request, res: Response): Promise<void> => {
  try {
    const [pendingDrivers, pendingVehicles, pendingCompanies] = await Promise.all([
      User.find({ role: 'driver', verificationStatus: 'pending' })
        .select('-password')
        .populate('assignedVehicle') // Include vehicle with all documents including OR/CR
        .sort({ createdAt: -1 }),
      Vehicle.find({ verificationStatus: 'pending' })
        .populate('driverId', 'name email phone')
        .populate('companyId', 'companyName')
        .sort({ createdAt: -1 }),
      User.find({ role: 'company', verificationStatus: 'pending' })
        .select('-password')
        .sort({ createdAt: -1 }),
    ]);

    res.json({
      pendingDrivers,
      pendingVehicles,
      pendingCompanies,
    });
  } catch (error) {
    console.error('Get pending error:', error);
    res.status(500).json({ error: 'Failed to get pending items' });
  }
});

/**
 * PUT /api/admin/verify/driver/:id
 * Verify or reject a driver
 */
router.put('/verify/driver/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, reason } = req.body; // status: 'approved' | 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const driver = await User.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: status },
      { new: true }
    ).select('-password');

    if (!driver) {
      res.status(404).json({ error: 'Driver not found' });
      return;
    }

    // Emit real-time notification to the driver
    const io = req.app.get('io');
    if (io) {
      io.emit('user:verified', {
        userId: driver._id.toString(),
        status,
        role: 'driver',
        message: status === 'approved' 
          ? 'Your driver account has been approved! You can now start tracking.'
          : 'Your driver account has been rejected.',
      });
    }

    res.json({
      message: `Driver ${status}`,
      driver,
    });
  } catch (error) {
    console.error('Verify driver error:', error);
    res.status(500).json({ error: 'Failed to verify driver' });
  }
});

/**
 * PUT /api/admin/verify/vehicle/:id
 * Verify or reject a vehicle
 */
router.put('/verify/vehicle/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, reason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: status },
      { new: true }
    ).populate('driverId', 'name email');

    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    // Emit real-time notification to the driver
    const io = req.app.get('io');
    if (io && vehicle.driverId) {
      io.emit('vehicle:verified', {
        vehicleId: vehicle._id.toString(),
        driverId: (vehicle.driverId as any)._id?.toString(),
        status,
        message: status === 'approved' 
          ? `Your vehicle ${vehicle.licensePlate} has been approved!`
          : `Your vehicle ${vehicle.licensePlate} has been rejected.`,
      });
    }

    res.json({
      message: `Vehicle ${status}`,
      vehicle,
    });
  } catch (error) {
    console.error('Verify vehicle error:', error);
    res.status(500).json({ error: 'Failed to verify vehicle' });
  }
});

/**
 * PUT /api/admin/verify/company/:id
 * Verify or reject a company
 */
router.put('/verify/company/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, reason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const company = await User.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: status },
      { new: true }
    ).select('-password');

    if (!company) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }

    res.json({
      message: `Company ${status}`,
      company,
    });
  } catch (error) {
    console.error('Verify company error:', error);
    res.status(500).json({ error: 'Failed to verify company' });
  }
});

/**
 * GET /api/admin/users
 * Get all users with filters
 */
router.get('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, status, page = 1, limit = 20 } = req.query;

    const query: any = {};
    if (role) query.role = role;
    if (status) query.verificationStatus = status;

    const users = await User.find(query)
      .select('-password')
      .populate('assignedVehicle', 'vehicleNumber licensePlate')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

/**
 * GET /api/admin/vehicles
 * Get all vehicles with filters (including pending)
 */
router.get('/vehicles', async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, status, companyId, page = 1, limit = 20 } = req.query;

    const query: any = {};
    if (type) query.type = type;
    if (status) query.verificationStatus = status;
    if (companyId) query.companyId = companyId;

    const vehicles = await Vehicle.find(query)
      .populate('driverId', 'name email phone')
      .populate('companyId', 'companyName')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Vehicle.countDocuments(query);

    res.json({
      vehicles,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ error: 'Failed to get vehicles' });
  }
});

/**
 * GET /api/admin/alerts
 * Get SOS alerts
 */
router.get('/alerts', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status = 'active' } = req.query;

    const alerts = await SOSAlert.find({ status })
      .populate('senderId', 'name email phone')
      .populate('vehicleId', 'vehicleNumber licensePlate')
      .sort({ createdAt: -1 });

    res.json({ alerts });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

/**
 * PUT /api/admin/alerts/:id/resolve
 * Resolve an SOS alert
 */
router.put('/alerts/:id/resolve', async (req: Request, res: Response): Promise<void> => {
  try {
    const alert = await SOSAlert.findByIdAndUpdate(
      req.params.id,
      {
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy: req.user!.id,
      },
      { new: true }
    );

    if (!alert) {
      res.status(404).json({ error: 'Alert not found' });
      return;
    }

    // Broadcast resolution to all admins so they remove the marker from map
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('sos:resolved', {
        alertId: alert._id.toString(),
        resolvedBy: req.user!.id,
      });
    }

    res.json({
      message: 'Alert resolved',
      alert,
    });
  } catch (error) {
    console.error('Resolve alert error:', error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

/**
 * GET /api/admin/analytics/vehicle/:id
 * Get analytics for a specific vehicle
 */
router.get('/analytics/vehicle/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get GPS history for the vehicle
    const history = await GPSHistory.find({
      vehicleId: req.params.id,
      createdAt: { $gte: start, $lte: end },
    }).sort({ createdAt: 1 });

    // Calculate analytics
    let totalDistance = 0;
    let maxSpeed = 0;
    let idleTime = 0;
    let lastPoint: any = null;

    for (const point of history) {
      if (point.location.speed > maxSpeed) {
        maxSpeed = point.location.speed;
      }

      if (point.location.speed < 5) {
        // Consider idle if speed < 5 km/h
        if (lastPoint) {
          const timeDiff = (point.createdAt.getTime() - lastPoint.createdAt.getTime()) / 1000 / 60;
          idleTime += timeDiff;
        }
      }

      if (lastPoint) {
        // Calculate distance using Haversine formula
        const dist = calculateDistance(
          lastPoint.location.latitude,
          lastPoint.location.longitude,
          point.location.latitude,
          point.location.longitude
        );
        totalDistance += dist;
      }

      lastPoint = point;
    }

    res.json({
      vehicleId: req.params.id,
      period: { start, end },
      analytics: {
        totalDistance: Math.round(totalDistance * 100) / 100, // km
        maxSpeed: Math.round(maxSpeed),
        idleTime: Math.round(idleTime), // minutes
        totalPoints: history.length,
      },
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

/**
 * Haversine formula to calculate distance between two GPS points
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
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
