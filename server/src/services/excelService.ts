import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import { Application } from '../models/Application.js';

// Note: @vercel/blob is only imported when actually on Vercel
// This prevents import errors during local development
// Dynamic import for Vercel Blob (only used when on Vercel)
// This prevents import errors during local development
async function getBlobStorage() {
  if (!isVercel) {
    return null;
  }
  
  try {
    // Dynamic import only when on Vercel
    const blobModule = await import('@vercel/blob');
    return blobModule;
  } catch (error) {
    console.warn('Vercel Blob not available (this is normal for local dev):', error);
    return null;
  }
}

// Get project root (assuming we're in server/src/services)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve to project root/data/applications.xlsx
const projectRoot = path.resolve(__dirname, '../..');
const EXCEL_FILE_PATH = path.join(projectRoot, '..', 'data', 'applications.xlsx');
const SHEET_NAME = 'Applications';
const BLOB_FILE_NAME = 'applications.xlsx';

// Check if running on Vercel
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;

// Ensure data directory exists (for local development)
if (!isVercel) {
  const dataDir = path.dirname(EXCEL_FILE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

/**
 * Get Excel file buffer from Vercel Blob or local file system
 */
async function getExcelFileBuffer(): Promise<Buffer | null> {
  if (isVercel) {
    try {
      const blobModule = await getBlobStorage();
      if (!blobModule) return null;
      
      // Use head to check if file exists, then getDownloadUrl to fetch it
      try {
        if (blobModule.head) {
          const blob = await blobModule.head(BLOB_FILE_NAME);
          if (blob && blob.url) {
            const response = await fetch(blob.url);
            const arrayBuffer = await response.arrayBuffer();
            // Convert ArrayBuffer to proper Node.js Buffer
            return Buffer.from(new Uint8Array(arrayBuffer));
          }
        }
      } catch (error: any) {
        // File doesn't exist (BlobNotFoundError is expected)
        if (error.name !== 'BlobNotFoundError') {
          console.warn('Error fetching blob:', error);
        }
      }
      return null;
    } catch (error) {
      // File doesn't exist yet, return null
      console.log('Blob file not found, will create new one');
      return null;
    }
  } else {
    if (fs.existsSync(EXCEL_FILE_PATH)) {
      return fs.readFileSync(EXCEL_FILE_PATH);
    }
    return null;
  }
}

/**
 * Save Excel file buffer to Vercel Blob or local file system
 */
async function saveExcelFileBuffer(buffer: Buffer): Promise<void> {
  if (isVercel) {
    const blobModule = await getBlobStorage();
    if (!blobModule) {
      throw new Error('Vercel Blob storage not available');
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
        // Ignore if file doesn't exist
      }
    }
    
    // Upload new blob
    if (blobModule.put) {
      await blobModule.put(BLOB_FILE_NAME, buffer, {
        access: 'public',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
    } else {
      throw new Error('Vercel Blob put method not available');
    }
  } else {
    fs.writeFileSync(EXCEL_FILE_PATH, buffer);
  }
}

async function ensureWorkbook(): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  
  // Try to load existing file
  const fileBuffer = await getExcelFileBuffer();
  
  if (fileBuffer) {
    // Check file size (for local files)
    if (!isVercel && fileBuffer.length < 100) {
      console.warn('Excel file appears to be empty or corrupted. Creating new file.');
      if (fs.existsSync(EXCEL_FILE_PATH)) {
        fs.unlinkSync(EXCEL_FILE_PATH);
      }
    } else {
      try {
        // Ensure fileBuffer is a proper Buffer for ExcelJS
        const buffer = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer as ArrayBuffer);
        await workbook.xlsx.load(buffer);
      } catch (error) {
        // If file is corrupted, backup it and create a new one
        console.warn('Excel file is corrupted. Backing up and creating new file.', error);
        if (!isVercel) {
          try {
            const backupPath = EXCEL_FILE_PATH.replace('.xlsx', `_corrupted_${Date.now()}.xlsx`);
            fs.copyFileSync(EXCEL_FILE_PATH, backupPath);
            console.log(`Corrupted file backed up to: ${backupPath}`);
            fs.unlinkSync(EXCEL_FILE_PATH);
          } catch (backupError) {
            try {
              fs.unlinkSync(EXCEL_FILE_PATH);
            } catch (unlinkError) {
              // Ignore unlink errors
            }
          }
        }
        // Create a fresh workbook
        const newWorkbook = new ExcelJS.Workbook();
        const worksheet = newWorkbook.addWorksheet(SHEET_NAME);
        // Add header row
        worksheet.addRow([
          'id',
          'url',
          'linkTitle',
          'company',
          'roleTitle',
          'location',
          'status',
          'priority',
          'notes',
          'appliedDate',
          'interviewDate',
          'createdAt',
          'updatedAt'
        ]);
        // Style header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
        // Save the new file immediately
        const writeBuffer = await newWorkbook.xlsx.writeBuffer();
        const newBuffer = Buffer.isBuffer(writeBuffer) ? writeBuffer : Buffer.from(writeBuffer);
        await saveExcelFileBuffer(newBuffer);
        return newWorkbook;
      }
    }
  }
  
  // Ensure sheet exists
  let worksheet = workbook.getWorksheet(SHEET_NAME);
  if (!worksheet) {
    worksheet = workbook.addWorksheet(SHEET_NAME);
    // Add header row
    worksheet.addRow([
      'id',
      'url',
      'linkTitle',
      'company',
      'roleTitle',
      'location',
      'status',
      'priority',
      'notes',
      'appliedDate',
      'interviewDate',
      'createdAt',
      'updatedAt'
    ]);
    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  }
  
  return workbook;
}

export async function loadApplications(): Promise<Application[]> {
  try {
    const workbook = await ensureWorkbook();
    const worksheet = workbook.getWorksheet(SHEET_NAME);
    
    if (!worksheet) {
      return [];
    }
    
    const applications: Application[] = [];
    const rows = worksheet.getRows(2, worksheet.rowCount - 1); // Skip header row
    
    if (!rows) {
      return [];
    }
    
    for (const row of rows) {
      if (!row.getCell(1).value) continue; // Skip empty rows
      
      // Handle old format (10-12 columns) and new format (13 columns with linkTitle)
      const colCount = row.cellCount;
      const hasLinkTitle = colCount >= 13;
      
      // Read cells by position
      const get = (col: number) => row.getCell(col);
      const getStr = (col: number) => get(col).value ? String(get(col).value) : undefined;
      
      applications.push({
        id: String(get(1).value || ''),
        url: String(get(2).value || ''),
        linkTitle: hasLinkTitle ? getStr(3) : undefined,
        company: hasLinkTitle ? getStr(4) : getStr(3),
        roleTitle: hasLinkTitle ? getStr(5) : getStr(4),
        location: hasLinkTitle ? getStr(6) : getStr(5),
        status: String((hasLinkTitle ? get(7) : get(6)).value || 'TODO') as Application['status'],
        priority: String((hasLinkTitle ? get(8) : get(7)).value || 'MEDIUM') as Application['priority'],
        notes: hasLinkTitle ? getStr(9) : getStr(8),
        appliedDate: hasLinkTitle ? getStr(10) : (colCount >= 10 ? getStr(9) : undefined),
        interviewDate: hasLinkTitle ? getStr(11) : (colCount >= 11 ? getStr(10) : undefined),
        createdAt: String((hasLinkTitle ? get(12) : (colCount >= 12 ? get(11) : get(9))).value || new Date().toISOString()),
        updatedAt: String((hasLinkTitle ? get(13) : (colCount >= 12 ? get(12) : get(10))).value || new Date().toISOString()),
      });
    }
    
    return applications;
  } catch (error) {
    console.error('Error loading applications:', error);
    throw new Error('Failed to load applications from Excel');
  }
}

export async function saveApplications(applications: Application[]): Promise<void> {
  try {
    const workbook = await ensureWorkbook();
    let worksheet = workbook.getWorksheet(SHEET_NAME);
    
    if (!worksheet) {
      worksheet = workbook.addWorksheet(SHEET_NAME);
      worksheet.addRow([
        'id',
        'url',
        'linkTitle',
        'company',
        'roleTitle',
        'location',
        'status',
        'priority',
        'notes',
        'appliedDate',
        'interviewDate',
        'createdAt',
        'updatedAt'
      ]);
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    }
    
    // Clear existing data rows (keep header)
    const rowCount = worksheet.rowCount;
    if (rowCount > 1) {
      worksheet.spliceRows(2, rowCount - 1);
    }
    
    // Add all applications
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
        app.updatedAt
      ]);
    }
    
    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      if (column) {
        column.width = 15;
      }
    });
    
    // Save to buffer and then to storage
    const writeBuffer = await workbook.xlsx.writeBuffer();
    const buffer = Buffer.isBuffer(writeBuffer) ? writeBuffer : Buffer.from(writeBuffer);
    await saveExcelFileBuffer(buffer);
    
    const storageType = isVercel ? 'Vercel Blob' : 'local file';
    console.log(`Excel file updated successfully: ${applications.length} applications saved to ${storageType}`);
  } catch (error) {
    console.error('Error saving applications:', error);
    throw new Error('Failed to save applications to Excel');
  }
}

/**
 * Restore Excel file from uploaded file buffer
 * Validates the file and replaces the current Excel file
 */
export async function restoreExcelFile(fileBuffer: Buffer | ArrayBuffer): Promise<Application[]> {
  try {
    // Validate the uploaded file by trying to read it
    const tempWorkbook = new ExcelJS.Workbook();
    // Convert to proper Buffer type for ExcelJS
    const buffer: Buffer = Buffer.isBuffer(fileBuffer) 
      ? fileBuffer 
      : Buffer.from(fileBuffer as ArrayBuffer);
    await tempWorkbook.xlsx.load(buffer as any);
    
    const worksheet = tempWorkbook.getWorksheet(SHEET_NAME);
    if (!worksheet) {
      throw new Error('Uploaded file does not contain "Applications" sheet');
    }
    
    // Backup current file before restoring (only for local)
    if (!isVercel && fs.existsSync(EXCEL_FILE_PATH)) {
      const backupPath = EXCEL_FILE_PATH.replace('.xlsx', `_backup_${Date.now()}.xlsx`);
      fs.copyFileSync(EXCEL_FILE_PATH, backupPath);
      console.log(`Current file backed up to: ${backupPath}`);
    }
    
    // Save the uploaded file (convert to Buffer if needed)
    const saveBuffer: Buffer = Buffer.isBuffer(fileBuffer) 
      ? fileBuffer 
      : Buffer.from(fileBuffer as ArrayBuffer);
    await saveExcelFileBuffer(saveBuffer);
    const storageType = isVercel ? 'Vercel Blob' : 'local file';
    console.log(`Excel file restored from upload to ${storageType}`);
    
    // Load and return the applications from restored file
    return await loadApplications();
  } catch (error) {
    console.error('Error restoring Excel file:', error);
    throw new Error(`Failed to restore Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
