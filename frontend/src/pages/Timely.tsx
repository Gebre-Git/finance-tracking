import React, { useEffect, useState } from 'react';
import { api, SummaryResponse, SummaryPeriod, ChartResponse } from '../api';
import DashboardChart from '../components/DashboardChart';
import { ChevronDown, ChevronRight, ArrowUpRight, ArrowDownRight, Eye } from 'lucide-react';

interface TimelyPageProps {
  onViewLedgerDetail: (id: number) => void;
  triggerRefresh: boolean;
}

export default function TimelyPage({ onViewLedgerDetail, triggerRefresh }: TimelyPageProps) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [chartData, setChartData] = useState<ChartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPeriods, setExpandedPeriods] = useState<string[]>([]);

  useEffect(() => {
    setLoading(true);
    
    // Load summary and chart together
    Promise.all([
      api.getSummary(period),
      api.getCharts(period)
    ]).then(([sumRes, chartRes]) => {
      setSummary(sumRes);
      setChartData(chartRes);
      setExpandedPeriods([]); // Reset expanded rows on period toggle
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      setLoading(false);
    });
  }, [period, triggerRefresh]);

  const toggleExpand = (pKey: string) => {
    if (expandedPeriods.includes(pKey)) {
      setExpandedPeriods(expandedPeriods.filter(k => k !== pKey));
    } else {
      setExpandedPeriods([...expandedPeriods, pKey]);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-sm text-muted">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mb-4"></div>
        <span>Structuring period aggregations...</span>
      </div>
    );
  }

  const entries = summary?.entries || [];

  return (
    <div className="flex flex-col gap-8">
      
      {/* Period Toggle & Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-neutral-800">Periodic Breakdown</h2>
          <p className="text-xs text-muted">Comparative aggregates across time divisions</p>
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

      {/* Aggregate Analysis Table */}
      <div className="bg-white border border-border rounded-xl p-5 shadow-premium">
        <h3 className="font-bold text-foreground mb-1">Periodic Ledger</h3>
        <p className="text-xs text-muted mb-4">Expand rows to view direct entries inside each calendar unit</p>

        {entries.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-lg text-sm text-muted">
            No entries logged yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-muted font-semibold text-xs">
                  <th className="pb-3 w-8"></th>
                  <th className="pb-3 font-semibold">Period</th>
                  <th className="pb-3 text-right font-semibold">Total Income</th>
                  <th className="pb-3 text-right font-semibold">Total Expense</th>
                  <th className="pb-3 text-right font-semibold">Net Savings</th>
                  <th className="pb-3 text-right font-semibold"># Entries</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {entries.map(grp => {
                  const isExpanded = expandedPeriods.includes(grp.period);
                  
                  return (
                    <React.Fragment key={grp.period}>
                      {/* Main Group Row */}
                      <tr 
                        onClick={() => toggleExpand(grp.period)}
                        className="hover:bg-neutral-50/70 transition cursor-pointer font-medium"
                      >
                        <td className="py-4 text-center text-muted">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 inline" />
                          ) : (
                            <ChevronRight className="w-4 h-4 inline" />
                          )}
                        </td>
                        <td className="py-4 capitalize font-semibold text-neutral-800">
                          {period === 'weekly' ? `Week of ${grp.period}` : grp.period}
                        </td>
                        <td className="py-4 text-right font-bold text-green-600">
                          +{grp.total_income.toLocaleString()} ETB
                        </td>
                        <td className="py-4 text-right font-bold text-red-500">
                          -{grp.total_expense.toLocaleString()} ETB
                        </td>
                        <td className={`py-4 text-right font-bold ${
                          grp.net >= 0 ? 'text-accent' : 'text-red-600'
                        }`}>
                          {grp.net.toLocaleString()} ETB
                        </td>
                        <td className="py-4 text-right text-neutral-500 font-semibold">
                          {grp.entries.length} entries
                        </td>
                      </tr>

                      {/* Expandable nested entries list */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="bg-neutral-50/50 p-4 border-y border-neutral-100">
                            <div className="border border-border rounded-lg bg-white overflow-hidden shadow-sm">
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="bg-neutral-50 border-b border-border text-muted font-bold">
                                    <th className="px-4 py-2">Name</th>
                                    <th className="px-4 py-2">Time</th>
                                    <th className="px-4 py-2">Type</th>
                                    <th className="px-4 py-2 text-right">Amount</th>
                                    <th className="px-4 py-2 text-right">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                  {grp.entries.map(subEntry => (
                                    <tr key={subEntry.id} className="hover:bg-neutral-50/50 transition">
                                      <td className="px-4 py-2.5 font-semibold text-neutral-800">{subEntry.name}</td>
                                      <td className="px-4 py-2.5 text-neutral-500">
                                        {new Date(subEntry.created_at).toLocaleString()}
                                      </td>
                                      <td className="px-4 py-2.5">
                                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                          subEntry.entry_type === 'income' 
                                            ? 'bg-green-50 text-green-700' 
                                            : 'bg-red-50 text-red-700'
                                        }`}>
                                          {subEntry.entry_type === 'income' ? (
                                            <ArrowUpRight className="w-2.5 h-2.5" />
                                          ) : (
                                            <ArrowDownRight className="w-2.5 h-2.5" />
                                          )}
                                          <span>{subEntry.entry_type}</span>
                                        </span>
                                      </td>
                                      <td className={`px-4 py-2.5 text-right font-bold ${
                                        subEntry.entry_type === 'income' ? 'text-green-600' : 'text-neutral-700'
                                      }`}>
                                        {subEntry.entry_type === 'income' ? '+' : '-'}{subEntry.amount.toLocaleString()} ETB
                                      </td>
                                      <td className="px-4 py-2.5 text-right">
                                        <button
                                          onClick={() => onViewLedgerDetail(subEntry.id)}
                                          className="text-accent hover:underline font-bold inline-flex items-center gap-0.5 cursor-pointer"
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
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Underlaying chart visualization */}
      {chartData && (
        <div className="mt-2">
          <DashboardChart data={chartData} />
        </div>
      )}

    </div>
  );
}
