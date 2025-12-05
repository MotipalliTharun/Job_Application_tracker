import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import FiltersBar from './components/FiltersBar';
import ApplicationTable from './components/ApplicationTable';
import StatsDashboard from './components/StatsDashboard';
import BulkPasteModal from './components/BulkPasteModal';
import LinkForm from './components/LinkForm';
import UpdateIndicator from './components/UpdateIndicator';
import { Application, ApplicationStatus } from './types';

// Use environment variable for API base URL, fallback to relative path
const API_BASE = import.meta.env.VITE_API_URL || '/api/applications';

function App() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }
      if (search) {
        params.append('search', search);
      }
      
      const url = `${API_BASE}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }
      
      const data = await response.json();
      setApplications(data);
      setFilteredApplications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, search]);

  const handleAddLinks = async (links: string[]) => {
    try {
      const response = await fetch(`${API_BASE}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ links }),
      });

      if (!response.ok) {
        throw new Error('Failed to add links');
      }

      await fetchApplications();
      setIsBulkModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add links');
      console.error('Error adding links:', err);
    }
  };

  const handleAddLinksWithTitles = async (linksWithTitles: Array<{ url: string; linkTitle?: string }>) => {
    try {
      const response = await fetch(`${API_BASE}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linksWithTitles }),
      });

      if (!response.ok) {
        throw new Error('Failed to add links');
      }

      await fetchApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add links');
      console.error('Error adding links:', err);
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Application>) => {
    try {
      setError(null);
      setIsUpdating(true);
      
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update application');
      }

      // Update saved to Excel - refresh data
      await fetchApplications();
      // Trigger stats refresh
      window.dispatchEvent(new Event('stats-refresh'));
      
      // Show success indicator
      setTimeout(() => setIsUpdating(false), 100);
    } catch (err) {
      setIsUpdating(false);
      setError(err instanceof Error ? err.message : 'Failed to update application');
      console.error('Error updating application:', err);
    }
  };

  const handleSoftDelete = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to soft delete application');
      }

      await fetchApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to soft delete application');
      console.error('Error soft deleting application:', err);
    }
  };

  const handleHardDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this application?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/${id}/hard`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to hard delete application');
      }

      await fetchApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to hard delete application');
      console.error('Error hard deleting application:', err);
    }
  };

  return (
    <Layout>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <FiltersBar
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        search={search}
        onSearchChange={setSearch}
        onOpenBulkPaste={() => setIsBulkModalOpen(true)}
      />

      <StatsDashboard />

      <div className="mt-4 mb-6">
        <LinkForm onAddLink={(url, title) => {
          if (title) {
            handleAddLinksWithTitles([{ url, linkTitle: title }]);
          } else {
            handleAddLinks([url]);
          }
        }} />
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <ApplicationTable
          applications={filteredApplications}
          onUpdate={handleUpdate}
          onSoftDelete={handleSoftDelete}
          onHardDelete={handleHardDelete}
        />
      )}

      <BulkPasteModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSubmit={handleAddLinks}
      />

      <UpdateIndicator isUpdating={isUpdating} />
    </Layout>
  );
}

export default App;

