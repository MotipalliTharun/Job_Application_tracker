import { useState } from 'react';
import { Application, ApplicationStatus, ApplicationPriority } from '../types';
import NotesModal from './NotesModal';

interface ApplicationTableProps {
  applications: Application[];
  onUpdate: (id: string, updates: Partial<Application>) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClearLink: (id: string) => Promise<void>;
}

export default function ApplicationTable({
  applications,
  onUpdate,
  onArchive,
  onDelete,
  onClearLink,
}: ApplicationTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [notesModalOpen, setNotesModalOpen] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleInlineEdit = async (id: string, field: string, value: string) => {
    try {
      await onUpdate(id, { [field]: value });
      setEditingId(null);
      setEditingField(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const handleLinkClick = (url: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleAction = async (action: () => Promise<void>, id: string) => {
    try {
      setProcessingId(id);
      await action();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setProcessingId(null);
    }
  };

  if (applications.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
        <p className="text-gray-500">No applications found. Add some links to get started!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Link</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {applications.map((app) => (
              <tr key={app.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === app.id && editingField === 'url' ? (
                    <input
                      type="text"
                      defaultValue={app.url}
                      onBlur={(e) => handleInlineEdit(app.id, 'url', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleInlineEdit(app.id, 'url', (e.target as HTMLInputElement).value);
                        } else if (e.key === 'Escape') {
                          setEditingId(null);
                          setEditingField(null);
                        }
                      }}
                      className="w-full px-2 py-1 border rounded text-sm"
                      autoFocus
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      {app.url ? (
                        <button
                          onClick={() => handleLinkClick(app.url)}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {app.linkTitle || app.url}
                        </button>
                      ) : (
                        <span className="text-gray-400 italic">No link</span>
                      )}
                      <button
                        onClick={() => {
                          setEditingId(app.id);
                          setEditingField('url');
                        }}
                        className="text-xs text-gray-400 hover:text-gray-600"
                        title="Edit URL"
                      >
                        ✏️
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === app.id && editingField === 'company' ? (
                    <input
                      type="text"
                      defaultValue={app.company || ''}
                      onBlur={(e) => handleInlineEdit(app.id, 'company', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleInlineEdit(app.id, 'company', (e.target as HTMLInputElement).value);
                        } else if (e.key === 'Escape') {
                          setEditingId(null);
                          setEditingField(null);
                        }
                      }}
                      className="w-full px-2 py-1 border rounded text-sm"
                      autoFocus
                    />
                  ) : (
                    <div
                      className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                      onClick={() => {
                        setEditingId(app.id);
                        setEditingField('company');
                      }}
                    >
                      {app.company || <span className="text-gray-400">-</span>}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === app.id && editingField === 'roleTitle' ? (
                    <input
                      type="text"
                      defaultValue={app.roleTitle || ''}
                      onBlur={(e) => handleInlineEdit(app.id, 'roleTitle', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleInlineEdit(app.id, 'roleTitle', (e.target as HTMLInputElement).value);
                        } else if (e.key === 'Escape') {
                          setEditingId(null);
                          setEditingField(null);
                        }
                      }}
                      className="w-full px-2 py-1 border rounded text-sm"
                      autoFocus
                    />
                  ) : (
                    <div
                      className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                      onClick={() => {
                        setEditingId(app.id);
                        setEditingField('roleTitle');
                      }}
                    >
                      {app.roleTitle || <span className="text-gray-400">-</span>}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === app.id && editingField === 'location' ? (
                    <input
                      type="text"
                      defaultValue={app.location || ''}
                      onBlur={(e) => handleInlineEdit(app.id, 'location', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleInlineEdit(app.id, 'location', (e.target as HTMLInputElement).value);
                        } else if (e.key === 'Escape') {
                          setEditingId(null);
                          setEditingField(null);
                        }
                      }}
                      className="w-full px-2 py-1 border rounded text-sm"
                      autoFocus
                    />
                  ) : (
                    <div
                      className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                      onClick={() => {
                        setEditingId(app.id);
                        setEditingField('location');
                      }}
                    >
                      {app.location || <span className="text-gray-400">-</span>}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={app.status}
                    onChange={(e) => onUpdate(app.id, { status: e.target.value as ApplicationStatus })}
                    className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={processingId === app.id}
                  >
                    <option value="TODO">TODO</option>
                    <option value="APPLIED">APPLIED</option>
                    <option value="INTERVIEW">INTERVIEW</option>
                    <option value="OFFER">OFFER</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={app.priority}
                    onChange={(e) => onUpdate(app.id, { priority: e.target.value as ApplicationPriority })}
                    className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={processingId === app.id}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setNotesModalOpen(app.id)}
                      className="text-blue-600 hover:underline"
                      disabled={processingId === app.id}
                    >
                      Notes
                    </button>
                    <button
                      onClick={() => handleAction(() => onClearLink(app.id), app.id)}
                      className="text-orange-600 hover:underline"
                      disabled={processingId === app.id}
                    >
                      Clear Link
                    </button>
                    <button
                      onClick={() => handleAction(() => onArchive(app.id), app.id)}
                      className="text-gray-600 hover:underline"
                      disabled={processingId === app.id}
                    >
                      Archive
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this application?')) {
                          handleAction(() => onDelete(app.id), app.id);
                        }
                      }}
                      className="text-red-600 hover:underline"
                      disabled={processingId === app.id}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {notesModalOpen && (
        <NotesModal
          application={applications.find(a => a.id === notesModalOpen)!}
          onClose={() => setNotesModalOpen(null)}
          onSave={async (notes) => {
            await onUpdate(notesModalOpen, { notes });
            setNotesModalOpen(null);
          }}
        />
      )}
    </div>
  );
}
