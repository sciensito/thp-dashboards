import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileBarChart, Loader2, Sparkles, Check } from 'lucide-react';
import { db } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface SfReportData {
  id: string;
  sf_report_id: string;
  name: string;
  report_type: string;
  folder_name: string | null;
}

interface WidgetSuggestion {
  widget_type: string;
  title: string;
  config: Record<string, unknown>;
  position: { x: number; y: number; w: number; h: number };
}

export function NewDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<'select' | 'configure' | 'generating'>('select');
  const [reports, setReports] = useState<SfReportData[]>([]);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [dashboardName, setDashboardName] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
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
      setReports((data || []) as SfReportData[]);
    } catch {
      setError('Failed to load reports. Make sure Salesforce is connected.');
    } finally {
      setLoading(false);
    }
  };

  const toggleReport = (sfReportId: string) => {
    setSelectedReports(prev =>
      prev.includes(sfReportId)
        ? prev.filter(id => id !== sfReportId)
        : [...prev, sfReportId]
    );
  };

  const generateWidgetSuggestions = (report: SfReportData, index: number): WidgetSuggestion[] => {
    const suggestions: WidgetSuggestion[] = [];
    const row = Math.floor(index / 2) * 3;
    const col = (index % 2) * 6;

    switch (report.report_type) {
      case 'summary':
        suggestions.push({
          widget_type: 'bar',
          title: report.name,
          config: { showGrid: true, showLegend: false },
          position: { x: col, y: row, w: 6, h: 3 },
        });
        break;
      case 'matrix':
        suggestions.push({
          widget_type: 'table',
          title: report.name,
          config: { sortable: true, maxRows: 10 },
          position: { x: col, y: row, w: 6, h: 3 },
        });
        break;
      case 'tabular':
      default:
        suggestions.push({
          widget_type: 'table',
          title: report.name,
          config: { sortable: true, maxRows: 10 },
          position: { x: col, y: row, w: 6, h: 3 },
        });
        break;
    }

    return suggestions;
  };

  const createDashboard = async () => {
    if (!user || selectedReports.length === 0 || !dashboardName.trim()) return;

    setGenerating(true);
    setStep('generating');
    setError(null);

    try {
      const { data: dashboard, error: dashboardError } = await db.dashboards()
        .insert({
          user_id: user.id,
          name: dashboardName.trim(),
          description: `Auto-generated from ${selectedReports.length} Salesforce report(s)`,
          layout: { columns: 12, rowHeight: 100 },
          is_public: false,
        })
        .select()
        .single();

      if (dashboardError) throw dashboardError;

      const selectedReportDetails = reports.filter(r =>
        selectedReports.includes(r.sf_report_id)
      );

      const widgets: Array<{
        dashboard_id: string;
        sf_report_id: string;
        widget_type: string;
        title: string;
        config: Record<string, unknown>;
        position: { x: number; y: number; w: number; h: number };
      }> = [];

      selectedReportDetails.forEach((report, index) => {
        const suggestions = generateWidgetSuggestions(report, index);
        suggestions.forEach(suggestion => {
          widgets.push({
            dashboard_id: (dashboard as { id: string }).id,
            sf_report_id: report.sf_report_id,
            ...suggestion,
          });
        });
      });

      if (widgets.length > 0) {
        const { error: widgetsError } = await db.widgets().insert(widgets);
        if (widgetsError) throw widgetsError;
      }

      navigate(`/dashboards/${(dashboard as { id: string }).id}`);
    } catch {
      setError('Failed to create dashboard');
      setStep('configure');
    } finally {
      setGenerating(false);
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
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Create Dashboard</h1>
          <p className="text-neutral-500">
            {step === 'select' && 'Select Salesforce reports to visualize'}
            {step === 'configure' && 'Configure your dashboard'}
            {step === 'generating' && 'Generating your dashboard...'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {step === 'select' && (
        <div>
          {reports.length === 0 ? (
            <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
              <FileBarChart className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                No reports available
              </h3>
              <p className="text-neutral-500 mb-4">
                Sync your Salesforce reports first
              </p>
              <button
                onClick={() => navigate('/reports')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Go to Reports
              </button>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-200 mb-6">
                {reports.map((report) => (
                  <label
                    key={report.id}
                    className="flex items-center gap-4 p-4 hover:bg-neutral-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedReports.includes(report.sf_report_id)}
                      onChange={() => toggleReport(report.sf_report_id)}
                      className="w-5 h-5 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileBarChart className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-neutral-900">{report.name}</p>
                      <p className="text-sm text-neutral-500">
                        {report.report_type} report
                        {report.folder_name && ` • ${report.folder_name}`}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setStep('configure')}
                  disabled={selectedReports.length === 0}
                  className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Continue
                  <span className="text-blue-200">
                    ({selectedReports.length} selected)
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {step === 'configure' && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Dashboard Name
            </label>
            <input
              type="text"
              value={dashboardName}
              onChange={(e) => setDashboardName(e.target.value)}
              placeholder="e.g., Sales Pipeline Overview"
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-6">
            <h3 className="text-sm font-medium text-neutral-700 mb-3">
              Selected Reports ({selectedReports.length})
            </h3>
            <div className="space-y-2">
              {reports
                .filter((r) => selectedReports.includes(r.sf_report_id))
                .map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg"
                  >
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-neutral-900">{report.name}</span>
                    <span className="text-xs text-neutral-500 bg-neutral-200 px-2 py-0.5 rounded">
                      {report.report_type}
                    </span>
                  </div>
                ))}
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg mb-6">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-blue-700">
              AI will automatically generate the best visualizations for your reports
            </p>
          </div>
          <div className="flex justify-between">
            <button
              onClick={() => setStep('select')}
              className="px-4 py-2 text-neutral-600 hover:text-neutral-900"
            >
              Back
            </button>
            <button
              onClick={createDashboard}
              disabled={!dashboardName.trim() || generating}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Dashboard
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {step === 'generating' && (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">
            Generating your dashboard
          </h3>
          <p className="text-neutral-500">
            Analyzing reports and creating visualizations...
          </p>
        </div>
      )}
    </div>
  );
}
