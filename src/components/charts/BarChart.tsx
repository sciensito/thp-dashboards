import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface BarChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  color?: string;
  showGrid?: boolean;
  showLegend?: boolean;
}

export function BarChart({
  data,
  xKey,
  yKey,
  color = '#3b82f6',
  showGrid = true,
  showLegend = false,
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />}
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 12, fill: '#737373' }}
          tickLine={false}
          axisLine={{ stroke: '#e5e5e5' }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#737373' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e5e5',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
        />
        {showLegend && <Legend />}
        <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
