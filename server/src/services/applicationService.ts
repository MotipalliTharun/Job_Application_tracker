/**
 * Application Service
 * Business logic for managing job applications
 */

import { v4 as uuidv4 } from 'uuid';
import { Application, ApplicationStats, ApplicationFilters } from '../models/Application.js';
import { loadApplications, saveApplications } from './excelService.js';
import { ApplicationNotFoundError, InvalidApplicationDataError } from '../utils/errors.js';
import { DEFAULT_STATUS, DEFAULT_PRIORITY } from '../config/constants.js';

/**
 * Get all applications with optional filtering
 */
export async function getAllApplications(filters?: ApplicationFilters): Promise<Application[]> {
  try {
    let applications = await loadApplications();
    
    // If no applications exist, create a dummy one
    if (applications.length === 0) {
      try {
        const dummyApp = createDummyApplication();
        await saveApplications([dummyApp]);
        return [dummyApp];
      } catch (saveError) {
        console.error('Failed to save dummy application:', saveError);
        // Return the dummy app anyway, even if save failed
        return [createDummyApplication()];
      }
    }
    
    // Apply filters
    if (filters) {
      if (filters.status) {
        applications = applications.filter(app => app.status === filters.status);
      }
      if (filters.priority) {
        applications = applications.filter(app => app.priority === filters.priority);
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        applications = applications.filter(app =>
          app.company?.toLowerCase().includes(searchLower) ||
          app.roleTitle?.toLowerCase().includes(searchLower) ||
          app.notes?.toLowerCase().includes(searchLower) ||
          (app.url && app.url.toLowerCase().includes(searchLower)) ||
          (app.linkTitle && app.linkTitle.toLowerCase().includes(searchLower))
        );
      }
      if (filters.dateRange) {
        if (filters.dateRange.start) {
          applications = applications.filter(app => app.createdAt >= filters.dateRange!.start!);
        }
        if (filters.dateRange.end) {
          applications = applications.filter(app => app.createdAt <= filters.dateRange!.end!);
        }
      }
    }
    
    return applications;
  } catch (error) {
    console.error('Error in getAllApplications:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      isVercel: !!process.env.VERCEL,
      hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    });
    
    // Try to recover by creating a dummy application
    try {
      const dummyApp = createDummyApplication();
      // Try to save, but don't fail if it doesn't work
      try {
        await saveApplications([dummyApp]);
      } catch (saveError) {
        console.warn('Could not save dummy application, returning in-memory version:', saveError);
      }
      return [dummyApp];
    } catch (recoveryError) {
      console.error('Recovery failed:', recoveryError);
      // Return empty array as last resort
      return [];
    }
  }
}

/**
 * Create applications from links
 */
export async function createApplicationsFromLinks(links: string[]): Promise<Application[]> {
  if (!Array.isArray(links) || links.length === 0) {
    throw new InvalidApplicationDataError('Links must be a non-empty array');
  }

  const existingApps = await loadApplications();
  const now = new Date().toISOString();
  const newApps: Application[] = [];

  for (const link of links) {
    if (typeof link !== 'string' || !link.trim()) {
      console.log('[CREATE LINKS] Skipping empty or invalid link:', link);
      continue;
    }

    // Parse "Title|URL" format
    const parts = link.split('|').map(s => s.trim());
    let url = link;
    let linkTitle: string | undefined;

    if (parts.length === 2 && parts[1].startsWith('http')) {
      linkTitle = parts[0] || undefined;
      url = parts[1];
    } else if (link.includes('http')) {
      // Extract URL from text
      const urlMatch = link.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        url = urlMatch[0];
        linkTitle = link.substring(0, link.indexOf(url)).trim() || undefined;
      }
    }

    // Normalize URL - add https:// if missing
    if (!url || !url.trim()) {
      console.log('[CREATE LINKS] Skipping link with empty URL:', link);
      continue;
    }
    
    // Add protocol if missing
    const originalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
      console.log('[CREATE LINKS] Normalized URL:', originalUrl, '->', url);
    }

    // Skip if URL already exists
    if (existingApps.some(app => app.url === url)) {
      console.log('[CREATE LINKS] Skipping duplicate URL:', url);
      continue;
    }
    
    console.log('[CREATE LINKS] Creating application for URL:', url, 'Title:', linkTitle);

    newApps.push({
      id: uuidv4(),
      url,
      linkTitle,
      status: DEFAULT_STATUS,
      priority: DEFAULT_PRIORITY,
      createdAt: now,
      updatedAt: now,
    });
  }

  if (newApps.length > 0) {
    console.log('[CREATE LINKS] Saving', newApps.length, 'new application(s) to Excel...');
    await saveApplications([...existingApps, ...newApps]);
    console.log('[CREATE LINKS] ✅ Successfully saved', newApps.length, 'application(s) to Excel');
  } else {
    console.log('[CREATE LINKS] No new applications to save (all were duplicates or invalid)');
  }

  return newApps;
}

/**
 * Get application by ID
 */
export async function getApplicationById(id: string): Promise<Application> {
  const applications = await loadApplications();
  const application = applications.find(app => app.id === id);
  
  if (!application) {
    throw new ApplicationNotFoundError(id);
  }
  
  return application;
}

/**
 * Update application
 */
export async function updateApplication(id: string, updates: Partial<Application>): Promise<Application> {
  const applications = await loadApplications();
  const index = applications.findIndex(app => app.id === id);

  if (index === -1) {
    throw new ApplicationNotFoundError(id);
  }

  const app = applications[index];
  const updatedApp: Application = {
    ...app,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  // Auto-set dates based on status changes
  if (updates.status) {
    const now = new Date().toISOString();
    if (updates.status === 'APPLIED' && !app.appliedDate) {
      updatedApp.appliedDate = now;
    }
    if (updates.status === 'INTERVIEW' && !app.interviewDate) {
      updatedApp.interviewDate = now;
    }
    if (updates.status === 'OFFER' && !app.offerDate) {
      updatedApp.offerDate = now;
    }
    if (updates.status === 'REJECTED' && !app.rejectedDate) {
      updatedApp.rejectedDate = now;
    }
  }

  applications[index] = updatedApp;
  console.log('[UPDATE] Saving updated application to Excel:', { id, updates: Object.keys(updates) });
  await saveApplications(applications);
  console.log('[UPDATE] ✅ Successfully saved updated application to Excel');

  return updatedApp;
}

/**
 * Soft delete (archive)
 */
export async function softDeleteApplication(id: string): Promise<Application> {
  console.log('[SOFT DELETE] Archiving application:', id);
  const archived = await updateApplication(id, { status: 'ARCHIVED' });
  console.log('[SOFT DELETE] ✅ Successfully archived application and saved to Excel');
  return archived;
}

/**
 * Hard delete
 */
export async function hardDeleteApplication(id: string): Promise<void> {
  console.log('[HARD DELETE] Deleting application:', id);
  const applications = await loadApplications();
  const filtered = applications.filter(app => app.id !== id);
  
  if (filtered.length === applications.length) {
    throw new ApplicationNotFoundError(id);
  }
  
  console.log('[HARD DELETE] Saving', filtered.length, 'remaining application(s) to Excel...');
  await saveApplications(filtered);
  console.log('[HARD DELETE] ✅ Successfully deleted application and saved to Excel');
}

/**
 * Clear link (remove URL and linkTitle only)
 */
export async function clearLink(id: string): Promise<Application> {
  console.log('[CLEAR LINK] Clearing link for application:', id);
  const updated = await updateApplication(id, { url: '', linkTitle: undefined });
  console.log('[CLEAR LINK] ✅ Successfully cleared link and saved to Excel:', { id, hasUrl: !!updated.url });
  return updated;
}

/**
 * Get application statistics
 */
export async function getApplicationStats(): Promise<ApplicationStats> {
  try {
    console.log('[STATS SERVICE] Starting stats calculation...');
    
    // Use getAllApplications for error handling - it will return empty array or dummy app if needed
    const applications = await getAllApplications();
    
    console.log('[STATS SERVICE] Loaded applications:', applications.length);
    
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const recentApplications = applications.filter(
      app => app.createdAt && app.createdAt >= sevenDaysAgo
    ).length;

    const stats: ApplicationStats = {
      total: applications.length,
      byStatus: {
        TODO: applications.filter(a => a.status === 'TODO').length,
        APPLIED: applications.filter(a => a.status === 'APPLIED').length,
        INTERVIEW: applications.filter(a => a.status === 'INTERVIEW').length,
        OFFER: applications.filter(a => a.status === 'OFFER').length,
        REJECTED: applications.filter(a => a.status === 'REJECTED').length,
        ARCHIVED: applications.filter(a => a.status === 'ARCHIVED').length,
      },
      byPriority: {
        HIGH: applications.filter(a => a.priority === 'HIGH').length,
        MEDIUM: applications.filter(a => a.priority === 'MEDIUM').length,
        LOW: applications.filter(a => a.priority === 'LOW').length,
      },
      recentApplications,
    };

    console.log('[STATS SERVICE] Stats calculated successfully:', {
      total: stats.total,
      recent: stats.recentApplications,
    });

    return stats;
  } catch (error) {
    console.error('[STATS SERVICE ERROR] Error in getApplicationStats:', error);
    console.error('[STATS SERVICE ERROR] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      isVercel: !!process.env.VERCEL,
      hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    });
    
    // Return empty stats instead of throwing - never throw from this function
    const emptyStats: ApplicationStats = {
      total: 0,
      byStatus: {
        TODO: 0,
        APPLIED: 0,
        INTERVIEW: 0,
        OFFER: 0,
        REJECTED: 0,
        ARCHIVED: 0,
      },
      byPriority: {
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0,
      },
      recentApplications: 0,
    };
    
    return emptyStats;
  }
}

/**
 * Create dummy application for first-time users
 */
function createDummyApplication(): Application {
  return {
    id: uuidv4(),
    url: 'https://example.com/job-posting',
    linkTitle: 'Example Job Posting',
    company: 'Example Company',
    roleTitle: 'Software Engineer',
    location: 'Remote',
    status: DEFAULT_STATUS,
    priority: DEFAULT_PRIORITY,
    notes: 'This is a sample application. You can edit or delete it! Start by adding your own job links.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
