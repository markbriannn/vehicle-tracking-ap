/**
 * =============================================================================
 * COLOR PALETTE
 * =============================================================================
 * 
 * MENTOR NOTE: Centralized color definitions for consistent theming.
 * Update these values to change the app's color scheme globally.
 */

export const colors = {
  // Primary colors
  primary: '#007AFF',
  primaryDark: '#0056b3',
  primaryLight: '#e3f2fd',

  // Status colors
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  info: '#5AC8FA',

  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#f9fafb',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#333333',
  },

  // Background colors
  background: '#f5f5f5',
  surface: '#FFFFFF',
  
  // Text colors
  textPrimary: '#333333',
  textSecondary: '#666666',
  textHint: '#999999',
  textDisabled: '#bdbdbd',

  // Vehicle type colors
  vehicleTypes: {
    bus: '#FF6B6B',
    van: '#4ECDC4',
    multicab: '#FFE66D',
    car: '#95E1D3',
    motorcycle: '#DDA0DD',
  },

  // Status badge colors
  statusApproved: '#d4edda',
  statusPending: '#fff3cd',
  statusRejected: '#f8d7da',
  statusOnline: '#d4edda',
  statusOffline: '#f8d7da',
};

export default colors;
