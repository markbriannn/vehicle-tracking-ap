/**
 * =============================================================================
 * AUTHENTICATION HOOK & STORE
 * =============================================================================
 * 
 * MENTOR NOTE: We use Zustand for state management - it's simpler than Redux
 * and perfect for this use case. The auth state persists to localStorage
 * so users stay logged in across page refreshes.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { User } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string): Promise<boolean> => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await axios.post(`${API_URL}/auth/login`, {
            email,
            password,
          });

          const { token, user } = response.data;

          // Only allow admin users
          if (user.role !== 'admin') {
            set({ 
              isLoading: false, 
              error: 'Access denied. Admin only.' 
            });
            return false;
          }

          // Set axios default header for future requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          set({
            token,
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return true;
        } catch (error: any) {
          const message = error.response?.data?.error || 'Login failed';
          set({ isLoading: false, error: message });
          return false;
        }
      },

      logout: () => {
        delete axios.defaults.headers.common['Authorization'];
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Set up axios interceptor to handle token expiration
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuth.getState().logout();
    }
    return Promise.reject(error);
  }
);

// Initialize axios header from stored token
const storedToken = useAuth.getState().token;
if (storedToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
}
