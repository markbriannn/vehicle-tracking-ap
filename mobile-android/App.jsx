/**
 * =============================================================================
 * MAIN APP COMPONENT
 * =============================================================================
 * 
 * MENTOR NOTE: Entry point for the React Native app.
 * Sets up navigation and authentication flow.
 * 
 * NAVIGATION STRUCTURE:
 * - Auth Stack (not logged in): Login, Register screens
 * - Driver Stack (logged in as driver): Driver home, vehicle registration
 * - Student Stack (logged in as student): Map view
 */

import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';

import { useAuthStore } from './src/store/authStore';
import { appStyles } from './src/screens/styles/appStyles';
import { colors } from './src/styles';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterDriverScreen from './src/screens/RegisterDriverScreen';
import RegisterStudentScreen from './src/screens/RegisterStudentScreen';
// RegisterVehicleScreen removed - vehicle registration is now part of driver registration
import MapScreen from './src/screens/MapScreen';
import DriverHomeScreen from './src/screens/DriverHomeScreen';

const Stack = createNativeStackNavigator();

// Auth Stack (not logged in)
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen 
        name="RegisterDriver" 
        component={RegisterDriverScreen}
        options={{ 
          headerShown: true, 
          title: 'Driver Registration',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen 
        name="RegisterStudent" 
        component={RegisterStudentScreen}
        options={{ 
          headerShown: true, 
          title: 'Student Registration',
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
  );
}

// Driver Stack (logged in as driver)
function DriverStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="DriverHome" 
        component={DriverHomeScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Student/Community Stack (logged in as student)
function StudentStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Map" 
        component={MapScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Main App
export default function App() {
  const { isAuthenticated, user, initialize } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from storage - only once on mount
  useEffect(() => {
    const init = async () => {
      await initialize();
      setIsLoading(false);
    };
    init();
  }, []); // Empty dependency array - run only once

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <View style={appStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      {!isAuthenticated ? (
        <AuthStack />
      ) : user?.role === 'driver' ? (
        <DriverStack />
      ) : (
        <StudentStack />
      )}
    </NavigationContainer>
  );
}
