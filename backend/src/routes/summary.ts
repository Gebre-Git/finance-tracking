import { Router, Request, Response } from 'express';
import db from '../db';

const router = Router();

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
      groups[key].total_income += entry.amount;
      overallIncome += entry.amount;
    } else {
      groups[key].total_expense += entry.amount;
      overallExpense += entry.amount;
    }
    
    groups[key].net = groups[key].total_income - groups[key].total_expense;
    groups[key].entries.push(entry);
  }

  // Sort groups chronologically
  const sortedPeriods = Object.keys(groups).sort();
  const entriesList = sortedPeriods.map(key => groups[key]);

  return {
    overallIncome,
    overallExpense,
    overallNet: overallIncome - overallExpense,
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
