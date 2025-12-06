import type { VercelRequest, VercelResponse } from '@vercel/node';

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

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: `Method ${req.method} not allowed. Only POST is supported.`,
    });
  }

  try {
    console.log('[LINKS] POST /api/applications/links called', {
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
      isVercel: !!process.env.VERCEL,
      vercelEnv: process.env.VERCEL_ENV,
      hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
      blobTokenLength: process.env.BLOB_READ_WRITE_TOKEN?.length || 0,
    });

    // Dynamic import to handle potential module loading issues
    let applicationService;
    let errorUtils;
    try {
      applicationService = await import('../../server/src/services/applicationService.js');
      errorUtils = await import('../../server/src/utils/errors.js');
    } catch (importError) {
      console.error('[LINKS ERROR] Failed to import modules:', importError);
      throw new Error(`Failed to load application service: ${importError instanceof Error ? importError.message : 'Unknown error'}`);
    }

    if (!applicationService || !applicationService.createApplicationsFromLinks) {
      throw new Error('createApplicationsFromLinks function not found in applicationService');
    }
    
    const { links, linksWithTitles } = req.body;
    
    if (!req.body || (!links && !linksWithTitles)) {
      console.error('[LINKS ERROR] Invalid request: missing links or linksWithTitles');
      return res.status(400).json({
        error: 'Invalid request format',
        message: 'Request body must contain either "links" or "linksWithTitles"',
      });
    }
    
    let linkArray: string[] = [];

    if (linksWithTitles && Array.isArray(linksWithTitles)) {
      linkArray = linksWithTitles.map((item: { url: string; linkTitle?: string }) => {
        return item.linkTitle ? `${item.linkTitle}|${item.url}` : item.url;
      });
    } else if (Array.isArray(links)) {
      linkArray = links;
    } else {
      console.error('[LINKS ERROR] Invalid request: links/linksWithTitles not arrays');
      return res.status(400).json({
        error: 'Invalid request format',
        message: 'Request body must contain either "links" or "linksWithTitles" as arrays',
      });
    }

    if (linkArray.length === 0) {
      return res.status(400).json({
        error: 'Empty links array',
        message: 'At least one link is required',
      });
    }

    console.log(`[LINKS] Creating ${linkArray.length} applications from links`);
    const newApplications = await applicationService.createApplicationsFromLinks(linkArray);
    console.log(`[LINKS SUCCESS] Successfully created ${newApplications.length} applications`);
    return res.status(201).json(newApplications);
  } catch (error) {
    console.error('[LINKS ERROR] Error creating applications:', error);
    console.error('[LINKS ERROR] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : undefined,
      stack: error instanceof Error ? error.stack : undefined,
      isVercel: !!process.env.VERCEL,
      hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    });

    // Try to get error utils for proper error type checking
    let errorUtils;
    try {
      errorUtils = await import('../../server/src/utils/errors.js');
    } catch (importError) {
      // If we can't import error utils, just treat as generic error
    }

    if (errorUtils && error instanceof errorUtils.InvalidApplicationDataError) {
      return res.status(400).json({ error: error.message });
    } else {
      // Return 400 instead of 500 to prevent frontend crashes
      return res.status(400).json({
        error: 'Failed to create applications',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
      });
    }
  }
}
