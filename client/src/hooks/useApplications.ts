/**
 * Custom Hook for Managing Applications
 * Uses localStorage for caching and state persistence
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Application, ApplicationStatus } from '../types';
import { api } from '../utils/api';
import { useLocalStorage } from './useLocalStorage';

interface UseApplicationsOptions {
  statusFilter?: ApplicationStatus | 'ALL';
  search?: string;
}

const CACHE_KEY = 'linkTracker_applications_cache';
const CACHE_TIMESTAMP_KEY = 'linkTracker_applications_cache_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CachedData {
  applications: Application[];
  timestamp: number;
  filters: {
    statusFilter?: ApplicationStatus | 'ALL';
    search?: string;
  };
}

export function useApplications(options: UseApplicationsOptions = {}) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cachedData, setCachedData] = useLocalStorage<CachedData | null>(CACHE_KEY, null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchApplications = useCallback(async (useCache: boolean = true) => {
    try {
      // Cancel previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setLoading(true);
      setError(null);

      // Check cache first
      if (useCache && cachedData) {
        const cacheAge = Date.now() - cachedData.timestamp;
        const filtersMatch = 
          cachedData.filters.statusFilter === options.statusFilter &&
          cachedData.filters.search === options.search;

        if (cacheAge < CACHE_DURATION && filtersMatch && cachedData.applications.length > 0) {
          console.log('[HOOK] Using cached applications:', cachedData.applications.length);
          setApplications(cachedData.applications);
          setLoading(false);
          // Fetch in background to update cache
          fetchApplications(false);
          return;
        }
      }
      
      const params = new URLSearchParams();
      if (options.statusFilter && options.statusFilter !== 'ALL') {
        params.append('status', options.statusFilter);
      }
      if (options.search) {
        params.append('search', options.search);
      }

      const queryString = params.toString();
      const endpoint = queryString ? `?${queryString}` : '';
      
      console.log('[HOOK] Fetching applications from API:', { endpoint, statusFilter: options.statusFilter, search: options.search });
      const data = await api.get<Application[]>(endpoint);
      console.log('[HOOK] Received applications:', data.length, 'with URLs:', data.filter(a => a.url).length);
      
      setApplications(data);

      // Update cache
      const newCache: CachedData = {
        applications: data,
        timestamp: Date.now(),
        filters: {
          statusFilter: options.statusFilter,
          search: options.search,
        },
      };
      setCachedData(newCache);
      console.log('[HOOK] Cached applications');
    } catch (err) {
      // If fetch failed but we have cache, use it
      if (cachedData && cachedData.applications.length > 0) {
        console.warn('[HOOK] Fetch failed, using cached data:', err);
        setApplications(cachedData.applications);
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch applications';
        setError(errorMessage);
        console.error('[HOOK ERROR] Error fetching applications:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [options.statusFilter, options.search, cachedData, setCachedData]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const invalidateCache = useCallback(() => {
    setCachedData(null);
    console.log('[HOOK] Cache invalidated');
  }, [setCachedData]);

  const addLink = useCallback(async (url: string, title?: string) => {
    try {
      console.log('[HOOK] Adding link:', { url, title });
      invalidateCache();
      const response = await api.post('/links', {
        linksWithTitles: [{ url, linkTitle: title }],
      });
      console.log('[HOOK] Link added successfully:', response);
      // Force refresh with a small delay to ensure data is saved
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchApplications(false); // Force fresh fetch
      console.log('[HOOK] Applications refreshed after adding link');
    } catch (err) {
      console.error('[HOOK ERROR] Failed to add link:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to add link');
    }
  }, [fetchApplications, invalidateCache]);

  const addLinks = useCallback(async (links: Array<{ url: string; linkTitle?: string }>) => {
    try {
      console.log('[HOOK] Adding links:', links.length);
      invalidateCache();
      const response = await api.post('/links', { linksWithTitles: links });
      console.log('[HOOK] Links added successfully:', response);
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchApplications(false);
      console.log('[HOOK] Applications refreshed after adding links');
    } catch (err) {
      console.error('[HOOK ERROR] Failed to add links:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to add links');
    }
  }, [fetchApplications, invalidateCache]);

  const updateApplication = useCallback(async (id: string, updates: Partial<Application>) => {
    try {
      console.log('[HOOK] Updating application:', { id, updates: Object.keys(updates) });
      invalidateCache();
      await api.patch(`/${id}`, updates);
      console.log('[HOOK] Update successful, refreshing applications...');
      await new Promise(resolve => setTimeout(resolve, 300));
      await fetchApplications(false);
      console.log('[HOOK] Applications refreshed after update');
    } catch (err) {
      console.error('[HOOK ERROR] Failed to update application:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to update application');
    }
  }, [fetchApplications, invalidateCache]);

  const archiveApplication = useCallback(async (id: string) => {
    try {
      console.log('[HOOK] Archiving application:', id);
      invalidateCache();
      await api.delete(`/${id}`);
      console.log('[HOOK] Archive successful, refreshing applications...');
      await new Promise(resolve => setTimeout(resolve, 300));
      await fetchApplications(false);
      console.log('[HOOK] Applications refreshed after archive');
    } catch (err) {
      console.error('[HOOK ERROR] Failed to archive application:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to archive application');
    }
  }, [fetchApplications, invalidateCache]);

  const deleteApplication = useCallback(async (id: string) => {
    try {
      console.log('[HOOK] Deleting application:', id);
      invalidateCache();
      await api.delete(`/${id}/hard`);
      console.log('[HOOK] Delete successful, refreshing applications...');
      await new Promise(resolve => setTimeout(resolve, 300));
      await fetchApplications(false);
      console.log('[HOOK] Applications refreshed after delete');
    } catch (err) {
      console.error('[HOOK ERROR] Failed to delete application:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to delete application');
    }
  }, [fetchApplications, invalidateCache]);

  const clearLink = useCallback(async (id: string) => {
    try {
      console.log('[HOOK] Clearing link for application:', id);
      invalidateCache();
      const response = await api.delete(`/${id}/clear-link`);
      console.log('[HOOK] Link cleared successfully:', response);
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchApplications(false);
      console.log('[HOOK] Applications refreshed after clearing link');
    } catch (err) {
      console.error('[HOOK ERROR] Failed to clear link:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to clear link');
    }
  }, [fetchApplications, invalidateCache]);

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

