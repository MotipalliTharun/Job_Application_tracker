import { ApplicationStatus } from '../types';

interface StatusBadgeProps {
  status: ApplicationStatus;
  size?: 'sm' | 'md' | 'lg';
}

const statusColors: Record<ApplicationStatus, string> = {
  TODO: 'bg-gray-100 text-gray-800 border-gray-300',
  APPLIED: 'bg-blue-100 text-blue-800 border-blue-300',
  INTERVIEW: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  OFFER: 'bg-green-100 text-green-800 border-green-300',
  REJECTED: 'bg-red-100 text-red-800 border-red-300',
  ARCHIVED: 'bg-gray-200 text-gray-600 border-gray-400',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full font-medium border ${statusColors[status]} ${sizeClasses[size]}`}>
      {status}
    </span>
  );
}
