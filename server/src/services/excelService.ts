import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import { Application } from '../models/Application.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const EXCEL_FILE_PATH = path.join(projectRoot, '..', 'data', 'applications.xlsx');
const SHEET_NAME = 'Applications';
const BLOB_FILE_NAME = 'applications.xlsx';

const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;

// Ensure data directory exists (local only)
if (!isVercel) {
  const dataDir = path.dirname(EXCEL_FILE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Get Vercel Blob storage module (dynamic import)
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

// Get Excel file buffer
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

// Save Excel file buffer
async function saveExcelFileBuffer(buffer: Buffer): Promise<void> {
  try {
    if (isVercel) {
      const blobModule = await getBlobStorage();
      if (!blobModule) {
        console.warn('Blob storage not available');
        return;
      }
      
      // Delete existing blob if it exists
      if (blobModule.list && blobModule.del) {
        try {
          const blobs = await blobModule.list({ prefix: BLOB_FILE_NAME });
          if (blobs.blobs) {
            for (const blob of blobs.blobs) {
              await blobModule.del(blob.url);
            }
          }
        } catch (error) {
          // Ignore
        }
      }
      
      // Upload new blob
      if (blobModule.put) {
        await blobModule.put(BLOB_FILE_NAME, buffer, {
          access: 'public',
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
      }
    } else {
      const dataDir = path.dirname(EXCEL_FILE_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(EXCEL_FILE_PATH, buffer);
    }
  } catch (error) {
    console.error('Error saving Excel file:', error);
    throw new Error(`Failed to save Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Ensure workbook exists and has correct structure
async function ensureWorkbook(): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  const fileBuffer = await getExcelFileBuffer();

  if (fileBuffer && fileBuffer.length > 0) {
    try {
      await workbook.xlsx.load(fileBuffer as any);
    } catch (error) {
      console.warn('Excel file corrupted, creating new one:', error);
    }
  }

  let worksheet = workbook.getWorksheet(SHEET_NAME);
  if (!worksheet) {
    worksheet = workbook.addWorksheet(SHEET_NAME);
    worksheet.addRow([
      'id', 'url', 'linkTitle', 'company', 'roleTitle', 'location',
      'status', 'priority', 'notes', 'appliedDate', 'interviewDate',
      'createdAt', 'updatedAt'
    ]);
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  }

  return workbook;
}

// Load applications from Excel
export async function loadApplications(): Promise<Application[]> {
  try {
    const workbook = await ensureWorkbook();
    const worksheet = workbook.getWorksheet(SHEET_NAME);
    
    if (!worksheet || worksheet.rowCount <= 1) {
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
        createdAt: String(row.getCell(12).value || new Date().toISOString()),
        updatedAt: String(row.getCell(13).value || new Date().toISOString()),
      });
    }

    return applications;
  } catch (error) {
    console.error('Error loading applications:', error);
    throw new Error(`Failed to load applications: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Save applications to Excel
export async function saveApplications(applications: Application[]): Promise<void> {
  try {
    const workbook = await ensureWorkbook();
    let worksheet = workbook.getWorksheet(SHEET_NAME);
    
    if (!worksheet) {
      worksheet = workbook.addWorksheet(SHEET_NAME);
      worksheet.addRow([
        'id', 'url', 'linkTitle', 'company', 'roleTitle', 'location',
        'status', 'priority', 'notes', 'appliedDate', 'interviewDate',
        'createdAt', 'updatedAt'
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
        app.createdAt,
        app.updatedAt,
      ]);
    }

    // Save to buffer
    const buffer = await workbook.xlsx.writeBuffer();
    await saveExcelFileBuffer(Buffer.from(buffer as ArrayBuffer));
  } catch (error) {
    console.error('Error saving applications:', error);
    throw new Error(`Failed to save applications: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Restore Excel file from upload
export async function restoreExcelFile(fileBuffer: Buffer | ArrayBuffer): Promise<Application[]> {
  try {
    const buffer = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer);
    await saveExcelFileBuffer(buffer);
    return await loadApplications();
  } catch (error) {
    console.error('Error restoring Excel file:', error);
    throw new Error(`Failed to restore Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

