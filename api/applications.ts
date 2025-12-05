// Vercel serverless function for /api/applications
import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {
  getAllApplications,
  createApplicationsFromLinks,
  updateApplication,
  softDeleteApplication,
  hardDeleteApplication,
} from '../server/src/services/applicationService.js';
import { Application, ApplicationStatus } from '../server/src/models/Application.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const EXCEL_FILE_PATH = path.join(projectRoot, 'data', 'applications.xlsx');

// GET /api/applications
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    let applications = await getAllApplications();
    
    // Filter by status
    if (status && typeof status === 'string') {
      applications = applications.filter(app => app.status === status);
    }
    
    // Search in company, roleTitle, notes
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      applications = applications.filter(app =>
        app.company?.toLowerCase().includes(searchLower) ||
        app.roleTitle?.toLowerCase().includes(searchLower) ||
        app.notes?.toLowerCase().includes(searchLower) ||
        app.url.toLowerCase().includes(searchLower)
      );
    }
    
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// POST /api/applications/links
router.post('/links', async (req, res) => {
  try {
    const { links, linksWithTitles } = req.body;
    
    // Support both formats: array of strings or array of {url, linkTitle}
    let linkArray: string[] = [];
    if (linksWithTitles && Array.isArray(linksWithTitles)) {
      // Format: [{url: "...", linkTitle: "..."}, ...]
      linkArray = linksWithTitles.map((item: { url: string; linkTitle?: string }) => {
        return item.linkTitle ? `${item.linkTitle}|${item.url}` : item.url;
      });
    } else if (Array.isArray(links)) {
      linkArray = links;
    }
    
    if (linkArray.length === 0) {
      return res.status(400).json({ error: 'links must be a non-empty array' });
    }
    
    const newApplications = await createApplicationsFromLinks(linkArray);
    res.status(201).json(newApplications);
  } catch (error) {
    console.error('Error creating applications:', error);
    res.status(500).json({ error: 'Failed to create applications' });
  }
});

// PATCH /api/applications/:id
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Remove id, createdAt from updates (these shouldn't be changed)
    const { id: _, createdAt: __, ...allowedUpdates } = updates;
    
    const updated = await updateApplication(id, allowedUpdates);
    res.json(updated);
  } catch (error) {
    console.error('Error updating application:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update application' });
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
    console.error('Error soft deleting application:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to soft delete application' });
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
    console.error('Error hard deleting application:', error);
    res.status(500).json({ error: 'Failed to hard delete application' });
  }
});

// GET /api/applications/stats
router.get('/stats', async (req, res) => {
  try {
    const applications = await getAllApplications();
    const stats = {
      total: applications.length,
      byStatus: {
        TODO: applications.filter(a => a.status === 'TODO').length,
        APPLIED: applications.filter(a => a.status === 'APPLIED').length,
        INTERVIEW: applications.filter(a => a.status === 'INTERVIEW').length,
        OFFER: applications.filter(a => a.status === 'OFFER').length,
        REJECTED: applications.filter(a => a.status === 'REJECTED').length,
        ARCHIVED: applications.filter(a => a.status === 'ARCHIVED').length,
      },
      byPriority: {
        HIGH: applications.filter(a => a.priority === 'HIGH').length,
        MEDIUM: applications.filter(a => a.priority === 'MEDIUM').length,
        LOW: applications.filter(a => a.priority === 'LOW').length,
      },
    };
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET /api/applications/excel-path
router.get('/excel-path', (req, res) => {
  res.json({ path: EXCEL_FILE_PATH });
});

const app = express();

app.use(cors({
  origin: '*', // Allow all origins for Vercel deployment
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.raw({ type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', limit: '10mb' }));

app.use('/', router);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}
