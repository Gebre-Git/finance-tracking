# Personal Finance Tracking Application

An ultra-minimal, high-end, responsive personal finance dashboard built with **TypeScript**, **Node.js/Express**, **SQLite** (`better-sqlite3`), and **React** (via **Vite** and **Tailwind CSS**). 

The app features a unified transaction ledger log, multi-condition and range filtering, time-series data visualizations, expandable calendar-period aggregations, budgeting envelopes, and detailed transaction drill-downs. All values are stored and tracked in **Ethiopian Birr (ETB)**.

---

## Technical Features

1. **Transactional Ledger Safety**: Automatic calculation of running balance using SQL transaction blocks to prevent sync discrepancies.
2. **Advanced Multi-Condition Filters**: Clean, modular filter pills combining complex categories, partial string matches, and number range boundaries with `AND` operations.
3. **Wow-Factor Interactions**: Slide-over drawer creation forms, nested expandable tables, and smooth visual transition micro-animations.
4. **Cross-Tab Navigational Anchors**: Clicking any income or expense row automatically jumps to the ledger view and highlights the exact transaction log with a smooth glow effect.
5. **No Cloud Bloat**: Operates entirely locally on a synchronous SQLite instance (`./backend/data/finance.db`).

---

## Getting Started

Follow these step-by-step commands to install and run both servers locally.

### ─── 1. BACKEND API SERVER ───────────────────────────

Open a terminal and navigate to the `backend` folder to install dependencies and boot the developer instance:

```bash
cd backend
npm install
npm run dev
```

- The API server will boot at **`http://localhost:3000`**.
- Database schemas will initialize automatically in `./data/finance.db`.

### ─── 2. FRONTEND VITE DASHBOARD ────────────────────

Open a second terminal window (or split pane) and boot the React developer server:

```bash
cd frontend
npm install
npm run dev
```

- The local web app will start at **`http://localhost:5173`**.
- An integrated API proxy configuration ensures all queries to `/api/*` are securely passed to the Express server.

---

## Tech Stack Overview

- **Backend**: Node.js, Express, TypeScript, `better-sqlite3` (Zero-ORM raw SQL).
- **Frontend**: Vite, React, TypeScript, Tailwind CSS, Recharts (Modern vectors), Lucide React.
- **Data Currency**: ETB (Ethiopian Birr).
- **Locality**: 100% offline, zero external API tracking.
