/**
 * Local Development Server
 * This is only used for local development
 * On Vercel, the API routes in /api are used instead
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
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
} from './services/applicationService.js';
import { restoreExcelFile } from './services/excelService.js';
import { ApplicationNotFoundError, InvalidApplicationDataError } from './utils/errors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.raw({ 
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
  limit: '10mb' 
}));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
// GET /api/applications
app.get('/api/applications', async (req, res) => {
  try {
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
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      error: 'Failed to fetch applications',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/applications/:id
app.get('/api/applications/:id', async (req, res) => {
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
app.post('/api/applications/links', async (req, res) => {
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
app.patch('/api/applications/:id', async (req, res) => {
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
app.delete('/api/applications/:id', async (req, res) => {
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
app.delete('/api/applications/:id/hard', async (req, res) => {
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
app.delete('/api/applications/:id/clear-link', async (req, res) => {
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
app.get('/api/applications/stats', async (req, res) => {
  try {
    const stats = await getApplicationStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/applications/excel-path
app.get('/api/applications/excel-path', (req, res) => {
  res.json({ 
    path: process.env.VERCEL ? 'Vercel Blob Storage' : 'data/applications.xlsx',
    storage: process.env.VERCEL ? 'blob' : 'filesystem',
  });
});

// POST /api/applications/restore
app.post('/api/applications/restore', upload.single('file'), async (req, res) => {
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err instanceof Error ? err.message : 'Unknown error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api/applications`);
});

