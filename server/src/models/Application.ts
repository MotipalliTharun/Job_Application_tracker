export type ApplicationStatus = "TODO" | "APPLIED" | "INTERVIEW" | "OFFER" | "REJECTED" | "ARCHIVED";
export type ApplicationPriority = "LOW" | "MEDIUM" | "HIGH";

export interface Application {
  id: string;
  url: string;               // Can be empty string if link is cleared
  linkTitle?: string;        // Title/name for the link (e.g., "Software Engineer - Google")
  company?: string;
  roleTitle?: string;
  location?: string;
  status: ApplicationStatus;
  priority: ApplicationPriority;
  notes?: string;
  appliedDate?: string;      // ISO date when application was submitted
  interviewDate?: string;     // ISO date for interview
  createdAt: string;
  updatedAt: string;
}

