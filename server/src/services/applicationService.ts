import { v4 as uuidv4 } from 'uuid';
import { Application } from '../models/Application.js';
import { loadApplications, saveApplications } from './excelService.js';

export async function getAllApplications(): Promise<Application[]> {
  return await loadApplications();
}

export async function createApplicationsFromLinks(links: string[]): Promise<Application[]> {
  const existingApps = await loadApplications();
  const now = new Date().toISOString();
  
  const newApplications: Application[] = links
    .map(link => link.trim())
    .filter(link => link.length > 0)
    .map(link => {
      // Support format: "Title|URL" or just "URL"
      const parts = link.split('|');
      const url = parts.length > 1 ? parts[1].trim() : parts[0].trim();
      const linkTitle = parts.length > 1 ? parts[0].trim() : undefined;
      
      return {
        id: uuidv4(),
        url,
        linkTitle,
        company: undefined,
        roleTitle: undefined,
        location: undefined,
        status: 'TODO' as const,
        priority: 'MEDIUM' as const,
        notes: undefined,
        createdAt: now,
        updatedAt: now,
      };
    });
  
  // Merge new links with existing applications
  // This preserves all existing modifications (company, role, notes, status, etc.)
  // Only adds new links that don't already exist (by URL)
  const existingUrls = new Set(existingApps.map(app => app.url.toLowerCase().trim()));
  const uniqueNewApps = newApplications.filter(app => {
    const urlLower = app.url.toLowerCase().trim();
    return urlLower && !existingUrls.has(urlLower);
  });
  
  const allApplications = [...existingApps, ...uniqueNewApps];
  await saveApplications(allApplications);
  
  console.log(`Added ${uniqueNewApps.length} new links (${newApplications.length - uniqueNewApps.length} duplicates skipped)`);
  
  return uniqueNewApps;
}

export async function updateApplication(
  id: string,
  updates: Partial<Application>
): Promise<Application> {
  const applications = await loadApplications();
  const index = applications.findIndex(app => app.id === id);
  
  if (index === -1) {
    throw new Error(`Application with id ${id} not found`);
  }
  
  const current = applications[index];
  const now = new Date().toISOString();
  
  // Auto-set dates based on status changes
  const finalUpdates: Partial<Application> = { ...updates };
  
  // If status is changing to APPLIED and appliedDate is not set, set it
  if (updates.status === 'APPLIED' && current.status !== 'APPLIED' && !updates.appliedDate) {
    finalUpdates.appliedDate = now;
  }
  
  // If status is changing to INTERVIEW and interviewDate is not set, set it
  if (updates.status === 'INTERVIEW' && current.status !== 'INTERVIEW' && !updates.interviewDate) {
    finalUpdates.interviewDate = now;
  }
  
  const updated = {
    ...current,
    ...finalUpdates,
    id, // Ensure ID doesn't change
    updatedAt: now,
  };
  
  applications[index] = updated;
  
  // Save to Excel file immediately
  await saveApplications(applications);
  console.log(`Application ${id} updated and saved to Excel file`);
  
  return updated;
}

export async function softDeleteApplication(id: string): Promise<Application> {
  return await updateApplication(id, { status: 'ARCHIVED' });
}

export async function hardDeleteApplication(id: string): Promise<void> {
  const applications = await loadApplications();
  const filtered = applications.filter(app => app.id !== id);
  await saveApplications(filtered);
}

