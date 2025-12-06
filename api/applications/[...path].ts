/**
 * Vercel Serverless Function - Main API Route Handler
 * Handles all /api/applications/* routes
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import multer from 'multer';

// Dynamic imports will be used in route handlers to handle module loading issues
let applicationService: any;
let excelService: any;
let errors: any;

// Lazy load services to handle potential import issues
async function getApplicationService() {
  if (!applicationService) {
    applicationService = await import('../../server/src/services/applicationService.js');
  }
  return applicationService;
}

async function getExcelService() {
  if (!excelService) {
    excelService = await import('../../server/src/services/excelService.js');
  }
  return excelService;
}

async function getErrors() {
  if (!errors) {
    errors = await import('../../server/src/utils/errors.js');
  }
  return errors;
}

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// CORS middleware - Enable for all routes
router.use(cors({ 
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false,
  preflightContinue: false,
  optionsSuccessStatus: 204,
}));

// Request logging middleware
router.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    query: req.query,
    hasBody: !!req.body,
  });
  next();
});

// GET /api/applications
router.get('/', async (req, res) => {
  try {
    console.log('[API] GET /api/applications called', {
      query: req.query,
      isVercel: !!process.env.VERCEL,
      vercelEnv: process.env.VERCEL_ENV,
      hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
      blobTokenLength: process.env.BLOB_READ_WRITE_TOKEN?.length || 0,
    });
    
    // Dynamic import to handle module loading issues
    const service = await getApplicationService();
    if (!service || !service.getAllApplications) {
      throw new Error('Failed to load applicationService module');
    }

    const { status, priority, search, startDate, endDate } = req.query;
    
    const filters = {
      ...(status && { status: status as string }),
      ...(priority && { priority: priority as string }),
      ...(search && { search: search as string }),
      ...((startDate || endDate) && {
        dateRange: {
          ...(startDate && { start: startDate as string }),
          ...(endDate && { end: endDate as string }),
        },
      }),
    };

    const applications = await service.getAllApplications(Object.keys(filters).length > 0 ? filters : undefined);
    console.log(`[API SUCCESS] Returning ${applications.length} applications`);
    return res.status(200).json(applications);
  } catch (error) {
    console.error('[API ERROR] Error fetching applications:', error);
    console.error('[API ERROR] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      isVercel: !!process.env.VERCEL,
      hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    });
    
    // Return empty array with 200 status instead of 500 to prevent frontend crashes
    return res.status(200).json([]);
  }
});

// GET /api/applications/:id
router.get('/:id', async (req, res) => {
  try {
    const service = await getApplicationService();
    const errorUtils = await getErrors();
    
    if (!service || !service.getApplicationById) {
      throw new Error('Failed to load applicationService module');
    }

    const { id } = req.params;
    const application = await service.getApplicationById(id);
    return res.status(200).json(application);
  } catch (error) {
    const errorUtils = await getErrors();
    if (errorUtils && error instanceof errorUtils.ApplicationNotFoundError) {
      return res.status(404).json({ error: error.message });
    } else {
      console.error('[API ERROR] Error fetching application:', error);
      return res.status(404).json({
        error: 'Application not found',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// POST /api/applications/links
router.post('/links', async (req, res) => {
  try {
    const service = await getApplicationService();
    const errorUtils = await getErrors();
    
    if (!service || !service.createApplicationsFromLinks) {
      throw new Error('Failed to load applicationService module');
    }

    const { links, linksWithTitles } = req.body;
    let linkArray: string[] = [];

    if (linksWithTitles && Array.isArray(linksWithTitles)) {
      linkArray = linksWithTitles.map((item: { url: string; linkTitle?: string }) => {
        return item.linkTitle ? `${item.linkTitle}|${item.url}` : item.url;
      });
    } else if (Array.isArray(links)) {
      linkArray = links;
    } else {
      return res.status(400).json({
        error: 'Invalid request format',
        message: 'Request body must contain either "links" or "linksWithTitles"',
      });
    }

    const newApplications = await service.createApplicationsFromLinks(linkArray);
    return res.status(201).json(newApplications);
  } catch (error) {
    console.error('[API ERROR] Error creating applications:', error);
    const errorUtils = await getErrors();
    if (errorUtils && error instanceof errorUtils.InvalidApplicationDataError) {
      return res.status(400).json({ error: error.message });
    } else {
      return res.status(400).json({
        error: 'Failed to create applications',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// PATCH /api/applications/:id
router.patch('/:id', async (req, res) => {
  try {
    const service = await getApplicationService();
    const errorUtils = await getErrors();
    
    if (!service || !service.updateApplication) {
      throw new Error('Failed to load applicationService module');
    }

    const { id } = req.params;
    const updated = await service.updateApplication(id, req.body);
    return res.status(200).json(updated);
  } catch (error) {
    console.error('[API ERROR] Error updating application:', error);
    const errorUtils = await getErrors();
    if (errorUtils && error instanceof errorUtils.ApplicationNotFoundError) {
      return res.status(404).json({ error: error.message });
    } else {
      return res.status(400).json({
        error: 'Failed to update application',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// DELETE /api/applications/:id (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const service = await getApplicationService();
    const errorUtils = await getErrors();
    
    if (!service || !service.softDeleteApplication) {
      throw new Error('Failed to load applicationService module');
    }

    const { id } = req.params;
    const archived = await service.softDeleteApplication(id);
    return res.status(200).json(archived);
  } catch (error) {
    console.error('[API ERROR] Error archiving application:', error);
    const errorUtils = await getErrors();
    if (errorUtils && error instanceof errorUtils.ApplicationNotFoundError) {
      return res.status(404).json({ error: error.message });
    } else {
      return res.status(400).json({
        error: 'Failed to archive application',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// DELETE /api/applications/:id/hard (hard delete)
router.delete('/:id/hard', async (req, res) => {
  try {
    const service = await getApplicationService();
    const errorUtils = await getErrors();
    
    if (!service || !service.hardDeleteApplication) {
      throw new Error('Failed to load applicationService module');
    }

    const { id } = req.params;
    await service.hardDeleteApplication(id);
    return res.status(204).send();
  } catch (error) {
    console.error('[API ERROR] Error deleting application:', error);
    const errorUtils = await getErrors();
    if (errorUtils && error instanceof errorUtils.ApplicationNotFoundError) {
      return res.status(404).json({ error: error.message });
    } else {
      return res.status(400).json({
        error: 'Failed to delete application',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// DELETE /api/applications/:id/clear-link
router.delete('/:id/clear-link', async (req, res) => {
  try {
    const service = await getApplicationService();
    const errorUtils = await getErrors();
    
    if (!service || !service.clearLink) {
      throw new Error('Failed to load applicationService module');
    }

    const { id } = req.params;
    const updated = await service.clearLink(id);
    return res.status(200).json(updated);
  } catch (error) {
    console.error('[API ERROR] Error clearing link:', error);
    const errorUtils = await getErrors();
    if (errorUtils && error instanceof errorUtils.ApplicationNotFoundError) {
      return res.status(404).json({ error: error.message });
    } else {
      return res.status(400).json({
        error: 'Failed to clear link',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// GET /api/applications/stats
router.get('/stats', async (req, res) => {
  try {
    const service = await getApplicationService();
    
    if (!service || !service.getApplicationStats) {
      throw new Error('Failed to load applicationService module');
    }

    console.log('[API] GET /api/applications/stats called', {
      isVercel: !!process.env.VERCEL,
      hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    });
    
    const stats = await service.getApplicationStats();
    console.log('[API SUCCESS] Stats calculated:', stats);
    return res.status(200).json(stats);
  } catch (error) {
    console.error('[API ERROR] Error fetching stats:', error);
    console.error('[API ERROR] Error stack:', error instanceof Error ? error.stack : undefined);
    // Return empty stats with 200 status instead of 500
    return res.status(200).json({
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
    });
  }
});

// GET /api/applications/excel-path
router.get('/excel-path', (req, res) => {
  res.json({ 
    path: process.env.VERCEL ? 'Vercel Blob Storage' : 'data/applications.xlsx',
    storage: process.env.VERCEL ? 'blob' : 'filesystem',
  });
});

// GET /api/applications/download
router.get('/download', async (req, res) => {
  try {
    console.log('[API] GET /api/applications/download called');
    const excel = await getExcelService();
    
    if (!excel || !excel.getExcelFileForDownload) {
      throw new Error('Failed to load excelService module');
    }

    const buffer = await excel.getExcelFileForDownload();
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="applications_${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.setHeader('Content-Length', buffer.length);
    
    console.log('[API SUCCESS] Sending Excel file for download, size:', buffer.length, 'bytes');
    return res.status(200).send(buffer);
  } catch (error) {
    console.error('[API ERROR] Error downloading Excel file:', error);
    return res.status(500).json({
      error: 'Failed to download Excel file',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/applications/restore
router.post('/restore', upload.single('file'), async (req, res) => {
  try {
    const excel = await getExcelService();
    
    if (!excel || !excel.restoreExcelFile) {
      throw new Error('Failed to load excelService module');
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const applications = await excel.restoreExcelFile(req.file.buffer);
    return res.status(200).json({ 
      message: 'Excel file restored successfully', 
      count: applications.length,
      applications 
    });
  } catch (error) {
    console.error('[API ERROR] Error restoring Excel file:', error);
    return res.status(400).json({
      error: 'Failed to restore Excel file',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Express app setup
const app = express();

// Body parsing middleware (must be before routes)
app.use(express.json({ limit: '10mb' }));
app.use(express.raw({ 
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
  limit: '10mb' 
}));

// Mount router at root (paths are already reconstructed in handler)
app.use('/', router);

// 404 handler (must be after all routes)
app.use((req, res) => {
  console.warn('404 - Route not found:', req.method, req.url);
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
      availableRoutes: [
        'GET /',
        'GET /:id',
        'POST /links',
        'PATCH /:id',
        'DELETE /:id',
        'DELETE /:id/hard',
        'DELETE /:id/clear-link',
        'GET /stats',
        'GET /excel-path',
        'GET /download',
        'POST /restore',
      ],
  });
});

// Global error handler (must be last)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Express error:', err);
  if (!res.headersSent) {
    res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

// Vercel handler - This handles /api/applications/* routes
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers immediately for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'false');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Log environment info for debugging
  if (process.env.VERCEL && !process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn('[ENV WARNING] Running on Vercel but BLOB_READ_WRITE_TOKEN is not set. Data will not persist.');
  }

  try {
    // Vercel catch-all routes: /api/applications/[...path] means:
    // - /api/applications -> pathSegments = []
    // - /api/applications/stats -> pathSegments = ['stats']
    // - /api/applications/123 -> pathSegments = ['123']
    const pathSegments = (req.query.path as string[]) || [];
    let pathArray: string[] = [];
    
    if (Array.isArray(pathSegments)) {
      pathArray = pathSegments;
    } else if (typeof pathSegments === 'string') {
      pathArray = [pathSegments];
    }
    
    // Reconstruct the path for Express router
    const path = pathArray.length > 0 ? '/' + pathArray.join('/') : '/';
    const originalUrl = req.url || '/';
    const queryString = originalUrl.includes('?') ? originalUrl.substring(originalUrl.indexOf('?')) : '';
    
    // Set Express-compatible properties
    req.url = path + queryString;
    (req as any).path = path;
    (req as any).originalUrl = path + queryString;
    
    console.log('Vercel handler:', {
      method: req.method,
      originalUrl,
      path,
      pathSegments: pathArray,
      query: req.query,
    });
    
    // Handle the request with Express app
    return new Promise<void>((resolve) => {
      app(req, res, (err?: any) => {
        if (err) {
          console.error('Express error:', err);
          if (!res.headersSent) {
            res.status(500).json({
              error: 'Internal server error',
              message: err instanceof Error ? err.message : 'Unknown error',
            });
          }
        }
        resolve();
      });
    });
  } catch (error) {
    console.error('Handler error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : undefined);
    
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
      });
    }
  }
}
