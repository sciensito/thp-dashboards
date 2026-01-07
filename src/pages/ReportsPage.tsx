import { useState, useEffect } from 'react';
import { FileBarChart, Search, RefreshCw, Loader2, FolderOpen, ChevronRight } from 'lucide-react';
import { supabase, db } from '../lib/supabase';

interface SfReportData {
  id: string;
  sf_report_id: string;
  name: string;
  report_type: string;
  folder_name: string | null;
}

interface SfReportFolder {
  name: string;
  reports: SfReportData[];
}

export function ReportsPage() {
  const [reports, setReports] = useState<SfReportData[]>([]);
  const [folders, setFolders] = useState<SfReportFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const { data, error } = await db.sfReports()
        .select('*')
        .order('folder_name')
        .order('name');

      if (error) throw error;

      const reportList = (data || []) as SfReportData[];
      setReports(reportList);

      // Group by folder
      const folderMap = new Map<string, SfReportData[]>();
      reportList.forEach((report) => {
        const folder = report.folder_name || 'Uncategorized';
        if (!folderMap.has(folder)) {
          folderMap.set(folder, []);
        }
        folderMap.get(folder)!.push(report);
      });

      const folderList = Array.from(folderMap.entries()).map(([name, reports]) => ({
        name,
        reports,
      }));
      setFolders(folderList);
    } catch (err) {
      console.error('Error loading reports:', err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const syncReports = async () => {
    setSyncing(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('salesforce-sync-reports', {
        body: {},
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync reports');
    } finally {
      setSyncing(false);
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.folder_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = !selectedFolder || report.folder_name === selectedFolder;
    return matchesSearch && matchesFolder;
  });

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
          <h1 className="text-2xl font-bold text-neutral-900">Salesforce Reports</h1>
          <p className="text-neutral-500 mt-1">
            Browse and import reports from your Salesforce org
          </p>
        </div>
        <button
          onClick={syncReports}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
        >
          {syncing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <RefreshCw className="w-5 h-5" />
          )}
          Sync Reports
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reports..."
            className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileBarChart className="w-8 h-8 text-neutral-400" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">
            No reports synced yet
          </h3>
          <p className="text-neutral-500 mb-6 max-w-sm mx-auto">
            Click "Sync Reports" to fetch your Salesforce reports
          </p>
          <button
            onClick={syncReports}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {syncing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
            Sync Reports
          </button>
        </div>
      ) : (
        <div className="flex gap-6">
          {/* Folder sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-neutral-200 p-3">
              <button
                onClick={() => setSelectedFolder(null)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !selectedFolder
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <FolderOpen className="w-4 h-4" />
                All Reports
                <span className="ml-auto text-xs bg-neutral-200 px-2 py-0.5 rounded-full">
                  {reports.length}
                </span>
              </button>
              {folders.map((folder) => (
                <button
                  key={folder.name}
                  onClick={() => setSelectedFolder(folder.name)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedFolder === folder.name
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  <FolderOpen className="w-4 h-4" />
                  <span className="truncate">{folder.name}</span>
                  <span className="ml-auto text-xs bg-neutral-200 px-2 py-0.5 rounded-full">
                    {folder.reports.length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Reports list */}
          <div className="flex-1">
            <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-200">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 hover:bg-neutral-50 transition-colors cursor-pointer flex items-center gap-4"
                >
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileBarChart className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-neutral-900 truncate">
                      {report.name}
                    </h3>
                    <p className="text-sm text-neutral-500">
                      {report.report_type} report
                      {report.folder_name && ` • ${report.folder_name}`}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-400" />
                </div>
              ))}
              {filteredReports.length === 0 && (
                <div className="p-8 text-center text-neutral-500">
                  No reports match your search
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
