/**
 * =============================================================================
 * LOGIN SCREEN
 * =============================================================================
 * 
 * MENTOR NOTE: Entry point for existing users.
 * Supports both driver and student login.
 */

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { loginStyles as styles } from './styles/loginStyles';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    clearError();
    const success = await login(email, password);
    
    if (!success) {
      // Get the latest error from the store
      const currentError = useAuthStore.getState().error;
      if (currentError) {
        Alert.alert('Login Failed', currentError);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🚗</Text>
          <Text style={styles.title}>VehicleTrack</Text>
          <Text style={styles.subtitle}>Real-time Vehicle Tracking</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Register Links */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Don't have an account?</Text>
          
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => navigation.navigate('RegisterDriver')}
          >
            <Text style={styles.registerButtonText}>Register as Driver</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.registerButton, styles.registerButtonSecondary]}
            onPress={() => navigation.navigate('RegisterStudent')}
          >
            <Text style={styles.registerButtonTextSecondary}>
              Register as Student/Community
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hintText}>
          Test: student@test.com / student123
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
