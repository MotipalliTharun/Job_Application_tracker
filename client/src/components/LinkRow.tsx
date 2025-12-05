import { useState } from 'react';
import { Application, ApplicationStatus, ApplicationPriority } from '../types';
import StatusBadge from './StatusBadge';

interface LinkRowProps {
  application: Application;
  onUpdate: (id: string, updates: Partial<Application>) => void;
  onSoftDelete: (id: string) => void;
  onHardDelete: (id: string) => void;
}

export default function LinkRow({
  application,
  onUpdate,
  onSoftDelete,
  onHardDelete,
}: LinkRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCompany, setEditedCompany] = useState(application.company || '');
  const [editedRoleTitle, setEditedRoleTitle] = useState(application.roleTitle || '');
  const [editedNotes, setEditedNotes] = useState(application.notes || '');

  const handleSave = () => {
    onUpdate(application.id, {
      company: editedCompany || undefined,
      roleTitle: editedRoleTitle || undefined,
      notes: editedNotes || undefined,
    });
    setIsEditing(false);
  };

  const handleStatusChange = (newStatus: ApplicationStatus) => {
    onUpdate(application.id, { status: newStatus });
  };

  const handlePriorityChange = (newPriority: ApplicationPriority) => {
    onUpdate(application.id, { priority: newPriority });
  };

  return (
    <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left column - Main info */}
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <a
                  href={application.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline break-all"
                >
                  {application.url}
                </a>
                <a
                  href={application.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Open
                </a>
              </div>
              
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editedCompany}
                    onChange={(e) => setEditedCompany(e.target.value)}
                    placeholder="Company"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    value={editedRoleTitle}
                    onChange={(e) => setEditedRoleTitle(e.target.value)}
                    placeholder="Role Title"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    placeholder="Notes"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedCompany(application.company || '');
                        setEditedRoleTitle(application.roleTitle || '');
                        setEditedNotes(application.notes || '');
                      }}
                      className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {application.company && (
                    <div className="text-sm font-medium text-gray-900">{application.company}</div>
                  )}
                  {application.roleTitle && (
                    <div className="text-sm text-gray-600">{application.roleTitle}</div>
                  )}
                  {application.location && (
                    <div className="text-xs text-gray-500">{application.location}</div>
                  )}
                  {application.notes && (
                    <div className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{application.notes}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column - Controls */}
        <div className="lg:w-64 space-y-2">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={application.status} />
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              application.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
              application.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {application.priority}
            </span>
          </div>

          {!isEditing && (
            <>
              <div className="flex flex-col gap-2">
                <select
                  value={application.status}
                  onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="TODO">TODO</option>
                  <option value="APPLIED">APPLIED</option>
                  <option value="INTERVIEW">INTERVIEW</option>
                  <option value="OFFER">OFFER</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>

                <select
                  value={application.priority}
                  onChange={(e) => handlePriorityChange(e.target.value as ApplicationPriority)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </select>
              </div>

              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => handleStatusChange('APPLIED')}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Mark Applied
                </button>
                <button
                  onClick={() => handleStatusChange('TODO')}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Mark TODO
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => onSoftDelete(application.id)}
                  className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                >
                  Archive
                </button>
                <button
                  onClick={() => onHardDelete(application.id)}
                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

