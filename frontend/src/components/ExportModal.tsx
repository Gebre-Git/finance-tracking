import { X, Download, FileSpreadsheet, Database, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportModal({ isOpen, onClose }: ExportModalProps) {
  if (!isOpen) return null;

  const handleDownload = (endpoint: string) => {
    window.open(`/api/export/${endpoint}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-xs transition-opacity" 
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-border overflow-hidden z-10 animate-scale-up">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-sm">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-base">Export Financial Data</h3>
              <p className="text-xs text-muted">Download records in CSV spreadsheet or JSON backup formats</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-muted hover:text-foreground hover:bg-neutral-100 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Options */}
        <div className="p-6 flex flex-col gap-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Spreadsheet Exports (CSV)</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Unified Ledger CSV */}
            <button
              onClick={() => handleDownload('csv')}
              className="flex flex-col items-start justify-between p-4 bg-neutral-50 hover:bg-neutral-100/80 border border-border rounded-xl transition cursor-pointer text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-sm block text-neutral-800">Main Ledger</span>
                <span className="text-[11px] text-muted block mt-0.5">All transactions + running totals</span>
              </div>
            </button>

            {/* Expenses CSV */}
            <button
              onClick={() => handleDownload('expenses/csv')}
              className="flex flex-col items-start justify-between p-4 bg-neutral-50 hover:bg-neutral-100/80 border border-border rounded-xl transition cursor-pointer text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <ArrowDownRight className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-sm block text-neutral-800">Expenses</span>
                <span className="text-[11px] text-muted block mt-0.5">Outflows, categories & planned status</span>
              </div>
            </button>

            {/* Income CSV */}
            <button
              onClick={() => handleDownload('income/csv')}
              className="flex flex-col items-start justify-between p-4 bg-neutral-50 hover:bg-neutral-100/80 border border-border rounded-xl transition cursor-pointer text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-sm block text-neutral-800">Income</span>
                <span className="text-[11px] text-muted block mt-0.5">Inflows, work/family & sources</span>
              </div>
            </button>
          </div>

          <h4 className="text-xs font-bold uppercase tracking-wider text-muted mt-2">Full Database Backup</h4>

          {/* Raw JSON Backup */}
          <button
            onClick={() => handleDownload('json')}
            className="flex items-center justify-between p-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl transition cursor-pointer shadow-premium group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-neutral-800 text-accent flex items-center justify-center shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="font-bold text-sm block">Complete JSON Database (`finance.json`)</span>
                <span className="text-xs text-neutral-400 block">Raw database backup file containing all schemas</span>
              </div>
            </div>
            <FileSpreadsheet className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-neutral-50 flex items-center justify-between text-xs text-muted">
          <span>Formatted for Excel, Google Sheets, & Numbers</span>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
