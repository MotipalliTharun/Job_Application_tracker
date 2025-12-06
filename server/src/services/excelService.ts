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
 */
async function getBlobStorage() {
  if (!isVercel || !process.env.BLOB_READ_WRITE_TOKEN) {
    return null;
  }
  try {
    return await import('@vercel/blob');
  } catch (error) {
    console.warn('Vercel Blob not available:', error);
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
      if (!blobModule) return null;
      
      try {
        if (blobModule.head) {
          const blob = await blobModule.head(BLOB_FILE_NAME);
          if (blob?.url) {
            const response = await fetch(blob.url);
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              return Buffer.from(new Uint8Array(arrayBuffer));
            }
          }
        }
      } catch (error: any) {
        if (error.name !== 'BlobNotFoundError' && error.name !== 'NotFoundError') {
          console.warn('Error fetching blob:', error);
        }
      }
      return null;
    } else {
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
      const blobModule = await getBlobStorage();
      if (!blobModule) {
        const errorMsg = 'Blob storage not available. Please set BLOB_READ_WRITE_TOKEN environment variable.';
        console.error(errorMsg);
        // Don't throw - allow app to continue without saving (data will be lost but app won't crash)
        console.warn('Continuing without saving to Blob storage');
        return;
      }
      
      // Delete existing blob if it exists
      if (blobModule.list && blobModule.del) {
        try {
          const blobs = await blobModule.list({ prefix: BLOB_FILE_NAME });
          if (blobs.blobs && blobs.blobs.length > 0) {
            for (const blob of blobs.blobs) {
              try {
                await blobModule.del(blob.url);
              } catch (delError) {
                console.warn('Failed to delete existing blob:', delError);
              }
            }
          }
        } catch (error) {
          // Ignore if file doesn't exist or list fails
          console.log('No existing blob to delete or list failed');
        }
      }
      
      // Upload new blob
      if (blobModule.put) {
        try {
          await blobModule.put(BLOB_FILE_NAME, buffer, {
            access: 'public',
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          console.log('Excel file saved to Vercel Blob successfully');
        } catch (putError) {
          console.error('Failed to upload blob:', putError);
          throw new ExcelServiceError(
            `Failed to upload to Blob storage: ${putError instanceof Error ? putError.message : 'Unknown error'}`,
            putError instanceof Error ? putError : undefined
          );
        }
      } else {
        throw new ExcelServiceError('Blob module put method not available');
      }
    } else {
      const dataDir = path.dirname(EXCEL_FILE_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(EXCEL_FILE_PATH, buffer);
      console.log('Excel file saved to local filesystem');
    }
  } catch (error) {
    console.error('Error saving Excel file:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      isVercel,
      hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
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
 */
export async function saveApplications(applications: Application[]): Promise<void> {
  try {
    const workbook = await ensureWorkbook();
    let worksheet = workbook.getWorksheet(EXCEL_SHEET_NAME);
    
    if (!worksheet) {
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

    // Clear existing data (keep header)
    const rowCount = worksheet.rowCount;
    if (rowCount > 1) {
      worksheet.spliceRows(2, rowCount - 1);
    }

    // Add applications
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

    // Save to buffer
    const buffer = await workbook.xlsx.writeBuffer();
    await saveExcelFileBuffer(Buffer.from(buffer as ArrayBuffer));
  } catch (error) {
    console.error('Error saving applications:', error);
    throw new ExcelServiceError(
      `Failed to save applications: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
