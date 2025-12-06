/**
 * Excel Service
 * Handles reading from and writing to Excel files
 * Supports both local filesystem and Vercel Blob storage
 */

import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import { Application } from '../models/Application.js';
import { EXCEL_FILE_NAME, EXCEL_SHEET_NAME, BLOB_FILE_NAME } from '../config/constants.js';
import { ExcelServiceError } from '../utils/errors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const EXCEL_FILE_PATH = path.join(projectRoot, '..', 'data', EXCEL_FILE_NAME);

const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;

// Ensure data directory exists (local only)
if (!isVercel) {
  const dataDir = path.dirname(EXCEL_FILE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

/**
 * Get Vercel Blob storage module (dynamic import)
 * Only imports when on Vercel and token is available
 */
async function getBlobStorage() {
  if (!isVercel) {
    console.log('[BLOB] Not on Vercel, skipping blob storage');
    return null;
  }
  
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn('[BLOB WARNING] BLOB_READ_WRITE_TOKEN not set. Blob storage will not be available.');
    return null;
  }
  
  try {
    const blobModule = await import('@vercel/blob');
    console.log('[BLOB] Successfully imported @vercel/blob module');
    return blobModule;
  } catch (error) {
    console.error('[BLOB ERROR] Failed to import @vercel/blob:', error);
    return null;
  }
}

/**
 * Get Excel file buffer from storage
 */
async function getExcelFileBuffer(): Promise<Buffer | null> {
  try {
    if (isVercel) {
      const blobModule = await getBlobStorage();
      if (!blobModule) {
        console.log('Blob storage not available - returning null');
        return null;
      }
      
      try {
        // @vercel/blob v2 API: head() returns blob metadata or throws if not found
        const { head } = blobModule;
        if (head) {
          const blob = await head(BLOB_FILE_NAME);
          if (blob?.url) {
            const response = await fetch(blob.url);
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              return Buffer.from(new Uint8Array(arrayBuffer));
            } else {
              console.warn(`Failed to fetch blob from URL: ${response.status} ${response.statusText}`);
            }
          }
        }
      } catch (error: any) {
        // BlobNotFoundError is expected when file doesn't exist yet
        if (error.name === 'BlobNotFoundError' || error.name === 'NotFoundError' || error.status === 404) {
          console.log('Blob file not found (this is OK for first run):', BLOB_FILE_NAME);
        } else {
          console.error('Error fetching blob:', {
            name: error.name,
            message: error.message,
            status: error.status,
          });
        }
      }
      return null;
    } else {
      // Local filesystem
      if (fs.existsSync(EXCEL_FILE_PATH)) {
        return fs.readFileSync(EXCEL_FILE_PATH);
      }
      return null;
    }
  } catch (error) {
    console.error('Error in getExcelFileBuffer:', error);
    return null;
  }
}

/**
 * Save Excel file buffer to storage
 */
async function saveExcelFileBuffer(buffer: Buffer): Promise<void> {
  try {
    if (isVercel) {
      // Check for required environment variable
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        const errorMsg = '[BLOB ERROR] BLOB_READ_WRITE_TOKEN environment variable is not set. Data will not persist.';
        console.error(errorMsg);
        console.warn('[BLOB WARNING] Continuing without saving to Blob storage. Set BLOB_READ_WRITE_TOKEN to enable persistence.');
        // Don't throw - allow app to continue without saving (data will be lost but app won't crash)
        return;
      }

      const blobModule = await getBlobStorage();
      if (!blobModule) {
        console.error('[BLOB ERROR] Failed to import @vercel/blob module');
        console.warn('[BLOB WARNING] Continuing without saving to Blob storage');
        return;
      }
      
      const { put, list, del } = blobModule;
      
      // Delete existing blob if it exists (optional - put will overwrite)
      if (list && del) {
        try {
          const blobs = await list({ prefix: BLOB_FILE_NAME });
          if (blobs?.blobs && blobs.blobs.length > 0) {
            for (const blob of blobs.blobs) {
              try {
                await del(blob.url);
                console.log(`Deleted existing blob: ${blob.url}`);
              } catch (delError) {
                console.warn('Failed to delete existing blob (continuing anyway):', delError);
              }
            }
          }
        } catch (error) {
          // Ignore if file doesn't exist or list fails - put will overwrite anyway
          console.log('Could not list/delete existing blob (this is OK):', error instanceof Error ? error.message : 'Unknown error');
        }
      }
      
      // Upload new blob using @vercel/blob v2 API
      if (put) {
        try {
          const result = await put(BLOB_FILE_NAME, buffer, {
            access: 'public',
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          console.log('[BLOB SUCCESS] Excel file saved to Vercel Blob:', {
            url: result.url,
            pathname: result.pathname,
            size: buffer.length,
          });
        } catch (putError) {
          console.error('[BLOB ERROR] Failed to upload blob:', {
            error: putError instanceof Error ? putError.message : 'Unknown error',
            name: putError instanceof Error ? putError.name : undefined,
            stack: putError instanceof Error ? putError.stack : undefined,
          });
          throw new ExcelServiceError(
            `Failed to upload to Blob storage: ${putError instanceof Error ? putError.message : 'Unknown error'}`,
            putError instanceof Error ? putError : undefined
          );
        }
      } else {
        throw new ExcelServiceError('Blob module put method not available');
      }
    } else {
      // Local filesystem
      const dataDir = path.dirname(EXCEL_FILE_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(EXCEL_FILE_PATH, buffer);
      console.log('Excel file saved to local filesystem:', EXCEL_FILE_PATH);
    }
  } catch (error) {
    console.error('[EXCEL ERROR] Error saving Excel file:', error);
    console.error('[EXCEL ERROR] Details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      isVercel,
      hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
      blobTokenLength: process.env.BLOB_READ_WRITE_TOKEN?.length || 0,
    });
    throw new ExcelServiceError(
      `Failed to save Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Ensure workbook exists and has correct structure
 */
async function ensureWorkbook(): Promise<ExcelJS.Workbook> {
  try {
    const workbook = new ExcelJS.Workbook();
    const fileBuffer = await getExcelFileBuffer();

    if (fileBuffer && fileBuffer.length > 0) {
      try {
        await workbook.xlsx.load(fileBuffer as any);
        console.log('Excel file loaded successfully');
      } catch (error) {
        console.warn('Excel file corrupted or invalid, creating new one:', error);
        // Continue to create new workbook
      }
    } else {
      console.log('No existing Excel file found, creating new one');
    }

    let worksheet = workbook.getWorksheet(EXCEL_SHEET_NAME);
    if (!worksheet) {
      console.log('Creating new worksheet:', EXCEL_SHEET_NAME);
      worksheet = workbook.addWorksheet(EXCEL_SHEET_NAME);
      worksheet.addRow([
        'id', 'url', 'linkTitle', 'company', 'roleTitle', 'location',
        'status', 'priority', 'notes', 'appliedDate', 'interviewDate',
        'offerDate', 'rejectedDate', 'createdAt', 'updatedAt'
      ]);
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    }

    return workbook;
  } catch (error) {
    console.error('Error in ensureWorkbook:', error);
    // Return a new workbook as fallback
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(EXCEL_SHEET_NAME);
    worksheet.addRow([
      'id', 'url', 'linkTitle', 'company', 'roleTitle', 'location',
      'status', 'priority', 'notes', 'appliedDate', 'interviewDate',
      'offerDate', 'rejectedDate', 'createdAt', 'updatedAt'
    ]);
    worksheet.getRow(1).font = { bold: true };
    return workbook;
  }
}

/**
 * Load applications from Excel
 */
export async function loadApplications(): Promise<Application[]> {
  try {
    console.log('Loading applications...', {
      isVercel,
      hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    });
    
    const workbook = await ensureWorkbook();
    const worksheet = workbook.getWorksheet(EXCEL_SHEET_NAME);
    
    if (!worksheet || worksheet.rowCount <= 1) {
      console.log('No worksheet or data found, returning empty array');
      return [];
    }

    const applications: Application[] = [];
    const rows = worksheet.getRows(2, worksheet.rowCount - 1) || [];

    for (const row of rows) {
      const id = String(row.getCell(1).value || '');
      if (!id) continue;

      applications.push({
        id,
        url: String(row.getCell(2).value || ''),
        linkTitle: row.getCell(3).value ? String(row.getCell(3).value) : undefined,
        company: row.getCell(4).value ? String(row.getCell(4).value) : undefined,
        roleTitle: row.getCell(5).value ? String(row.getCell(5).value) : undefined,
        location: row.getCell(6).value ? String(row.getCell(6).value) : undefined,
        status: String(row.getCell(7).value || 'TODO') as Application['status'],
        priority: String(row.getCell(8).value || 'MEDIUM') as Application['priority'],
        notes: row.getCell(9).value ? String(row.getCell(9).value) : undefined,
        appliedDate: row.getCell(10).value ? String(row.getCell(10).value) : undefined,
        interviewDate: row.getCell(11).value ? String(row.getCell(11).value) : undefined,
        offerDate: row.getCell(12).value ? String(row.getCell(12).value) : undefined,
        rejectedDate: row.getCell(13).value ? String(row.getCell(13).value) : undefined,
        createdAt: String(row.getCell(14).value || new Date().toISOString()),
        updatedAt: String(row.getCell(15).value || new Date().toISOString()),
      });
    }

    console.log(`Successfully loaded ${applications.length} applications`);
    return applications;
  } catch (error) {
    console.error('Error loading applications:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      isVercel,
      hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    });
    
    // Don't throw - return empty array to allow app to continue
    // The getAllApplications function will handle creating a dummy app
    return [];
  }
}

/**
 * Save applications to Excel
 * This function directly writes to the Excel file (Blob or filesystem)
 * It replaces all existing data with the new data
 */
export async function saveApplications(applications: Application[]): Promise<void> {
  try {
    console.log('[EXCEL] Writing', applications.length, 'application(s) to Excel file...');
    console.log('[EXCEL] Storage:', isVercel ? 'Vercel Blob' : 'Local Filesystem');

    // Create a fresh workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(EXCEL_SHEET_NAME);
    
    // Add header row
    worksheet.addRow([
      'id', 'url', 'linkTitle', 'company', 'roleTitle', 'location',
      'status', 'priority', 'notes', 'appliedDate', 'interviewDate',
      'offerDate', 'rejectedDate', 'createdAt', 'updatedAt'
    ]);
    
    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add all application rows
    for (const app of applications) {
      worksheet.addRow([
        app.id,
        app.url || '',
        app.linkTitle || '',
        app.company || '',
        app.roleTitle || '',
        app.location || '',
        app.status,
        app.priority,
        app.notes || '',
        app.appliedDate || '',
        app.interviewDate || '',
        app.offerDate || '',
        app.rejectedDate || '',
        app.createdAt,
        app.updatedAt,
      ]);
    }

    // Generate Excel buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const bufferSize = Buffer.from(buffer as ArrayBuffer).length;
    console.log('[EXCEL] Generated Excel file, size:', bufferSize, 'bytes');
    
    // Write directly to storage (Blob or filesystem)
    await saveExcelFileBuffer(Buffer.from(buffer as ArrayBuffer));
    console.log('[EXCEL] ✅ Successfully wrote', applications.length, 'application(s) to Excel file');
  } catch (error) {
    console.error('[EXCEL ERROR] Failed to write to Excel file:', error);
    console.error('[EXCEL ERROR] Details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      applicationCount: applications.length,
      isVercel,
      hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    });
    throw new ExcelServiceError(
      `Failed to write to Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Restore Excel file from upload
 */
export async function restoreExcelFile(fileBuffer: Buffer | ArrayBuffer): Promise<Application[]> {
  try {
    const buffer = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer);
    await saveExcelFileBuffer(buffer);
    return await loadApplications();
  } catch (error) {
    console.error('Error restoring Excel file:', error);
    throw new ExcelServiceError(
      `Failed to restore Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Get Excel file buffer for download
 */
export async function getExcelFileForDownload(): Promise<Buffer> {
  try {
    console.log('[EXCEL DOWNLOAD] Preparing Excel file for download...');
    
    // Load current applications and create a fresh workbook
    const applications = await loadApplications();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(EXCEL_SHEET_NAME);
    
    // Add header row
    worksheet.addRow([
      'id', 'url', 'linkTitle', 'company', 'roleTitle', 'location',
      'status', 'priority', 'notes', 'appliedDate', 'interviewDate',
      'offerDate', 'rejectedDate', 'createdAt', 'updatedAt'
    ]);
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Add application rows
    for (const app of applications) {
      worksheet.addRow([
        app.id,
        app.url,
        app.linkTitle || '',
        app.company || '',
        app.roleTitle || '',
        app.location || '',
        app.status,
        app.priority,
        app.notes || '',
        app.appliedDate || '',
        app.interviewDate || '',
        app.offerDate || '',
        app.rejectedDate || '',
        app.createdAt,
        app.updatedAt,
      ]);
    }
    
    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    console.log('[EXCEL DOWNLOAD] Excel file prepared, size:', Buffer.from(buffer as ArrayBuffer).length, 'bytes');
    return Buffer.from(buffer as ArrayBuffer);
  } catch (error) {
    console.error('[EXCEL DOWNLOAD ERROR] Failed to prepare Excel file:', error);
    throw new ExcelServiceError(
      `Failed to prepare Excel file for download: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined
    );
  }
}
