import React from 'react';
import { TrendingUp, TrendingDown, Wallet, AlertCircle } from 'lucide-react';

interface SummaryCardsProps {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  unnecessaryExpense: number;
}

export default function SummaryCards({ 
  totalIncome, 
  totalExpense, 
  netBalance, 
  unnecessaryExpense 
}: SummaryCardsProps) {
  const cards = [
    {
      label: 'Total Income',
      value: totalIncome,
      icon: TrendingUp,
      colorClass: 'text-green-600',
      bgColor: 'bg-green-50/50',
      borderColor: 'border-green-100',
    },
    {
      label: 'Total Expense',
      value: totalExpense,
      icon: TrendingDown,
      colorClass: 'text-red-500',
      bgColor: 'bg-red-50/50',
      borderColor: 'border-red-100',
    },
    {
      label: 'Net Balance',
      value: netBalance,
      icon: Wallet,
      colorClass: netBalance >= 0 ? 'text-accent' : 'text-red-600',
      bgColor: netBalance >= 0 ? 'bg-blue-50/50' : 'bg-red-50/50',
      borderColor: netBalance >= 0 ? 'border-blue-100' : 'border-red-100',
    },
    {
      label: 'Unnecessary Spend',
      value: unnecessaryExpense,
      icon: AlertCircle,
      colorClass: 'text-amber-600',
      bgColor: 'bg-amber-50/50',
      borderColor: 'border-amber-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {cards.map(card => {
        const Icon = card.icon;
        return (
          <div 
            key={card.label} 
            className={`border rounded-xl p-5 bg-white shadow-premium hover:shadow-premium-hover transition-all flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">{card.label}</span>
              <div className={`p-2 rounded-lg ${card.bgColor} border ${card.borderColor}`}>
                <Icon className={`w-4 h-4 ${card.colorClass}`} />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight">
                {card.value.toLocaleString()} <span className="text-xs font-medium text-muted">ETB</span>
              </div>
              <p className="text-[10px] text-muted mt-1">Ethiopian Birr base currency</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
