/**
 * =============================================================================
 * SOS ALERT ROUTES
 * =============================================================================
 * 
 * MENTOR NOTE: SOS is a critical safety feature. When triggered:
 * 1. Alert is saved to database
 * 2. Socket.io broadcasts to admin room immediately
 * 3. Admin sees alert on dashboard with location
 * 4. Admin can acknowledge and resolve
 * 
 * The Socket.io broadcast happens in the route handler by accessing
 * the io instance attached to the app.
 */

import { Router, Request, Response } from 'express';
import { SOSAlert, Vehicle } from '../models';
import { authenticate } from '../middleware/auth';
import { SOCKET_EVENTS, SOCKET_ROOMS, SOSAlertPayload } from '../types';

const router = Router();

/**
 * POST /api/sos/send
 * Send an SOS alert (driver or student)
 * 
 * MENTOR NOTE: This is the primary SOS endpoint. It:
 * 1. Creates the alert in the database
 * 2. Broadcasts via Socket.io to admins
 * 3. Returns confirmation to the sender
 */
router.post('/send', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { latitude, longitude, speed, heading, accuracy, message, vehicleId } = req.body;

    // Validate location
    if (latitude === undefined || longitude === undefined) {
      res.status(400).json({ error: 'Location (latitude, longitude) required' });
      return;
    }

    // Get vehicle info if provided
    let vehicle = null;
    if (vehicleId) {
      vehicle = await Vehicle.findById(vehicleId);
    }

    // Create SOS alert
    const alert = new SOSAlert({
      senderId: req.user!.id,
      senderRole: req.user!.role,
      senderName: req.user!.name,
      vehicleId: vehicleId || undefined,
      location: {
        latitude,
        longitude,
        speed: speed || 0,
        heading: heading || 0,
        timestamp: new Date(),
        accuracy,
      },
      message,
      status: 'active',
    });

    await alert.save();

    /**
     * MENTOR NOTE: Broadcasting SOS to admins via Socket.io
     * The io instance is attached to the Express app in server.ts
     * We emit to the admin room so only admins receive the alert
     */
    const io = req.app.get('io');
    if (io) {
      const alertPayload: SOSAlertPayload = {
        alertId: alert._id.toString(),
        senderId: req.user!.id,
        senderName: req.user!.name,
        senderRole: req.user!.role,
        vehicleId: vehicleId,
        vehiclePlate: vehicle?.licensePlate,
        location: alert.location,
        message,
        timestamp: alert.createdAt,
      };

      io.to(SOCKET_ROOMS.ADMIN).emit(SOCKET_EVENTS.SOS_ALERT, alertPayload);
      console.log('SOS alert broadcast to admins:', alertPayload.alertId);
    }

    res.status(201).json({
      message: 'SOS alert sent successfully',
      alertId: alert._id,
    });
  } catch (error) {
    console.error('SOS send error:', error);
    res.status(500).json({ error: 'Failed to send SOS alert' });
  }
});

/**
 * GET /api/sos/my-alerts
 * Get alerts sent by current user
 */
router.get('/my-alerts', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const alerts = await SOSAlert.find({ senderId: req.user!.id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ alerts });
  } catch (error) {
    console.error('Get my alerts error:', error);
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

/**
 * PUT /api/sos/:id/location
 * Update SOS alert location (for real-time tracking on admin map)
 */
router.put('/:id/location', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { latitude, longitude, speed, heading, accuracy } = req.body;

    const alert = await SOSAlert.findOne({
      _id: req.params.id,
      senderId: req.user!.id,
      status: 'active',
    });

    if (!alert) {
      res.status(404).json({ error: 'Active alert not found' });
      return;
    }

    // Update location
    alert.location = {
      latitude,
      longitude,
      speed: speed || 0,
      heading: heading || 0,
      timestamp: new Date(),
      accuracy,
    };
    await alert.save();

    // Broadcast location update to admins
    const io = req.app.get('io');
    if (io) {
      io.to(SOCKET_ROOMS.ADMIN).emit('sos:location', {
        alertId: alert._id.toString(),
        location: { latitude, longitude },
      });
    }

    res.json({ message: 'Location updated' });
  } catch (error) {
    console.error('Update SOS location error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

/**
 * PUT /api/sos/:id/cancel
 * Cancel an active SOS alert (sender only)
 */
router.put('/:id/cancel', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const alert = await SOSAlert.findOne({
      _id: req.params.id,
      senderId: req.user!.id,
      status: 'active',
    });

    if (!alert) {
      res.status(404).json({ error: 'Active alert not found' });
      return;
    }

    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    await alert.save();

    // Notify admins that alert was cancelled
    const io = req.app.get('io');
    if (io) {
      io.to(SOCKET_ROOMS.ADMIN).emit(SOCKET_EVENTS.SOS_RESOLVED, {
        alertId: alert._id.toString(),
        resolvedBy: 'sender',
      });
    }

    res.json({
      message: 'SOS alert cancelled',
      alert,
    });
  } catch (error) {
    console.error('Cancel SOS error:', error);
    res.status(500).json({ error: 'Failed to cancel alert' });
  }
});

export default router;
