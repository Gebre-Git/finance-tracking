import { Router, Request, Response } from 'express';
import db from '../db';
import fs from 'fs';
import path from 'path';

const router = Router();

// Helper to escape CSV cell values
function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

// GET /api/export/json - Raw JSON Backup Download
router.get('/json', (req: Request, res: Response) => {
  try {
    const dbPath = path.join(__dirname, '../../data/finance.json');
    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ error: 'Database file not found' });
    }

    const filename = `finance_backup_${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const fileStream = fs.createReadStream(dbPath);
    fileStream.pipe(res);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/export/csv - Unified Ledger CSV Export
router.get('/csv', (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        l.id,
        l.name,
        l.created_at,
        l.entry_type,
        l.ref_id,
        l.total_remaining,
        COALESCE(i.amount, e.amount, 0) as amount,
        COALESCE(i.type, e.type) as type
      FROM main_ledger l
      LEFT JOIN income i ON l.entry_type = 'income' AND l.ref_id = i.id
      LEFT JOIN expense e ON l.entry_type = 'expense' AND l.ref_id = e.id
      ORDER BY l.created_at DESC, l.id DESC
    `;
    const rows = db.prepare(query).all() as any[];

    const headers = ['Ledger ID', 'Name', 'Date/Time', 'Entry Type', 'Category', 'Amount (ETB)', 'Running Balance (ETB)'];
    const csvRows = [headers.join(',')];

    for (const row of rows) {
      csvRows.push([
        escapeCsv(row.id),
        escapeCsv(row.name),
        escapeCsv(row.created_at ? new Date(row.created_at).toLocaleString() : ''),
        escapeCsv(row.entry_type),
        escapeCsv(row.type || ''),
        escapeCsv(row.amount),
        escapeCsv(row.total_remaining)
      ].join(','));
    }

    const filename = `ledger_export_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvRows.join('\n'));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/export/expenses/csv - Expenses CSV Export
router.get('/expenses/csv', (req: Request, res: Response) => {
  try {
    const rows = db.prepare('SELECT * FROM expense ORDER BY id DESC').all() as any[];

    const headers = ['ID', 'Name', 'Date/Time', 'Amount (ETB)', 'Planned', 'Category', 'Description'];
    const csvRows = [headers.join(',')];

    for (const row of rows) {
      csvRows.push([
        escapeCsv(row.id),
        escapeCsv(row.name),
        escapeCsv(row.created_at ? new Date(row.created_at).toLocaleString() : ''),
        escapeCsv(row.amount),
        escapeCsv(Number(row.planned) === 1 ? 'Yes' : 'No'),
        escapeCsv(row.type),
        escapeCsv(row.description || '')
      ].join(','));
    }

    const filename = `expenses_export_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvRows.join('\n'));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/export/income/csv - Income CSV Export
router.get('/income/csv', (req: Request, res: Response) => {
  try {
    const rows = db.prepare('SELECT * FROM income ORDER BY id DESC').all() as any[];

    const headers = ['ID', 'Name', 'Date/Time', 'Amount (ETB)', 'Type', 'Source'];
    const csvRows = [headers.join(',')];

    for (const row of rows) {
      csvRows.push([
        escapeCsv(row.id),
        escapeCsv(row.name),
        escapeCsv(row.created_at ? new Date(row.created_at).toLocaleString() : ''),
        escapeCsv(row.amount),
        escapeCsv(row.type),
        escapeCsv(row.source || '')
      ].join(','));
    }

    const filename = `income_export_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvRows.join('\n'));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
