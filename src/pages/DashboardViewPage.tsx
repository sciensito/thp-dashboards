import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Share2, Loader2 } from 'lucide-react';
import { db } from '../lib/supabase';
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadDashboard(id);
    }
  }, [id]);

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
        const { data: snapshotData } = await db.reportSnapshots()
          .select('data, captured_at')
          .eq('sf_report_id', reportId)
          .order('captured_at', { ascending: false })
          .limit(1)
          .single();

        if (snapshotData) {
          dataMap[reportId] = snapshotData as ReportSnapshot;
        }
      }

      setWidgetData(dataMap);
    } catch {
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const renderWidget = (widget: Widget) => {
    const snapshot = widgetData[widget.sf_report_id];
    const data = snapshot?.data || [];
    const position = widget.position || { x: 0, y: 0, w: 6, h: 3 };

    // Calculate grid position styles
    const style = {
      gridColumn: `span ${position.w}`,
      gridRow: `span ${position.h}`,
    };

    // Generate sample data if no real data available
    const sampleData = data.length > 0 ? data : [
      { name: 'Sample A', value: 400 },
      { name: 'Sample B', value: 300 },
      { name: 'Sample C', value: 200 },
      { name: 'Sample D', value: 278 },
      { name: 'Sample E', value: 189 },
    ];

    const chartData = sampleData.map((item: Record<string, unknown>) => ({
      name: String(item.name || item.Name || 'Unknown'),
      value: Number(item.value || item.Value || item.Amount || 0),
    }));

    // Generate columns for table from data keys
    const tableColumns = sampleData.length > 0
      ? Object.keys(sampleData[0]).map(key => ({
          key,
          label: key.charAt(0).toUpperCase() + key.slice(1),
        }))
      : [{ key: 'name', label: 'Name' }, { key: 'value', label: 'Value' }];

    const widgetContent = () => {
      switch (widget.widget_type) {
        case 'bar':
          return (
            <div className="h-full">
              <h3 className="text-sm font-medium text-neutral-700 mb-2">{widget.title || 'Bar Chart'}</h3>
              <div className="h-[calc(100%-24px)]">
                <BarChart
                  data={chartData}
                  xKey="name"
                  yKey="value"
                />
              </div>
            </div>
          );
        case 'line':
          return (
            <div className="h-full">
              <h3 className="text-sm font-medium text-neutral-700 mb-2">{widget.title || 'Line Chart'}</h3>
              <div className="h-[calc(100%-24px)]">
                <LineChart
                  data={chartData}
                  xKey="name"
                  yKey="value"
                />
              </div>
            </div>
          );
        case 'pie':
          return (
            <div className="h-full">
              <h3 className="text-sm font-medium text-neutral-700 mb-2">{widget.title || 'Pie Chart'}</h3>
              <div className="h-[calc(100%-24px)]">
                <PieChart data={chartData} />
              </div>
            </div>
          );
        case 'kpi':
          const total = chartData.reduce((sum, item) => sum + item.value, 0);
          return (
            <KPICard
              title={widget.title || 'Total'}
              value={total}
              format="number"
            />
          );
        case 'table':
        default:
          return (
            <div className="h-full">
              <h3 className="text-sm font-medium text-neutral-700 mb-2">{widget.title || 'Data Table'}</h3>
              <DataTable
                data={sampleData as Record<string, unknown>[]}
                columns={tableColumns}
              />
            </div>
          );
      }
    };

    return (
      <div key={widget.id} style={style} className="bg-white rounded-xl border border-neutral-200 p-4 min-h-[200px]">
        {widgetContent()}
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
