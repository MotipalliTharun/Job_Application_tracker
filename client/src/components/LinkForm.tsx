import { useState } from 'react';
import { extractFirstUrlWithTitle, normalizeUrl } from '../utils/urlExtractor';

interface LinkFormProps {
  onAddLink: (url: string, title?: string) => Promise<void>;
}

export default function LinkForm({ onAddLink }: LinkFormProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('URL is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const extracted = extractFirstUrlWithTitle(url);
      // Normalize URL - add https:// if missing
      const finalUrl = extracted.url ? extracted.url : normalizeUrl(url);
      const finalTitle = extracted.title || title || undefined;
      
      console.log('[LINKFORM] Submitting:', { url: finalUrl, title: finalTitle });
      await onAddLink(finalUrl, finalTitle);
      console.log('[LINKFORM] Link added successfully');
      setUrl('');
      setTitle('');
    } catch (err) {
      console.error('[LINKFORM ERROR] Failed to add link:', err);
      setError(err instanceof Error ? err.message : 'Failed to add link');
    } finally {
      setLoading(false);
    }
  };

  const handleUrlPaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    const extracted = extractFirstUrlWithTitle(pastedText);
    if (extracted.url) {
      setUrl(extracted.url);
      if (extracted.title) {
        setTitle(extracted.title);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 bg-white rounded-xl shadow-sm border-2 border-gray-200 p-5">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onPaste={handleUrlPaste}
            placeholder="Paste job link here..."
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 text-sm"
            required
            disabled={loading}
          />
        </div>
        <div className="flex-1">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Job title (optional)"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 text-sm"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold whitespace-nowrap"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Adding...
            </span>
          ) : (
            '➕ Add Link'
          )}
        </button>
      </div>
    </form>
  );
}
