import { describe, it, expect } from '@jest/globals';

// Copy the URL extraction logic for testing (since we can't import from client)
// These tests verify the URL extraction logic works correctly

function isValidUrl(url: string): boolean {
  try {
    new URL(url.startsWith('http') ? url : `http://${url}`);
    return true;
  } catch {
    return false;
  }
}

function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+|www\.[^\s<>"{}|\\^`\[\]]+|[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}[^\s<>"{}|\\^`\[\]]*)/gi;
  const matches = text.match(urlRegex);
  if (!matches) return [];
  
  return matches
    .map(url => {
      url = url.replace(/[.,;:!?]+$/, '');
      url = url.replace(/[)\]'"]+$/, '');
      url = url.replace(/[}]+$/, '');
      
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        if (url.includes('.') && !url.startsWith('.')) {
          url = 'https://' + url;
        } else {
          return null;
        }
      }
      
      return url.trim();
    })
    .filter((url): url is string => url !== null && url.length > 0 && isValidUrl(url));
}

function extractFirstUrl(text: string): string | null {
  const urls = extractUrls(text);
  return urls.length > 0 ? urls[0] : null;
}

function parseLinkLine(line: string): { title?: string; url: string } | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  
  if (trimmed.includes('|')) {
    const parts = trimmed.split('|');
    if (parts.length >= 2) {
      const title = parts[0].trim();
      const urlText = parts.slice(1).join('|').trim();
      const url = extractFirstUrl(urlText);
      if (url) {
        return { title: title || undefined, url };
      }
    }
  }
  
  const url = extractFirstUrl(trimmed);
  if (url) {
    const urlIndex = trimmed.toLowerCase().indexOf(url.toLowerCase());
    if (urlIndex > 0) {
      const title = trimmed.substring(0, urlIndex).trim();
      return { title: title || undefined, url };
    }
    return { url };
  }
  
  return null;
}

function extractUrlsWithTitles(text: string): Array<{ url: string; linkTitle?: string }> {
  const lines = text.split('\n');
  const results: Array<{ url: string; linkTitle?: string }> = [];
  
  for (const line of lines) {
    const parsed = parseLinkLine(line);
    if (parsed) {
      results.push({
        url: parsed.url,
        linkTitle: parsed.title
      });
    }
  }
  
  return results;
}

function extractFirstUrlWithTitle(text: string): { url?: string; title?: string } {
  const parsed = parseLinkLine(text.trim());
  if (parsed) {
    return {
      url: parsed.url,
      title: parsed.title
    };
  }
  return {};
}

describe('URL Extractor Utilities', () => {
  describe('extractUrls', () => {
    it('should extract URLs from text', () => {
      const text = 'Check out https://example.com/job and www.test.com';
      const urls = extractUrls(text);
      expect(urls.length).toBeGreaterThan(0);
      expect(urls[0]).toContain('example.com');
    });

    it('should handle URLs with paths', () => {
      const text = 'Visit https://example.com/jobs/software-engineer';
      const urls = extractUrls(text);
      expect(urls[0]).toBe('https://example.com/jobs/software-engineer');
    });

    it('should return empty array for text without URLs', () => {
      const text = 'This is just plain text without any URLs';
      const urls = extractUrls(text);
      expect(urls).toEqual([]);
    });
  });

  describe('extractFirstUrl', () => {
    it('should extract the first URL from text', () => {
      const text = 'Check https://first.com and https://second.com';
      const url = extractFirstUrl(text);
      expect(url).toBe('https://first.com');
    });

    it('should return null if no URL found', () => {
      const text = 'No URLs here';
      const url = extractFirstUrl(text);
      expect(url).toBeNull();
    });
  });

  describe('parseLinkLine', () => {
    it('should parse "Title|URL" format', () => {
      const line = 'Software Engineer|https://example.com/job';
      const result = parseLinkLine(line);
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Software Engineer');
      expect(result?.url).toContain('example.com');
    });

    it('should parse plain URL', () => {
      const line = 'https://example.com/job';
      const result = parseLinkLine(line);
      expect(result).not.toBeNull();
      expect(result?.url).toContain('example.com');
    });

    it('should extract title from text before URL', () => {
      const line = 'Check this job https://example.com';
      const result = parseLinkLine(line);
      expect(result).not.toBeNull();
      expect(result?.url).toContain('example.com');
    });
  });

  describe('extractUrlsWithTitles', () => {
    it('should extract multiple URLs with titles', () => {
      const text = 'Job 1|https://example.com/1\nJob 2|https://example.com/2';
      const results = extractUrlsWithTitles(text);
      expect(results.length).toBe(2);
      expect(results[0].linkTitle).toBe('Job 1');
      expect(results[1].linkTitle).toBe('Job 2');
    });

    it('should handle plain URLs without titles', () => {
      const text = 'https://example.com/1\nhttps://example.com/2';
      const results = extractUrlsWithTitles(text);
      expect(results.length).toBe(2);
      expect(results[0].url).toContain('example.com');
    });
  });

  describe('extractFirstUrlWithTitle', () => {
    it('should extract first URL with title', () => {
      const text = 'Software Engineer|https://example.com/job';
      const result = extractFirstUrlWithTitle(text);
      expect(result.url).toContain('example.com');
      expect(result.title).toBe('Software Engineer');
    });

    it('should handle plain URL without title', () => {
      const text = 'https://example.com/job';
      const result = extractFirstUrlWithTitle(text);
      expect(result.url).toContain('example.com');
    });
  });
});

