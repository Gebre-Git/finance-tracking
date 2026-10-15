import { Router, Request, Response } from 'express';
import db from '../db';

const router = Router();

interface SavingEntry {
  id: number;
  label: string | null;
  amount: number;
  direction: 'deposit' | 'withdrawal';
  created_at: string;
}

// Helper — compute current saving balance from all transactions
function computeBalance(transactions: SavingEntry[]): number {
  return transactions.reduce((bal, t) => {
    return t.direction === 'deposit' ? bal + t.amount : bal - t.amount;
  }, 0);
}

// GET /api/saving — fetch all saving transactions + current balance
router.get('/', (_req: Request, res: Response) => {
  try {
    const transactions = db.prepare('SELECT * FROM saving ORDER BY created_at DESC').all() as SavingEntry[];
    const balance = computeBalance(transactions);
    res.json({ balance, transactions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/saving/deposit — move money from main account INTO savings
// This does NOT record an expense — it only increases the saving balance.
router.post('/deposit', (req: Request, res: Response) => {
  const { amount, label, created_at } = req.body;

  if (amount === undefined || Number(amount) <= 0) {
    return res.status(400).json({ error: 'A positive amount is required' });
  }

  try {
    const timestamp = created_at ? new Date(created_at).toISOString() : new Date().toISOString();
    const result = db.prepare(
      'INSERT INTO saving (label, amount, direction, created_at) VALUES (?, ?, ?, ?)'
    ).run(label || null, Number(amount), 'deposit', timestamp) as any;

    const transactions = db.prepare('SELECT * FROM saving ORDER BY created_at DESC').all() as SavingEntry[];
    const balance = computeBalance(transactions);

    res.status(210).json({
      id: result.lastInsertRowid,
      label: label || null,
      amount: Number(amount),
      direction: 'deposit',
      created_at: timestamp,
      balance
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/saving/withdrawal — return money FROM savings back to main account
// This does NOT record income — it only decreases the saving balance.
router.post('/withdrawal', (req: Request, res: Response) => {
  const { amount, label, created_at } = req.body;

  if (amount === undefined || Number(amount) <= 0) {
    return res.status(400).json({ error: 'A positive amount is required' });
  }

  try {
    // Check we're not withdrawing more than we have
    const transactions = db.prepare('SELECT * FROM saving ORDER BY created_at DESC').all() as SavingEntry[];
    const currentBalance = computeBalance(transactions);
    if (Number(amount) > currentBalance) {
      return res.status(400).json({
        error: `Insufficient saving balance. Available: ${currentBalance} ETB`
      });
    }

    const timestamp = created_at ? new Date(created_at).toISOString() : new Date().toISOString();
    const result = db.prepare(
      'INSERT INTO saving (label, amount, direction, created_at) VALUES (?, ?, ?, ?)'
    ).run(label || null, Number(amount), 'withdrawal', timestamp) as any;

    const updatedTransactions = db.prepare('SELECT * FROM saving ORDER BY created_at DESC').all() as SavingEntry[];
    const balance = computeBalance(updatedTransactions);

    res.status(210).json({
      id: result.lastInsertRowid,
      label: label || null,
      amount: Number(amount),
      direction: 'withdrawal',
      created_at: timestamp,
      balance
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/saving/:id — remove a saving transaction
router.delete('/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);

  try {
    const transactions = db.prepare('SELECT * FROM saving ORDER BY created_at DESC').all() as SavingEntry[];
    const entry = transactions.find(t => t.id === id);

    if (!entry) {
      return res.status(404).json({ error: 'Saving entry not found' });
    }

    db.prepare('DELETE FROM saving WHERE id = ?').run(id);

    const updatedTransactions = db.prepare('SELECT * FROM saving ORDER BY created_at DESC').all() as SavingEntry[];
    const balance = computeBalance(updatedTransactions);

    res.json({ success: true, message: `Saving entry ${id} deleted`, balance });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
