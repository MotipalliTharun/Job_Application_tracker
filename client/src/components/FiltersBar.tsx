import { ApplicationStatus } from '../types';

interface FiltersBarProps {
  statusFilter: ApplicationStatus | 'ALL';
  onStatusFilterChange: (status: ApplicationStatus | 'ALL') => void;
  search: string;
  onSearchChange: (search: string) => void;
  onBulkPasteClick: () => void;
}

export default function FiltersBar({
  statusFilter,
  onStatusFilterChange,
  search,
  onSearchChange,
  onBulkPasteClick,
}: FiltersBarProps) {
  return (
    <div className="mb-6 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as ApplicationStatus | 'ALL')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search applications..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={onBulkPasteClick}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
          >
            📋 Paste Links
          </button>
        </div>
      </div>
    </div>
  );
}
