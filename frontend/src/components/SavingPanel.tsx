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
    <div className="mt-4">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition cursor-pointer select-none"
      >
        <PiggyBank className="w-4 h-4" />
        <span>Saving Account</span>
        {isOpen ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
      </button>

      {/* Reveal panel */}
      {isOpen && (
        <div className="mt-3 border border-amber-100 rounded-xl bg-white shadow-premium overflow-hidden">

          {/* Balance card */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100 p-5">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Saving Balance</p>
            {loading ? (
              <div className="h-8 w-32 bg-amber-100 animate-pulse rounded" />
            ) : (
              <div className="text-3xl font-bold text-amber-800 tracking-tight">
                {balance.toLocaleString()} <span className="text-sm font-medium text-amber-600">ETB</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => openForm(formMode === 'deposit' ? null : 'deposit')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  formMode === 'deposit'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white border border-amber-200 text-amber-700 hover:bg-amber-50'
                }`}
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
                Deposit to Savings
              </button>
              <button
                onClick={() => openForm(formMode === 'withdrawal' ? null : 'withdrawal')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  formMode === 'withdrawal'
                    ? 'bg-green-600 text-white'
                    : 'bg-white border border-green-200 text-green-700 hover:bg-green-50'
                }`}
              >
                <ArrowUpFromLine className="w-3.5 h-3.5" />
                Return to Main
              </button>
            </div>
          </div>

          {/* Inline form */}
          {formMode && (
            <div className={`border-b p-5 ${formMode === 'deposit' ? 'bg-amber-50/40 border-amber-100' : 'bg-green-50/40 border-green-100'}`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-neutral-700">
                  {formMode === 'deposit' ? '↓ Move to Savings' : '↑ Return to Main Account'}
                </p>
                <button onClick={closeForm} className="text-neutral-400 hover:text-neutral-600 transition cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">Amount (ETB) *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    placeholder="e.g. 5000"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-300 transition"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Description (optional) */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1">Description <span className="font-normal text-muted">(optional)</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Emergency fund"
                      value={form.label}
                      onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-300 transition"
                    />
                  </div>

                  {/* Date (optional) */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1">Date <span className="font-normal text-muted">(optional, defaults to now)</span></label>
                    <input
                      type="datetime-local"
                      value={form.created_at}
                      onChange={e => setForm(f => ({ ...f, created_at: e.target.value }))}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-300 transition"
                    />
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-4 py-2 rounded-lg text-xs font-bold text-white transition cursor-pointer disabled:opacity-60 ${
                      formMode === 'deposit' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {submitting ? 'Saving...' : formMode === 'deposit' ? 'Confirm Deposit' : 'Confirm Return'}
                  </button>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-600 border border-border hover:bg-neutral-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Transaction history */}
          <div className="p-5">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Transaction History</p>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(n => (
                  <div key={n} className="h-10 bg-neutral-100 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-border rounded-lg text-sm text-muted">
                No saving transactions yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted font-semibold text-xs">
                      <th className="pb-3">Description</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3 text-right">Amount</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {transactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-neutral-50/50 transition">
                        <td className="py-3 font-medium text-neutral-700">
                          {tx.label || <span className="text-muted italic">—</span>}
                        </td>
                        <td className="py-3 text-neutral-500 text-xs">{formatDate(tx.created_at)}</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${
                            tx.direction === 'deposit'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-green-50 text-green-700'
                          }`}>
                            {tx.direction === 'deposit'
                              ? <ArrowDownToLine className="w-3 h-3" />
                              : <ArrowUpFromLine className="w-3 h-3" />
                            }
                            {tx.direction === 'deposit' ? 'Deposit' : 'Return'}
                          </span>
                        </td>
                        <td className={`py-3 text-right font-bold ${
                          tx.direction === 'deposit' ? 'text-amber-700' : 'text-green-600'
                        }`}>
                          {tx.direction === 'deposit' ? '−' : '+'}{tx.amount.toLocaleString()} ETB
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleDelete(tx.id)}
                            disabled={deletingId === tx.id}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-600 transition cursor-pointer disabled:opacity-50"
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
