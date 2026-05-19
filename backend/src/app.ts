import express from 'express';
import cors from 'cors';
import { initDB } from './db';
import incomeRouter from './routes/income';
import expenseRouter from './routes/expense';
import ledgerRouter from './routes/ledger';
import summaryRouter from './routes/summary';
import planningRouter from './routes/planning';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Database Schema
initDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/income', incomeRouter);
app.use('/api/expense', expenseRouter);
app.use('/api/ledger', ledgerRouter);
app.use('/api', summaryRouter); // Mounts /api/summary and /api/charts
app.use('/api/planning', planningRouter);

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
