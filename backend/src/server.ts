/**
 * =============================================================================
 * VEHICLE TRACKING SYSTEM - MAIN SERVER
 * =============================================================================
 * 
 * MENTOR NOTE: This is the entry point for the backend. It sets up:
 * 1. Express server for REST API endpoints
 * 2. Socket.io for real-time GPS tracking
 * 3. MongoDB connection
 * 4. Cron jobs for background tasks
 * 
 * DEPLOYMENT ON RENDER FREE TIER:
 * - The server will sleep after 15 minutes of inactivity
 * - Uptime Robot pings /api/health every 5-10 minutes to keep it awake
 * - First request after sleep takes ~30 seconds (cold start)
 * 
 * SOCKET.IO ARCHITECTURE:
 * - Drivers send GPS updates via 'vehicle:update' event
 * - Server broadcasts to 'admin-room' and 'public-map' rooms
 * - Clients receive 'vehicle:location' events with updated positions
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import { authRoutes, vehicleRoutes, adminRoutes, sosRoutes } from './routes';

// Import socket handlers and cron tasks
import { initializeSocketHandlers } from './socket/handlers';
import { initializeCronTasks } from './cron/tasks';

// Initialize Express app
const app = express();
const httpServer = createServer(app);

/**
 * MENTOR NOTE: Socket.io Configuration
 * 
 * CORS is configured to allow connections from:
 * - localhost (development)
 * - Your deployed frontend URLs (add them here)
 * 
 * transports: We enable both websocket and polling.
 * Polling is fallback for environments where websockets are blocked.
 */
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:3000', // Web admin dev
      'http://localhost:5173', // Vite dev server
      'http://localhost:19006', // Expo web
      // Add your production URLs here:
      // 'https://your-admin.vercel.app',
      // 'https://your-app.netlify.app',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Attach io to app for use in routes (e.g., SOS alerts)
app.set('io', io);

// Middleware
app.use(cors({
  origin: '*', // Configure properly for production
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

/**
 * HEALTH CHECK ENDPOINT
 * 
 * MENTOR NOTE: This endpoint is crucial for Render + Uptime Robot setup.
 * Uptime Robot pings this URL every 5-10 minutes to prevent the free-tier
 * server from sleeping. It also serves as a basic health check.
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/sos', sosRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

/**
 * DATABASE CONNECTION & SERVER START
 * 
 * MENTOR NOTE: We connect to MongoDB first, then start the server.
 * This ensures the database is ready before accepting requests.
 * 
 * For MongoDB, use MongoDB Atlas free tier (M0 cluster).
 * Connection string format: mongodb+srv://user:pass@cluster.mongodb.net/dbname
 */
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vehicle-tracking';

async function startServer() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');

    // Initialize Socket.io handlers
    initializeSocketHandlers(io);
    console.log('Socket.io handlers initialized');

    // Initialize cron tasks
    initializeCronTasks(io);

    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`
========================================
🚗 Vehicle Tracking Server Started
========================================
Port: ${PORT}
Environment: ${process.env.NODE_ENV || 'development'}
MongoDB: Connected
Socket.io: Ready
Cron Jobs: Running

Health Check: http://localhost:${PORT}/api/health
API Base: http://localhost:${PORT}/api

UPTIME ROBOT SETUP:
Configure Uptime Robot to ping:
https://your-app.onrender.com/api/health
every 5 minutes to prevent sleep.
========================================
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await mongoose.connection.close();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start the server
startServer();
