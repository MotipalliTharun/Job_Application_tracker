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
    <div className="mb-6 bg-white rounded-xl shadow-sm border-2 border-gray-200 p-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="🔍 Search applications..."
            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 text-sm"
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as ApplicationStatus | 'ALL')}
            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 text-sm font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="TODO">📝 TODO</option>
            <option value="APPLIED">✅ APPLIED</option>
            <option value="INTERVIEW">💼 INTERVIEW</option>
            <option value="OFFER">🎉 OFFER</option>
            <option value="REJECTED">❌ REJECTED</option>
            <option value="ARCHIVED">📦 ARCHIVED</option>
          </select>
        </div>
        <button
          onClick={onBulkPasteClick}
          className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-semibold whitespace-nowrap"
        >
          📋 Bulk Paste
        </button>
      </div>
    </div>
  );
}
