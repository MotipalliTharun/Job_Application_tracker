import { useState } from 'react';
import { Application, ApplicationStatus, ApplicationPriority } from '../types';
import StatusBadge from './StatusBadge';
import NotesModal from './NotesModal';

interface ApplicationTableProps {
  applications: Application[];
  onUpdate: (id: string, updates: Partial<Application>) => void;
  onSoftDelete: (id: string) => void;
  onHardDelete: (id: string) => void;
}

export default function ApplicationTable({
  applications,
  onUpdate,
  onSoftDelete,
  onHardDelete,
}: ApplicationTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Application>>({});
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const startEdit = (app: Application) => {
    setEditingId(app.id);
    setEditForm({
      linkTitle: app.linkTitle || '',
      url: app.url || '',
      company: app.company || '',
      roleTitle: app.roleTitle || '',
      location: app.location || '',
      notes: app.notes || '',
      appliedDate: app.appliedDate ? app.appliedDate.split('T')[0] : '',
      interviewDate: app.interviewDate ? app.interviewDate.split('T')[0] : '',
    });
  };

  const saveEdit = (id: string) => {
    const updates: Partial<Application> = {
      linkTitle: editForm.linkTitle || undefined,
      url: editForm.url || undefined,
      company: editForm.company || undefined,
      roleTitle: editForm.roleTitle || undefined,
      location: editForm.location || undefined,
      notes: editForm.notes || undefined,
      appliedDate: editForm.appliedDate ? new Date(editForm.appliedDate).toISOString() : undefined,
      interviewDate: editForm.interviewDate ? new Date(editForm.interviewDate).toISOString() : undefined,
    };
    onUpdate(id, updates);
    setEditingId(null);
    setEditForm({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (applications.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">
        No applications found. Add some job links to get started!
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Link</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interview</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {applications.map((app) => (
              <tr key={app.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  {editingId === app.id ? (
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={editForm.linkTitle || ''}
                        onChange={(e) => setEditForm({ ...editForm, linkTitle: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        placeholder="Link Title"
                      />
                      <input
                        type="text"
                        value={editForm.url || ''}
                        onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        placeholder="URL"
                      />
                    </div>
                  ) : (
                    <div>
                      {app.url ? (
                        <>
                          <a
                            href={app.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-sm"
                          >
                            {app.linkTitle || app.url}
                          </a>
                          {app.linkTitle && (
                            <div className="text-xs text-gray-400 truncate max-w-xs mt-1" title={app.url}>
                              {app.url}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-gray-400 italic">No link</span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {editingId === app.id ? (
                    <input
                      type="text"
                      value={editForm.company || ''}
                      onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      placeholder="Company"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-900">
                      {app.company || <span className="text-gray-400">-</span>}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === app.id ? (
                    <input
                      type="text"
                      value={editForm.roleTitle || ''}
                      onChange={(e) => setEditForm({ ...editForm, roleTitle: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      placeholder="Role Title"
                    />
                  ) : (
                    <div className="text-sm text-gray-900">{app.roleTitle || <span className="text-gray-400">-</span>}</div>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {editingId === app.id ? (
                    <input
                      type="text"
                      value={editForm.location || ''}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      placeholder="Location"
                    />
                  ) : (
                    <div className="text-sm text-gray-500">{app.location || <span className="text-gray-400">-</span>}</div>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {editingId === app.id ? (
                    <select
                      value={app.status}
                      onChange={(e) => onUpdate(app.id, { status: e.target.value as ApplicationStatus })}
                      className="px-2 py-1 text-sm border border-gray-300 rounded"
                    >
                      <option value="TODO">TODO</option>
                      <option value="APPLIED">APPLIED</option>
                      <option value="INTERVIEW">INTERVIEW</option>
                      <option value="OFFER">OFFER</option>
                      <option value="REJECTED">REJECTED</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  ) : (
                    <StatusBadge status={app.status} />
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {editingId === app.id ? (
                    <select
                      value={app.priority}
                      onChange={(e) => onUpdate(app.id, { priority: e.target.value as ApplicationPriority })}
                      className="px-2 py-1 text-sm border border-gray-300 rounded"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                    </select>
                  ) : (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      app.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                      app.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {app.priority}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {editingId === app.id ? (
                    <input
                      type="date"
                      value={editForm.appliedDate || ''}
                      onChange={(e) => setEditForm({ ...editForm, appliedDate: e.target.value })}
                      className="px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  ) : (
                    formatDate(app.appliedDate)
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {editingId === app.id ? (
                    <input
                      type="date"
                      value={editForm.interviewDate || ''}
                      onChange={(e) => setEditForm({ ...editForm, interviewDate: e.target.value })}
                      className="px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  ) : (
                    formatDate(app.interviewDate)
                  )}
                </td>
                <td className="px-4 py-3 max-w-xs">
                  {app.notes ? (
                    <div className="text-sm text-gray-600 truncate" title={app.notes}>
                      {app.notes.substring(0, 50)}{app.notes.length > 50 ? '...' : ''}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                  <button
                    onClick={() => {
                      setSelectedApp(app);
                      setNotesModalOpen(true);
                    }}
                    className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                    title="Edit notes"
                  >
                    {app.notes ? '✏️ Edit' : '➕ Add'}
                  </button>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  {editingId === app.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => saveEdit(app.id)}
                        className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(app)}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onUpdate(app.id, { status: 'APPLIED' })}
                        className="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs"
                        title="Mark as Applied"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => onSoftDelete(app.id)}
                        className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 text-xs"
                        title="Archive"
                      >
                        📦
                      </button>
                      <button
                        onClick={() => onUpdate(app.id, { url: '', linkTitle: undefined })}
                        className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs"
                        title="Clear Link (removes URL only)"
                      >
                        🔗×
                      </button>
                      <button
                        onClick={() => onHardDelete(app.id)}
                        className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                        title="Delete Entire Application"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <NotesModal
        isOpen={notesModalOpen}
        application={selectedApp}
        onClose={() => {
          setNotesModalOpen(false);
          setSelectedApp(null);
        }}
        onSave={(id, notes) => onUpdate(id, { notes })}
      />
    </div>
  );
}

