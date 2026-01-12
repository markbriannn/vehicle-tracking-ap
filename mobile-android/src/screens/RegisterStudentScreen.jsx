/**
 * =============================================================================
 * REGISTER STUDENT SCREEN
 * =============================================================================
 * 
 * MENTOR NOTE: Simple registration for students/community users.
 * Students are auto-approved and can immediately view the map.
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
  ScrollView,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { registerStudentStyles as styles } from './styles/registerStudentStyles';

export default function RegisterStudentScreen({ navigation }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    middleInitial: '',
    lastName: '',
    suffix: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const { registerStudent, isLoading, error } = useAuthStore();

  const handleSubmit = async () => {
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.password) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    // Build full name from parts
    let fullName = formData.firstName;
    if (formData.middleInitial) {
      fullName += ` ${formData.middleInitial}.`;
    }
    fullName += ` ${formData.lastName}`;
    if (formData.suffix) {
      fullName += ` ${formData.suffix}`;
    }

    const success = await registerStudent({
      name: fullName,
      firstName: formData.firstName,
      middleInitial: formData.middleInitial,
      lastName: formData.lastName,
      suffix: formData.suffix,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
    });

    if (!success && error) {
      Alert.alert('Registration Failed', error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>
          Register to view real-time vehicle locations
        </Text>

        <TextInput
          style={styles.input}
          placeholder="First Name *"
          value={formData.firstName}
          onChangeText={(text) => setFormData({ ...formData, firstName: text })}
        />

        <View style={styles.nameRow}>
          <TextInput
            style={[styles.input, styles.inputSmall]}
            placeholder="M.I."
            value={formData.middleInitial}
            onChangeText={(text) => setFormData({ ...formData, middleInitial: text.toUpperCase().slice(0, 1) })}
            maxLength={1}
            autoCapitalize="characters"
          />
          <TextInput
            style={[styles.input, styles.inputMedium]}
            placeholder="Suffix (Jr., Sr.)"
            value={formData.suffix}
            onChangeText={(text) => setFormData({ ...formData, suffix: text })}
          />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Last Name *"
          value={formData.lastName}
          onChangeText={(text) => setFormData({ ...formData, lastName: text })}
        />

        <TextInput
          style={styles.input}
          placeholder="Email *"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Phone Number *"
          value={formData.phone}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
          keyboardType="phone-pad"
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password *"
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirm Password *"
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Register</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
