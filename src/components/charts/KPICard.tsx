import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number | string;
  previousValue?: number;
  format?: 'number' | 'currency' | 'percent';
  prefix?: string;
  suffix?: string;
}

export function KPICard({
  title,
  value,
  previousValue,
  format = 'number',
  prefix,
  suffix,
}: KPICardProps) {
  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val;

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case 'percent':
        return `${val.toFixed(1)}%`;
      default:
        return new Intl.NumberFormat('en-US').format(val);
    }
  };

  const calculateChange = (): { value: number; direction: 'up' | 'down' | 'neutral' } | null => {
    if (previousValue === undefined || typeof value !== 'number') return null;
    if (previousValue === 0) return { value: 0, direction: 'neutral' };

    const change = ((value - previousValue) / previousValue) * 100;
    return {
      value: Math.abs(change),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
    };
  };

  const change = calculateChange();

  return (
    <div className="h-full flex flex-col justify-center">
      <p className="text-sm font-medium text-neutral-500 mb-1">{title}</p>
      <p className="text-3xl font-bold text-neutral-900">
        {prefix}
        {formatValue(value)}
        {suffix}
      </p>
      {change && (
        <div className="flex items-center gap-1 mt-2">
          {change.direction === 'up' && (
            <TrendingUp className="w-4 h-4 text-green-500" />
          )}
          {change.direction === 'down' && (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
          {change.direction === 'neutral' && (
            <Minus className="w-4 h-4 text-neutral-400" />
          )}
          <span
            className={`text-sm font-medium ${
              change.direction === 'up'
                ? 'text-green-600'
                : change.direction === 'down'
                ? 'text-red-600'
                : 'text-neutral-500'
            }`}
          >
            {change.value.toFixed(1)}%
          </span>
          <span className="text-sm text-neutral-400">vs previous</span>
        </div>
      )}
    </div>
  );
}
