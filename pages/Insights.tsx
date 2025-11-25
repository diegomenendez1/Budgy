import React, { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import Card from '../components/Card';
import { 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieIcon, 
  Target, 
  ArrowRight,
  DollarSign,
  Activity,
  CalendarClock
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { TransactionType } from '../types';

const COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#5856D6', '#8E8E93'];

const Insights: React.FC = () => {
  const { 
    transactions, 
    totalDisposableIncome,
    cycleStartDate,
    savingsGoal,
    spentThisCycle,
    currentBalance,
    cycleHistory
  } = useFinance();

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // --- 1. Cálculos de Tiempo y Presupuesto ---
  const { daysPassed, daysTotal, daysLeft, progressPercentage } = useMemo(() => {
    const start = new Date(cycleStartDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const daysPassed = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    const daysTotal = 30; // Ciclo estándar de 30 días
    const daysLeft = Math.max(0, daysTotal - daysPassed);
    const progressPercentage = (daysPassed / daysTotal) * 100;
    return { daysPassed, daysTotal, daysLeft, progressPercentage };
  }, [cycleStartDate]);

  // --- 2. Métricas KPI ---
  const effectiveBudget = totalDisposableIncome - savingsGoal;
  const burnRate = effectiveBudget > 0 ? (spentThisCycle / effectiveBudget) * 100 : 0;
  
  // Velocidad de gasto: Relación entre % de presupuesto gastado vs % de tiempo transcurrido
  // > 1.0 significa que gastas más rápido que el tiempo
  const spendingVelocity = progressPercentage > 0 ? burnRate / progressPercentage : 0;
  
  const dailyAverage = daysPassed > 0 ? spentThisCycle / daysPassed : 0;
  const projectedSpend = dailyAverage * 30;
  const projectedBalance = effectiveBudget - projectedSpend;

  // --- 3. Datos por Categoría ---
  const categoryData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const grouped: Record<string, number> = {};
    
    expenses.forEach(t => {
      const cat = t.category || 'Otros';
      grouped[cat] = (grouped[cat] || 0) + t.amount;
    });

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // Ordenar mayor a menor
  }, [transactions]);

  // --- 4. Top Gastos ---
  const topTransactions = useMemo(() => {
    return [...transactions]
      .filter(t => t.type === TransactionType.EXPENSE)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions]);

  return (
    <div className="animate-in space-y-6 pt-2">
      <header className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Análisis Profundo</h1>
        <p className="text-gray-500 text-sm font-medium">Métricas de rendimiento financiero</p>
      </header>

      {/* 1. Velocity Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Velocidad */}
        <div className={`p-4 rounded-[24px] border flex flex-col justify-between h-32 relative overflow-hidden ${spendingVelocity > 1.1 ? 'bg-orange-50 border-orange-100 text-orange-900' : 'bg-white border-gray-100 text-gray-900 shadow-sm'}`}>
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1 opacity-70">
                    <Activity size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Velocidad</span>
                </div>
                <span className="text-3xl font-extrabold tracking-tighter">
                    {spendingVelocity.toFixed(1)}x
                </span>
                <p className="text-[10px] font-medium mt-1 opacity-80 leading-tight">
                    {spendingVelocity > 1.1 ? 'Gastas más rápido que el tiempo' : 'Ritmo saludable y controlado'}
                </p>
            </div>
            {/* Chart Background Decoration */}
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                 <TrendingUp size={60} />
            </div>
        </div>

        {/* Proyección */}
        <div className={`p-4 rounded-[24px] border flex flex-col justify-between h-32 relative overflow-hidden ${projectedBalance < 0 ? 'bg-red-50 border-red-100 text-red-900' : 'bg-green-50 border-green-100 text-green-900'}`}>
             <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1 opacity-70">
                    <Target size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Proyección</span>
                </div>
                <span className="text-3xl font-extrabold tracking-tighter">
                    {projectedBalance >= 0 ? '+' : ''}${Math.round(projectedBalance).toLocaleString()}
                </span>
                <p className="text-[10px] font-medium mt-1 opacity-80 leading-tight">
                    Estimado al final del ciclo
                </p>
            </div>
        </div>
      </div>

      {/* 2. Breakdown Pie Chart */}
      <Card title="Distribución de Gastos" subtitle="¿A dónde va tu dinero?" className="overflow-visible">
        <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="h-48 w-48 relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            onMouseEnter={(_, index) => setActiveIndex(index)}
                            onMouseLeave={() => setActiveIndex(null)}
                        >
                            {categoryData.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={COLORS[index % COLORS.length]} 
                                    stroke="none"
                                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.3}
                                />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs text-gray-400 font-bold uppercase">Total</span>
                    <span className="text-lg font-bold text-gray-900">${spentThisCycle.toLocaleString()}</span>
                </div>
            </div>

            {/* Legend */}
            <div className="w-full space-y-3">
                {categoryData.slice(0, 4).map((cat, index) => (
                    <div key={cat.name} className="flex justify-between items-center group cursor-pointer" onMouseEnter={() => setActiveIndex(index)} onMouseLeave={() => setActiveIndex(null)}>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">{cat.name}</span>
                        </div>
                        <div className="text-right">
                             <span className="block text-sm font-bold text-gray-900">${cat.value.toLocaleString()}</span>
                             <span className="text-[10px] text-gray-400 font-medium">
                                {((cat.value / spentThisCycle) * 100).toFixed(1)}%
                             </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </Card>

      {/* 3. Daily Average vs Limit */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-end mb-4">
              <div>
                  <h3 className="text-gray-900 font-bold text-lg">Promedio Diario</h3>
                  <p className="text-gray-400 text-xs font-medium mt-1">Real vs Permitido</p>
              </div>
              <div className="bg-gray-50 p-2 rounded-xl">
                  <CalendarClock size={20} className="text-gray-400" />
              </div>
          </div>
          
          <div className="space-y-4">
              {/* Real Spend Bar */}
              <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-gray-600">Gasto Promedio Actual</span>
                      <span className="text-gray-900">${Math.round(dailyAverage).toLocaleString()} / día</span>
                  </div>
                  <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(((dailyAverage / (effectiveBudget/30)) * 100), 100)}%` }}></div>
                  </div>
              </div>

              {/* Safe Limit Bar */}
              <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-gray-400">Límite Saludable</span>
                      <span className="text-gray-500">${Math.round(effectiveBudget / 30).toLocaleString()} / día</span>
                  </div>
                  <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden relative">
                      {/* Pattern for limit */}
                      <div className="absolute inset-0 w-full h-full opacity-30 bg-[linear-gradient(45deg,#000_25%,transparent_25%,transparent_50%,#000_50%,#000_75%,transparent_75%,transparent)] bg-[length:10px_10px]"></div>
                  </div>
              </div>
          </div>
      </div>

      {/* 4. Top Expenses List */}
      <Card title="Mayores Gastos" subtitle="Identifica tus fugas" noPadding>
         <div className="divide-y divide-gray-100">
             {topTransactions.map((t) => (
                 <div key={t.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                     <div className="flex items-center gap-3">
                         <div className="bg-red-50 text-red-500 w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                             <TrendingDown size={18} />
                         </div>
                         <div>
                             <p className="font-bold text-sm text-gray-900 truncate max-w-[140px]">{t.description}</p>
                             <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">{t.category}</p>
                         </div>
                     </div>
                     <span className="font-bold text-gray-900 text-sm">
                         -${t.amount.toLocaleString()}
                     </span>
                 </div>
             ))}
             {topTransactions.length === 0 && (
                 <div className="p-6 text-center text-gray-400 text-sm">Sin datos suficientes</div>
             )}
         </div>
      </Card>

      {/* 5. Historical Performance (Only if data exists) */}
      {cycleHistory.length > 0 && (
        <Card title="Historial de Ahorro" subtitle="Rendimiento últimos ciclos">
             <div className="h-40 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cycleHistory}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis 
                            dataKey="endDate" 
                            tick={{fontSize: 10, fill: '#9CA3AF'}} 
                            axisLine={false} 
                            tickLine={false} 
                            tickFormatter={(v) => new Date(v).toLocaleDateString('es-ES', {month:'short'})}
                        />
                        <Tooltip 
                            cursor={{fill: '#F3F4F6'}}
                            contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)'}}
                        />
                        <Bar 
                            dataKey="achievedSurplus" 
                            name="Superávit" 
                            fill="#10b981" 
                            radius={[6, 6, 6, 6]} 
                            barSize={24}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
      )}

    </div>
  );
};

export default Insights;