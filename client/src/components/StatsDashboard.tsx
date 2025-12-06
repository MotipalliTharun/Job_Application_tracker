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
    <div className="mb-6 bg-white rounded-xl shadow-sm border-2 border-gray-200 p-4">
      <div className="flex flex-wrap gap-4 justify-center">
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
          <span className="text-lg">📊</span>
          <div>
            <div className="text-xs text-gray-600">Total</div>
            <div className="text-xl font-bold text-gray-900">{stats.total}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-lg">
          <span className="text-lg">✅</span>
          <div>
            <div className="text-xs text-blue-700">Active</div>
            <div className="text-xl font-bold text-blue-900">
              {stats.byStatus.TODO + stats.byStatus.APPLIED}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 rounded-lg">
          <span className="text-lg">💼</span>
          <div>
            <div className="text-xs text-yellow-700">Interview</div>
            <div className="text-xl font-bold text-yellow-900">{stats.byStatus.INTERVIEW}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-lg">
          <span className="text-lg">🆕</span>
          <div>
            <div className="text-xs text-purple-700">Recent</div>
            <div className="text-xl font-bold text-purple-900">{stats.recentApplications}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
