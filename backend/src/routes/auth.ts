/**
 * =============================================================================
 * AUTHENTICATION ROUTES
 * =============================================================================
 * 
 * MENTOR NOTE: These routes handle user registration and login for all roles.
 * The registration flow differs by role:
 * - Driver: Registers with documents, needs admin verification
 * - Company: Registers company info, needs admin verification
 * - Student: Simple registration, auto-approved
 * - Admin: Created via seed script or by other admins
 */

import { Router, Request, Response } from 'express';
import { User, Vehicle } from '../models';
import { generateToken, authenticate } from '../middleware/auth';
import { driverWithVehicleUpload } from '../middleware/upload';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user (driver, company, or student)
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role, name, phone, companyName, companyAddress, firstName, middleInitial, lastName, suffix } = req.body;

    // Validate required fields
    if (!email || !password || !role || !name || !phone) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    // Create user based on role
    const userData: any = {
      email,
      password,
      role,
      name,
      phone,
      // Students are auto-approved, others need verification
      verificationStatus: role === 'student' ? 'approved' : 'pending',
    };

    // Add name parts if provided (for students)
    if (firstName) userData.firstName = firstName;
    if (middleInitial) userData.middleInitial = middleInitial;
    if (lastName) userData.lastName = lastName;
    if (suffix) userData.suffix = suffix;

    // Add company-specific fields
    if (role === 'company') {
      userData.companyName = companyName;
      userData.companyAddress = companyAddress;
    }

    const user = new User(userData);
    await user.save();

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        verificationStatus: user.verificationStatus,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/register/driver
 * Register a driver with document uploads AND vehicle (required)
 * 
 * MENTOR NOTE: This endpoint handles multipart form data with files.
 * The driverWithVehicleUpload middleware processes the files before this handler runs.
 * Vehicle registration is mandatory during driver signup.
 */
router.post(
  '/register/driver',
  driverWithVehicleUpload,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { 
        email, password, name, phone, companyId,
        vehicleLicensePlate, vehicleType, vehicleRouteName 
      } = req.body;
      const files = req.files as { [fieldname: string]: any[] };

      // Validate required personal fields
      if (!email || !password || !name || !phone) {
        res.status(400).json({ error: 'Missing required personal fields' });
        return;
      }

      // Validate required driver documents
      if (!files.licenseFront || !files.licenseBack || !files.selfie) {
        res.status(400).json({ 
          error: 'Missing required driver documents (licenseFront, licenseBack, selfie)' 
        });
        return;
      }

      // Validate required vehicle fields
      if (!vehicleLicensePlate || !vehicleType) {
        res.status(400).json({ error: 'Vehicle license plate and type are required' });
        return;
      }

      // Validate required vehicle documents
      if (!files.vehiclePhoto || !files.vehiclePlatePhoto || !files.vehicleOrCr) {
        res.status(400).json({ 
          error: 'Missing required vehicle documents (vehiclePhoto, vehiclePlatePhoto, vehicleOrCr)' 
        });
        return;
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({ error: 'Email already registered' });
        return;
      }

      // Check if license plate already registered
      const existingVehicle = await Vehicle.findOne({ licensePlate: vehicleLicensePlate.toUpperCase() });
      if (existingVehicle) {
        res.status(400).json({ error: 'License plate already registered' });
        return;
      }

      // Create driver user
      const user = new User({
        email,
        password,
        role: 'driver',
        name,
        firstName: req.body.firstName,
        middleInitial: req.body.middleInitial,
        lastName: req.body.lastName,
        suffix: req.body.suffix,
        phone,
        verificationStatus: 'pending',
        documents: {
          licenseFront: files.licenseFront[0].path,
          licenseBack: files.licenseBack[0].path,
          selfie: files.selfie[0].path,
        },
        companyId: companyId || undefined,
      });

      await user.save();

      // Generate unique vehicle number
      const vehicleNumber = `VH-${uuidv4().slice(0, 8).toUpperCase()}`;

      // Create vehicle with ownership proof
      const vehicle = new Vehicle({
        vehicleNumber,
        licensePlate: vehicleLicensePlate.toUpperCase(),
        type: vehicleType,
        documents: {
          vehiclePhoto: files.vehiclePhoto[0].path,
          licensePlatePhoto: files.vehiclePlatePhoto[0].path,
          orCrPhoto: files.vehicleOrCr[0].path,
        },
        driverId: user._id,
        verificationStatus: 'pending',
        routeName: vehicleRouteName || undefined,
      });

      await vehicle.save();

      // Assign vehicle to driver
      user.assignedVehicle = vehicle._id;
      await user.save();

      const token = generateToken(user);

      res.status(201).json({
        message: 'Driver and vehicle registration successful. Awaiting admin verification.',
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          name: user.name,
          verificationStatus: user.verificationStatus,
          assignedVehicle: vehicle._id,
        },
        vehicle: {
          id: vehicle._id,
          vehicleNumber: vehicle.vehicleNumber,
          licensePlate: vehicle.licensePlate,
          type: vehicle.type,
          verificationStatus: vehicle.verificationStatus,
        },
      });
    } catch (error) {
      console.error('Driver registration error:', error);
      res.status(500).json({ error: 'Driver registration failed' });
    }
  }
);

/**
 * POST /api/auth/login
 * Login for all user types
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(403).json({ error: 'Account is deactivated' });
      return;
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        verificationStatus: user.verificationStatus,
        companyId: user.companyId,
        assignedVehicle: user.assignedVehicle,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id)
      .select('-password')
      .populate('assignedVehicle')
      .populate('companyId', 'companyName');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

export default router;
