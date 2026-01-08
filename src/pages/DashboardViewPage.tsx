import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Share2, Loader2, RefreshCw, BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, Table, Hash } from 'lucide-react';
import { db, supabase } from '../lib/supabase';
import { BarChart } from '../components/charts/BarChart';
import { LineChart } from '../components/charts/LineChart';
import { PieChart } from '../components/charts/PieChart';
import { KPICard } from '../components/charts/KPICard';
import { DataTable } from '../components/charts/DataTable';

interface Dashboard {
  id: string;
  name: string;
  description: string | null;
  layout: { columns: number; rowHeight: number } | null;
  is_public: boolean;
  created_at: string;
}

interface Widget {
  id: string;
  dashboard_id: string;
  sf_report_id: string;
  widget_type: string;
  title: string | null;
  config: Record<string, unknown> | null;
  position: { x: number; y: number; w: number; h: number } | null;
}

interface ReportSnapshot {
  data: Record<string, unknown>[];
  captured_at: string;
}

export function DashboardViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [widgetData, setWidgetData] = useState<Record<string, ReportSnapshot>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [widgetTypes, setWidgetTypes] = useState<Record<string, string>>({});

  const chartTypeOptions = [
    { type: 'bar', icon: BarChart3, label: 'Bar' },
    { type: 'line', icon: LineChartIcon, label: 'Line' },
    { type: 'pie', icon: PieChartIcon, label: 'Pie' },
    { type: 'table', icon: Table, label: 'Table' },
    { type: 'kpi', icon: Hash, label: 'KPI' },
  ];

  useEffect(() => {
    if (id) {
      loadDashboard(id);
    }
  }, [id]);

  const fetchReportData = async (reportId: string): Promise<ReportSnapshot | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('salesforce-fetch-report', {
        body: { report_id: reportId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return {
        data: data.data || [],
        captured_at: new Date().toISOString(),
      };
    } catch (err) {
      console.error('Error fetching report:', err);
      return null;
    }
  };

  const refreshData = async () => {
    if (!widgets.length) return;

    setRefreshing(true);
    const reportIds = [...new Set(widgets.map((w) => w.sf_report_id))];
    const dataMap: Record<string, ReportSnapshot> = {};

    for (const reportId of reportIds) {
      const snapshot = await fetchReportData(reportId);
      if (snapshot) {
        dataMap[reportId] = snapshot;
      }
    }

    setWidgetData(dataMap);
    setRefreshing(false);
  };

  const loadDashboard = async (dashboardId: string) => {
    try {
      const { data: dashboardData, error: dashboardError } = await db.dashboards()
        .select('*')
        .eq('id', dashboardId)
        .single();

      if (dashboardError) throw dashboardError;
      setDashboard(dashboardData as Dashboard);

      const { data: widgetsData, error: widgetsError } = await db.widgets()
        .select('*')
        .eq('dashboard_id', dashboardId)
        .order('created_at');

      if (widgetsError) throw widgetsError;
      setWidgets((widgetsData || []) as Widget[]);

      // Load report data for each widget
      const reportIds = [...new Set((widgetsData || []).map((w: Widget) => w.sf_report_id))];
      const dataMap: Record<string, ReportSnapshot> = {};

      for (const reportId of reportIds) {
        // First try to get cached snapshot
        const { data: snapshotData } = await db.reportSnapshots()
          .select('data, captured_at')
          .eq('sf_report_id', reportId)
          .order('captured_at', { ascending: false })
          .limit(1)
          .single();

        if (snapshotData && Array.isArray(snapshotData.data) && snapshotData.data.length > 0) {
          dataMap[reportId] = snapshotData as ReportSnapshot;
        } else {
          // No cached data, fetch from Salesforce
          const freshData = await fetchReportData(reportId);
          if (freshData) {
            dataMap[reportId] = freshData;
          }
        }
      }

      setWidgetData(dataMap);
    } catch {
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getWidgetType = (widgetId: string, defaultType: string) => {
    return widgetTypes[widgetId] || defaultType;
  };

  const setWidgetType = (widgetId: string, type: string) => {
    setWidgetTypes(prev => ({ ...prev, [widgetId]: type }));
  };

  const renderWidget = (widget: Widget) => {
    const snapshot = widgetData[widget.sf_report_id];
    const data = snapshot?.data || [];
    const position = widget.position || { x: 0, y: 0, w: 6, h: 3 };
    const currentType = getWidgetType(widget.id, widget.widget_type);

    // Calculate grid position styles
    const style = {
      gridColumn: `span ${position.w}`,
      gridRow: `span ${position.h}`,
    };

    // Use actual data or show placeholder
    const hasRealData = data.length > 0;
    const chartDisplayData = hasRealData ? data : [
      { name: 'No data', value: 0 },
    ];

    const chartData = chartDisplayData.map((item: Record<string, unknown>) => ({
      name: String(item.name || item.Name || 'Unknown'),
      value: Number(item.value || item.Value || item.Amount || 0),
    }));

    // Generate columns for table from data keys
    const tableColumns = chartDisplayData.length > 0
      ? Object.keys(chartDisplayData[0]).map(key => ({
          key,
          label: key.charAt(0).toUpperCase() + key.slice(1),
        }))
      : [{ key: 'name', label: 'Name' }, { key: 'value', label: 'Value' }];

    const widgetContent = () => {
      switch (currentType) {
        case 'bar':
          return (
            <div className="h-full">
              <BarChart
                data={chartData}
                xKey="name"
                yKey="value"
              />
            </div>
          );
        case 'line':
          return (
            <div className="h-full">
              <LineChart
                data={chartData}
                xKey="name"
                yKey="value"
              />
            </div>
          );
        case 'pie':
          return (
            <div className="h-full">
              <PieChart data={chartData} />
            </div>
          );
        case 'kpi':
          const total = chartData.reduce((sum, item) => sum + item.value, 0);
          return (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-4xl font-bold text-neutral-900">
                  {total.toLocaleString()}
                </p>
                <p className="text-sm text-neutral-500 mt-1">Total</p>
              </div>
            </div>
          );
        case 'table':
        default:
          return (
            <div className="h-full overflow-auto">
              {hasRealData ? (
                <DataTable
                  data={chartDisplayData as Record<string, unknown>[]}
                  columns={tableColumns}
                />
              ) : (
                <div className="flex items-center justify-center h-32 text-neutral-400">
                  Click Refresh to load data
                </div>
              )}
            </div>
          );
      }
    };

    return (
      <div key={widget.id} style={style} className="bg-white rounded-xl border border-neutral-200 p-4 min-h-[200px] flex flex-col">
        {/* Chart type selector */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-neutral-700">{widget.title || 'Chart'}</h3>
          <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-0.5">
            {chartTypeOptions.map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                onClick={() => setWidgetType(widget.id, type)}
                title={label}
                className={`p-1.5 rounded-md transition-colors ${
                  currentType === type
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-neutral-400 hover:text-neutral-600'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
        {/* Widget content */}
        <div className="flex-1 min-h-0">
          {widgetContent()}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">Dashboard not found</h2>
        <p className="text-neutral-500 mb-4">{error || 'The dashboard you are looking for does not exist.'}</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go to Dashboards
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{dashboard.name}</h1>
            {dashboard.description && (
              <p className="text-neutral-500 mt-1">{dashboard.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
            <Share2 className="w-5 h-5 text-neutral-600" />
          </button>
          <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-neutral-600" />
          </button>
        </div>
      </div>

      {/* Widgets Grid */}
      {widgets.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <h3 className="text-lg font-medium text-neutral-900 mb-2">No widgets yet</h3>
          <p className="text-neutral-500">This dashboard doesn't have any widgets.</p>
        </div>
      ) : (
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${dashboard.layout?.columns || 12}, 1fr)`,
          }}
        >
          {widgets.map(renderWidget)}
        </div>
      )}
    </div>
  );
}
