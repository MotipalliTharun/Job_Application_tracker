/**
 * Vercel Serverless Function - Main API Route Handler
 * Handles all /api/applications/* routes
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import {
  getAllApplications,
  createApplicationsFromLinks,
  getApplicationById,
  updateApplication,
  softDeleteApplication,
  hardDeleteApplication,
  clearLink,
  getApplicationStats,
} from '../../server/src/services/applicationService.js';
import { restoreExcelFile } from '../../server/src/services/excelService.js';
import { ApplicationNotFoundError, InvalidApplicationDataError } from '../../server/src/utils/errors.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// CORS middleware
router.use(cors({ 
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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
    console.log('GET /api/applications called', {
      query: req.query,
      isVercel: !!process.env.VERCEL,
      hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    });
    
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

    const applications = await getAllApplications(Object.keys(filters).length > 0 ? filters : undefined);
    console.log(`Returning ${applications.length} applications`);
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : undefined);
    res.status(500).json({
      error: 'Failed to fetch applications',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
    });
  }
});

// GET /api/applications/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const application = await getApplicationById(id);
    res.json(application);
  } catch (error) {
    if (error instanceof ApplicationNotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      console.error('Error fetching application:', error);
      res.status(500).json({
        error: 'Failed to fetch application',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// POST /api/applications/links
router.post('/links', async (req, res) => {
  try {
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

    const newApplications = await createApplicationsFromLinks(linkArray);
    res.status(201).json(newApplications);
  } catch (error) {
    console.error('Error creating applications:', error);
    if (error instanceof InvalidApplicationDataError) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({
        error: 'Failed to create applications',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// PATCH /api/applications/:id
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await updateApplication(id, req.body);
    res.json(updated);
  } catch (error) {
    if (error instanceof ApplicationNotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      console.error('Error updating application:', error);
      res.status(500).json({
        error: 'Failed to update application',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// DELETE /api/applications/:id (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const archived = await softDeleteApplication(id);
    res.json(archived);
  } catch (error) {
    if (error instanceof ApplicationNotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      console.error('Error archiving application:', error);
      res.status(500).json({
        error: 'Failed to archive application',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// DELETE /api/applications/:id/hard (hard delete)
router.delete('/:id/hard', async (req, res) => {
  try {
    const { id } = req.params;
    await hardDeleteApplication(id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof ApplicationNotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      console.error('Error deleting application:', error);
      res.status(500).json({
        error: 'Failed to delete application',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// DELETE /api/applications/:id/clear-link
router.delete('/:id/clear-link', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await clearLink(id);
    res.json(updated);
  } catch (error) {
    if (error instanceof ApplicationNotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      console.error('Error clearing link:', error);
      res.status(500).json({
        error: 'Failed to clear link',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// GET /api/applications/stats
router.get('/stats', async (req, res) => {
  try {
    console.log('GET /api/applications/stats called', {
      isVercel: !!process.env.VERCEL,
      hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    });
    
    const stats = await getApplicationStats();
    console.log('Stats calculated:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : undefined);
    // Return empty stats instead of 500 error
    res.json({
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

// POST /api/applications/restore
router.post('/restore', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const applications = await restoreExcelFile(req.file.buffer);
    res.json({ 
      message: 'Excel file restored successfully', 
      count: applications.length,
      applications 
    });
  } catch (error) {
    console.error('Error restoring Excel file:', error);
    res.status(500).json({
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
  // Set CORS headers immediately
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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
