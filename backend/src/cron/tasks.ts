/**
 * =============================================================================
 * CRON TASKS
 * =============================================================================
 * 
 * MENTOR NOTE: Cron jobs handle scheduled background tasks:
 * 
 * 1. OFFLINE DETECTION: Every minute, check for vehicles that haven't sent
 *    GPS updates recently. Mark them as offline and notify clients.
 * 
 * 2. LOG CLEANUP: Daily, remove old GPS history records to prevent
 *    database bloat. (Note: We also use TTL index as backup)
 * 
 * 3. ALERT CLEANUP: Weekly, archive old resolved SOS alerts.
 * 
 * These tasks run server-side and are essential for system health.
 * On Render free tier, the server may sleep, so Uptime Robot pings
 * keep it awake and these cron jobs running.
 */

import cron from 'node-cron';
import { Server } from 'socket.io';
import { Vehicle, GPSHistory, SOSAlert } from '../models';
import { markVehicleOffline } from '../socket/handlers';
import { SOCKET_EVENTS, SOCKET_ROOMS } from '../types';

/**
 * Initialize all cron tasks
 */
export function initializeCronTasks(io: Server): void {
  console.log('Initializing cron tasks...');

  /**
   * OFFLINE VEHICLE DETECTION
   * Runs every minute
   * 
   * MENTOR NOTE: If a vehicle hasn't sent a GPS update in X minutes,
   * we consider it offline. This could mean:
   * - Driver turned off the app
   * - Phone lost connection
   * - Vehicle stopped for extended period
   * 
   * We broadcast the offline status so map clients can update the UI
   * (e.g., gray out the vehicle icon, show "offline" badge)
   */
  cron.schedule('* * * * *', async () => {
    try {
      const offlineThreshold = parseInt(process.env.OFFLINE_THRESHOLD_MINUTES || '5');
      const cutoffTime = new Date(Date.now() - offlineThreshold * 60 * 1000);

      // Find vehicles that were online but haven't updated recently
      const offlineVehicles = await Vehicle.find({
        verificationStatus: 'approved',
        isActive: true,
        lastSeen: { $lt: cutoffTime, $ne: null },
      });

      for (const vehicle of offlineVehicles) {
        await markVehicleOffline(io, vehicle._id.toString());
        console.log(`Vehicle ${vehicle.vehicleNumber} marked offline`);
      }

      if (offlineVehicles.length > 0) {
        console.log(`Marked ${offlineVehicles.length} vehicles as offline`);
      }
    } catch (error) {
      console.error('Offline detection cron error:', error);
    }
  });

  /**
   * GPS HISTORY CLEANUP
   * Runs daily at 3 AM
   * 
   * MENTOR NOTE: Even with TTL index, it's good to have explicit cleanup.
   * This removes records older than 30 days. Adjust retention as needed.
   */
  cron.schedule('0 3 * * *', async () => {
    try {
      const retentionDays = 30;
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

      const result = await GPSHistory.deleteMany({
        createdAt: { $lt: cutoffDate },
      });

      console.log(`GPS history cleanup: removed ${result.deletedCount} old records`);
    } catch (error) {
      console.error('GPS cleanup cron error:', error);
    }
  });

  /**
   * RESOLVED ALERTS CLEANUP
   * Runs weekly on Sunday at 4 AM
   * 
   * Archives resolved SOS alerts older than 90 days
   */
  cron.schedule('0 4 * * 0', async () => {
    try {
      const retentionDays = 90;
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

      const result = await SOSAlert.deleteMany({
        status: 'resolved',
        resolvedAt: { $lt: cutoffDate },
      });

      console.log(`Alert cleanup: archived ${result.deletedCount} old alerts`);
    } catch (error) {
      console.error('Alert cleanup cron error:', error);
    }
  });

  /**
   * STALE PENDING VERIFICATION REMINDER
   * Runs daily at 9 AM
   * 
   * MENTOR NOTE: This is a placeholder for sending notifications
   * to admins about pending verifications. In production, you'd
   * integrate with email/SMS/push notification services.
   */
  cron.schedule('0 9 * * *', async () => {
    try {
      const pendingDrivers = await Vehicle.countDocuments({
        verificationStatus: 'pending',
        createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Older than 24h
      });

      if (pendingDrivers > 0) {
        console.log(`Reminder: ${pendingDrivers} vehicles pending verification for >24h`);
        
        // Emit to admin room as a notification
        io.to(SOCKET_ROOMS.ADMIN).emit('notification', {
          type: 'pending_verification',
          message: `${pendingDrivers} vehicles awaiting verification`,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error('Pending reminder cron error:', error);
    }
  });

  console.log('Cron tasks initialized successfully');
}
