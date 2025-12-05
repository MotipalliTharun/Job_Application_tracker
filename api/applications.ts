// Vercel serverless function for /api/applications
import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import applicationsRouter from '../../server/src/routes/applications.js';

const app = express();

app.use(cors({
  origin: '*', // Allow all origins for Vercel deployment
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.raw({ type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', limit: '10mb' }));

app.use('/', applicationsRouter);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}

