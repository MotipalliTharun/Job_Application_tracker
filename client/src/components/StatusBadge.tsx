import { ApplicationStatus } from '../types';

interface StatusBadgeProps {
  status: ApplicationStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const colors = {
    TODO: 'bg-gray-100 text-gray-800',
    APPLIED: 'bg-blue-100 text-blue-800',
    INTERVIEW: 'bg-green-100 text-green-800',
    OFFER: 'bg-purple-100 text-purple-800',
    REJECTED: 'bg-red-100 text-red-800',
    ARCHIVED: 'bg-gray-200 text-gray-900',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}
    >
      {status}
    </span>
  );
}

