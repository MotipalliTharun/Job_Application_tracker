import { useEffect, useState } from 'react';

interface Stats {
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
}

export default function StatsDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    fetch('/api/applications/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching stats:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStats();
    
    // Listen for stats refresh events
    const handleRefresh = () => fetchStats();
    window.addEventListener('stats-refresh', handleRefresh);
    
    return () => {
      window.removeEventListener('stats-refresh', handleRefresh);
    };
  }, []);

  if (loading) {
    return <div className="text-center py-4">Loading stats...</div>;
  }

  if (!stats) return null;

  const statusColors = {
    TODO: 'bg-gray-100 text-gray-800',
    APPLIED: 'bg-blue-100 text-blue-800',
    INTERVIEW: 'bg-green-100 text-green-800',
    OFFER: 'bg-purple-100 text-purple-800',
    REJECTED: 'bg-red-100 text-red-800',
    ARCHIVED: 'bg-gray-200 text-gray-900',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="text-sm text-gray-600 mb-1">Total Applications</div>
        <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="text-sm text-gray-600 mb-2">By Status</div>
        <div className="space-y-1">
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <div key={status} className="flex justify-between items-center">
              <span className={`text-xs px-2 py-0.5 rounded ${statusColors[status as keyof typeof statusColors]}`}>
                {status}
              </span>
              <span className="font-semibold">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="text-sm text-gray-600 mb-2">By Priority</div>
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-800">HIGH</span>
            <span className="font-semibold">{stats.byPriority.HIGH}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">MEDIUM</span>
            <span className="font-semibold">{stats.byPriority.MEDIUM}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-800">LOW</span>
            <span className="font-semibold">{stats.byPriority.LOW}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="text-sm text-gray-600 mb-2">Active Pipeline</div>
        <div className="text-2xl font-bold text-blue-600">
          {stats.byStatus.TODO + stats.byStatus.APPLIED + stats.byStatus.INTERVIEW}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {stats.byStatus.OFFER > 0 && `${stats.byStatus.OFFER} Offer${stats.byStatus.OFFER > 1 ? 's' : ''}`}
        </div>
      </div>
    </div>
  );
}

