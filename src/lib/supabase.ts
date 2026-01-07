import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create client - will fail gracefully if env vars are missing
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to get table references with explicit typing
export const db = {
  sfConnection: () => supabase.from('sf_connection'),
  sfReports: () => supabase.from('sf_reports'),
  reportSnapshots: () => supabase.from('report_snapshots'),
  dashboards: () => supabase.from('dashboards'),
  widgets: () => supabase.from('widgets'),
  comments: () => supabase.from('comments'),
};
