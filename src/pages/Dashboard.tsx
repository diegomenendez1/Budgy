import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { TrendingUp, Plus, ArrowRight, ArrowDownRight, ArrowUpRight, Sparkles } from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import { cn, formatCurrency } from '../lib/utils';
import { TransactionType } from '../types';
import CreateTransactionModal from '../components/budget/modals/CreateTransactionModal';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { activeCycle, cycleMetrics, currency, transactions, addTransaction, categories } = useFinance();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('1W');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const balance = cycleMetrics?.remainingBudget || 0;
  const spent = cycleMetrics?.spentThisCycle || 0;
  const income = activeCycle?.initialBudget || 0;

  const chartData = useMemo(() => {
    if (!transactions.length) return [];
    const now = new Date();
    let startDate = new Date();
    if (timeRange === '1W') startDate.setDate(now.getDate() - 7);
    else if (timeRange === '1M') startDate.setMonth(now.getMonth() - 1);
    else if (timeRange === 'All') startDate = new Date(0);

    const filtered = transactions
      .filter(t => new Date(t.date) >= startDate && t.type === TransactionType.EXPENSE)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const grouped: Record<string, number> = {};
    filtered.forEach(t => {
      const day = new Date(t.date).toLocaleDateString(undefined, { weekday: 'short' });
      grouped[day] = (grouped[day] || 0) + t.amount;
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [transactions, timeRange]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4);
  }, [transactions]);

  const handleCreateTransaction = (amount: number, description: string, category: string, type: TransactionType, isExceptional: boolean) => {
    addTransaction({ amount, description, category, type, isExceptional, date: new Date().toISOString() });
    setIsCreateModalOpen(false);
  };

  const isEmpty = transactions.length === 0 && !activeCycle;

  // --- Empty State ---
  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center h-[75vh] text-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
            <Sparkles className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Tu espacio esta listo</h2>
          <p className="text-slate-500 text-sm max-w-[260px] mx-auto leading-relaxed">
            Registra tu primer movimiento para comenzar a trackear.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-8 h-12 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-lg shadow-blue-500/25"
        >
          <Plus className="mr-2 w-4 h-4" /> Registrar Movimiento
        </Button>
        <CreateTransactionModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreate={handleCreateTransaction} categories={categories} currency={currency} />
      </div>
    );
  }

  // --- Main Dashboard ---
  return (
    <div className="pb-8 space-y-6 pt-6">

      {/* Header */}
      <div>
        <p className="text-slate-500 text-xs font-medium">Bienvenido</p>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {user?.full_name?.split(' ')[0] || 'Viajero'}
        </h1>
      </div>

      {/* Hero Balance Card */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 relative overflow-hidden">
        {/* Subtle blue gradient top border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600" />

        <div className="relative">
          <p className="text-xs text-slate-500 font-medium mb-1">Saldo Disponible</p>
          <p className={cn(
            "text-4xl font-bold tracking-tight tabular-nums",
            balance < 0
              ? "text-red-600"
              : "text-slate-900"
          )}>
            {formatCurrency(balance, currency)}
          </p>

          <div className="grid grid-cols-2 gap-3 mt-6">
            {/* Income mini-card */}
            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
              <div className="flex items-center gap-1.5 mb-1">
                <ArrowUpRight size={14} className="text-emerald-600" />
                <span className="text-[11px] text-emerald-700 font-medium">Ingresos</span>
              </div>
              <p className="text-base font-semibold text-emerald-700 tabular-nums">
                {formatCurrency(income, currency)}
              </p>
            </div>
            {/* Expense mini-card */}
            <div className="bg-red-50 rounded-xl p-3 border border-red-100">
              <div className="flex items-center gap-1.5 mb-1">
                <ArrowDownRight size={14} className="text-red-600" />
                <span className="text-[11px] text-red-700 font-medium">Gastos</span>
              </div>
              <p className="text-base font-semibold text-red-700 tabular-nums">
                {formatCurrency(spent, currency)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-slate-900">Actividad</h3>
          <div className="flex bg-slate-50 rounded-lg p-0.5 border border-slate-200/60">
            {['1W', '1M', 'All'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-3 py-1 text-[11px] font-medium rounded-md transition-all duration-150",
                  timeRange === range
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="h-36 w-full rounded-2xl bg-white border border-slate-200/60 shadow-sm p-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#0F172A',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
                }}
                itemStyle={{ color: '#0F172A', fontWeight: '600' }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3B82F6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#chartGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-slate-900">Recientes</h3>
          <button
            onClick={() => onNavigate('budget')}
            className="text-xs text-blue-600 font-medium flex items-center gap-1 hover:text-blue-700 transition-colors"
          >
            Ver todo <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-2">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((t) => (
              <div
                key={t.id}
                className="bg-white border border-slate-200/60 rounded-xl p-3.5 flex justify-between items-center hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center",
                    t.type === TransactionType.EXPENSE
                      ? "bg-red-50 text-red-600"
                      : "bg-emerald-50 text-emerald-700"
                  )}>
                    {t.type === TransactionType.EXPENSE
                      ? <ArrowDownRight size={16} />
                      : <ArrowUpRight size={16} />
                    }
                  </div>
                  <div>
                    <p className="font-medium text-sm text-slate-900">
                      {t.description || t.category}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {new Date(t.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
                <span className={cn(
                  "font-semibold text-sm tabular-nums",
                  t.type === TransactionType.EXPENSE ? "text-red-600" : "text-emerald-700"
                )}>
                  {t.type === TransactionType.EXPENSE ? '-' : '+'}{formatCurrency(t.amount, currency)}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500 text-xs rounded-2xl border border-dashed border-slate-200">
              Sin movimientos recientes
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-col items-start gap-3 hover:bg-blue-100/60 transition-all active:scale-[0.97]"
        >
          <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-900">Nuevo Gasto</span>
        </button>

        <button
          onClick={() => onNavigate('insights')}
          className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-start gap-3 hover:bg-slate-50 transition-all active:scale-[0.97]"
        >
          <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-900">Reportes</span>
        </button>
      </div>

      <CreateTransactionModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreate={handleCreateTransaction} categories={categories} currency={currency} />
    </div>
  );
};

export default Dashboard;
