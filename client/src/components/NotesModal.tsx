import { useState, useEffect } from 'react';
import { Application } from '../types';

interface NotesModalProps {
  application: Application;
  onClose: () => void;
  onSave: (notes: string) => Promise<void>;
}

export default function NotesModal({ application, onClose, onSave }: NotesModalProps) {
  const [notes, setNotes] = useState(application.notes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNotes(application.notes || '');
  }, [application]);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      await onSave(notes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save notes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Edit Notes</h2>
          <p className="text-sm text-gray-600 mt-1">
            {application.company || application.roleTitle || application.url}
          </p>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Add notes about this application..."
            disabled={loading}
          />
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
