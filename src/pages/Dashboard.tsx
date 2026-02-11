import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Plus, Search, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

const data = [
  { name: 'Mon', value: 4000 },
  { name: 'Tue', value: 3000 },
  { name: 'Wed', value: 2000 },
  { name: 'Thu', value: 2780 },
  { name: 'Fri', value: 1890 },
  { name: 'Sat', value: 2390 },
  { name: 'Sun', value: 3490 },
];

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { activeCycle, cycleMetrics, currency } = useFinance();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('1W');

  // Safe default values if context is loading/empty
  const balance = cycleMetrics?.remainingBudget || 0;
  const spent = cycleMetrics?.spentThisCycle || 0;
  const income = activeCycle?.initialBudget || 0; // Simplified estimation

  return (
    <div className="pb-32 space-y-8 animate-in fade-in zoom-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center px-2">
        <div>
          <h2 className="text-sm font-medium text-gray-400">Buenos días,</h2>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            {user?.user_metadata?.full_name || 'Usuario'}
          </h1>
        </div>
        <div className="flex gap-3">
          <Button size="icon" variant="glass" className="rounded-full w-10 h-10">
            <Search className="w-5 h-5" />
          </Button>
          <Button size="icon" variant="glass" className="rounded-full w-10 h-10 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-black" />
          </Button>
        </div>
      </div>

      {/* Balance Card */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-indigo-900/50 via-purple-900/30 to-black/50">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

        <CardHeader>
          <CardDescription className="text-indigo-200">Saldo Disponible</CardDescription>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white tracking-tight">
              {currency === 'EUR' ? '€' : '$'}{balance.toLocaleString()}
            </span>
            <div className="flex items-center text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3 mr-1" />
              +2.4%
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="bg-white/5 rounded-2xl p-3 flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-green-500/20 rounded-lg text-green-400">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <span className="text-xs text-gray-400">Ingresos</span>
              </div>
              <span className="text-lg font-semibold">{currency === 'EUR' ? '€' : '$'}{income.toLocaleString()}</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-red-500/20 rounded-lg text-red-400">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
                <span className="text-xs text-gray-400">Gastos</span>
              </div>
              <span className="text-lg font-semibold">{currency === 'EUR' ? '€' : '$'}{spent.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="font-bold text-lg">Resumen de Gastos</h3>
          <div className="flex bg-white/5 rounded-xl p-1">
            {['1D', '1W', '1M', '1Y'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-xs rounded-lg transition-all ${timeRange === range ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="value" stroke="#8884d8" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transactions Shortcuts */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="glass"
          className="h-24 flex flex-col items-start justify-center gap-2 rounded-3xl border-white/5 bg-gradient-to-br from-indigo-500/10 to-transparent hover:from-indigo-500/20"
          onClick={() => onNavigate('budget')}
        >
          <div className="p-2 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/30">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <span className="font-medium">Nuevo Gasto</span>
        </Button>

        <Button
          variant="glass"
          className="h-24 flex flex-col items-start justify-center gap-2 rounded-3xl border-white/5 bg-gradient-to-br from-purple-500/10 to-transparent hover:from-purple-500/20"
          onClick={() => onNavigate('insights')}
        >
          <div className="p-2 bg-purple-500 rounded-xl shadow-lg shadow-purple-500/30">
            <Search className="w-5 h-5 text-white" />
          </div>
          <span className="font-medium">Ver Reporte</span>
        </Button>
      </div>

    </div>
  );
};

export default Dashboard;