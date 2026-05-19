import React from 'react';
import { 
  LayoutDashboard, 
  ArrowUpRight, 
  ArrowDownRight, 
  FileText, 
  CalendarRange, 
  Compass 
} from 'lucide-react';

interface LayoutProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  children: React.ReactNode;
  runningBalance: number;
}

export default function Layout({ currentTab, setCurrentTab, children, runningBalance }: LayoutProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'income', label: 'Income', icon: ArrowUpRight },
    { id: 'expenses', label: 'Expenses', icon: ArrowDownRight },
    { id: 'ledger', label: 'Main Ledger', icon: FileText },
    { id: 'timely', label: 'Timely View', icon: CalendarRange },
    { id: 'planning', label: 'Planning', icon: Compass },
  ];

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Left Sidebar */}
      <aside className="w-64 border-r border-border bg-white flex flex-col justify-between p-6 shrink-0 h-screen sticky top-0">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8 select-none">
            <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center text-white font-bold text-sm">
              F
            </div>
            <span className="font-semibold text-lg tracking-tight">Finance<span className="text-muted font-normal text-sm">.et</span></span>
          </div>

          {/* Running Balance Widget */}
          <div className="bg-neutral-50 border border-border rounded-xl p-4 mb-6">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">Total Balance</span>
            <div className={`text-xl font-bold tracking-tight ${(runningBalance ?? 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {(runningBalance ?? 0).toLocaleString()} <span className="text-xs font-medium">ETB</span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex flex-col gap-1">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                    isActive 
                      ? 'bg-neutral-900 text-white' 
                      : 'text-muted hover:text-foreground hover:bg-neutral-50'
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-muted'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="text-xs text-muted font-medium border-t border-border pt-4 select-none">
          <div>Finance Tracker v1.0</div>
          <div className="mt-0.5 text-neutral-400">Ethiopian Birr (ETB)</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
        <header className="border-b border-border bg-white px-8 py-5 shrink-0 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight capitalize">
            {currentTab === 'timely' ? 'Timely View' : currentTab}
          </h1>
          <div className="text-xs text-muted bg-neutral-100 border border-border px-3 py-1.5 rounded-full font-medium">
            Local SQLite DB
          </div>
        </header>
        <div className="p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
