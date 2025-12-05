// Vercel serverless function entry point
import express from 'express';
import cors from 'cors';
import applicationsRouter from '../routes/applications.js';

const app = express();

app.use(cors({
  origin: process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

app.use('/api/applications', applicationsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Export as Vercel serverless function
export default app;

