import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface LineChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  color?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  showDots?: boolean;
}

export function LineChart({
  data,
  xKey,
  yKey,
  color = '#3b82f6',
  showGrid = true,
  showLegend = false,
  showDots = true,
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
        <Line
          type="monotone"
          dataKey={yKey}
          stroke={color}
          strokeWidth={2}
          dot={showDots ? { fill: color, strokeWidth: 2, r: 4 } : false}
          activeDot={{ r: 6 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
