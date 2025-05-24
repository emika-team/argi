import axios, { AxiosResponse } from 'axios';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Monitor,
  CreateMonitorRequest,
  UpdateMonitorRequest,
  MonitorStats,
  DashboardData,
  SslCheck,
  DomainCheck,
  User,
} from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (data: LoginRequest): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/auth/login', data),

  register: (data: RegisterRequest): Promise<AxiosResponse<User>> =>
    api.post('/auth/register', data),

  getProfile: (): Promise<AxiosResponse<User>> =>
    api.get('/auth/profile'),
};

// Monitors API
export const monitorsApi = {
  getAll: (): Promise<AxiosResponse<Monitor[]>> =>
    api.get('/monitors'),

  getById: (id: string): Promise<AxiosResponse<Monitor>> =>
    api.get(`/monitors/${id}`),

  create: (data: CreateMonitorRequest): Promise<AxiosResponse<Monitor>> =>
    api.post('/monitors', data),

  update: (id: string, data: UpdateMonitorRequest): Promise<AxiosResponse<Monitor>> =>
    api.patch(`/monitors/${id}`, data),

  delete: (id: string): Promise<AxiosResponse<void>> =>
    api.delete(`/monitors/${id}`),

  getStats: (id: string): Promise<AxiosResponse<MonitorStats>> =>
    api.get(`/monitors/${id}/stats`),
};

// Dashboard API
export const dashboardApi = {
  getData: (): Promise<AxiosResponse<DashboardData>> =>
    api.get('/dashboard'),
};

// SSL API
export const sslApi = {
  check: (hostname: string): Promise<AxiosResponse<SslCheck>> =>
    api.get(`/ssl/check/${hostname}`),

  checkMultiple: (hostnames: string[]): Promise<AxiosResponse<SslCheck[]>> =>
    api.get(`/ssl/check-multiple?hostnames=${hostnames.join(',')}`),
};

// Domain API
export const domainApi = {
  check: (domain: string): Promise<AxiosResponse<DomainCheck>> =>
    api.get(`/domain/check/${domain}`),

  checkMultiple: (domains: string[]): Promise<AxiosResponse<DomainCheck[]>> =>
    api.get(`/domain/check-multiple?domains=${domains.join(',')}`),

  // Enhanced domain management endpoints
  getUserDomains: (userId: string): Promise<AxiosResponse<any[]>> =>
    api.get(`/domain/user/${userId}/domains`),

  getUserDomainsWithStatus: (userId: string): Promise<AxiosResponse<DomainCheck[]>> => {
    // First get the domains, then check their status
    return api.get(`/domain/user/${userId}/domains`).then(async (response) => {
      const domains = response.data;
      if (domains.length === 0) {
        return { ...response, data: [] };
      }
      
      // Convert to simple domain list for existing API
      const domainNames = domains.map((d: any) => d.domain);
      const statusResponse = await api.get(`/domain/check-multiple?domains=${domainNames.join(',')}`);
      return statusResponse;
    });
  },

  addDomain: (domain: string, userId: string): Promise<AxiosResponse<{ success: boolean; message: string; domain?: string }>> =>
    api.post(`/domain/user/${userId}/domains`, { 
      domain,
      enableExpiryAlerts: true,
      alertDaysBefore: 30
    }).then(response => ({
      ...response,
      data: {
        success: true,
        message: 'Domain added successfully',
        domain: response.data.domain
      }
    })).catch(error => {
      throw {
        ...error,
        response: {
          ...error.response,
          data: {
            success: false,
            message: error.response?.data?.message || 'Failed to add domain'
          }
        }
      };
    }),

  removeDomain: (domain: string, userId: string): Promise<AxiosResponse<{ success: boolean; message: string }>> =>
    api.delete(`/domain/user/${userId}/domains/${encodeURIComponent(domain)}`),

  updateDomain: (domain: string, userId: string, updateData: any): Promise<AxiosResponse<any>> =>
    api.put(`/domain/user/${userId}/domains/${encodeURIComponent(domain)}`, updateData),

  checkAndUpdateDomain: (domain: string, userId: string): Promise<AxiosResponse<DomainCheck>> =>
    api.get(`/domain/user/${userId}/domains/${encodeURIComponent(domain)}/check`),

  getExpiringDomains: (days: number = 30): Promise<AxiosResponse<any[]>> =>
    api.get(`/domain/expiring?days=${days}`),

  // Legacy endpoints for backward compatibility (deprecated)
  getUserDomainsLegacy: (userId: string = 'default'): Promise<AxiosResponse<string[]>> =>
    api.get(`/domain/list/${userId}`),

  addDomainLegacy: (domain: string, userId: string = 'default'): Promise<AxiosResponse<{ success: boolean; message: string; domain?: string }>> =>
    api.post('/domain/add', { domain, userId }),

  removeDomainLegacy: (domain: string, userId: string = 'default'): Promise<AxiosResponse<{ success: boolean; message: string }>> =>
    api.delete(`/domain/${userId}/${encodeURIComponent(domain)}`),
};

// Integrations API
export const integrationsApi = {
  validateCloudflareCredentials: (credentials: { email: string; apiKey: string }): Promise<AxiosResponse<{ valid: boolean; userInfo?: any }>> =>
    api.post('/integrations/cloudflare/validate', credentials),

  getCloudflareZones: (credentials: { email: string; apiKey: string }): Promise<AxiosResponse<{ success: boolean; data: any[]; count: number }>> =>
    api.post('/integrations/cloudflare/zones', credentials),

  importFromCloudflare: (importData: { email: string; apiKey: string; userId: string }): Promise<AxiosResponse<{ success: boolean; data: any }>> =>
    api.post('/integrations/cloudflare/import', importData),

  getProviderSummary: (userId: string): Promise<AxiosResponse<{ success: boolean; data: any }>> =>
    api.get(`/integrations/summary/${userId}`),

  testCloudflareConnection: (): Promise<AxiosResponse<{ success: boolean; message: string; provider: string; version: string }>> =>
    api.get('/integrations/cloudflare/test'),
};

export default api; 