// Specific route handler for POST /api/applications/links
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  createApplicationsFromLinks,
} from '../../server/src/services/applicationService.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ 
      error: 'Method Not Allowed',
      message: `Method ${req.method} not allowed. Only POST is supported.`
    });
  }

  try {
    console.log('POST /api/applications/links called', { 
      body: req.body,
      method: req.method,
      url: req.url,
      headers: req.headers
    });
    
    // Check if body is parsed correctly
    if (!req.body) {
      console.error('Request body is missing or not parsed');
      return res.status(400).json({ error: 'Request body is required' });
    }
    
    const { links, linksWithTitles } = req.body;
    console.log('Parsed body:', { links, linksWithTitles, hasLinks: !!links, hasLinksWithTitles: !!linksWithTitles });
    
    // Support both formats: array of strings or array of {url, linkTitle}
    let linkArray: string[] = [];
    if (linksWithTitles && Array.isArray(linksWithTitles)) {
      // Format: [{url: "...", linkTitle: "..."}, ...]
      console.log(`Processing ${linksWithTitles.length} links with titles`);
      linkArray = linksWithTitles.map((item: { url: string; linkTitle?: string }) => {
        return item.linkTitle ? `${item.linkTitle}|${item.url}` : item.url;
      });
    } else if (Array.isArray(links)) {
      console.log(`Processing ${links.length} plain links`);
      linkArray = links;
    } else {
      console.error('Invalid request format - neither links nor linksWithTitles is a valid array');
      return res.status(400).json({ 
        error: 'Invalid request format',
        message: 'Request body must contain either "links" (array of strings) or "linksWithTitles" (array of {url, linkTitle})'
      });
    }
    
    if (linkArray.length === 0) {
      return res.status(400).json({ error: 'links must be a non-empty array' });
    }
    
    console.log(`Creating ${linkArray.length} applications from links`);
    const newApplications = await createApplicationsFromLinks(linkArray);
    console.log(`Successfully created ${newApplications.length} applications`);
    res.status(201).json(newApplications);
  } catch (error) {
    console.error('Error creating applications:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? error.stack : undefined;
    res.status(500).json({ 
      error: 'Failed to create applications',
      message: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { details: errorDetails })
    });
  }
}

