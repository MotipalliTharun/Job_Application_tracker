/**
 * Extracts URLs from text using regex pattern
 * Supports http://, https://, www., and common URL patterns
 */
export function extractUrls(text: string): string[] {
  // Comprehensive URL regex pattern
  // Matches: http://, https://, www., and various domain patterns
  // Improved pattern to handle URLs with paths, query params, and fragments
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+|www\.[^\s<>"{}|\\^`\[\]]+|[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}[^\s<>"{}|\\^`\[\]]*)/gi;
  
  const matches = text.match(urlRegex);
  if (!matches) return [];
  
  // Clean and normalize URLs
  return matches
    .map(url => {
      // Remove trailing punctuation that might not be part of URL
      url = url.replace(/[.,;:!?]+$/, '');
      // Remove trailing parentheses, brackets, quotes
      url = url.replace(/[)\]'"]+$/, '');
      // Remove trailing closing braces
      url = url.replace(/[}]+$/, '');
      
      // Add https:// if missing protocol
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        // Only add https:// if it looks like a domain
        if (url.includes('.') && !url.startsWith('.')) {
          url = 'https://' + url;
        } else {
          return null; // Skip if it doesn't look like a valid URL
        }
      }
      
      return url.trim();
    })
    .filter((url): url is string => url !== null && url.length > 0 && isValidUrl(url));
}

/**
 * Basic URL validation
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extracts the first URL from text, or returns the original text if no URL found
 */
export function extractFirstUrl(text: string): string | null {
  const urls = extractUrls(text);
  return urls.length > 0 ? urls[0] : null;
}

/**
 * Parses a line that might contain "Title|URL" format or just text with URL
 * Returns { title?: string, url: string }
 */
export function parseLinkLine(line: string): { title?: string; url: string } | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  
  // Check if it's in "Title|URL" format
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
  
  // Try to extract URL from the line
  const url = extractFirstUrl(trimmed);
  if (url) {
    // Try to extract title (text before the URL)
    const urlIndex = trimmed.toLowerCase().indexOf(url.toLowerCase());
    if (urlIndex > 0) {
      const title = trimmed.substring(0, urlIndex).trim();
      return { title: title || undefined, url };
    }
    return { url };
  }
  
  return null;
}

/**
 * Extracts URLs with titles from text
 * Supports "Title|URL" format or plain text with URLs
 * Returns array of { url: string, linkTitle?: string }
 */
export function extractUrlsWithTitles(text: string): Array<{ url: string; linkTitle?: string }> {
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

/**
 * Extracts the first URL with title from text
 * Returns { url?: string, title?: string }
 */
export function extractFirstUrlWithTitle(text: string): { url?: string; title?: string } {
  const parsed = parseLinkLine(text.trim());
  if (parsed) {
    return {
      url: parsed.url,
      title: parsed.title
    };
  }
  return {};
}

