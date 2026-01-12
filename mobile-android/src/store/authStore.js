/**
 * =============================================================================
 * AUTHENTICATION STORE
 * =============================================================================
 * 
 * MENTOR NOTE: Zustand store for managing authentication state.
 * Handles login, logout, and token persistence.
 */

import { create } from 'zustand';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

export const useAuthStore = create((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Initialize auth state from storage
  initialize: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        set({ token, user, isAuthenticated: true });
      }
    } catch (error) {
      console.error('Auth init error:', error);
    }
  },

  // Login
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    
    try {
      console.log('Attempting login to:', API_URL);
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      const { token, user } = response.data;

      // Save to storage
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      // Set axios header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (error) {
      console.log('Login error:', error.message);
      console.log('API URL:', API_URL);
      const message = error.response?.data?.error || error.message || 'Login failed - check network connection';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  // Register driver
  registerDriver: async (formData) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await axios.post(
        `${API_URL}/auth/register/driver`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      const { token, user } = response.data;

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      return true;
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  // Register student
  registerStudent: async (data) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        ...data,
        role: 'student',
      });

      const { token, user } = response.data;

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      return true;
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  // Logout
  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  // Refresh user data from server
  refreshUser: async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const user = response.data.user;
      await AsyncStorage.setItem('user', JSON.stringify(user));
      set({ user });
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  },

  clearError: () => set({ error: null }),
}));
