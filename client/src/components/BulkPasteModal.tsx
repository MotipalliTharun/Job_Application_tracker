import { useState } from 'react';
import { parseLinkLine } from '../utils/urlExtractor';

interface BulkPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (links: string[]) => void;
}

export default function BulkPasteModal({ isOpen, onClose, onSubmit }: BulkPasteModalProps) {
  const [links, setLinks] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = links.split('\n');
    
    // Extract URLs from each line, handling "Title|URL" format or plain text with URLs
    const linkArray: string[] = [];
    
    for (const line of lines) {
      const parsed = parseLinkLine(line);
      if (parsed) {
        // Format as "Title|URL" if title exists, otherwise just URL
        if (parsed.title) {
          linkArray.push(`${parsed.title}|${parsed.url}`);
        } else {
          linkArray.push(parsed.url);
        }
      }
    }
    
    if (linkArray.length > 0) {
      onSubmit(linkArray);
      setLinks('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Paste Job Links</h2>
          <p className="text-sm text-gray-600 mt-1">
            Paste text with links - URLs will be automatically extracted. Format: "Title|URL" or any text containing URLs
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="flex-1 p-6">
            <textarea
              value={links}
              onChange={(e) => setLinks(e.target.value)}
              placeholder="Check out this job: https://careers.google.com/job/123&#10;Software Engineer - Google|https://example.com/job/2&#10;Visit www.example.com/jobs for more info"
              className="w-full h-full min-h-[200px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>
          
          <div className="px-6 py-4 border-t flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setLinks('');
                onClose();
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add Links
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

