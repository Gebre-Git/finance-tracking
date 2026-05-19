import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

interface ChartDataPoint {
  period: string;
  income: number;
  expense: number;
  net: number;
}

interface DashboardChartProps {
  data: {
    labels: string[];
    income: number[];
    expense: number[];
    net: number[];
  };
}

export default function DashboardChart({ data }: DashboardChartProps) {
  const [chartView, setChartView] = useState<'both' | 'net' | 'split'>('both');

  // Format data for Recharts
  const chartData: ChartDataPoint[] = data.labels.map((label, idx) => ({
    period: label,
    income: data.income[idx] || 0,
    expense: data.expense[idx] || 0,
    net: data.net[idx] || 0,
  }));

  if (chartData.length === 0) {
    return (
      <div className="w-full h-80 border border-dashed border-border rounded-xl flex flex-col items-center justify-center text-muted">
        <span className="text-sm font-medium">No transaction data available yet</span>
        <span className="text-xs text-neutral-400 mt-1">Add income or expense to see time-series charts</span>
      </div>
    );
  }

  return (
    <div className="w-full bg-white border border-border rounded-xl p-5 shadow-premium">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="font-bold text-foreground">Financial Trends</h3>
          <p className="text-xs text-muted">Periodic flow and balance tracking</p>
        </div>

        {/* View Toggle */}
        <div className="flex bg-neutral-100 p-0.5 rounded-lg border border-border text-xs font-semibold">
          <button
            onClick={() => setChartView('both')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
              chartView === 'both' 
                ? 'bg-white text-foreground shadow-sm' 
                : 'text-muted hover:text-foreground'
            }`}
          >
            Unified View
          </button>
          <button
            onClick={() => setChartView('net')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
              chartView === 'net' 
                ? 'bg-white text-foreground shadow-sm' 
                : 'text-muted hover:text-foreground'
            }`}
          >
            Net Trend
          </button>
          <button
            onClick={() => setChartView('split')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
              chartView === 'split' 
                ? 'bg-white text-foreground shadow-sm' 
                : 'text-muted hover:text-foreground'
            }`}
          >
            Income vs Expense
          </button>
        </div>
      </div>

      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f3f3" vertical={false} />
            <XAxis 
              dataKey="period" 
              stroke="#888888" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              dy={10}
            />
            <YAxis 
              stroke="#888888" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(value) => `${value.toLocaleString()}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e5e5', 
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                fontSize: '12px'
              }}
              formatter={(value: any) => [`${Number(value).toLocaleString()} ETB`]}
              labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
            />
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', fontWeight: 500 }}
            />
            
            {/* Split view shows bars only */}
            {chartView !== 'net' && (
              <Bar 
                name="Income" 
                dataKey="income" 
                fill="#10b981" // vibrant emerald
                radius={[4, 4, 0, 0]} 
                maxBarSize={40}
              />
            )}
            
            {chartView !== 'net' && (
              <Bar 
                name="Expense" 
                dataKey="expense" 
                fill="#f43f5e" // warm rose
                radius={[4, 4, 0, 0]} 
                maxBarSize={40}
              />
            )}

            {/* Net over time / unified view */}
            {chartView !== 'split' && (
              <Line 
                name="Net Flow" 
                type="monotone" 
                dataKey="net" 
                stroke="#3b82f6" // electric blue
                strokeWidth={2}
                dot={{ r: 4, stroke: '#3b82f6', strokeWidth: 1, fill: '#white' }}
                activeDot={{ r: 6 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
