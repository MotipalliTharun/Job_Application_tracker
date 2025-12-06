/**
 * Application Service - Todo-Style Link Tracker
 * 
 * This service manages job application links stored in an Excel file.
 * All operations follow a simple pattern:
 * 1. Load from Excel
 * 2. Modify data
 * 3. Save back to Excel
 * 
 * Key Features:
 * - All operations directly modify the Excel file
 * - Duplicate prevention based on normalized URLs
 * - Automatic deduplication when loading
 * - Status updates with automatic date tracking
 * 
 * Excel File Structure:
 * - Stored in: data/applications.xlsx (local) or Vercel Blob (production)
 * - Columns: id, url, linkTitle, company, roleTitle, location, status, priority, notes, dates
 */

import { v4 as uuidv4 } from 'uuid';
import { Application, ApplicationStats, ApplicationFilters } from '../models/Application.js';
import { loadApplications, saveApplications } from './excelService.js';
import { ApplicationNotFoundError, InvalidApplicationDataError } from '../utils/errors.js';
import { DEFAULT_STATUS, DEFAULT_PRIORITY } from '../config/constants.js';

/**
 * Normalize URL for comparison (add protocol, lowercase, remove trailing slashes)
 */
function normalizeUrlForComparison(url: string): string {
  if (!url || !url.trim()) return '';
  
  let normalized = url.trim();
  
  // Add protocol if missing
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`;
  }
  
  // Convert to lowercase and remove trailing slashes
  normalized = normalized.toLowerCase().replace(/\/+$/, '');
  
  return normalized;
}

/**
 * Remove duplicate applications based on normalized URLs
 */
function deduplicateApplications(applications: Application[]): Application[] {
  const seen = new Set<string>();
  const deduplicated: Application[] = [];
  let duplicatesRemoved = 0;

  for (const app of applications) {
    if (!app.url || !app.url.trim()) {
      // Keep applications without URLs (they might be cleared links)
      deduplicated.push(app);
      continue;
    }

    const normalizedUrl = normalizeUrlForComparison(app.url);
    
    if (seen.has(normalizedUrl)) {
      duplicatesRemoved++;
      console.log('[DEDUPE] Removing duplicate application:', { id: app.id, url: app.url });
      continue;
    }
    
    seen.add(normalizedUrl);
    deduplicated.push(app);
  }

  if (duplicatesRemoved > 0) {
    console.log(`[DEDUPE] Removed ${duplicatesRemoved} duplicate application(s)`);
  }

  return deduplicated;
}

/**
 * Get all applications with optional filtering
 * Loads directly from Excel file
 */
export async function getAllApplications(filters?: ApplicationFilters): Promise<Application[]> {
  try {
    // Load applications directly from Excel
    let applications = await loadApplications();
    const originalCount = applications.length;
    
    // Remove duplicates based on normalized URLs
    applications = deduplicateApplications(applications);
    
    // If duplicates were found and removed, save cleaned list back to Excel
    if (applications.length < originalCount) {
      const duplicatesRemoved = originalCount - applications.length;
      console.log(`[LOAD] Found ${duplicatesRemoved} duplicate(s), cleaning Excel file...`);
      await saveApplications(applications);
      console.log(`[LOAD] ✅ Cleaned Excel file, removed ${duplicatesRemoved} duplicate(s)`);
    }
    
    // If no applications exist, create a dummy one and save to Excel
    if (applications.length === 0) {
      console.log('[LOAD] No applications found, creating sample application in Excel...');
      try {
        const dummyApp = createDummyApplication();
        await saveApplications([dummyApp]);
        console.log('[LOAD] ✅ Created sample application in Excel');
        return [dummyApp];
      } catch (saveError) {
        console.error('[LOAD ERROR] Failed to save sample application:', saveError);
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
 * Directly modifies Excel file - loads, adds new links, saves back
 */
export async function createApplicationsFromLinks(links: string[]): Promise<Application[]> {
  if (!Array.isArray(links) || links.length === 0) {
    throw new InvalidApplicationDataError('Links must be a non-empty array');
  }

  // Load current applications from Excel
  const existingApps = await loadApplications();
  const now = new Date().toISOString();
  const newApps: Application[] = [];

  for (const link of links) {
    if (typeof link !== 'string' || !link.trim()) {
      console.log('[ADD LINK] Skipping empty or invalid link:', link);
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
      console.log('[ADD LINK] Skipping link with empty URL:', link);
      continue;
    }
    
    // Normalize URL for storage and comparison
    const originalUrl = url;
    const normalizedUrl = normalizeUrlForComparison(url);
    
    if (normalizedUrl !== url) {
      url = normalizedUrl;
      console.log('[ADD LINK] Normalized URL:', originalUrl, '->', url);
    }
    
    // Check for duplicates by comparing normalized URLs
    const isDuplicate = existingApps.some(app => {
      if (!app.url || !app.url.trim()) return false;
      const normalizedExisting = normalizeUrlForComparison(app.url);
      return normalizedExisting === normalizedUrl;
    });
    
    if (isDuplicate) {
      console.log('[ADD LINK] ⚠️ Duplicate URL skipped:', url);
      continue;
    }
    
    console.log('[ADD LINK] ✅ Creating new application:', { url, linkTitle });

    // Create new application
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

  // Save to Excel: Load -> Add new -> Save
  if (newApps.length > 0) {
    console.log('[ADD LINK] 📝 Writing', newApps.length, 'new link(s) to Excel file...');
    const allApps = [...existingApps, ...newApps];
    await saveApplications(allApps);
    console.log('[ADD LINK] ✅ Successfully saved', newApps.length, 'new link(s) to Excel');
  } else {
    console.log('[ADD LINK] ℹ️ No new links to add (all were duplicates or invalid)');
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
 * Directly modifies Excel file - loads, updates, saves back
 */
export async function updateApplication(id: string, updates: Partial<Application>): Promise<Application> {
  // Load current applications from Excel
  const applications = await loadApplications();
  const index = applications.findIndex(app => app.id === id);

  if (index === -1) {
    throw new ApplicationNotFoundError(`Application with ID ${id} not found`);
  }

  const app = applications[index];
  const now = new Date().toISOString();
  
  // Build updated application
  const updatedApp: Application = {
    ...app,
    ...updates,
    updatedAt: now,
  };

  // Auto-set dates based on status changes
  if (updates.status && updates.status !== app.status) {
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

  // If URL is being updated, normalize it and check for duplicates
  if (updates.url && updates.url.trim()) {
    const normalizedUrl = normalizeUrlForComparison(updates.url);
    const isDuplicate = applications.some((app, idx) => {
      if (idx === index || !app.url || !app.url.trim()) return false;
      const normalizedExisting = normalizeUrlForComparison(app.url);
      return normalizedExisting === normalizedUrl;
    });
    
    if (isDuplicate) {
      throw new InvalidApplicationDataError(`URL already exists: ${updates.url}`);
    }
    
    updatedApp.url = normalizedUrl;
  }

  // Update in array
  applications[index] = updatedApp;

  // Save to Excel: Load -> Update -> Save
  console.log('[UPDATE] 📝 Writing updated application to Excel file:', { id, fields: Object.keys(updates) });
  await saveApplications(applications);
  console.log('[UPDATE] ✅ Successfully updated and saved to Excel');

  return updatedApp;
}

/**
 * Soft delete (archive)
 * Directly modifies Excel file - loads, updates status to ARCHIVED, saves back
 */
export async function softDeleteApplication(id: string): Promise<Application> {
  console.log('[ARCHIVE] Archiving application:', id);
  const archived = await updateApplication(id, { status: 'ARCHIVED' });
  console.log('[ARCHIVE] ✅ Successfully archived and saved to Excel');
  return archived;
}

/**
 * Hard delete
 * Directly modifies Excel file - loads, removes application, saves back
 */
export async function hardDeleteApplication(id: string): Promise<void> {
  console.log('[DELETE] Deleting application from Excel:', id);
  
  // Load current applications from Excel
  const applications = await loadApplications();
  const beforeCount = applications.length;
  const filtered = applications.filter(app => app.id !== id);
  
  if (filtered.length === beforeCount) {
    throw new ApplicationNotFoundError(`Application with ID ${id} not found`);
  }
  
  // Save to Excel: Load -> Remove -> Save
  console.log('[DELETE] 📝 Writing', filtered.length, 'remaining application(s) to Excel file...');
  await saveApplications(filtered);
  console.log('[DELETE] ✅ Successfully deleted application from Excel');
}

/**
 * Clear link (remove URL and linkTitle only)
 * Directly modifies Excel file - loads, clears URL, saves back
 */
export async function clearLink(id: string): Promise<Application> {
  console.log('[CLEAR LINK] Clearing link from Excel:', id);
  const updated = await updateApplication(id, { url: '', linkTitle: undefined });
  console.log('[CLEAR LINK] ✅ Successfully cleared link and saved to Excel');
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
