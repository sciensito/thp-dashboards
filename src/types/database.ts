export interface SfConnection {
  id: string;
  consumer_key: string;
  consumer_secret_encrypted: string;
  username: string;
  password_encrypted: string;
  instance_url: string | null;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  token_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SfReport {
  id: string;
  sf_report_id: string;
  name: string;
  report_type: 'tabular' | 'summary' | 'matrix';
  folder_name: string | null;
  metadata: Record<string, unknown> | null;
  last_synced_at: string | null;
  created_at: string;
}

export interface ReportSnapshot {
  id: string;
  sf_report_id: string;
  data: Record<string, unknown>;
  row_count: number | null;
  captured_at: string;
}

export interface Dashboard {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  layout: DashboardLayout | null;
  is_public: boolean;
  share_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface Widget {
  id: string;
  dashboard_id: string;
  sf_report_id: string | null;
  widget_type: WidgetType;
  title: string | null;
  config: WidgetConfig | null;
  position: WidgetPosition;
  created_at: string;
}

export interface Comment {
  id: string;
  dashboard_id: string;
  widget_id: string | null;
  user_id: string;
  content: string;
  created_at: string;
}

// Widget types
export type WidgetType =
  | 'bar'
  | 'line'
  | 'pie'
  | 'donut'
  | 'kpi'
  | 'table'
  | 'funnel'
  | 'gauge'
  | 'heatmap'
  | 'treemap';

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WidgetConfig {
  xAxis?: string;
  yAxis?: string;
  groupBy?: string;
  metric?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  // KPI specific
  value?: string;
  previousValue?: string;
  format?: 'number' | 'currency' | 'percent';
  // Table specific
  columns?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DashboardLayout {
  columns: number;
  rowHeight: number;
  widgets: WidgetPosition[];
}

// Database types for Supabase
export interface Database {
  public: {
    Tables: {
      sf_connection: {
        Row: SfConnection;
        Insert: Omit<SfConnection, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SfConnection, 'id'>>;
      };
      sf_reports: {
        Row: SfReport;
        Insert: Omit<SfReport, 'id' | 'created_at'>;
        Update: Partial<Omit<SfReport, 'id'>>;
      };
      report_snapshots: {
        Row: ReportSnapshot;
        Insert: Omit<ReportSnapshot, 'id' | 'captured_at'>;
        Update: Partial<Omit<ReportSnapshot, 'id'>>;
      };
      dashboards: {
        Row: Dashboard;
        Insert: Omit<Dashboard, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Dashboard, 'id'>>;
      };
      widgets: {
        Row: Widget;
        Insert: Omit<Widget, 'id' | 'created_at'>;
        Update: Partial<Omit<Widget, 'id'>>;
      };
      comments: {
        Row: Comment;
        Insert: Omit<Comment, 'id' | 'created_at'>;
        Update: Partial<Omit<Comment, 'id'>>;
      };
    };
  };
}
