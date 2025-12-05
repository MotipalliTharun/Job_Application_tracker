import { useState } from 'react';
import { extractFirstUrl, parseLinkLine } from '../utils/urlExtractor';

interface LinkFormProps {
  onAddLink: (url: string, title?: string) => void;
}

export default function LinkForm({ onAddLink }: LinkFormProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');

  const handleUrlPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    const extractedUrl = extractFirstUrl(pastedText);
    
    if (extractedUrl) {
      e.preventDefault();
      setUrl(extractedUrl);
      
      // Try to extract title from pasted text
      const parsed = parseLinkLine(pastedText);
      if (parsed && parsed.title && !title) {
        setTitle(parsed.title);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Extract URL from input if it contains text with URL
    const extractedUrl = extractFirstUrl(url) || url.trim();
    
    if (extractedUrl) {
      onAddLink(extractedUrl, title.trim() || undefined);
      setUrl('');
      setTitle('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-sm border">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Link Title (optional)"
          className="sm:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onPaste={handleUrlPaste}
          placeholder="Paste job link URL or any text with URL..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add Link
        </button>
      </div>
    </form>
  );
}

