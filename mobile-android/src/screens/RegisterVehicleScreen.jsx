/**
 * =============================================================================
 * REGISTER VEHICLE SCREEN
 * =============================================================================
 * 
 * MENTOR NOTE: Allows drivers to register their vehicle.
 * Requires vehicle photo and license plate photo.
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
import axios from 'axios';
import { API_URL } from '../config/api';
import { useAuthStore } from '../store/authStore';
import { registerVehicleStyles as styles } from './styles/registerVehicleStyles';

const VEHICLE_TYPES = [
  { id: 'bus', label: '🚌 Bus' },
  { id: 'van', label: '🚐 Van' },
  { id: 'multicab', label: '🚕 Multicab' },
  { id: 'car', label: '🚗 Car' },
  { id: 'motorcycle', label: '🏍️ Motorcycle' },
];

export default function RegisterVehicleScreen({ navigation }) {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    licensePlate: '',
    type: '',
    routeName: '',
  });
  const [photos, setPhotos] = useState({
    vehiclePhoto: null,
    licensePlatePhoto: null,
  });

  // Pick image
  const pickImage = async (type) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotos((prev) => ({
        ...prev,
        [type]: result.assets[0],
      }));
    }
  };

  // Take photo
  const takePhoto = async (type) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotos((prev) => ({
        ...prev,
        [type]: result.assets[0],
      }));
    }
  };

  // Submit
  const handleSubmit = async () => {
    // Validation
    if (!formData.licensePlate || !formData.type) {
      Alert.alert('Error', 'Please fill license plate and select vehicle type');
      return;
    }

    if (!photos.vehiclePhoto || !photos.licensePlatePhoto) {
      Alert.alert('Error', 'Please upload both vehicle and license plate photos');
      return;
    }

    setIsLoading(true);

    try {
      const data = new FormData();
      data.append('licensePlate', formData.licensePlate);
      data.append('type', formData.type);
      data.append('routeName', formData.routeName);

      data.append('vehiclePhoto', {
        uri: photos.vehiclePhoto.uri,
        type: 'image/jpeg',
        name: 'vehicle.jpg',
      });
      data.append('licensePlatePhoto', {
        uri: photos.licensePlatePhoto.uri,
        type: 'image/jpeg',
        name: 'plate.jpg',
      });

      await axios.post(`${API_URL}/vehicles/register`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert(
        'Success',
        'Vehicle registered successfully. Awaiting admin verification.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Photo upload component
  const PhotoUpload = ({ label, type, photo }) => (
    <View style={styles.photoContainer}>
      <Text style={styles.label}>{label}</Text>
      {photo ? (
        <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
      ) : (
        <View style={styles.photoPlaceholder}>
          <Text style={styles.photoPlaceholderText}>No image</Text>
        </View>
      )}
      <View style={styles.photoButtons}>
        <TouchableOpacity style={styles.photoButton} onPress={() => takePhoto(type)}>
          <Text style={styles.photoButtonText}>📷 Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.photoButton} onPress={() => pickImage(type)}>
          <Text style={styles.photoButtonText}>🖼️ Gallery</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Register Vehicle</Text>
          <Text style={styles.subtitle}>
            Add your vehicle details for tracking
          </Text>

          {/* License Plate */}
          <Text style={styles.label}>License Plate</Text>
          <TextInput
            style={styles.input}
            placeholder="ABC-1234"
            value={formData.licensePlate}
            onChangeText={(text) => setFormData({ ...formData, licensePlate: text.toUpperCase() })}
            autoCapitalize="characters"
          />

          {/* Vehicle Type */}
          <View style={styles.typeContainer}>
            <Text style={styles.label}>Vehicle Type</Text>
            <View style={styles.typeOptions}>
              {VEHICLE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeOption,
                    formData.type === type.id && styles.typeOptionSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, type: type.id })}
                >
                  <Text style={styles.typeOptionText}>{type.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Route Name (Optional) */}
          <Text style={styles.label}>Route Name (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Route A - Downtown"
            value={formData.routeName}
            onChangeText={(text) => setFormData({ ...formData, routeName: text })}
          />

          {/* Photos */}
          <PhotoUpload
            label="Vehicle Photo"
            type="vehiclePhoto"
            photo={photos.vehiclePhoto}
          />

          <PhotoUpload
            label="License Plate Photo"
            type="licensePlatePhoto"
            photo={photos.licensePlatePhoto}
          />

          {/* Submit */}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Register Vehicle</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
