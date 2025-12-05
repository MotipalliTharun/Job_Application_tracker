import { ApplicationStatus } from '../types';

interface FiltersBarProps {
  statusFilter: ApplicationStatus | 'ALL';
  onStatusChange: (status: ApplicationStatus | 'ALL') => void;
  search: string;
  onSearchChange: (search: string) => void;
  onOpenBulkPaste: () => void;
}

export default function FiltersBar({
  statusFilter,
  onStatusChange,
  search,
  onSearchChange,
  onOpenBulkPaste,
}: FiltersBarProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border mb-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            id="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by company, role, notes, or URL..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="sm:w-48">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as ApplicationStatus | 'ALL')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="TODO">TODO</option>
            <option value="APPLIED">APPLIED</option>
            <option value="INTERVIEW">INTERVIEW</option>
            <option value="OFFER">OFFER</option>
            <option value="REJECTED">REJECTED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>
        
        <div className="flex items-end gap-2">
          <button
            onClick={onOpenBulkPaste}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            📋 Paste Links
          </button>
        </div>
      </div>
    </div>
  );
}

