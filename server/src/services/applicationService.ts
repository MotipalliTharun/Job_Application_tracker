import { v4 as uuidv4 } from 'uuid';
import { Application } from '../models/Application.js';
import { loadApplications, saveApplications } from './excelService.js';

// Get all applications
export async function getAllApplications(): Promise<Application[]> {
  try {
    const applications = await loadApplications();
    
    if (applications.length === 0) {
      const dummyApp: Application = {
        id: uuidv4(),
        url: 'https://example.com/job-posting',
        linkTitle: 'Example Job Posting',
        company: 'Example Company',
        roleTitle: 'Software Engineer',
        location: 'Remote',
        status: 'TODO',
        priority: 'MEDIUM',
        notes: 'This is a sample application. You can edit or delete it!',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await saveApplications([dummyApp]);
      return [dummyApp];
    }
    
    return applications;
  } catch (error) {
    console.error('Error in getAllApplications:', error);
    try {
      const dummyApp: Application = {
        id: uuidv4(),
        url: 'https://example.com/job-posting',
        linkTitle: 'Example Job Posting',
        company: 'Example Company',
        roleTitle: 'Software Engineer',
        location: 'Remote',
        status: 'TODO',
        priority: 'MEDIUM',
        notes: 'This is a sample application. You can edit or delete it!',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveApplications([dummyApp]);
      return [dummyApp];
    } catch (recoveryError) {
      console.error('Recovery failed:', recoveryError);
      return [];
    }
  }
}

// Create applications from links
export async function createApplicationsFromLinks(links: string[]): Promise<Application[]> {
  const existingApps = await loadApplications();
  const now = new Date().toISOString();
  const newApps: Application[] = [];

  for (const link of links) {
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

    // Skip if URL already exists
    if (existingApps.some(app => app.url === url)) {
      continue;
    }

    newApps.push({
      id: uuidv4(),
      url,
      linkTitle,
      status: 'TODO',
      priority: 'MEDIUM',
      createdAt: now,
      updatedAt: now,
    });
  }

  if (newApps.length > 0) {
    await saveApplications([...existingApps, ...newApps]);
  }

  return newApps;
}

// Update application
export async function updateApplication(id: string, updates: Partial<Application>): Promise<Application> {
  const applications = await loadApplications();
  const index = applications.findIndex(app => app.id === id);

  if (index === -1) {
    throw new Error(`Application with id ${id} not found`);
  }

  const app = applications[index];
  const updatedApp: Application = {
    ...app,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  // Auto-set dates based on status
  if (updates.status === 'APPLIED' && !app.appliedDate) {
    updatedApp.appliedDate = new Date().toISOString();
  }
  if (updates.status === 'INTERVIEW' && !app.interviewDate) {
    updatedApp.interviewDate = new Date().toISOString();
  }

  applications[index] = updatedApp;
  await saveApplications(applications);

  return updatedApp;
}

// Soft delete (archive)
export async function softDeleteApplication(id: string): Promise<Application> {
  return updateApplication(id, { status: 'ARCHIVED' });
}

// Hard delete
export async function hardDeleteApplication(id: string): Promise<void> {
  const applications = await loadApplications();
  const filtered = applications.filter(app => app.id !== id);
  await saveApplications(filtered);
}

// Clear link (remove URL and linkTitle only)
export async function clearLink(id: string): Promise<Application> {
  return updateApplication(id, { url: '', linkTitle: undefined });
}

