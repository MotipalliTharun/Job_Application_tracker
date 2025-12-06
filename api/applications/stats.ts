import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers immediately
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: `Method ${req.method} not allowed. Only GET is supported.`,
    });
  }

  try {
    console.log('[STATS] GET /api/applications/stats called', {
      isVercel: !!process.env.VERCEL,
      vercelEnv: process.env.VERCEL_ENV,
      hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
      blobTokenLength: process.env.BLOB_READ_WRITE_TOKEN?.length || 0,
    });

    // Dynamic import to handle potential module loading issues
    let getApplicationStats;
    try {
      const applicationService = await import('../../server/src/services/applicationService.js');
      getApplicationStats = applicationService.getApplicationStats;
    } catch (importError) {
      console.error('[STATS ERROR] Failed to import applicationService:', importError);
      throw new Error(`Failed to load application service: ${importError instanceof Error ? importError.message : 'Unknown error'}`);
    }

    if (!getApplicationStats) {
      throw new Error('getApplicationStats function not found in applicationService');
    }

    const stats = await getApplicationStats();
    console.log('[STATS SUCCESS] Stats calculated:', { 
      total: stats.total,
      recent: stats.recentApplications,
    });

    // Ensure response is sent
    return res.status(200).json(stats);
  } catch (error) {
    console.error('[STATS ERROR] Error fetching stats:', error);
    console.error('[STATS ERROR] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : undefined,
      stack: error instanceof Error ? error.stack : undefined,
      isVercel: !!process.env.VERCEL,
      hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    });

    // Return empty stats with 200 status instead of 500 to prevent frontend crashes
    const emptyStats = {
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
    };

    // Always return 200 with empty stats, never 500
    return res.status(200).json(emptyStats);
  }
}
