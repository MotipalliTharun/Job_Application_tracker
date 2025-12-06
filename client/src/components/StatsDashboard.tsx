import { useEffect, useState } from 'react';
import { api } from '../utils/api';

interface ApplicationStats {
  total: number;
  byStatus: {
    TODO: number;
    APPLIED: number;
    INTERVIEW: number;
    OFFER: number;
    REJECTED: number;
    ARCHIVED: number;
  };
  byPriority: {
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  recentApplications: number;
}

export default function StatsDashboard() {
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.get<ApplicationStats>('/stats');
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="mb-6 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error || 'Failed to load statistics'}
      </div>
    );
  }

  return (
    <div className="mb-6 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold mb-4 text-gray-900">Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
          <div className="text-sm font-medium text-blue-700 mb-1">Total Applications</div>
          <div className="text-3xl font-bold text-blue-900">{stats.total}</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
          <div className="text-sm font-medium text-green-700 mb-1">Active (TODO + APPLIED)</div>
          <div className="text-3xl font-bold text-green-900">
            {stats.byStatus.TODO + stats.byStatus.APPLIED}
          </div>
        </div>
        <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
          <div className="text-sm font-medium text-yellow-700 mb-1">In Progress</div>
          <div className="text-3xl font-bold text-yellow-900">{stats.byStatus.INTERVIEW}</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
          <div className="text-sm font-medium text-purple-700 mb-1">Recent (7 days)</div>
          <div className="text-3xl font-bold text-purple-900">{stats.recentApplications}</div>
        </div>
      </div>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-2 text-gray-700">By Status</h3>
          <div className="space-y-2 text-sm">
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center">
                <span className="text-gray-600">{status}:</span>
                <span className="font-semibold text-gray-900">{String(count)}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2 text-gray-700">By Priority</h3>
          <div className="space-y-2 text-sm">
            {Object.entries(stats.byPriority).map(([priority, count]) => (
              <div key={priority} className="flex justify-between items-center">
                <span className="text-gray-600">{priority}:</span>
                <span className="font-semibold text-gray-900">{String(count)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
