import { useState, useEffect } from 'react';
import { Application } from '../types';
import { api } from '../utils/api';
import StatusBadge from './StatusBadge';

interface TodoDashboardProps {
  onRefresh?: () => void;
}

export default function TodoDashboard({ onRefresh }: TodoDashboardProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchTodoApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[TODO DASHBOARD] Fetching TODO applications...');
      
      const data = await api.get<Application[]>('/?status=TODO');
      console.log('[TODO DASHBOARD] Received applications:', data.length);
      
      setApplications(data);
      setLastRefresh(new Date());
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch TODO applications';
      setError(errorMessage);
      console.error('[TODO DASHBOARD ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodoApplications();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchTodoApplications, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLinkClick = (url: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleRefresh = () => {
    fetchTodoApplications();
  };

  if (loading && applications.length === 0) {
    return (
      <div className="mb-6 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">TODO Links Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">
            {applications.length} {applications.length === 1 ? 'link' : 'links'} to review
            {lastRefresh && (
              <span className="ml-2 text-gray-400">
                • Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <span>🔄</span>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {applications.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500 text-lg mb-2">No TODO links yet</p>
          <p className="text-gray-400 text-sm">Add some links to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <div
              key={app.id}
              className="p-4 bg-gradient-to-r from-blue-50 to-white rounded-lg border border-blue-200 hover:border-blue-300 transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    {app.url && app.url.trim() ? (
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.preventDefault();
                          handleLinkClick(app.url);
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-semibold text-lg flex items-center gap-2 group"
                        title={app.url}
                      >
                        <span className="text-2xl">🔗</span>
                        <span className="truncate max-w-md">
                          {app.linkTitle || app.url}
                        </span>
                        <span className="text-xs text-gray-400 group-hover:text-gray-600">
                          (opens in new tab)
                        </span>
                      </a>
                    ) : (
                      <span className="text-gray-400 italic">No link</span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    {app.company && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Company:</span>
                        <span>{app.company}</span>
                      </div>
                    )}
                    {app.roleTitle && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Role:</span>
                        <span>{app.roleTitle}</span>
                      </div>
                    )}
                    {app.location && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Location:</span>
                        <span>{app.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <StatusBadge status={app.status} />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Priority:</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        app.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                        app.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {app.priority}
                      </span>
                    </div>
                  </div>

                  {app.notes && (
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Notes:</span> {app.notes}
                    </div>
                  )}

                  {app.createdAt && (
                    <div className="mt-2 text-xs text-gray-400">
                      Added: {new Date(app.createdAt).toLocaleDateString()} {new Date(app.createdAt).toLocaleTimeString()}
                    </div>
                  )}
                </div>

                {app.url && (
                  <div className="flex-shrink-0">
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.preventDefault();
                        handleLinkClick(app.url);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors inline-flex items-center gap-2"
                    >
                      <span>🔗</span>
                      <span>Open Link</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

