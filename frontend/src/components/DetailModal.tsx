import React, { useEffect, useState } from 'react';
import { X, Calendar, DollarSign, Tag, Info, AlertCircle, Bookmark } from 'lucide-react';
import { api, LedgerDetail } from '../api';

interface DetailModalProps {
  ledgerId: number | null;
  onClose: () => void;
}

export default function DetailModal({ ledgerId, onClose }: DetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<LedgerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ledgerId) return;

    setLoading(true);
    setError(null);
    api.getLedgerDetail(ledgerId)
      .then(res => {
        setData(res);
      })
      .catch(err => {
        console.error(err);
        setError(err.message || 'Failed to load details');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [ledgerId]);

  if (!ledgerId) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-neutral-900/20 backdrop-blur-xs transition-opacity"
      />

      {/* Side Slide-Over Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-border transition-all duration-300 animate-slide-in">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-foreground">Transaction Detail</h3>
            <p className="text-xs text-muted">Ledger ID: #{ledgerId}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-100 rounded-lg text-muted hover:text-foreground transition cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="h-40 flex items-center justify-center text-sm text-muted">
              Loading transaction details...
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-500 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4.5 h-4.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && data && (
            <div className="flex flex-col gap-6">
              
              {/* Type & Amount Header Badge */}
              <div className="text-center py-6 bg-neutral-50 border border-border rounded-2xl">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 ${
                  data.entry_type === 'income' 
                    ? 'bg-green-50 text-green-700 border border-green-100' 
                    : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                  {data.entry_type}
                </span>
                <div className={`text-3xl font-extrabold tracking-tight ${
                  data.entry_type === 'income' ? 'text-green-600' : 'text-red-500'
                }`}>
                  {data.entry_type === 'income' ? '+' : '-'}{data.detail?.amount.toLocaleString()} <span className="text-sm font-medium">ETB</span>
                </div>
                <div className="text-xs text-muted mt-1 font-medium">{data.name}</div>
              </div>

              {/* Transaction Attributes Grid */}
              <div className="flex flex-col gap-4">
                <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Metadata</h4>

                {/* Ledger Fields */}
                <div className="grid grid-cols-3 gap-2 border-b border-neutral-100 pb-3 text-sm">
                  <span className="text-muted flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Date</span>
                  <span className="col-span-2 font-medium text-right">
                    {new Date(data.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 border-b border-neutral-100 pb-3 text-sm">
                  <span className="text-muted flex items-center gap-1.5"><Bookmark className="w-4 h-4" /> Category</span>
                  <span className="col-span-2 font-medium capitalize text-right">
                    {data.detail?.type || 'N/A'}
                  </span>
                </div>

                {/* Income-specific fields */}
                {data.entry_type === 'income' && (
                  <div className="grid grid-cols-3 gap-2 border-b border-neutral-100 pb-3 text-sm">
                    <span className="text-muted flex items-center gap-1.5"><Info className="w-4 h-4" /> Source</span>
                    <span className="col-span-2 font-medium text-right">
                      {(data.detail as any)?.source || 'None'}
                    </span>
                  </div>
                )}

                {/* Expense-specific fields */}
                {data.entry_type === 'expense' && (
                  <>
                    <div className="grid grid-cols-3 gap-2 border-b border-neutral-100 pb-3 text-sm">
                      <span className="text-muted flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> Planned Spend</span>
                      <span className="col-span-2 font-semibold text-right">
                        {(data.detail as any)?.planned ? (
                          <span className="text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded text-xs">Planned</span>
                        ) : (
                          <span className="text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded text-xs">Unplanned / Unnecessary</span>
                        )}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-b border-neutral-100 pb-3 text-sm">
                      <span className="text-muted flex items-center gap-1.5"><Info className="w-4 h-4" /> Description</span>
                      <span className="col-span-2 font-medium text-right text-neutral-600 break-words">
                        {(data.detail as any)?.description || 'No description provided'}
                      </span>
                    </div>
                  </>
                )}

                {/* Ledger Running Balance */}
                <div className="grid grid-cols-3 gap-2 text-sm pt-2">
                  <span className="text-muted flex items-center gap-1.5"><DollarSign className="w-4 h-4" /> Post Balance</span>
                  <span className="col-span-2 font-bold text-right text-neutral-800">
                    {data.total_remaining.toLocaleString()} ETB
                  </span>
                </div>

              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
