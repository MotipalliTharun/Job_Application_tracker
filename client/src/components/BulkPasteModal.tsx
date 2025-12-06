import { useState } from 'react';
import { extractUrlsWithTitles } from '../utils/urlExtractor';

interface BulkPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (links: Array<{ url: string; linkTitle?: string }>) => Promise<void>;
}

export default function BulkPasteModal({ isOpen, onClose, onSubmit }: BulkPasteModalProps) {
  const [links, setLinks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Array<{ url: string; linkTitle?: string }>>([]);

  if (!isOpen) return null;

  const handlePreview = () => {
    const parsedLinks = extractUrlsWithTitles(links);
    setPreview(parsedLinks);
    if (parsedLinks.length === 0) {
      setError('No valid links found in the pasted text.');
    } else {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLinks = extractUrlsWithTitles(links);
    
    if (parsedLinks.length === 0) {
      setError('No valid links found in the pasted text.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('[BULK MODAL] Submitting links:', parsedLinks.length);
      await onSubmit(parsedLinks);
      console.log('[BULK MODAL] Links added successfully');
      setLinks('');
      setPreview([]);
      onClose();
    } catch (err) {
      console.error('[BULK MODAL ERROR] Failed to add links:', err);
      setError(err instanceof Error ? err.message : 'Failed to add links');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Bulk Add Links</h2>
          <p className="text-sm text-gray-600 mt-1">
            Paste multiple links (one per line) or use "Title|URL" format
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 flex-1 overflow-y-auto">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste Links
              </label>
              <textarea
                value={links}
                onChange={(e) => {
                  setLinks(e.target.value);
                  setPreview([]);
                  setError(null);
                }}
                placeholder="https://example.com/job1&#10;Software Engineer|https://example.com/job2&#10;https://example.com/job3"
                className="w-full h-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                disabled={loading}
              />
              <button
                type="button"
                onClick={handlePreview}
                className="mt-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                disabled={loading || !links.trim()}
              >
                Preview ({preview.length} links)
              </button>
            </div>

            {preview.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Preview:</h3>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50">
                  {preview.map((link, index) => (
                    <div key={index} className="text-sm py-1">
                      <span className="font-medium">{link.linkTitle || 'No title'}</span>
                      <span className="text-gray-500 mx-2">→</span>
                      <span className="text-blue-600">{link.url}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || preview.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : `Add ${preview.length || 'Links'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
