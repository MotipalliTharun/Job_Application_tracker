import { useState, useRef } from 'react';
import { ApplicationStatus } from './types';
import Layout from './components/Layout';
import LinkForm from './components/LinkForm';
import FiltersBar from './components/FiltersBar';
import ApplicationTable from './components/ApplicationTable';
import BulkPasteModal from './components/BulkPasteModal';
import StatsDashboard from './components/StatsDashboard';
import TodoDashboard, { TodoDashboardRef } from './components/TodoDashboard';
import { useApplications } from './hooks/useApplications';

function App() {
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const todoDashboardRef = useRef<TodoDashboardRef>(null);

  const {
    applications,
    loading,
    error: fetchError,
    addLink,
    addLinks,
    updateApplication,
    archiveApplication,
    deleteApplication,
    clearLink,
  } = useApplications({ statusFilter, search });

  const handleError = (err: Error) => {
    setError(err.message);
    setTimeout(() => setError(null), 5000);
  };

  const handleAddLink = async (url: string, title?: string) => {
    try {
      console.log('[APP] Adding link:', { url, title });
      await addLink(url, title);
      console.log('[APP] Link added successfully, refreshing...');
      // Ensure we're showing TODO items (new links default to TODO)
      if (statusFilter !== 'ALL' && statusFilter !== 'TODO') {
        setStatusFilter('TODO');
      }
      // Refresh TODO dashboard
      if (todoDashboardRef.current) {
        todoDashboardRef.current.refresh();
      }
    } catch (err) {
      console.error('[APP ERROR] Failed to add link:', err);
      handleError(err instanceof Error ? err : new Error('Failed to add link'));
      throw err;
    }
  };

  const handleAddLinks = async (links: Array<{ url: string; linkTitle?: string }>) => {
    try {
      console.log('[APP] Adding links:', links.length);
      await addLinks(links);
      console.log('[APP] Links added successfully, refreshing...');
      // Ensure we're showing TODO items (new links default to TODO)
      if (statusFilter !== 'ALL' && statusFilter !== 'TODO') {
        setStatusFilter('TODO');
      }
      // Refresh TODO dashboard
      if (todoDashboardRef.current) {
        todoDashboardRef.current.refresh();
      }
    } catch (err) {
      console.error('[APP ERROR] Failed to add links:', err);
      handleError(err instanceof Error ? err : new Error('Failed to add links'));
      throw err;
    }
  };

  const handleUpdate = async (id: string, updates: Partial<import('./types').Application>) => {
    try {
      await updateApplication(id, updates);
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Failed to update'));
      throw err;
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveApplication(id);
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Failed to archive'));
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteApplication(id);
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Failed to delete'));
      throw err;
    }
  };

  const handleClearLink = async (id: string) => {
    try {
      console.log('[APP] Clearing link for application:', id);
      await clearLink(id);
      console.log('[APP] Link cleared successfully');
    } catch (err) {
      console.error('[APP ERROR] Failed to clear link:', err);
      handleError(err instanceof Error ? err : new Error('Failed to clear link'));
      throw err;
    }
  };

  return (
    <Layout>
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {fetchError && (
        <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg">
          {fetchError}
        </div>
      )}

      <StatsDashboard />

      <LinkForm onAddLink={handleAddLink} />

      {/* TODO Links Dashboard - Shows all TODO links, refreshes when links are added */}
      <TodoDashboard 
        ref={todoDashboardRef}
        onRefresh={() => {
          // Trigger refresh of main applications list if needed
          console.log('[APP] TodoDashboard requested refresh');
        }} 
      />

      <FiltersBar
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        search={search}
        onSearchChange={setSearch}
        onBulkPasteClick={() => setIsBulkModalOpen(true)}
      />

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading applications...</p>
        </div>
      ) : (
        <ApplicationTable
          applications={applications}
          onUpdate={handleUpdate}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onClearLink={handleClearLink}
        />
      )}

      <BulkPasteModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSubmit={handleAddLinks}
      />
    </Layout>
  );
}

export default App;
