export type ApplicationStatus = 'TODO' | 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'ARCHIVED';
export type ApplicationPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Application {
  id: string;
  url: string;
  linkTitle?: string;
  company?: string;
  roleTitle?: string;
  location?: string;
  status: ApplicationStatus;
  priority: ApplicationPriority;
  notes?: string;
  appliedDate?: string;
  interviewDate?: string;
  createdAt: string;
  updatedAt: string;
}

