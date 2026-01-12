# iOS App - Future Expansion

This folder is prepared for iOS-specific code when you're ready to expand.

## Current Status

The React Native code in `mobile-android/` is cross-platform and will work on iOS with minimal changes.

## To Build for iOS

1. **Prerequisites**
   - macOS with Xcode installed
   - CocoaPods (`sudo gem install cocoapods`)

2. **Setup**
   ```bash
   cd mobile-android
   npx expo prebuild --platform ios
   cd ios
   pod install
   ```

3. **Run**
   ```bash
   npx expo run:ios
   ```

## iOS-Specific Considerations

### Location Permissions
Add to `Info.plist`:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to track vehicle position</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>We need your location to track vehicle position in background</string>
<key>UIBackgroundModes</key>
<array>
    <string>location</string>
</array>
```

### Google Maps API Key
Add your iOS API key in `app.json`:
```json
"ios": {
  "config": {
    "googleMapsApiKey": "YOUR_IOS_API_KEY"
  }
}
```

### Push Notifications (Future)
For SOS alerts, consider implementing push notifications:
- Apple Push Notification Service (APNs)
- Configure in Apple Developer Portal
- Add `expo-notifications` package

## File Structure (When Expanded)

```
iOS/
├── VehicleTrack/
│   ├── AppDelegate.swift
│   ├── Info.plist
│   └── Assets.xcassets/
├── VehicleTrack.xcodeproj/
└── Podfile
```

## Notes

- The Expo-based React Native app handles most iOS requirements automatically
- Native modules may require additional iOS configuration
- Test thoroughly on physical iOS devices for GPS accuracy
