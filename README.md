# 🚗 Real-Time Vehicle Tracking System

A full-stack vehicle tracking system for schools and communities with real-time GPS tracking, admin dashboard, and mobile apps.

## 📋 Features

### For Drivers
- Register with license documents and selfie
- Register vehicles with photos
- Real-time GPS tracking (broadcasts every 5 seconds)
- SOS emergency button
- View verification status

### For Students/Community
- View all verified vehicles on map
- Real-time vehicle movement
- Filter by vehicle type
- View vehicle details (driver, speed, company)
- SOS emergency button

### For Admins
- Web dashboard with real-time map
- Verify drivers, vehicles, and companies
- Monitor all vehicles in real-time
- Receive SOS alerts instantly
- Analytics (speed, distance, idle time)

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Driver App    │────▶│    Backend      │◀────│   Admin Web     │
│  (React Native) │     │  (Node.js +     │     │   (React +      │
│                 │◀────│   Socket.io)    │────▶│   TypeScript)   │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
┌─────────────────┐              │
│  Student App    │◀─────────────┘
│  (React Native) │
└─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Google Maps API key

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run seed  # Create test data
npm run dev   # Start development server
```

### 2. Web Admin Setup

```bash
cd web-admin
npm install
# Add your Google Maps API key to index.html
npm run dev
```

### 3. Mobile App Setup

```bash
cd mobile-android
npm install
# Edit src/config/api.js with your backend URL
npx expo start
```

## 📱 Test Credentials

After running `npm run seed`:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@vehicletrack.com | admin123 |
| Driver | driver1@test.com | driver123 |
| Student | student@test.com | student123 |

## 🔌 Socket.io Events

### Client → Server
| Event | Description |
|-------|-------------|
| `vehicle:update` | Driver sends GPS location |
| `sos:send` | Send emergency alert |
| `join:room` | Join a room (admin-room, public-map) |

### Server → Client
| Event | Description |
|-------|-------------|
| `vehicle:location` | Broadcast vehicle position |
| `vehicle:offline` | Vehicle went offline |
| `sos:alert` | Emergency alert notification |

## 🌐 Deployment

### Backend on Render (Free Tier)

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repo
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NODE_ENV=production`

### Keep Server Awake with Uptime Robot

1. Sign up at [Uptime Robot](https://uptimerobot.com)
2. Create HTTP(s) monitor
3. URL: `https://your-app.onrender.com/api/health`
4. Interval: 5 minutes

### Web Admin on Vercel/Netlify

```bash
cd web-admin
npm run build
# Deploy dist/ folder
```

## 📁 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── models/       # MongoDB schemas
│   │   ├── routes/       # API endpoints
│   │   ├── middleware/   # Auth, upload
│   │   ├── socket/       # Socket.io handlers
│   │   ├── cron/         # Background tasks
│   │   └── server.ts     # Entry point
│   └── package.json
│
├── web-admin/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom hooks
│   │   └── types/        # TypeScript types
│   └── package.json
│
├── mobile-android/
│   ├── src/
│   │   ├── screens/      # App screens
│   │   ├── hooks/        # Custom hooks
│   │   ├── store/        # Zustand stores
│   │   └── config/       # API config
│   ├── App.jsx
│   └── package.json
│
└── iOS/                  # Future iOS expansion
```

## 🔧 Configuration

### Google Maps API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable Maps JavaScript API and Maps SDK for Android/iOS
3. Create API keys with appropriate restrictions
4. Add keys to:
   - `web-admin/index.html`
   - `mobile-android/app.json`

### MongoDB Atlas (Free Tier)

1. Create cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create database user
3. Whitelist IP addresses (or 0.0.0.0/0 for development)
4. Get connection string for `.env`

## 🛡️ Security Considerations

- JWT tokens expire after 7 days
- Passwords are hashed with bcrypt
- File uploads are validated (images only, 5MB max)
- CORS is configured for specific origins
- Admin routes require authentication + admin role

## 📈 Extending the System

### Adding New Vehicle Types

1. Update `VehicleType` in `backend/src/types/index.ts`
2. Add icon/color in `web-admin/src/components/Map.tsx`
3. Add icon/color in `mobile-android/src/screens/MapScreen.jsx`

### Adding Routes

1. Create route model in backend
2. Add route assignment to vehicles
3. Display route lines on map

### Push Notifications

1. Add `expo-notifications` to mobile app
2. Implement push token registration
3. Send notifications from backend on SOS alerts

## 📝 License

MIT License - feel free to use for your school or community!

## 🤝 Contributing

Contributions welcome! Please read the contributing guidelines first.

---

Built with ❤️ for safer school transportation
