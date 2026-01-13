/**
 * =============================================================================
 * DATABASE SEED SCRIPT
 * =============================================================================
 * 
 * MENTOR NOTE: Run this script to create initial admin user and test data.
 * Usage: npm run seed
 * 
 * This creates:
 * - 1 Admin user (for dashboard access)
 * - 1 Test company
 * - 2 Test drivers
 * - 2 Test vehicles
 * - 1 Test student
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Vehicle, Geofence } from '../models';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vehicle-tracking';

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    // Clear existing data (optional - comment out in production)
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Geofence.deleteMany({});

    // Create admin user
    console.log('Creating admin user...');
    const admin = await User.create({
      email: 'admin@vehicletrack.com',
      password: 'admin123', // Change in production!
      role: 'admin',
      name: 'System Admin',
      phone: '+1234567890',
      verificationStatus: 'approved',
      isActive: true,
    });
    console.log(`Admin created: ${admin.email}`);

    // Create test company
    console.log('Creating test company...');
    const company = await User.create({
      email: 'company@test.com',
      password: 'company123',
      role: 'company',
      name: 'Test Transport Co.',
      phone: '+1234567891',
      companyName: 'Test Transport Company',
      companyAddress: '123 Main Street, City',
      verificationStatus: 'approved',
      isActive: true,
    });
    console.log(`Company created: ${company.companyName}`);

    // Create test drivers
    console.log('Creating test drivers...');
    const driver1 = await User.create({
      email: 'driver1@test.com',
      password: 'driver123',
      role: 'driver',
      name: 'John Driver',
      phone: '+1234567892',
      verificationStatus: 'approved',
      isActive: true,
      companyId: company._id,
      documents: {
        licenseFront: 'uploads/drivers/sample-license-front.jpg',
        licenseBack: 'uploads/drivers/sample-license-back.jpg',
        selfie: 'uploads/drivers/sample-selfie.jpg',
      },
    });

    const driver2 = await User.create({
      email: 'driver2@test.com',
      password: 'driver123',
      role: 'driver',
      name: 'Jane Driver',
      phone: '+1234567893',
      verificationStatus: 'pending', // Pending for testing verification flow
      isActive: true,
      documents: {
        licenseFront: 'uploads/drivers/sample-license-front.jpg',
        licenseBack: 'uploads/drivers/sample-license-back.jpg',
        selfie: 'uploads/drivers/sample-selfie.jpg',
      },
    });
    console.log(`Drivers created: ${driver1.name}, ${driver2.name}`);

    // Create test vehicles
    console.log('Creating test vehicles...');
    const vehicle1 = await Vehicle.create({
      vehicleNumber: 'VH-TEST001',
      licensePlate: 'ABC-1234',
      type: 'bus',
      verificationStatus: 'approved',
      isActive: true,
      driverId: driver1._id,
      companyId: company._id,
      documents: {
        vehiclePhoto: 'uploads/vehicles/sample-vehicle.jpg',
        licensePlatePhoto: 'uploads/vehicles/sample-plate.jpg',
      },
      currentLocation: {
        latitude: 14.5995,
        longitude: 120.9842,
        speed: 0,
        heading: 0,
        timestamp: new Date(),
      },
      lastSeen: new Date(),
      routeName: 'Route A - Downtown',
    });

    const vehicle2 = await Vehicle.create({
      vehicleNumber: 'VH-TEST002',
      licensePlate: 'XYZ-5678',
      type: 'van',
      verificationStatus: 'pending', // Pending for testing
      isActive: true,
      driverId: driver2._id,
      documents: {
        vehiclePhoto: 'uploads/vehicles/sample-vehicle.jpg',
        licensePlatePhoto: 'uploads/vehicles/sample-plate.jpg',
      },
    });
    console.log(`Vehicles created: ${vehicle1.vehicleNumber}, ${vehicle2.vehicleNumber}`);

    // Update driver with assigned vehicle
    await User.findByIdAndUpdate(driver1._id, { assignedVehicle: vehicle1._id });

    // Create test student
    console.log('Creating test student...');
    const student = await User.create({
      email: 'student@test.com',
      password: 'student123',
      role: 'student',
      name: 'Test Student',
      phone: '+1234567894',
      verificationStatus: 'approved',
      isActive: true,
    });
    console.log(`Student created: ${student.name}`);

    // Create Maasin City Terminal geofence
    console.log('Creating geofences...');
    const maasinTerminal = await Geofence.create({
      name: 'Maasin City Terminal',
      description: 'Main bus and van terminal in Maasin City, Southern Leyte',
      type: 'terminal',
      center: {
        latitude: 10.1319,
        longitude: 124.8348,
      },
      radius: 50, // 50 meters radius - typical terminal size
      isActive: true,
      alertOnEntry: true,
      alertOnExit: true,
      notifyAdmin: true,
      notifyDriver: true,
      color: '#EF4444', // Red for terminal
      createdBy: admin._id,
    });
    console.log(`Geofence created: ${maasinTerminal.name} (${maasinTerminal.radius}m radius)`);

    // Create Bato Terminal geofence
    const batoTerminal = await Geofence.create({
      name: 'Bato Terminal',
      description: 'Bus and van terminal in Bato, Leyte - Plus Code: 8QHQ+6GQ',
      type: 'terminal',
      center: {
        latitude: 10.3281,
        longitude: 124.7920,
      },
      radius: 40, // 40 meters radius
      isActive: true,
      alertOnEntry: true,
      alertOnExit: true,
      notifyAdmin: true,
      notifyDriver: true,
      color: '#F59E0B', // Orange for terminal
      createdBy: admin._id,
    });
    console.log(`Geofence created: ${batoTerminal.name} (${batoTerminal.radius}m radius)`);

    // Create Hilongos Terminal geofence
    const hilongosTerminal = await Geofence.create({
      name: 'Hilongos Terminal',
      description: 'Bus and van terminal in Hilongos, Leyte - Plus Code: 9QF2+52V',
      type: 'terminal',
      center: {
        latitude: 10.3755,
        longitude: 124.7529,
      },
      radius: 40, // 40 meters radius
      isActive: true,
      alertOnEntry: true,
      alertOnExit: true,
      notifyAdmin: true,
      notifyDriver: true,
      color: '#10B981', // Green for terminal
      createdBy: admin._id,
    });
    console.log(`Geofence created: ${hilongosTerminal.name} (${hilongosTerminal.radius}m radius)`);

    // Create Inopacan Terminal geofence
    const inopacanTerminal = await Geofence.create({
      name: 'Inopacan Terminal',
      description: 'Bus and van terminal in Inopacan, Leyte - borders Hindang and Camotes Sea',
      type: 'terminal',
      center: {
        latitude: 10.5000,
        longitude: 124.7333,
      },
      radius: 40, // 40 meters radius
      isActive: true,
      alertOnEntry: true,
      alertOnExit: true,
      notifyAdmin: true,
      notifyDriver: true,
      color: '#8B5CF6', // Purple for terminal
      createdBy: admin._id,
    });
    console.log(`Geofence created: ${inopacanTerminal.name} (${inopacanTerminal.radius}m radius)`);

    // Create Hindang Public Market geofence
    const hindangMarket = await Geofence.create({
      name: 'Hindang Public Market',
      description: 'Public market in Hindang, Leyte - Plus Code: CPMH+95Q, near municipal center',
      type: 'checkpoint',
      center: {
        latitude: 10.43,
        longitude: 124.73,
      },
      radius: 35, // 35 meters radius for market
      isActive: true,
      alertOnEntry: true,
      alertOnExit: true,
      notifyAdmin: true,
      notifyDriver: true,
      color: '#EC4899', // Pink for market
      createdBy: admin._id,
    });
    console.log(`Geofence created: ${hindangMarket.name} (${hindangMarket.radius}m radius)`);

    // Create Baybay City Terminal geofence
    const baybayTerminal = await Geofence.create({
      name: 'Baybay City Terminal',
      description: 'Bus and van terminal in Baybay City, Leyte - Plus Code: MQGX+57X, near Pan-Philippine Highway',
      type: 'terminal',
      center: {
        latitude: 10.72,
        longitude: 124.75,
      },
      radius: 50, // 50 meters radius
      isActive: true,
      alertOnEntry: true,
      alertOnExit: true,
      notifyAdmin: true,
      notifyDriver: true,
      color: '#06B6D4', // Cyan for terminal
      createdBy: admin._id,
    });
    console.log(`Geofence created: ${baybayTerminal.name} (${baybayTerminal.radius}m radius)`);

    // Create Ormoc City Terminal geofence
    const ormocTerminal = await Geofence.create({
      name: 'Ormoc City Terminal',
      description: 'Bus and van terminal in Ormoc City, Leyte - Plus Code: 2J34+WX, downtown near coast',
      type: 'terminal',
      center: {
        latitude: 11.00639,
        longitude: 124.6075,
      },
      radius: 50, // 50 meters radius - larger city terminal
      isActive: true,
      alertOnEntry: true,
      alertOnExit: true,
      notifyAdmin: true,
      notifyDriver: true,
      color: '#6366F1', // Indigo for terminal
      createdBy: admin._id,
    });
    console.log(`Geofence created: ${ormocTerminal.name} (${ormocTerminal.radius}m radius)`);

    console.log(`
========================================
🌱 Seed Complete!
========================================
Admin Login:
  Email: admin@vehicletrack.com
  Password: admin123

Company Login:
  Email: company@test.com
  Password: company123

Driver Login:
  Email: driver1@test.com
  Password: driver123

Student Login:
  Email: student@test.com
  Password: student123
========================================
    `);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
