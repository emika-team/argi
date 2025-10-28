import { useState } from 'react';
import { integrationsApi } from '../services/api';

export interface CloudflareZone {
  domain: string;
  providerId: string;
  status: string;
  isPaused: boolean;
  nameServers: string[];
  originalNameServers: string[];
  originalRegistrar: string;
  createdAt: Date;
  modifiedAt: Date;
  activatedAt: Date | null;
}

export interface ImportResult {
  success: boolean;
  totalDomains: number;
  importedDomains: number;
  skippedDomains: number;
  errors: string[];
  importedDomainsList: string[];
  skippedDomainsList: Array<{ domain: string; reason: string }>;
}

export interface CloudflareCredentials {
  email?: string;
  apiKey: string;
}

export interface ImportRequest extends CloudflareCredentials {
  userId: string;
}

interface ValidationResult {
  valid: boolean;
  userInfo?: any;
}

export const useCloudflareImport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zones, setZones] = useState<CloudflareZone[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const validateCredentials = async (credentials: CloudflareCredentials): Promise<ValidationResult> => {
    setLoading(true);
    setError(null);

    try {
      const response = await integrationsApi.validateCloudflareCredentials(credentials);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to validate credentials';
      setError(errorMessage);
      return { valid: false };
    } finally {
      setLoading(false);
    }
  };

  const fetchZones = async (credentials: CloudflareCredentials): Promise<CloudflareZone[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await integrationsApi.getCloudflareZones(credentials);
      const zonesData = response.data.data || [];
      setZones(zonesData);
      return zonesData;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch domains';
      setError(errorMessage);
      setZones([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const importDomains = async (importRequest: ImportRequest): Promise<ImportResult | null> => {
    setLoading(true);
    setError(null);

    // Validate that userId is explicitly provided
    if (!importRequest.userId || importRequest.userId.trim() === '') {
      const errorMessage = 'User ID is required and cannot be empty';
      setError(errorMessage);
      setLoading(false);
      return null;
    }

    try {
      const response = await integrationsApi.importFromCloudflare(importRequest);
      const result = response.data.data;
      setImportResult(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to import domains';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setError(null);
    setZones([]);
    setImportResult(null);
    setLoading(false);
  };

  return {
    loading,
    error,
    zones,
    importResult,
    validateCredentials,
    fetchZones,
    importDomains,
    reset,
  };
}; 