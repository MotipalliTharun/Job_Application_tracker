import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getApplicationStats } from '../../server/src/services/applicationService.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: `Method ${req.method} not allowed. Only GET is supported.`,
    });
  }

  try {
    console.log('GET /api/applications/stats called', {
      isVercel: !!process.env.VERCEL,
      hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    });
    
    const stats = await getApplicationStats();
    console.log('Stats calculated successfully:', { total: stats.total });
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : undefined);
    
    // Return empty stats instead of 500 to prevent frontend crashes
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
}
