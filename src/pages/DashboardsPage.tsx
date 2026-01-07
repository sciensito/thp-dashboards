import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, LayoutDashboard, Clock, MoreVertical } from 'lucide-react';
import { db } from '../lib/supabase';
import type { Dashboard } from '../types/database';

export function DashboardsPage() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboards();
  }, []);

  const loadDashboards = async () => {
    try {
      const { data, error } = await db.dashboards()
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDashboards(data || []);
    } catch (err) {
      console.error('Error loading dashboards:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Dashboards</h1>
          <p className="text-neutral-500 mt-1">
            Create and manage your Salesforce report dashboards
          </p>
        </div>
        <Link
          to="/dashboards/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Dashboard
        </Link>
      </div>

      {/* Dashboard grid */}
      {dashboards.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LayoutDashboard className="w-8 h-8 text-neutral-400" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">
            No dashboards yet
          </h3>
          <p className="text-neutral-500 mb-6 max-w-sm mx-auto">
            Create your first dashboard by importing a Salesforce report
          </p>
          <Link
            to="/dashboards/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Dashboard
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboards.map((dashboard) => (
            <Link
              key={dashboard.id}
              to={`/dashboards/${dashboard.id}`}
              className="bg-white rounded-xl border border-neutral-200 p-6 hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 text-blue-600" />
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    // TODO: Open menu
                  }}
                  className="p-1 rounded hover:bg-neutral-100 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-5 h-5 text-neutral-400" />
                </button>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1">
                {dashboard.name}
              </h3>
              {dashboard.description && (
                <p className="text-sm text-neutral-500 mb-4 line-clamp-2">
                  {dashboard.description}
                </p>
              )}
              <div className="flex items-center gap-1 text-xs text-neutral-400">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  Updated{' '}
                  {new Date(dashboard.updated_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
