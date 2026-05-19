import React, { useEffect, useState } from 'react';
import { api, SummaryResponse, ChartResponse, LedgerRow } from '../api';
import SummaryCards from '../components/SummaryCards';
import DashboardChart from '../components/DashboardChart';
import { ArrowUpRight, ArrowDownRight, Eye } from 'lucide-react';

interface DashboardProps {
  onViewLedgerDetail: (id: number) => void;
  triggerRefresh: boolean;
}

export default function Dashboard({ onViewLedgerDetail, triggerRefresh }: DashboardProps) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [chartData, setChartData] = useState<ChartResponse | null>(null);
  const [recentEntries, setRecentEntries] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    // Load summary and chart in parallel
    Promise.all([
      api.getSummary(period),
      api.getCharts(period),
      api.getLedger() // Fetch ledger rows for recent entries feed
    ]).then(([sumRes, chartRes, ledgerRes]) => {
      setSummary(sumRes);
      setChartData(chartRes);
      setRecentEntries(ledgerRes.slice(0, 10)); // Get top 10
    }).catch(err => {
      console.error('Error fetching dashboard data:', err);
    }).finally(() => {
      setLoading(false);
    });
  }, [period, triggerRefresh]);

  // Compute Unnecessary (unplanned) Expenses
  // We can scan the recent entries or just calculate it from the summary payload.
  // Wait! To calculate it properly across all data, let's fetch all expenses and sum those where planned = false.
  // Let's do that! We can compute unnecessary spending by fetching the total expense where planned = 0.
  const [unnecessary, setUnnecessary] = useState(0);
  useEffect(() => {
    api.getExpenses({ planned: 0 })
      .then(res => {
        const sum = res.reduce((acc, curr) => acc + curr.amount, 0);
        setUnnecessary(sum);
      })
      .catch(err => console.error(err));
  }, [triggerRefresh]);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-sm text-muted">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mb-4"></div>
        <span>Aggregating financial metrics...</span>
      </div>
    );
  }

  const overallIncome = summary?.total_income || 0;
  const overallExpense = summary?.total_expense || 0;
  const overallNet = summary?.net || 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Period Toggle & Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-neutral-800">Financial Summary</h2>
          <p className="text-xs text-muted">Real-time aggregate calculations</p>
        </div>

        <div className="flex bg-neutral-100 p-0.5 rounded-lg border border-border text-xs font-semibold">
          {(['daily', 'weekly', 'monthly'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer capitalize ${
                period === p 
                  ? 'bg-white text-foreground shadow-sm' 
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards 
        totalIncome={overallIncome}
        totalExpense={overallExpense}
        netBalance={overallNet}
        unnecessaryExpense={unnecessary}
      />

      {/* Main Chart */}
      {chartData && <DashboardChart data={chartData} />}

      {/* Recent Entries */}
      <div className="bg-white border border-border rounded-xl p-5 shadow-premium">
        <h3 className="font-bold text-foreground mb-1">Recent Activity</h3>
        <p className="text-xs text-muted mb-4">Last 10 updates to the ledger</p>

        {recentEntries.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-border rounded-lg text-sm text-muted">
            No transaction records found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-muted font-semibold text-xs">
                  <th className="pb-3 font-semibold">Name</th>
                  <th className="pb-3 font-semibold">Time</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold text-right">Amount</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {recentEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-neutral-50/50 transition">
                    <td className="py-3.5 font-medium text-neutral-800">{entry.name}</td>
                    <td className="py-3.5 text-neutral-500 text-xs">
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${
                        entry.entry_type === 'income' 
                          ? 'bg-green-50 text-green-700' 
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {entry.entry_type === 'income' ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {entry.entry_type}
                      </span>
                    </td>
                    <td className={`py-3.5 text-right font-bold ${
                      entry.entry_type === 'income' ? 'text-green-600' : 'text-neutral-700'
                    }`}>
                      {entry.entry_type === 'income' ? '+' : '-'}{entry.amount.toLocaleString()} ETB
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => onViewLedgerDetail(entry.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-hover transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
