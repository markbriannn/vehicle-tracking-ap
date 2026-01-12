/**
 * =============================================================================
 * API HOOKS
 * =============================================================================
 * 
 * MENTOR NOTE: Custom hooks for API calls. These wrap axios and handle
 * loading states, errors, and data fetching patterns.
 */

import { useState, useCallback } from 'react';
import axios from 'axios';
import { DashboardStats, User, Vehicle, SOSAlert } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Generic fetch hook
export function useFetch<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}${url}`);
      setData(response.data);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Request failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetch, setData };
}

// Dashboard stats hook
export function useDashboard() {
  const { data, loading, error, fetch } = useFetch<{ stats: DashboardStats }>();

  const fetchStats = useCallback(() => {
    return fetch('/admin/dashboard');
  }, [fetch]);

  return { stats: data?.stats, loading, error, fetchStats };
}

// Pending verifications hook
export function usePendingVerifications() {
  const [data, setData] = useState<{
    pendingDrivers: User[];
    pendingVehicles: Vehicle[];
    pendingCompanies: User[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/admin/pending`);
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyDriver = useCallback(async (id: string, status: 'approved' | 'rejected') => {
    await axios.put(`${API_URL}/admin/verify/driver/${id}`, { status });
    fetchPending();
  }, [fetchPending]);

  const verifyVehicle = useCallback(async (id: string, status: 'approved' | 'rejected') => {
    await axios.put(`${API_URL}/admin/verify/vehicle/${id}`, { status });
    fetchPending();
  }, [fetchPending]);

  const verifyCompany = useCallback(async (id: string, status: 'approved' | 'rejected') => {
    await axios.put(`${API_URL}/admin/verify/company/${id}`, { status });
    fetchPending();
  }, [fetchPending]);

  return {
    data,
    loading,
    error,
    fetchPending,
    verifyDriver,
    verifyVehicle,
    verifyCompany,
  };
}

// Alerts hook
export function useAlerts() {
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = useCallback(async (status = 'active') => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/admin/alerts?status=${status}`);
      setAlerts(response.data.alerts);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const resolveAlert = useCallback(async (id: string) => {
    await axios.put(`${API_URL}/admin/alerts/${id}/resolve`);
    setAlerts((prev) => prev.filter((a) => a._id !== id));
  }, []);

  return { alerts, loading, fetchAlerts, resolveAlert };
}

// Vehicles hook
export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchVehicles = useCallback(async (params?: {
    type?: string;
    status?: string;
    page?: number;
  }) => {
    setLoading(true);
    try {
      const query = new URLSearchParams(params as any).toString();
      const response = await axios.get(`${API_URL}/admin/vehicles?${query}`);
      setVehicles(response.data.vehicles);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { vehicles, loading, pagination, fetchVehicles };
}
