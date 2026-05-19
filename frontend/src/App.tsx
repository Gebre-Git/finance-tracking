import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import IncomePage from './pages/Income';
import ExpensesPage from './pages/Expenses';
import LedgerPage from './pages/Ledger';
import TimelyPage from './pages/Timely';
import PlanningPage from './pages/Planning';
import DetailModal from './components/DetailModal';
import { api } from './api';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedLedgerId, setSelectedLedgerId] = useState<number | null>(null);
  
  // Ledger highlighting states for cross-tab row click mapping
  const [highlightLedgerId, setHighlightLedgerId] = useState<number | null>(null);
  
  // Running balance overall state (cached from ledger total_remaining)
  const [runningBalance, setRunningBalance] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  // Function to toggle a simple refresh of all data states
  const triggerRefresh = () => {
    setRefreshTrigger(prev => !prev);
  };

  // Keep running balance updated
  useEffect(() => {
    api.getLedger()
      .then(res => {
        if (res.length > 0) {
          // Since the ledger is sorted descending (id DESC) by the backend,
          // the first entry represents the latest transaction state
          setRunningBalance(res[0].total_remaining);
        } else {
          setRunningBalance(0);
        }
      })
      .catch(err => {
        console.error('Failed to update running balance:', err);
      });
  }, [refreshTrigger]);

  // Handler for row clicks in Income or Expense tables
  const handleHighlightLedgerRow = (refId: number, entryType: 'income' | 'expense') => {
    // We first fetch the ledger to find the exact ledger row id matching entryType and refId
    api.getLedger({ entry_type: entryType })
      .then(rows => {
        const found = rows.find(r => r.ref_id === refId);
        if (found) {
          // Set highlight row state
          setHighlightLedgerId(found.id);
          // Redirect user to Main Ledger tab
          setCurrentTab('ledger');
        } else {
          alert('Could not resolve this transaction inside the ledger log.');
        }
      })
      .catch(err => {
        console.error(err);
      });
  };

  return (
    <>
      <Layout 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        runningBalance={runningBalance}
      >
        {/* Render pages conditionally */}
        {currentTab === 'dashboard' && (
          <Dashboard 
            onViewLedgerDetail={setSelectedLedgerId}
            triggerRefresh={refreshTrigger}
          />
        )}
        {currentTab === 'income' && (
          <IncomePage 
            onHighlightLedgerRow={handleHighlightLedgerRow}
            onRefreshTrigger={triggerRefresh}
          />
        )}
        {currentTab === 'expenses' && (
          <ExpensesPage 
            onHighlightLedgerRow={handleHighlightLedgerRow}
            onRefreshTrigger={triggerRefresh}
          />
        )}
        {currentTab === 'ledger' && (
          <LedgerPage 
            onViewLedgerDetail={setSelectedLedgerId}
            highlightId={highlightLedgerId}
            setHighlightId={setHighlightLedgerId}
          />
        )}
        {currentTab === 'timely' && (
          <TimelyPage 
            onViewLedgerDetail={setSelectedLedgerId}
            triggerRefresh={refreshTrigger}
          />
        )}
        {currentTab === 'planning' && (
          <PlanningPage />
        )}
      </Layout>

      {/* Side Slide-Over Details Modal */}
      {selectedLedgerId !== null && (
        <DetailModal 
          ledgerId={selectedLedgerId}
          onClose={() => setSelectedLedgerId(null)}
        />
      )}
    </>
  );
}
