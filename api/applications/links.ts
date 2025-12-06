import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApplicationsFromLinks } from '../../server/src/services/applicationService.js';
import { InvalidApplicationDataError } from '../../server/src/utils/errors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: `Method ${req.method} not allowed. Only POST is supported.`,
    });
  }

  try {
    console.log('POST /api/applications/links called', {
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
      isVercel: !!process.env.VERCEL,
      hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    });
    
    const { links, linksWithTitles } = req.body;
    
    if (!req.body || (!links && !linksWithTitles)) {
      console.error('Invalid request: missing links or linksWithTitles');
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
      console.error('Invalid request: links/linksWithTitles not arrays');
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

    console.log(`Creating ${linkArray.length} applications from links`);
    const newApplications = await createApplicationsFromLinks(linkArray);
    console.log(`Successfully created ${newApplications.length} applications`);
    res.status(201).json(newApplications);
  } catch (error) {
    console.error('Error creating applications:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : undefined);
    
    if (error instanceof InvalidApplicationDataError) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({
        error: 'Failed to create applications',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
      });
    }
  }
}
