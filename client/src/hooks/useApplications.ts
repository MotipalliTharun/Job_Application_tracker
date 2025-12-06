/**
 * Custom Hook for Managing Applications
 */

import { useState, useEffect, useCallback } from 'react';
import { Application, ApplicationStatus } from '../types';
import { api } from '../utils/api';

interface UseApplicationsOptions {
  statusFilter?: ApplicationStatus | 'ALL';
  search?: string;
}

export function useApplications(options: UseApplicationsOptions = {}) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (options.statusFilter && options.statusFilter !== 'ALL') {
        params.append('status', options.statusFilter);
      }
      if (options.search) {
        params.append('search', options.search);
      }

      const queryString = params.toString();
      const endpoint = queryString ? `?${queryString}` : '';
      const data = await api.get<Application[]>(endpoint);
      
      setApplications(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch applications';
      setError(errorMessage);
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  }, [options.statusFilter, options.search]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const addLink = useCallback(async (url: string, title?: string) => {
    try {
      await api.post('/links', {
        linksWithTitles: [{ url, linkTitle: title }],
      });
      await fetchApplications();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add link');
    }
  }, [fetchApplications]);

  const addLinks = useCallback(async (links: Array<{ url: string; linkTitle?: string }>) => {
    try {
      await api.post('/links', { linksWithTitles: links });
      await fetchApplications();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add links');
    }
  }, [fetchApplications]);

  const updateApplication = useCallback(async (id: string, updates: Partial<Application>) => {
    try {
      await api.patch(`/${id}`, updates);
      await fetchApplications();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update application');
    }
  }, [fetchApplications]);

  const archiveApplication = useCallback(async (id: string) => {
    try {
      await api.delete(`/${id}`);
      await fetchApplications();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to archive application');
    }
  }, [fetchApplications]);

  const deleteApplication = useCallback(async (id: string) => {
    try {
      await api.delete(`/${id}/hard`);
      await fetchApplications();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete application');
    }
  }, [fetchApplications]);

  const clearLink = useCallback(async (id: string) => {
    try {
      await api.delete(`/${id}/clear-link`);
      await fetchApplications();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to clear link');
    }
  }, [fetchApplications]);

  return {
    applications,
    loading,
    error,
    refetch: fetchApplications,
    addLink,
    addLinks,
    updateApplication,
    archiveApplication,
    deleteApplication,
    clearLink,
  };
}

