/**
 * Application Constants
 */

export const EXCEL_FILE_NAME = 'applications.xlsx';
export const EXCEL_SHEET_NAME = 'Applications';
export const BLOB_FILE_NAME = 'applications.xlsx';

export const STATUS_ORDER: Record<string, number> = {
  TODO: 1,
  APPLIED: 2,
  INTERVIEW: 3,
  OFFER: 4,
  REJECTED: 5,
  ARCHIVED: 6,
};

export const PRIORITY_ORDER: Record<string, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
};

export const DEFAULT_PRIORITY = 'MEDIUM';
export const DEFAULT_STATUS = 'TODO';

