import db from '../db';

export function recalculateLedger() {
  const selectStmt = db.prepare(`
    SELECT 
      l.id, 
      l.entry_type, 
      l.ref_id, 
      COALESCE(i.amount, e.amount, 0) as amount 
    FROM main_ledger l 
    LEFT JOIN income i ON l.entry_type = 'income' AND l.ref_id = i.id 
    LEFT JOIN expense e ON l.entry_type = 'expense' AND l.ref_id = e.id 
    ORDER BY l.id ASC
  `);

  const updateStmt = db.prepare('UPDATE main_ledger SET total_remaining = ? WHERE id = ?');

  const entries = selectStmt.all() as { id: number; entry_type: string; ref_id: number; amount: number }[];
  
  let balance = 0;
  for (const entry of entries) {
    if (entry.entry_type === 'income') {
      balance += entry.amount;
    } else if (entry.entry_type === 'expense') {
      balance -= entry.amount;
    }
    updateStmt.run(balance, entry.id);
  }
}
