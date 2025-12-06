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
    <form onSubmit={handleSubmit} className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onPaste={handleUrlPaste}
            placeholder="https://example.com/job"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Job Title"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Adding...' : 'Add Link'}
          </button>
        </div>
      </div>
    </form>
  );
}
