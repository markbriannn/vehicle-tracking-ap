/**
 * =============================================================================
 * DRIVER REGISTRATION SCREEN
 * =============================================================================
 * 
 * MENTOR NOTE: Multi-step registration for drivers.
 * 
 * FLOW:
 * 1. Personal info (name, email, phone, password)
 * 2. Driver document uploads (license front, back, selfie)
 * 3. Vehicle registration (plate, type, photos, ownership proof OR/CR)
 * 4. Submit → Backend stores → Admin verifies
 * 
 * After registration, driver AND vehicle status is "pending" until admin approves.
 */

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../store/authStore';
import { registerDriverStyles as styles } from './styles/registerDriverStyles';

const VEHICLE_TYPES = [
  { id: 'bus', label: '🚌 Bus' },
  { id: 'van', label: '🚐 Van' },
  { id: 'multicab', label: '🚕 Multicab' },
  { id: 'car', label: '🚗 Car' },
  { id: 'motorcycle', label: '🏍️ Motorcycle' },
];

export default function RegisterDriverScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    middleInitial: '',
    lastName: '',
    suffix: '', // Optional: Jr., Sr., III, etc.
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [documents, setDocuments] = useState({
    licenseFront: null,
    licenseBack: null,
    selfie: null,
  });
  // Vehicle data
  const [vehicleData, setVehicleData] = useState({
    licensePlate: '',
    type: '',
    routeName: '',
  });
  const [vehicleDocuments, setVehicleDocuments] = useState({
    vehiclePhoto: null,
    licensePlatePhoto: null,
    orCrPhoto: null, // Official Receipt / Certificate of Registration (ownership proof)
  });
  const { registerDriver, isLoading, error } = useAuthStore();

  // Pick image from camera or gallery
  const pickImage = async (type, isVehicle = false) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'selfie' ? [1, 1] : [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      if (isVehicle) {
        setVehicleDocuments((prev) => ({
          ...prev,
          [type]: result.assets[0],
        }));
      } else {
        setDocuments((prev) => ({
          ...prev,
          [type]: result.assets[0],
        }));
      }
    }
  };

  // Take photo with camera
  const takePhoto = async (type, isVehicle = false) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: type === 'selfie' ? [1, 1] : [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      if (isVehicle) {
        setVehicleDocuments((prev) => ({
          ...prev,
          [type]: result.assets[0],
        }));
      } else {
        setDocuments((prev) => ({
          ...prev,
          [type]: result.assets[0],
        }));
      }
    }
  };

  // Validate step 1
  const validateStep1 = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.password) {
      Alert.alert('Error', 'Please fill all required fields');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  // Validate step 2
  const validateStep2 = () => {
    if (!documents.licenseFront || !documents.licenseBack || !documents.selfie) {
      Alert.alert('Error', 'Please upload all required documents');
      return false;
    }
    return true;
  };

  // Validate step 3 (vehicle)
  const validateStep3 = () => {
    if (!vehicleData.licensePlate || !vehicleData.type) {
      Alert.alert('Error', 'Please fill license plate and select vehicle type');
      return false;
    }
    if (!vehicleDocuments.vehiclePhoto || !vehicleDocuments.licensePlatePhoto || !vehicleDocuments.orCrPhoto) {
      Alert.alert('Error', 'Please upload all vehicle documents including OR/CR (ownership proof)');
      return false;
    }
    return true;
  };

  // Handle next step
  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validateStep3()) return;

    // Build full name from parts
    let fullName = formData.firstName;
    if (formData.middleInitial) {
      fullName += ` ${formData.middleInitial}.`;
    }
    fullName += ` ${formData.lastName}`;
    if (formData.suffix) {
      fullName += ` ${formData.suffix}`;
    }

    // Create form data for multipart upload
    const data = new FormData();
    
    // Personal info
    data.append('name', fullName);
    data.append('firstName', formData.firstName);
    data.append('middleInitial', formData.middleInitial);
    data.append('lastName', formData.lastName);
    data.append('suffix', formData.suffix);
    data.append('email', formData.email);
    data.append('phone', formData.phone);
    data.append('password', formData.password);

    // Driver documents
    data.append('licenseFront', {
      uri: documents.licenseFront.uri,
      type: 'image/jpeg',
      name: 'license_front.jpg',
    });
    data.append('licenseBack', {
      uri: documents.licenseBack.uri,
      type: 'image/jpeg',
      name: 'license_back.jpg',
    });
    data.append('selfie', {
      uri: documents.selfie.uri,
      type: 'image/jpeg',
      name: 'selfie.jpg',
    });

    // Vehicle info
    data.append('vehicleLicensePlate', vehicleData.licensePlate.toUpperCase());
    data.append('vehicleType', vehicleData.type);
    data.append('vehicleRouteName', vehicleData.routeName);

    // Vehicle documents
    data.append('vehiclePhoto', {
      uri: vehicleDocuments.vehiclePhoto.uri,
      type: 'image/jpeg',
      name: 'vehicle.jpg',
    });
    data.append('vehiclePlatePhoto', {
      uri: vehicleDocuments.licensePlatePhoto.uri,
      type: 'image/jpeg',
      name: 'plate.jpg',
    });
    data.append('vehicleOrCr', {
      uri: vehicleDocuments.orCrPhoto.uri,
      type: 'image/jpeg',
      name: 'or_cr.jpg',
    });

    const success = await registerDriver(data);

    if (success) {
      Alert.alert(
        'Registration Successful',
        'Your account and vehicle are pending verification. You will be notified once approved.',
        [{ text: 'OK' }]
      );
    } else if (error) {
      Alert.alert('Registration Failed', error);
    }
  };

  // Document upload component
  const DocumentUpload = ({ label, type, document, isVehicle = false }) => (
    <View style={styles.documentContainer}>
      <Text style={styles.documentLabel}>{label}</Text>
      {document ? (
        <Image source={{ uri: document.uri }} style={styles.documentImage} />
      ) : (
        <View style={styles.documentPlaceholder}>
          <Text style={styles.documentPlaceholderText}>No image</Text>
        </View>
      )}
      <View style={styles.documentButtons}>
        <TouchableOpacity
          style={styles.documentButton}
          onPress={() => takePhoto(type, isVehicle)}
        >
          <Text style={styles.documentButtonText}>📷 Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.documentButton}
          onPress={() => pickImage(type, isVehicle)}
        >
          <Text style={styles.documentButtonText}>🖼️ Gallery</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Progress indicator */}
        <View style={styles.progress}>
          <View style={[styles.progressStep, step >= 1 && styles.progressStepActive]}>
            <Text style={styles.progressText}>1</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={[styles.progressStep, step >= 2 && styles.progressStepActive]}>
            <Text style={styles.progressText}>2</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={[styles.progressStep, step >= 3 && styles.progressStepActive]}>
            <Text style={styles.progressText}>3</Text>
          </View>
        </View>

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Personal Information</Text>

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

            <TouchableOpacity style={styles.button} onPress={handleNext}>
              <Text style={styles.buttonText}>Next →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Driver Document Upload */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Driver Documents</Text>
            <Text style={styles.stepSubtitle}>
              Please upload clear photos of your documents
            </Text>

            <DocumentUpload
              label="Driver's License (Front)"
              type="licenseFront"
              document={documents.licenseFront}
            />

            <DocumentUpload
              label="Driver's License (Back)"
              type="licenseBack"
              document={documents.licenseBack}
            />

            <DocumentUpload
              label="Selfie with ID"
              type="selfie"
              document={documents.selfie}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setStep(1)}
              >
                <Text style={styles.buttonTextSecondary}>← Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.button}
                onPress={handleNext}
              >
                <Text style={styles.buttonText}>Next →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 3: Vehicle Registration */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Vehicle Registration</Text>
            <Text style={styles.stepSubtitle}>
              Register your vehicle with ownership proof
            </Text>

            {/* License Plate */}
            <Text style={styles.inputLabel}>License Plate *</Text>
            <TextInput
              style={styles.input}
              placeholder="ABC-1234"
              value={vehicleData.licensePlate}
              onChangeText={(text) => setVehicleData({ ...vehicleData, licensePlate: text.toUpperCase() })}
              autoCapitalize="characters"
            />

            {/* Vehicle Type */}
            <Text style={styles.inputLabel}>Vehicle Type *</Text>
            <View style={styles.typeOptions}>
              {VEHICLE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeOption,
                    vehicleData.type === type.id && styles.typeOptionSelected,
                  ]}
                  onPress={() => setVehicleData({ ...vehicleData, type: type.id })}
                >
                  <Text style={[
                    styles.typeOptionText,
                    vehicleData.type === type.id && styles.typeOptionTextSelected,
                  ]}>{type.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Route Name (Optional) */}
            <Text style={styles.inputLabel}>Route Name (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Route A - Downtown"
              value={vehicleData.routeName}
              onChangeText={(text) => setVehicleData({ ...vehicleData, routeName: text })}
            />

            {/* Vehicle Photos */}
            <DocumentUpload
              label="Vehicle Photo *"
              type="vehiclePhoto"
              document={vehicleDocuments.vehiclePhoto}
              isVehicle={true}
            />

            <DocumentUpload
              label="License Plate Photo *"
              type="licensePlatePhoto"
              document={vehicleDocuments.licensePlatePhoto}
              isVehicle={true}
            />

            <DocumentUpload
              label="OR/CR (Ownership Proof) *"
              type="orCrPhoto"
              document={vehicleDocuments.orCrPhoto}
              isVehicle={true}
            />

            <Text style={styles.ownershipNote}>
              📋 OR/CR = Official Receipt / Certificate of Registration. This proves you own the vehicle.
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setStep(2)}
              >
                <Text style={styles.buttonTextSecondary}>← Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
