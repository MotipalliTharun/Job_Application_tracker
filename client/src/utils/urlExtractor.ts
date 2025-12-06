/**
 * URL Extraction Utilities
 * Extracts URLs and titles from text input
 */

const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+\/[^\s]*)/g;
const TITLE_URL_SPLIT_REGEX = /^(.*?)\s*\|\s*(https?:\/\/[^\s]+)$/;

function isValidUrl(url: string): boolean {
  try {
    new URL(url.startsWith('http') ? url : `http://${url}`);
    return true;
  } catch (e) {
    return false;
  }
}

export function extractUrlsWithTitles(text: string): Array<{ url: string; linkTitle?: string }> {
  const lines = text.split('\n');
  const results: Array<{ url: string; linkTitle?: string }> = [];

  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    const titleUrlMatch = trimmedLine.match(TITLE_URL_SPLIT_REGEX);
    if (titleUrlMatch) {
      const title = titleUrlMatch[1].trim();
      const url = titleUrlMatch[2].trim();
      if (isValidUrl(url)) {
        results.push({ url, linkTitle: title || undefined });
      }
    } else {
      const urlsInLine = Array.from(trimmedLine.matchAll(URL_REGEX)).map(match => match[0]);
      if (urlsInLine.length > 0) {
        const firstUrl = urlsInLine[0];
        const textBeforeUrl = trimmedLine.substring(0, trimmedLine.indexOf(firstUrl)).trim();
        if (isValidUrl(firstUrl)) {
          results.push({ url: firstUrl, linkTitle: textBeforeUrl || undefined });
        }
      } else if (isValidUrl(trimmedLine)) {
        results.push({ url: trimmedLine });
      }
    }
  });
  return results;
}

export function extractFirstUrlWithTitle(text: string): { url?: string; title?: string } {
  const trimmedText = text.trim();
  if (!trimmedText) return {};

  const titleUrlMatch = trimmedText.match(TITLE_URL_SPLIT_REGEX);
  if (titleUrlMatch) {
    const title = titleUrlMatch[1].trim();
    const url = titleUrlMatch[2].trim();
    return { url: isValidUrl(url) ? url : undefined, title: title || undefined };
  }

  const urlMatch = trimmedText.match(URL_REGEX);
  if (urlMatch && urlMatch[0]) {
    const url = urlMatch[0];
    const textBeforeUrl = trimmedText.substring(0, trimmedText.indexOf(url)).trim();
    return { url: isValidUrl(url) ? url : undefined, title: textBeforeUrl || undefined };
  }

  return { url: isValidUrl(trimmedText) ? trimmedText : undefined };
}
