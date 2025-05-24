import { useState, useEffect, useCallback } from 'react';
import { DomainCheck } from '../types';
import { domainApi } from '../services/api';

interface UseDomainMonitoringProps {
  domains?: string[];
  autoRefresh?: boolean;
  refreshInterval?: number;
  userId?: string;
  autoRefreshStatus?: boolean;
}

interface UseDomainMonitoringReturn {
  domains: DomainCheck[];
  loading: boolean;
  error: string | null;
  fetchDomains: () => Promise<void>;
  fetchDomainsWithStatus: () => Promise<void>;
  addDomain: (domain: string) => Promise<void>;
  removeDomain: (domain: string) => Promise<void>;
  stats: {
    total: number;
    valid: number;
    expiring: number;
    expired: number;
    errors: number;
  };
}

export const useDomainMonitoring = ({
  domains: initialDomains = [],
  autoRefresh = true,
  refreshInterval = 300000, // 5 minutes
  userId,
  autoRefreshStatus = false,
}: UseDomainMonitoringProps = {}): UseDomainMonitoringReturn => {
  const [domains, setDomains] = useState<DomainCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current user ID from localStorage or use a default
  const getCurrentUserId = useCallback(() => {
    if (userId) return userId;
    
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        return userData._id || userData.id;
      } catch (e) {
        console.warn('Failed to parse user data from localStorage');
      }
    }
    
    // For development/testing, throw an error if no user is authenticated
    throw new Error('User not authenticated. Please log in first.');
  }, [userId]);

  const fetchDomains = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('fetchDomains');
      const currentUserId = getCurrentUserId();
      const response = await domainApi.getUserDomains(currentUserId);
      
      // Convert domain documents to simple DomainCheck format
      const simpleDomains: DomainCheck[] = response.data.map((domainDoc: any) => ({
        domain: domainDoc.domain,
        error: domainDoc.lastError || undefined,
        isExpired: domainDoc.isExpired || false,
        isExpiringSoon: domainDoc.isExpiringSoon || false,
        expiryDate: domainDoc.lastExpiryDate,
        daysUntilExpiry: domainDoc.lastDaysUntilExpiry,
      }));
      
      setDomains(simpleDomains);
    } catch (err: any) {
      if (err.message?.includes('User not authenticated')) {
        setError('Please log in to view your domains');
        setDomains([]);
        return;
      }
      
      setError('Failed to fetch domain list');
      console.error('Error fetching domains:', err);
    
    } finally {
      setLoading(false);
    }
  }, [getCurrentUserId]);

  const fetchDomainsWithStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const currentUserId = getCurrentUserId();
      const response = await domainApi.getUserDomainsWithStatus(currentUserId);
      setDomains(response.data);
    } catch (err: any) {
      if (err.message?.includes('User not authenticated')) {
        setError('Please log in to view your domains');
        setDomains([]);
        return;
      }
      
      setError('Failed to fetch domain information');
      console.error('Error fetching domains with status:', err);
      // Fallback to basic domain list
      await fetchDomains();
    } finally {
      setLoading(false);
    }
  }, [getCurrentUserId, fetchDomains]);

  const addDomain = useCallback(async (domain: string) => {
    const domainToAdd = domain.trim().toLowerCase();
    
    if (!domainToAdd) {
      throw new Error('Domain cannot be empty');
    }

    if (domains.some(d => d.domain === domainToAdd)) {
      throw new Error('Domain already being monitored');
    }

    try {
      setLoading(true);
      const currentUserId = getCurrentUserId();
      const response = await domainApi.addDomain(domainToAdd, currentUserId);
      
      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      await fetchDomains();
      setError(null);
    } catch (err: any) {
      if (err.message?.includes('User not authenticated')) {
        const errorMessage = 'Please log in to add domains';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to add domain';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [domains, getCurrentUserId, fetchDomains]);

  const removeDomain = useCallback(async (domain: string) => {
    try {
      setLoading(true);
      const currentUserId = getCurrentUserId();
      const response = await domainApi.removeDomain(domain, currentUserId);
      
      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      await fetchDomains();
      setError(null);
    } catch (err: any) {
      if (err.message?.includes('User not authenticated')) {
        setError('Please log in to remove domains');
        return;
      }
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to remove domain';
      setError(errorMessage);
      console.error('Error removing domain:', err);
    } finally {
      setLoading(false);
    }
  }, [getCurrentUserId, fetchDomains]);

  const stats = {
    total: domains.length,
    valid: domains.filter(d => !d.error && !d.isExpired && !d.isExpiringSoon).length,
    expiring: domains.filter(d => d.isExpiringSoon && !d.isExpired).length,
    expired: domains.filter(d => d.isExpired).length,
    errors: domains.filter(d => d.error).length,
  };

  // Initial load - always fetch domain list first
  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  // Background status check after getting domain list
  useEffect(() => {
    if (domains.length > 0 && domains.every(d => d.error === undefined)) {
      // Only run background status check if we have domains and they're not already checked
      const timer = setTimeout(() => {
        fetchDomainsWithStatus();
      }, 1000); // Delay 1 second to let UI load first

      return () => clearTimeout(timer);
    }
  }, [domains.length, fetchDomainsWithStatus]);

  // Optional auto-refresh for domain list (fast)
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchDomains(); // Just refresh the list
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchDomains]);

  // Periodic background status check (slow, less frequent)
  useEffect(() => {
    if (domains.length > 0) {
      const interval = setInterval(() => {
        fetchDomainsWithStatus(); // Background status update
      }, refreshInterval * 5); // 5x less frequent (25 minutes default)

      return () => clearInterval(interval);
    }
  }, [domains.length, refreshInterval, fetchDomainsWithStatus]);

  return {
    domains,
    loading,
    error,
    fetchDomains,
    fetchDomainsWithStatus,
    addDomain,
    removeDomain,
    stats,
  };
}; 