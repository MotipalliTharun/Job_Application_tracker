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
      
      console.log('[HOOK] Fetching applications:', { endpoint, statusFilter: options.statusFilter, search: options.search });
      const data = await api.get<Application[]>(endpoint);
      console.log('[HOOK] Received applications:', data.length, 'with URLs:', data.filter(a => a.url).length);
      
      setApplications(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch applications';
      setError(errorMessage);
      console.error('[HOOK ERROR] Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  }, [options.statusFilter, options.search]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const addLink = useCallback(async (url: string, title?: string) => {
    try {
      console.log('[HOOK] Adding link:', { url, title });
      const response = await api.post('/links', {
        linksWithTitles: [{ url, linkTitle: title }],
      });
      console.log('[HOOK] Link added successfully:', response);
      // Force refresh with a small delay to ensure data is saved
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchApplications();
      console.log('[HOOK] Applications refreshed after adding link');
    } catch (err) {
      console.error('[HOOK ERROR] Failed to add link:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to add link');
    }
  }, [fetchApplications]);

  const addLinks = useCallback(async (links: Array<{ url: string; linkTitle?: string }>) => {
    try {
      console.log('[HOOK] Adding links:', links.length);
      const response = await api.post('/links', { linksWithTitles: links });
      console.log('[HOOK] Links added successfully:', response);
      // Force refresh with a small delay to ensure data is saved
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchApplications();
      console.log('[HOOK] Applications refreshed after adding links');
    } catch (err) {
      console.error('[HOOK ERROR] Failed to add links:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to add links');
    }
  }, [fetchApplications]);

  const updateApplication = useCallback(async (id: string, updates: Partial<Application>) => {
    try {
      console.log('[HOOK] Updating application:', { id, updates: Object.keys(updates) });
      await api.patch(`/${id}`, updates);
      console.log('[HOOK] Update successful, refreshing applications...');
      // Small delay to ensure Excel is saved
      await new Promise(resolve => setTimeout(resolve, 300));
      await fetchApplications();
      console.log('[HOOK] Applications refreshed after update');
    } catch (err) {
      console.error('[HOOK ERROR] Failed to update application:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to update application');
    }
  }, [fetchApplications]);

  const archiveApplication = useCallback(async (id: string) => {
    try {
      console.log('[HOOK] Archiving application:', id);
      await api.delete(`/${id}`);
      console.log('[HOOK] Archive successful, refreshing applications...');
      await new Promise(resolve => setTimeout(resolve, 300));
      await fetchApplications();
      console.log('[HOOK] Applications refreshed after archive');
    } catch (err) {
      console.error('[HOOK ERROR] Failed to archive application:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to archive application');
    }
  }, [fetchApplications]);

  const deleteApplication = useCallback(async (id: string) => {
    try {
      console.log('[HOOK] Deleting application:', id);
      await api.delete(`/${id}/hard`);
      console.log('[HOOK] Delete successful, refreshing applications...');
      await new Promise(resolve => setTimeout(resolve, 300));
      await fetchApplications();
      console.log('[HOOK] Applications refreshed after delete');
    } catch (err) {
      console.error('[HOOK ERROR] Failed to delete application:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to delete application');
    }
  }, [fetchApplications]);

  const clearLink = useCallback(async (id: string) => {
    try {
      console.log('[HOOK] Clearing link for application:', id);
      const response = await api.delete(`/${id}/clear-link`);
      console.log('[HOOK] Link cleared successfully:', response);
      // Force refresh with a small delay to ensure data is saved
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchApplications();
      console.log('[HOOK] Applications refreshed after clearing link');
    } catch (err) {
      console.error('[HOOK ERROR] Failed to clear link:', err);
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

