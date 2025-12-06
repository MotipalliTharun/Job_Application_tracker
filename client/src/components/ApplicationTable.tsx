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
      setProcessingId(id);
      const updates: any = { [field]: value };
      
      if (field === 'url' && value.trim()) {
        updates[field] = value.trim();
      }
      
      await onUpdate(id, updates);
      setEditingId(null);
      setEditingField(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update';
      alert(errorMessage);
      console.error('[TABLE ERROR] Failed to update:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleLinkClick = (url: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleAction = async (action: () => Promise<void>, id: string, actionName: string = 'Action') => {
    try {
      setProcessingId(id);
      console.log(`[TABLE] Executing ${actionName} for application:`, id);
      await action();
      console.log(`[TABLE] ✅ ${actionName} completed successfully`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `${actionName} failed`;
      console.error(`[TABLE ERROR] ${actionName} failed:`, err);
      alert(`Error: ${errorMessage}\n\nPlease try again. If the problem persists, refresh the page.`);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status: ApplicationStatus): string => {
    const colors: Record<ApplicationStatus, string> = {
      TODO: 'bg-gray-100 text-gray-700 border-gray-300',
      APPLIED: 'bg-blue-100 text-blue-700 border-blue-300',
      INTERVIEW: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      OFFER: 'bg-green-100 text-green-700 border-green-300',
      REJECTED: 'bg-red-100 text-red-700 border-red-300',
      ARCHIVED: 'bg-gray-200 text-gray-600 border-gray-400',
    };
    return colors[status];
  };

  const getPriorityColor = (priority: ApplicationPriority): string => {
    const colors: Record<ApplicationPriority, string> = {
      LOW: 'bg-green-100 text-green-700',
      MEDIUM: 'bg-yellow-100 text-yellow-700',
      HIGH: 'bg-red-100 text-red-700',
    };
    return colors[priority];
  };

  if (applications.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="text-6xl mb-4">📋</div>
        <p className="text-gray-500 text-lg">No applications yet</p>
        <p className="text-gray-400 text-sm mt-2">Add your first job link to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {applications.map((app) => (
        <div
          key={app.id}
          className={`bg-white rounded-lg border-2 transition-all duration-200 ${
            processingId === app.id
              ? 'border-blue-300 shadow-md opacity-75'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
          }`}
        >
          <div className="p-4">
            {/* Main Content Row */}
            <div className="flex items-start justify-between gap-4">
              {/* Left: Link and Details */}
              <div className="flex-1 min-w-0">
                {/* Link Section */}
                <div className="mb-3">
                  {editingId === app.id && editingField === 'url' ? (
                    <input
                      type="text"
                      defaultValue={app.url || ''}
                      onBlur={(e) => handleInlineEdit(app.id, 'url', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleInlineEdit(app.id, 'url', (e.target as HTMLInputElement).value);
                        } else if (e.key === 'Escape') {
                          setEditingId(null);
                          setEditingField(null);
                        }
                      }}
                      className="w-full px-3 py-2 border-2 border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      autoFocus
                      placeholder="Enter URL"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      {app.url && app.url.trim() ? (
                        <a
                          href={app.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            e.preventDefault();
                            handleLinkClick(app.url);
                          }}
                          className="text-lg font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-2 group"
                          title={app.url}
                        >
                          <span>🔗</span>
                          <span className="truncate">{app.linkTitle || app.url}</span>
                        </a>
                      ) : (
                        <span className="text-gray-400 italic">No link</span>
                      )}
                      <button
                        onClick={() => {
                          setEditingId(app.id);
                          setEditingField('url');
                        }}
                        className="text-gray-400 hover:text-gray-600 text-sm"
                        title="Edit URL"
                      >
                        ✏️
                      </button>
                    </div>
                  )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  {/* Company */}
                  <div>
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
                        className="w-full px-2 py-1 border-2 border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        autoFocus
                        placeholder="Company"
                      />
                    ) : (
                      <div
                        className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded -ml-2"
                        onClick={() => {
                          setEditingId(app.id);
                          setEditingField('company');
                        }}
                      >
                        <div className="text-xs text-gray-500 mb-0.5">Company</div>
                        <div className="text-sm font-medium text-gray-900">
                          {app.company || <span className="text-gray-400">—</span>}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Role */}
                  <div>
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
                        className="w-full px-2 py-1 border-2 border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        autoFocus
                        placeholder="Role"
                      />
                    ) : (
                      <div
                        className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded -ml-2"
                        onClick={() => {
                          setEditingId(app.id);
                          setEditingField('roleTitle');
                        }}
                      >
                        <div className="text-xs text-gray-500 mb-0.5">Role</div>
                        <div className="text-sm font-medium text-gray-900">
                          {app.roleTitle || <span className="text-gray-400">—</span>}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Location */}
                  <div>
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
                        className="w-full px-2 py-1 border-2 border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        autoFocus
                        placeholder="Location"
                      />
                    ) : (
                      <div
                        className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded -ml-2"
                        onClick={() => {
                          setEditingId(app.id);
                          setEditingField('location');
                        }}
                      >
                        <div className="text-xs text-gray-500 mb-0.5">Location</div>
                        <div className="text-sm font-medium text-gray-900">
                          {app.location || <span className="text-gray-400">—</span>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes Preview */}
                {app.notes && (
                  <div className="text-xs text-gray-500 mb-2 line-clamp-1">
                    📝 {app.notes.substring(0, 60)}{app.notes.length > 60 ? '...' : ''}
                  </div>
                )}
              </div>

              {/* Right: Status, Priority, Actions */}
              <div className="flex flex-col items-end gap-3 flex-shrink-0">
                {/* Status and Priority */}
                <div className="flex flex-col items-end gap-2">
                  <select
                    value={app.status}
                    onChange={async (e) => {
                      try {
                        setProcessingId(app.id);
                        await onUpdate(app.id, { status: e.target.value as ApplicationStatus });
                      } catch (err) {
                        const errorMessage = err instanceof Error ? err.message : 'Failed to update status';
                        alert(errorMessage);
                        console.error('[TABLE ERROR] Failed to update status:', err);
                      } finally {
                        setProcessingId(null);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${getStatusColor(app.status)}`}
                    disabled={processingId === app.id}
                  >
                    <option value="TODO">TODO</option>
                    <option value="APPLIED">APPLIED</option>
                    <option value="INTERVIEW">INTERVIEW</option>
                    <option value="OFFER">OFFER</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>

                  <select
                    value={app.priority}
                    onChange={async (e) => {
                      try {
                        setProcessingId(app.id);
                        await onUpdate(app.id, { priority: e.target.value as ApplicationPriority });
                      } catch (err) {
                        const errorMessage = err instanceof Error ? err.message : 'Failed to update priority';
                        alert(errorMessage);
                        console.error('[TABLE ERROR] Failed to update priority:', err);
                      } finally {
                        setProcessingId(null);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${getPriorityColor(app.priority)}`}
                    disabled={processingId === app.id}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setNotesModalOpen(app.id)}
                    className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    disabled={processingId === app.id}
                    title="Edit notes"
                  >
                    📝
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Clear the link URL?')) {
                        handleAction(() => onClearLink(app.id), app.id, 'Clear Link');
                      }
                    }}
                    className="px-2 py-1 text-xs text-orange-600 hover:bg-orange-50 rounded transition-colors"
                    disabled={processingId === app.id || !app.url}
                    title="Clear link"
                  >
                    🔗
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Archive this application?')) {
                        handleAction(() => onArchive(app.id), app.id, 'Archive');
                      }
                    }}
                    className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 rounded transition-colors"
                    disabled={processingId === app.id}
                    title="Archive"
                  >
                    📦
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('⚠️ Permanently delete this application?')) {
                        handleAction(() => onDelete(app.id), app.id, 'Delete');
                      }
                    }}
                    className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                    disabled={processingId === app.id}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>

                {processingId === app.id && (
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

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
