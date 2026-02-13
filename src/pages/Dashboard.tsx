import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TrendingUp, Plus, Bell, Wallet, ArrowRight } from 'lucide-react';
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

  // Computed Data
  const balance = cycleMetrics?.remainingBudget || 0;
  const spent = cycleMetrics?.spentThisCycle || 0;
  // Income could be activeCycle budget or sum of income transactions. Using activeCycle for now to match logic.
  const income = activeCycle?.initialBudget || 0;

  // Chart Data Processing
  const chartData = useMemo(() => {
    if (!transactions.length) return [];

    const now = new Date();
    let startDate = new Date();

    if (timeRange === '1W') startDate.setDate(now.getDate() - 7);
    else if (timeRange === '1M') startDate.setMonth(now.getMonth() - 1);
    else if (timeRange === 'All') startDate = new Date(0); // Beginning of time

    const filtered = transactions
      .filter(t => new Date(t.date) >= startDate && t.type === TransactionType.EXPENSE)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Group by day
    const grouped: Record<string, number> = {};
    filtered.forEach(t => {
      const day = new Date(t.date).toLocaleDateString(undefined, { weekday: 'short' }); // Mon, Tue...
      grouped[day] = (grouped[day] || 0) + t.amount;
    });

    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [transactions, timeRange]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4);
  }, [transactions]);

  // Handle Create Transaction
  const handleCreateTransaction = (amount: number, description: string, category: string, type: TransactionType, isExceptional: boolean) => {
    addTransaction({
      amount,
      description,
      category,
      type,
      isExceptional,
      date: new Date().toISOString()
    });
    setIsCreateModalOpen(false);
  };

  // Empty State Logic
  const isEmpty = transactions.length === 0 && !activeCycle;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Wallet className="w-16 h-16 text-primary opacity-80" />
        </div>
        <h2 className="text-2xl font-black text-foreground">Tu espacio está listo</h2>
        <p className="text-muted-foreground max-w-xs mx-auto">
          Aún no tienes movimientos. Registra tu primer gasto o ingreso para ver la magia.
        </p>
        <Button onClick={() => setIsCreateModalOpen(true)} variant="premium" className="px-8 py-6 rounded-2xl text-lg shadow-xl shadow-primary/20">
          <Plus className="mr-2 w-5 h-5" /> Registrar Gasto
        </Button>

        <CreateTransactionModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateTransaction}
          categories={categories}
          currency={currency}
        />
      </div>
    )
  }

  return (
    <div className="pb-32 space-y-8 animate-in fade-in zoom-in-95 duration-700 ease-out pt-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight italic uppercase">
            Hola, {user?.full_name?.split(' ')[0] || 'Viajero'}
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
            Resumen Financiero
          </p>
        </div>
        <Button size="icon" variant="ghost" className="rounded-full w-10 h-10 bg-secondary/50 hover:bg-secondary">
          <Bell className="w-5 h-5 text-muted-foreground" />
        </Button>
      </div>

      {/* Hero Balance Card */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/10 blur-3xl opacity-50" />
        <Card className="relative overflow-hidden border border-white/5 bg-card/40 backdrop-blur-xl shadow-2xl rounded-[2.5rem] py-8">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">Saldo Disponible</span>
            <div className="flex flex-col items-center">
              <span className="text-5xl md:text-6xl font-black text-foreground tracking-tighter">
                {formatCurrency(balance, currency)}
              </span>

              {/* Optional: Add percentage trend if we calculate it later */}
              {/* <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-green-400 bg-green-400/10 px-4 py-1.5 rounded-full border border-green-400/20">
                <TrendingUp className="w-3 h-3" />
                +2.4% este mes
              </div> */}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px bg-white/5 mt-8 border-t border-white/5">
            <div className="p-4 text-center space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Ingresos</span>
              <p className="text-lg font-bold text-foreground/90">{formatCurrency(income, currency)}</p>
            </div>
            <div className="p-4 text-center space-y-1 border-l border-white/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Gastos</span>
              <p className="text-lg font-bold text-foreground/90">{formatCurrency(spent, currency)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Chart & Recent Activity */}
      <div className="grid gap-6">
        {/* Chart */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">Gastos</h3>
            <div className="flex bg-secondary/30 rounded-full p-1 border border-white/5">
              {['1W', '1M', 'All'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    "px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full transition-all",
                    timeRange === range ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(20,20,20,0.9)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-2">
            <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">Recientes</h3>
            <button onClick={() => onNavigate('budget')} className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
              Ver todos <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((t) => (
                <div key={t.id} className="bg-card/30 border border-white/5 rounded-2xl p-4 flex justify-between items-center backdrop-blur-sm hover:bg-card/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm font-bold",
                      t.type === TransactionType.EXPENSE ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"
                    )}>
                      {t.type === TransactionType.EXPENSE ? '↓' : '↑'}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{t.description || t.category}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{new Date(t.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "font-black text-sm tracking-tight",
                    t.type === TransactionType.EXPENSE ? "text-foreground" : "text-green-400"
                  )}>
                    {t.type === TransactionType.EXPENSE ? '-' : '+'} {formatCurrency(t.amount, currency)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground text-xs">
                Sin movimientos recientes
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions - Floating Feel */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="glass"
          className="h-28 flex flex-col items-center justify-center gap-3 rounded-[2rem] border-white/5 bg-white/5 hover:bg-white/10 transition-all hover:scale-[1.02] shadow-xl"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <div className="p-3 bg-primary/20 rounded-2xl text-primary shadow-lg shadow-primary/10">
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Nuevo Gasto</span>
        </Button>

        <Button
          variant="glass"
          className="h-28 flex flex-col items-center justify-center gap-3 rounded-[2rem] border-white/5 bg-white/5 hover:bg-white/10 transition-all hover:scale-[1.02] shadow-xl"
          onClick={() => onNavigate('insights')}
        >
          <div className="p-3 bg-purple-500/20 rounded-2xl text-purple-400 shadow-lg shadow-purple-500/10">
            <TrendingUp className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Reportes</span>
        </Button>
      </div>

      <CreateTransactionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateTransaction}
        categories={categories}
        currency={currency}
      />
    </div>
  );
};

export default Dashboard;