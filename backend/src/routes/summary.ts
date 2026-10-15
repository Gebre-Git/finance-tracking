import { Router, Request, Response } from 'express';
import db from '../db';

const router = Router();

// Savings account → main account transfers are named "saving" (case-insensitive).
// They increase the running balance (handled by the ledger) but must NOT count
// toward income totals — they are not real income, just a fund transfer.
function isSavingTransfer(name: string): boolean {
  return name?.trim().toLowerCase() === 'saving';
}

// Helper to get week start date (Monday)
function getStartOfWeek(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  return monday.toISOString().split('T')[0];
}

// Helper to get month string (YYYY-MM)
function getStartOfMonth(dateStr: string): string {
  return dateStr.substring(0, 7);
}

// Helper to get date string (YYYY-MM-DD)
function getStartOfDay(dateStr: string): string {
  return dateStr.split('T')[0];
}

interface LedgerEntry {
  id: number;
  name: string;
  created_at: string;
  entry_type: 'income' | 'expense';
  ref_id: number;
  total_remaining: number;
  amount: number;
}

function getGroupedData(period: string) {
  const rawEntries = db.prepare(`
    SELECT 
      l.id,
      l.name,
      l.created_at,
      l.entry_type,
      l.ref_id,
      l.total_remaining,
      COALESCE(i.amount, e.amount, 0) as amount
    FROM main_ledger l
    LEFT JOIN income i ON l.entry_type = 'income' AND l.ref_id = i.id
    LEFT JOIN expense e ON l.entry_type = 'expense' AND l.ref_id = e.id
    ORDER BY l.created_at ASC
  `).all() as LedgerEntry[];

  const groups: Record<string, {
    period: string;
    total_income: number;
    total_expense: number;
    net: number;
    entries: LedgerEntry[];
  }> = {};

  let overallIncome = 0;
  let overallExpense = 0;
  let overallSaving = 0; // saving transfers: increase balance but not income

  for (const entry of rawEntries) {
    let key = '';
    // Format timestamp correctly for parsing
    // SQlite default_timestamp could be 'YYYY-MM-DD HH:MM:SS'. We need to make sure Date parses it correctly.
    // If it's space-separated, replacing space with 'T' and appending 'Z' helps, but let's be safe.
    let dateStr = entry.created_at;
    if (dateStr.includes(' ') && !dateStr.includes('T')) {
      dateStr = dateStr.replace(' ', 'T') + 'Z';
    }

    if (period === 'weekly') {
      key = getStartOfWeek(dateStr);
    } else if (period === 'monthly') {
      key = getStartOfMonth(dateStr);
    } else {
      key = getStartOfDay(dateStr);
    }

    if (!groups[key]) {
      groups[key] = {
        period: key,
        total_income: 0,
        total_expense: 0,
        net: 0,
        entries: []
      };
    }

    if (entry.entry_type === 'income') {
      // Saving transfers are balance top-ups from a savings account — not real income.
      // They still affect the net balance via the ledger but are excluded from income stats.
      if (!isSavingTransfer(entry.name)) {
        groups[key].total_income += entry.amount;
        overallIncome += entry.amount;
      } else {
        overallSaving += entry.amount;
      }
      // Net cash flow for this period includes saving transfers (money is still in hand)
      groups[key].net += entry.amount;
    } else {
      groups[key].total_expense += entry.amount;
      overallExpense += entry.amount;
      groups[key].net -= entry.amount;
    }
    groups[key].entries.push(entry);
  }

  // ─── Incorporate Saving Account Transfers ────────────────────────────────────
  // Deposits move money from main account into savings (reducing main account net).
  // Withdrawals return money from savings into main account (increasing main account net).
  // Neither affects total_income or total_expense.
  const savingTransactions = (db.prepare('SELECT * FROM saving').all() as any[]) || [];
  let currentSavingBalance = 0;

  for (const st of savingTransactions) {
    const amt = Number(st.amount) || 0;
    if (st.direction === 'deposit') {
      currentSavingBalance += amt;
    } else if (st.direction === 'withdrawal') {
      currentSavingBalance -= amt;
    }

    let dateStr = st.created_at;
    if (dateStr && dateStr.includes(' ') && !dateStr.includes('T')) {
      dateStr = dateStr.replace(' ', 'T') + 'Z';
    }

    let key = '';
    if (period === 'weekly') {
      key = getStartOfWeek(dateStr);
    } else if (period === 'monthly') {
      key = getStartOfMonth(dateStr);
    } else {
      key = getStartOfDay(dateStr);
    }

    if (!groups[key]) {
      groups[key] = {
        period: key,
        total_income: 0,
        total_expense: 0,
        net: 0,
        entries: []
      };
    }

    if (st.direction === 'deposit') {
      groups[key].net -= amt;
    } else if (st.direction === 'withdrawal') {
      groups[key].net += amt;
    }
  }

  // Sort groups chronologically
  const sortedPeriods = Object.keys(groups).sort();
  const entriesList = sortedPeriods.map(key => groups[key]);

  // ─── Old-data correction ────────────────────────────────────────────────────
  // Before the new saving system existed, transfers TO savings were recorded as
  // expenses. The money returned FROM savings was recorded as income (type='saving')
  // and ignored from income totals — but it was then spent again as a real expense,
  // causing the same money to be counted as expense TWICE.
  //
  // Fix: sum all income entries with type='saving'. Each one represents money that
  // was originally double-counted as expense (once when sent to savings, once when
  // spent after being returned). Subtracting this total from overallExpense removes
  // the first (wrong) expense recording, leaving only the final real spend.
  //
  // This correction ONLY affects old income records with type='saving'.
  // The new saving[] table (used by /api/saving) is never touched here.
  const allIncomeRows = db.prepare('SELECT * FROM income').all() as any[];
  const oldSavingCorrectionAmount = allIncomeRows
    .filter(i => i.type === 'saving')
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const correctedExpense = Math.max(0, overallExpense - oldSavingCorrectionAmount);

  return {
    overallIncome,
    overallExpense: correctedExpense,
    // Net balance = main account balance only.
    // We subtract currentSavingBalance because saving deposits move money OUT
    // of the main account into the savings account. It's not an expense, but
    // the main account balance is reduced. Withdrawals from savings return money
    // to main account, so they reduce currentSavingBalance and increase net.
    overallNet: overallIncome - correctedExpense - currentSavingBalance,
    entriesList
  };
}

// GET /api/summary?period=daily|weekly|monthly
router.get('/summary', (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || 'daily';
    const { overallIncome, overallExpense, overallNet, entriesList } = getGroupedData(period);
    
    res.json({
      total_income: overallIncome,
      total_expense: overallExpense,
      net: overallNet,
      entries: entriesList
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/charts?period=daily|weekly|monthly
router.get('/charts', (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || 'daily';
    const { entriesList } = getGroupedData(period);

    const labels: string[] = [];
    const income: number[] = [];
    const expense: number[] = [];
    const net: number[] = [];

    let runningNet = 0;
    for (const group of entriesList) {
      labels.push(group.period);
      income.push(group.total_income);
      expense.push(group.total_expense);
      net.push(group.net);
    }

    res.json({
      labels,
      income,
      expense,
      net
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
