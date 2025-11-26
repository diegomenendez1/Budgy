import React, { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import Card from '../components/Card';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  CalendarClock,
  Lightbulb,
  AlertOctagon,
  Award,
  Zap,
  Target,
  Layers,
  CalendarCheck
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
    activeCycle,
    cycleMetrics,
    totalDisposableIncome,
    weeklyBreakdown,
    totalFixedExpenses,
    totalFixedIncome
  } = useFinance();

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Destructure metrics from the robust context calculation
  const {
      daysPassed,
      progressPercentage,
      spentThisCycle,
      spentPace,
      idealDailyBudget,
      remainingBudget,
      currentSurplus
  } = cycleMetrics;

  // --- 1. Projections and Velocity ---
  // Effective Budget = Total Available for Spending
  const effectiveBudget = activeCycle ? activeCycle.initialBudget : 0;
  
  // Burn Rate: % of budget spent
  const burnRate = effectiveBudget > 0 ? (spentThisCycle / effectiveBudget) * 100 : 0;
  
  // Velocity: Ratio of % Spend vs % Time
  const spendingVelocity = progressPercentage > 0 ? burnRate / progressPercentage : 0;
  
  const dailyAverage = daysPassed > 0 ? spentThisCycle / daysPassed : 0;
  const projectedSpend = dailyAverage * (cycleMetrics.daysTotal || 30);
  const projectedBalance = effectiveBudget - projectedSpend;

  // --- 2. Data by Category (Filtered by Active Cycle) ---
  const categoryData = useMemo(() => {
    if (!activeCycle) return [];
    
    // Use the same filter logic as in context or refactor context to expose it
    const start = new Date(activeCycle.startDate);
    const end = new Date(activeCycle.endDate);
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);

    const expenses = transactions.filter(t => {
         const d = new Date(t.date);
         return d >= start && d <= end && t.type === TransactionType.EXPENSE;
    });

    const grouped: Record<string, number> = {};
    
    expenses.forEach(t => {
      const cat = t.category || 'Otros';
      grouped[cat] = (grouped[cat] || 0) + t.amount;
    });

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, activeCycle]);

  // --- 3. Weekly Data for Chart ---
  const weeklyChartData = useMemo(() => {
      return weeklyBreakdown.map(w => ({
          name: w.label.replace('Semana ', 'S'),
          spent: w.spent,
          limit: w.limit,
          status: w.remaining < 0 ? 'bad' : 'good'
      }));
  }, [weeklyBreakdown]);

  // --- 4. Zero Spend Days Calculation ---
  const zeroSpendDays = useMemo(() => {
      if (!activeCycle) return 0;
      const start = new Date(activeCycle.startDate);
      const today = new Date();
      let count = 0;
      
      // Iterate from start date to today
      for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
          // Check if any transaction exists on this day
          const hasTx = transactions.some(t => {
              const tDate = new Date(t.date);
              return tDate.toDateString() === d.toDateString() && t.type === TransactionType.EXPENSE;
          });
          
          const isToday = d.toDateString() === new Date().toDateString();
          // Don't count today until it's effectively over
          if (!hasTx && !isToday) { 
              count++;
          }
      }
      return count;
  }, [activeCycle, transactions]);

  // --- 5. Financial Structure Analysis ---
  const totalIncome = totalFixedIncome; // Base
  const fixedRatio = totalIncome > 0 ? (totalFixedExpenses / totalIncome) * 100 : 0;
  
  // --- 6. Coach Logic ---
  const coachInsight = useMemo(() => {
    if (!activeCycle) return {
        theme: 'info', icon: Lightbulb, title: 'Inicia un Ciclo', message: 'Configura un ciclo en Presupuesto para activar el coach.', action: 'Ir a pestaña Presupuesto'
    };

    const mainCategory = categoryData[0] ? categoryData[0].name : 'gastos varios';
    
    // Danger: Projection negative
    if (projectedBalance < 0) {
      return {
        theme: 'danger',
        icon: AlertOctagon,
        title: 'Alerta de Déficit',
        message: `Estás gastando por encima de tus posibilidades. Si sigues así, terminarás el ciclo debiendo $${Math.abs(Math.round(projectedBalance)).toLocaleString()}.`,
        action: `Tu mayor fuga es ${mainCategory}. Intenta no gastar nada en esta categoría por los próximos 3 días.`
      };
    }

    // Warning: High Velocity
    if (spendingVelocity > 1.15) {
      return {
        theme: 'warning',
        icon: Zap,
        title: 'Desacelera un poco',
        message: 'Tienes dinero, pero lo estás gastando muy rápido para la altura del mes en la que estamos.',
        action: 'Prueba un "día cero gastos" mañana para equilibrar tu curva de consumo.'
      };
    }

    // Info: Low Savings Rate (Contextual)
    const realTotalIncome = effectiveBudget + (activeCycle.savingsGoal || 0);
    const savingsRate = realTotalIncome > 0 ? ((activeCycle.savingsGoal || 0) / realTotalIncome) * 100 : 0;
    
    if (savingsRate < 10 && effectiveBudget > 0) {
      return {
        theme: 'info',
        icon: Lightbulb,
        title: 'Ritmo Saludable',
        message: 'Tienes tus gastos bajo control total. Es un excelente momento para ser más ambicioso.',
        action: 'Podrías aumentar tu meta de ahorro un 5% para el próximo ciclo sin afectar tu estilo de vida.'
      };
    }

    // Success
    return {
      theme: 'success',
      icon: Award,
      title: '¡Gestión Maestra!',
      message: 'Estás manejando tus finanzas como un profesional. Tienes superávit proyectado y buen ahorro.',
      action: 'Considera usar el excedente proyectado para una inversión a largo plazo o un gusto libre de culpa.'
    };
  }, [projectedBalance, spendingVelocity, activeCycle, categoryData, effectiveBudget]);

  const getCoachStyles = (theme: string) => {
    switch (theme) {
      case 'danger': return 'bg-red-500 text-white shadow-red-500/30';
      case 'warning': return 'bg-orange-500 text-white shadow-orange-500/30';
      case 'info': return 'bg-blue-600 text-white shadow-blue-500/30';
      case 'success': return 'bg-green-600 text-white shadow-green-500/30';
      default: return 'bg-gray-800 text-white';
    }
  };

  if (!activeCycle) {
      return (
        <div className="pt-10 flex flex-col items-center justify-center text-center opacity-50">
            <Activity size={48} className="mb-4" />
            <p>Configura un ciclo primero</p>
        </div>
      );
  }

  // --- Helper: Top Transactions ---
  const topTransactions = [...transactions]
    .filter(t => {
         // Filter by active cycle
         const start = new Date(activeCycle.startDate);
         const end = new Date(activeCycle.endDate);
         start.setHours(0,0,0,0);
         end.setHours(23,59,59,999);
         const d = new Date(t.date);
         return d >= start && d <= end && t.type === TransactionType.EXPENSE;
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return (
    <div className="animate-in space-y-6 pt-2">
      <header className="mb-2">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Análisis Profundo</h1>
        <p className="text-gray-500 text-sm font-medium">Radiografía de tus finanzas</p>
      </header>

      {/* --- COACH CARD --- */}
      <div className={`rounded-[28px] p-6 shadow-xl relative overflow-hidden transition-all duration-500 ${getCoachStyles(coachInsight.theme)}`}>
        {/* Background Decorative Pattern */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-40 h-40 bg-black opacity-5 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <coachInsight.icon size={24} className="text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-lg font-bold tracking-tight text-white opacity-95">Coach Financiero</h2>
          </div>
          
          <h3 className="text-2xl font-bold mb-2 text-white leading-tight">
            {coachInsight.title}
          </h3>
          <p className="text-white/90 font-medium leading-snug mb-5 text-[15px]">
            {coachInsight.message}
          </p>

          <div className="bg-white/10 rounded-xl p-3.5 backdrop-blur-md border border-white/10 flex gap-3 items-start">
            <Lightbulb className="text-yellow-300 shrink-0 mt-0.5" size={18} fill="currentColor" fillOpacity={0.2} />
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-0.5">Consejo del día</span>
              <p className="text-sm font-semibold text-white leading-snug">
                {coachInsight.action}
              </p>
            </div>
          </div>
        </div>
      </div>

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

      {/* 2. Zero Spend & Financial Structure */}
      <div className="grid grid-cols-2 gap-3">
         {/* Zero Spend Days */}
         <div className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
             <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1 opacity-70">
                    <CalendarCheck size={16} className="text-indigo-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">Días Cero</span>
                </div>
                <span className="text-3xl font-extrabold tracking-tighter text-indigo-600">
                    {zeroSpendDays}
                </span>
                <p className="text-[10px] font-medium mt-1 text-gray-400 leading-tight">
                    Días sin gastos variables este ciclo
                </p>
            </div>
            <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none text-indigo-600">
                 <Award size={60} />
            </div>
        </div>

        {/* Financial Rigidity */}
        <div className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
            <div className="relative z-10 w-full">
                <div className="flex items-center gap-2 mb-2 opacity-70">
                    <Layers size={16} className="text-gray-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Rigidez</span>
                </div>
                
                <div className="flex items-end gap-1 mb-1">
                    <span className={`text-2xl font-extrabold tracking-tighter ${fixedRatio > 50 ? 'text-red-500' : 'text-gray-900'}`}>
                        {Math.round(fixedRatio)}%
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 mb-1.5">Comprometido</span>
                </div>
                
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${fixedRatio > 50 ? 'bg-red-500' : 'bg-gray-900'}`} style={{ width: `${Math.min(fixedRatio, 100)}%` }}></div>
                </div>
                <p className="text-[10px] font-medium mt-2 text-gray-400 leading-tight">
                    De tus ingresos son gastos fijos
                </p>
            </div>
        </div>
      </div>

      {/* 3. Breakdown Pie Chart */}
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

      {/* 4. Weekly Rhythm Chart */}
      <Card title="Ritmo Semanal" subtitle="Gasto vs Límite Sugerido">
          <div className="h-48 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold' }} 
                        dy={10}
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#9CA3AF' }} 
                    />
                    <Tooltip 
                        cursor={{ fill: '#F3F4F6', radius: 4 }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="limit" fill="#F3F4F6" radius={[4, 4, 4, 4]} name="Límite" />
                    <Bar dataKey="spent" radius={[4, 4, 4, 4]} name="Gastado">
                        {weeklyChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.spent > entry.limit ? '#EF4444' : '#3B82F6'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
          </div>
      </Card>

      {/* 5. Daily Average vs Limit */}
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
                      <div className="absolute inset-0 w-full h-full opacity-30 bg-[linear-gradient(45deg,#000_25%,transparent_25%,transparent_50%,#000_50%,#000_75%,transparent_75%,transparent)] bg-[length:10px_10px]"></div>
                  </div>
              </div>
          </div>
      </div>

      {/* 6. Top Expenses List */}
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
    </div>
  );
};

export default Insights;
