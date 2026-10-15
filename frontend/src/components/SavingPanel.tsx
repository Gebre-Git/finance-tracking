import React, { useState, useEffect, useCallback } from 'react';
import { PiggyBank, ChevronDown, ChevronUp, ArrowDownToLine, ArrowUpFromLine, Trash2, X, AlertCircle } from 'lucide-react';
import { api, SavingEntry } from '../api';

interface SavingPanelProps {
  triggerRefresh: boolean;
  onRefresh: () => void;
}

type FormMode = 'deposit' | 'withdrawal' | null;

interface FormState {
  amount: string;
  label: string;
  created_at: string;
}

const emptyForm: FormState = { amount: '', label: '', created_at: '' };

export default function SavingPanel({ triggerRefresh, onRefresh }: SavingPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<SavingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchSaving = useCallback(() => {
    setLoading(true);
    api.getSaving()
      .then(res => {
        setBalance(res.balance);
        setTransactions(res.transactions);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isOpen) fetchSaving();
  }, [isOpen, triggerRefresh, fetchSaving]);

  const openForm = (mode: FormMode) => {
    setFormMode(mode);
    setForm(emptyForm);
    setError(null);
  };

  const closeForm = () => {
    setFormMode(null);
    setForm(emptyForm);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        amount,
        label: form.label.trim() || undefined,
        created_at: form.created_at || undefined,
      };
      if (formMode === 'deposit') {
        await api.depositToSaving(payload);
      } else {
        await api.withdrawFromSaving(payload);
      }
      closeForm();
      fetchSaving();
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this saving record?')) return;
    setDeletingId(id);
    try {
      await api.deleteSaving(id);
      fetchSaving();
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  return (
    <div className="flex flex-col gap-3">
      {/* Sleek toggle button under Recent Activity */}
      <div className="flex justify-start">
        <button
          onClick={() => setIsOpen(prev => !prev)}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-neutral-50 border border-border rounded-lg text-xs font-semibold text-neutral-800 transition cursor-pointer shadow-premium"
        >
          <PiggyBank className="w-4 h-4 text-neutral-600" />
          <span>{isOpen ? 'Hide Saving Account' : 'Saving Account'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-muted" />}
        </button>
      </div>

      {/* Revealed minimal card matching Recent Activity */}
      {isOpen && (
        <div className="bg-white border border-border rounded-xl p-5 shadow-premium">
          {/* Top Header & Balance */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-neutral-50 border border-border text-neutral-700">
                <PiggyBank className="w-5 h-5 text-neutral-700" />
              </div>
              <div>
                <h3 className="font-bold text-foreground leading-tight">Saving Account</h3>
                <p className="text-xs text-muted">Dedicated savings reserve outside main cashflow</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">Balance</span>
                <div className="text-xl font-bold tracking-tight text-neutral-900">
                  {loading ? (
                    <span className="inline-block h-6 w-20 bg-neutral-100 animate-pulse rounded" />
                  ) : (
                    <>
                      {balance.toLocaleString()} <span className="text-xs font-medium text-muted">ETB</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openForm(formMode === 'deposit' ? null : 'deposit')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    formMode === 'deposit'
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'bg-white hover:bg-neutral-50 border border-border text-neutral-800 shadow-xs'
                  }`}
                >
                  <ArrowDownToLine className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Deposit</span>
                </button>
                <button
                  onClick={() => openForm(formMode === 'withdrawal' ? null : 'withdrawal')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    formMode === 'withdrawal'
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'bg-white hover:bg-neutral-50 border border-border text-neutral-800 shadow-xs'
                  }`}
                >
                  <ArrowUpFromLine className="w-3.5 h-3.5 text-green-600" />
                  <span>Return</span>
                </button>
              </div>
            </div>
          </div>

          {/* Inline Action Form */}
          {formMode && (
            <div className="my-4 p-4 rounded-lg bg-neutral-50/60 border border-border transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-800">
                    {formMode === 'deposit' ? 'Deposit to Savings' : 'Return to Main Account'}
                  </span>
                  <span className="text-[11px] text-muted">
                    {formMode === 'deposit' ? '· moves funds out of main account' : '· restores funds to main account'}
                  </span>
                </div>
                <button onClick={closeForm} className="text-muted hover:text-neutral-700 transition cursor-pointer p-0.5">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Amount (ETB) *</label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      placeholder="e.g. 5000"
                      value={form.amount}
                      onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                      className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted/60 outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition"
                      required
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Description <span className="font-normal text-muted">(optional)</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Emergency fund"
                      value={form.label}
                      onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                      className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted/60 outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Date <span className="font-normal text-muted">(optional)</span></label>
                    <input
                      type="datetime-local"
                      value={form.created_at}
                      onChange={e => setForm(f => ({ ...f, created_at: e.target.value }))}
                      className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50/70 border border-red-100 rounded-lg px-3 py-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-premium disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : formMode === 'deposit' ? 'Confirm Deposit' : 'Confirm Return'}
                  </button>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="px-3.5 py-1.5 bg-white hover:bg-neutral-50 border border-border text-neutral-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Bottom Table: History */}
          <div className="pt-5">
            <div className="mb-3">
              <h4 className="font-bold text-foreground text-sm">Saving History</h4>
              <p className="text-xs text-muted">All deposits and returns associated with this saving balance</p>
            </div>

            {loading ? (
              <div className="text-center py-8 text-xs text-muted">Loading saving history...</div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-border rounded-lg text-xs text-muted">
                No saving records found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted font-semibold text-xs">
                      <th className="pb-3 font-semibold">Description</th>
                      <th className="pb-3 font-semibold">Time</th>
                      <th className="pb-3 font-semibold">Type</th>
                      <th className="pb-3 font-semibold text-right">Amount</th>
                      <th className="pb-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {transactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-neutral-50/50 transition">
                        <td className="py-3.5 font-medium text-neutral-800 text-xs">
                          {tx.label || <span className="text-muted italic">Saving Transfer</span>}
                        </td>
                        <td className="py-3.5 text-neutral-500 text-xs">
                          {formatDate(tx.created_at)}
                        </td>
                        <td className="py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${
                            tx.direction === 'deposit'
                              ? 'bg-neutral-100 text-neutral-700'
                              : 'bg-green-50 text-green-700'
                          }`}>
                            {tx.direction === 'deposit' ? (
                              <ArrowDownToLine className="w-3 h-3" />
                            ) : (
                              <ArrowUpFromLine className="w-3 h-3" />
                            )}
                            {tx.direction === 'deposit' ? 'Deposit' : 'Return'}
                          </span>
                        </td>
                        <td className={`py-3.5 text-right font-bold text-xs ${
                          tx.direction === 'deposit' ? 'text-neutral-700' : 'text-green-600'
                        }`}>
                          {tx.direction === 'deposit' ? '−' : '+'}{tx.amount.toLocaleString()} ETB
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => handleDelete(tx.id)}
                            disabled={deletingId === tx.id}
                            className="p-1 text-muted hover:text-red-500 rounded hover:bg-red-50 transition cursor-pointer inline-flex"
                            title="Delete record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      )}
    </div>
  );
}
