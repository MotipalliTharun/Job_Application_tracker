import { useState, useEffect } from 'react';
import { Application } from '../types';

interface NotesModalProps {
  isOpen: boolean;
  application: Application | null;
  onClose: () => void;
  onSave: (id: string, notes: string) => void;
}

export default function NotesModal({ isOpen, application, onClose, onSave }: NotesModalProps) {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (application) {
      setNotes(application.notes || '');
    }
  }, [application]);

  if (!isOpen || !application) return null;

  const handleSave = () => {
    onSave(application.id, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Notes</h2>
          <p className="text-sm text-gray-600 mt-1">
            {application.company || 'Application'} - {application.roleTitle || 'No role title'}
          </p>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your notes here..."
            className="w-full h-full min-h-[200px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={10}
          />
        </div>
        
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Save Notes
          </button>
        </div>
      </div>
    </div>
  );
}

