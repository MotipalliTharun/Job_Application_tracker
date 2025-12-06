import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ApplicationStatus } from '../types';

interface AppState {
  statusFilter: ApplicationStatus | 'ALL';
  search: string;
  isBulkModalOpen: boolean;
  error: string | null;
}

interface AppContextType extends AppState {
  setStatusFilter: (filter: ApplicationStatus | 'ALL') => void;
  setSearch: (search: string) => void;
  setIsBulkModalOpen: (open: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  STATUS_FILTER: 'linkTracker_statusFilter',
  SEARCH: 'linkTracker_search',
  PREFERENCES: 'linkTracker_preferences',
};

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  // Load initial state from localStorage
  const loadInitialState = (): AppState => {
    try {
      const savedFilter = localStorage.getItem(STORAGE_KEYS.STATUS_FILTER);
      const savedSearch = sessionStorage.getItem(STORAGE_KEYS.SEARCH);
      
      return {
        statusFilter: (savedFilter as ApplicationStatus | 'ALL') || 'ALL',
        search: savedSearch || '',
        isBulkModalOpen: false,
        error: null,
      };
    } catch (error) {
      console.error('[CONTEXT] Error loading initial state:', error);
      return {
        statusFilter: 'ALL',
        search: '',
        isBulkModalOpen: false,
        error: null,
      };
    }
  };

  const [state, setState] = useState<AppState>(loadInitialState);

  // Persist status filter to localStorage
  const setStatusFilter = useCallback((filter: ApplicationStatus | 'ALL') => {
    setState(prev => ({ ...prev, statusFilter: filter }));
    try {
      localStorage.setItem(STORAGE_KEYS.STATUS_FILTER, filter);
      console.log('[CONTEXT] Saved status filter to localStorage:', filter);
    } catch (error) {
      console.error('[CONTEXT] Error saving status filter:', error);
    }
  }, []);

  // Persist search to sessionStorage (temporary, cleared on tab close)
  const setSearch = useCallback((search: string) => {
    setState(prev => ({ ...prev, search }));
    try {
      if (search) {
        sessionStorage.setItem(STORAGE_KEYS.SEARCH, search);
      } else {
        sessionStorage.removeItem(STORAGE_KEYS.SEARCH);
      }
      console.log('[CONTEXT] Saved search to sessionStorage:', search);
    } catch (error) {
      console.error('[CONTEXT] Error saving search:', error);
    }
  }, []);

  const setIsBulkModalOpen = useCallback((open: boolean) => {
    setState(prev => ({ ...prev, isBulkModalOpen: open }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
    if (error) {
      console.error('[CONTEXT] Error set:', error);
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (state.error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.error, clearError]);

  const value: AppContextType = {
    ...state,
    setStatusFilter,
    setSearch,
    setIsBulkModalOpen,
    setError,
    clearError,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
}

