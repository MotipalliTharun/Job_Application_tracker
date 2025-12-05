import { Application } from '../types';
import LinkRow from './LinkRow';

interface LinkTableProps {
  applications: Application[];
  onUpdate: (id: string, updates: Partial<Application>) => void;
  onSoftDelete: (id: string) => void;
  onHardDelete: (id: string) => void;
}

export default function LinkTable({
  applications,
  onUpdate,
  onSoftDelete,
  onHardDelete,
}: LinkTableProps) {
  if (applications.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">
        No applications found. Add some job links to get started!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((application) => (
        <LinkRow
          key={application.id}
          application={application}
          onUpdate={onUpdate}
          onSoftDelete={onSoftDelete}
          onHardDelete={onHardDelete}
        />
      ))}
    </div>
  );
}

