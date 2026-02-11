import React, { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Card } from '../components/ui/Card';
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
    CalendarCheck,
    Compass,
    Anchor,
    Flag,
    Download
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    Tooltip,
    CartesianGrid
} from 'recharts';
import { TransactionType } from '../types';
import { exportTransactionsToCSV } from '../services/exportService';

// Modern, vibrant palette for dark/glass modes
const COLORS = [
    '#6366f1', // Indigo
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Violet
    '#06b6d4', // Cyan
    '#ec4899', // Pink
    '#64748b'  // Slate
];

const Insights: React.FC = () => {
    const {
        transactions,
        activeCycle,
        cycleMetrics,
        weeklyBreakdown,
        totalFixedExpenses,
        totalFixedIncome
    } = useFinance();

    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    // Destructure metrics from the robust context calculation
    const {
        daysPassed,
        progressPercentage,
        totalAvailable,
        spentThisCycle,
        remainingBudget,
        currentSurplus
    } = cycleMetrics;

    // --- 1. Projections and Velocity ---
    const effectiveBudget = totalAvailable;
    const daysTotal = cycleMetrics.daysTotal || 30;
    const dailyLimit = daysTotal > 0 ? effectiveBudget / daysTotal : 0;
    const burnRate = effectiveBudget > 0 ? (spentThisCycle / effectiveBudget) * 100 : 0;
    const spendingVelocity = progressPercentage > 0 ? burnRate / progressPercentage : 0;
    const dailyAverage = daysPassed > 0 ? spentThisCycle / daysPassed : 0;
    const projectedSpend = dailyAverage * daysTotal;
    const projectedBalance = effectiveBudget - projectedSpend;

    // --- 2. Data by Category (Filtered by Active Cycle) ---
    const categoryData = useMemo(() => {
        if (!activeCycle) return [];

        const start = new Date(activeCycle.startDate);
        const end = new Date(activeCycle.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

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

        for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
            const hasTx = transactions.some(t => {
                const tDate = new Date(t.date);
                return tDate.toDateString() === d.toDateString() && t.type === TransactionType.EXPENSE;
            });
            const isToday = d.toDateString() === new Date().toDateString();
            if (!hasTx && !isToday) {
                count++;
            }
        }
        return count;
    }, [activeCycle, transactions]);

    // --- 5. Financial Structure Analysis ---
    const totalIncome = totalFixedIncome;
    const fixedRatio = totalIncome > 0 ? (totalFixedExpenses / totalIncome) * 100 : 0;

    // --- 6. Coach Logic ---
    const coachInsight = useMemo(() => {
        if (!activeCycle) return {
            theme: 'info', icon: Lightbulb, title: 'Inicia un Ciclo', message: 'Configura un ciclo en Presupuesto para activar el coach.', action: 'Ir a pestaña Presupuesto'
        };

        const mainCategory = categoryData[0] ? categoryData[0].name : 'gastos varios';
        const daysLeft = daysTotal - daysPassed;
        const isBeginning = progressPercentage < 20;
        const isEnding = daysLeft <= 5;

        if (projectedBalance < 0 && Math.abs(projectedBalance) > (effectiveBudget * 0.1)) {
            return {
                theme: 'danger',
                icon: AlertOctagon,
                title: 'Alerta Roja: Déficit',
                message: `A este ritmo, te faltarán $${Math.abs(Math.round(projectedBalance)).toLocaleString()} para terminar el mes.`,
                action: `Activa el protocolo de emergencia: Cero gastos en ${mainCategory} por 3 días.`
            };
        }

        if (fixedRatio > 65 && spendingVelocity > 1.0) {
            return {
                theme: 'warning',
                icon: Anchor,
                title: 'Rigidez Financiera Alta',
                message: 'Tus gastos fijos consumen gran parte de tus ingresos. Tienes muy poco margen.',
                action: 'Prioridad #1: no desviarte ni un dólar en variables.'
            };
        }

        if (isBeginning && burnRate > 25) {
            return {
                theme: 'warning',
                icon: Compass,
                title: 'Arranque Falso',
                message: 'Has quemado más del 25% de tu presupuesto al inicio. Peligroso.',
                action: 'Divide el dinero restante entre las semanas que faltan.'
            };
        }

        if (isEnding) {
            if (currentSurplus > 0) {
                return {
                    theme: 'success',
                    icon: Flag,
                    title: 'Recta Final Impecable',
                    message: 'Estás aterrizando el mes con saldo a favor. Tienes el control total.',
                    action: '¿Te das un gusto o lo sumas a tus ahorros? Tú decides.'
                };
            } else if (remainingBudget > 0) {
                return {
                    theme: 'warning',
                    icon: Target,
                    title: 'Aterrizaje de Precisión',
                    message: 'Quedan pocos días y poco presupuesto. Momento de precisión.',
                    action: `Tienes $${Math.round(remainingBudget / daysLeft).toLocaleString()} por día. No te pases.`
                };
            }
        }

        if (spendingVelocity > 1.3) {
            return {
                theme: 'warning',
                icon: Zap,
                title: 'Ritmo Acelerado',
                message: 'Gastas 30% más rápido que el tiempo. No es sostenible.',
                action: `Intenta reducir ${mainCategory} a la mitad esta semana.`
            };
        }

        if (zeroSpendDays > 5 && spendingVelocity < 0.9) {
            return {
                theme: 'success',
                icon: Award,
                title: 'Maestro de la Disciplina',
                message: `Llevas ${zeroSpendDays} días sin gastos variables. Esa disciplina es clave.`,
                action: 'Mantén esta inercia. Tu "Yo del futuro" te lo agradecerá.'
            };
        }

        return {
            theme: 'info',
            icon: Lightbulb,
            title: 'Navegación Estable',
            message: 'Tus finanzas fluyen correctamente. Sin alertas graves.',
            action: 'Buen momento para revisar si puedes optimizar gastos hormiga.'
        };
    }, [projectedBalance, spendingVelocity, activeCycle, categoryData, effectiveBudget, daysPassed, progressPercentage, fixedRatio, currentSurplus, remainingBudget, zeroSpendDays]);

    const getCoachStyles = (theme: string) => {
        switch (theme) {
            case 'danger': return 'bg-gradient-to-br from-red-600 to-red-900 border-red-500/30';
            case 'warning': return 'bg-gradient-to-br from-amber-500 to-orange-800 border-orange-500/30';
            case 'info': return 'bg-gradient-to-br from-blue-600 to-indigo-900 border-blue-500/30';
            case 'success': return 'bg-gradient-to-br from-green-600 to-emerald-900 border-green-500/30';
            default: return 'bg-white/5 border-white/10';
        }
    };

    if (!activeCycle) {
        return (
            <div className="pt-32 flex flex-col items-center justify-center text-center opacity-50 min-h-[60vh]">
                <Activity size={48} className="mb-4 text-gray-500" />
                <p className="font-medium text-gray-500">Configura un ciclo en el Dashboard</p>
            </div>
        );
    }

    const topTransactions = [...transactions]
        .filter(t => {
            const start = new Date(activeCycle.startDate);
            const end = new Date(activeCycle.endDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            const d = new Date(t.date);
            return d >= start && d <= end && t.type === TransactionType.EXPENSE;
        })
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-8 pt-6 pb-32">
            <header className="px-4 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Insights</h1>
                    <p className="text-indigo-200 text-sm font-medium">Radiografía de tus finanzas</p>
                </div>
                <button
                    onClick={() => exportTransactionsToCSV(transactions)}
                    aria-label="Exportar transacciones a CSV"
                    className="p-3 bg-white/5 rounded-2xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 backdrop-blur-sm"
                >
                    <Download size={20} />
                </button>
            </header>

            {/* --- COACH CARD --- */}
            <div className={`mx-4 rounded-[2rem] p-6 relative overflow-hidden transition-all duration-500 shadow-xl border ${getCoachStyles(coachInsight.theme)}`}>
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-[50px]"></div>
                <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-40 h-40 bg-black opacity-20 rounded-full blur-[60px]"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md shadow-inner border border-white/10">
                            <coachInsight.icon size={20} className="text-white" strokeWidth={3} />
                        </div>
                        <h2 className="text-xs font-black tracking-widest uppercase text-white/80">Coach IA</h2>
                    </div>

                    <h3 className="text-2xl font-black mb-3 text-white leading-tight drop-shadow-md">
                        {coachInsight.title}
                    </h3>
                    <p className="text-white/90 font-medium leading-relaxed mb-6 text-[15px]">
                        {coachInsight.message}
                    </p>

                    <div className="bg-black/20 rounded-2xl p-4 backdrop-blur-md border border-white/10 flex gap-4 items-start shadow-sm">
                        <Lightbulb className="text-yellow-300 shrink-0 mt-0.5" size={20} fill="currentColor" fillOpacity={0.4} />
                        <div>
                            <span className="block text-[10px] font-black uppercase tracking-wider text-white/60 mb-1">Recomendación Táctica</span>
                            <p className="text-sm font-bold text-white leading-snug">
                                {coachInsight.action}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 1. Velocity Cards Grid */}
            <div className="grid grid-cols-2 gap-3 px-4">
                <div className={`p-5 rounded-[2rem] border flex flex-col justify-between h-40 relative overflow-hidden backdrop-blur-sm ${spendingVelocity > 1.1 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white/5 border-white/10'}`}>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 opacity-70">
                            <Activity size={16} className={spendingVelocity > 1.1 ? 'text-amber-400' : 'text-gray-400'} />
                            <span className={`text-xs font-black uppercase tracking-wider ${spendingVelocity > 1.1 ? 'text-amber-400' : 'text-gray-400'}`}>Velocidad</span>
                        </div>
                        <span className={`text-4xl font-black tracking-tighter ${spendingVelocity > 1.1 ? 'text-amber-400' : 'text-white'}`}>
                            {spendingVelocity.toFixed(1)}x
                        </span>
                        <p className={`text-[10px] font-bold mt-2 opacity-80 leading-tight text-balance ${spendingVelocity > 1.1 ? 'text-amber-300' : 'text-gray-400'}`}>
                            {spendingVelocity > 1.1 ? 'Gastas más rápido que el tiempo' : 'Ritmo saludable'}
                        </p>
                    </div>
                </div>

                <div className={`p-5 rounded-[2rem] border flex flex-col justify-between h-40 relative overflow-hidden backdrop-blur-sm ${projectedBalance < 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 opacity-70">
                            <Target size={16} className={projectedBalance < 0 ? 'text-red-400' : 'text-emerald-400'} />
                            <span className={`text-xs font-black uppercase tracking-wider ${projectedBalance < 0 ? 'text-red-400' : 'text-emerald-400'}`}>Proyección</span>
                        </div>
                        <span className={`text-3xl font-black tracking-tighter ${projectedBalance < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {projectedBalance >= 0 ? '+' : ''}${Math.round(projectedBalance).toLocaleString()}
                        </span>
                        <p className={`text-[10px] font-bold mt-2 opacity-80 leading-tight ${projectedBalance < 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                            Estimado al final del ciclo
                        </p>
                    </div>
                </div>
            </div>

            {/* 2. Zero Spend & Financial Structure */}
            <div className="grid grid-cols-2 gap-3 px-4">
                <div className="bg-white/5 backdrop-blur-sm p-5 rounded-[2rem] border border-white/10 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <CalendarCheck size={16} className="text-indigo-400" />
                            <span className="text-xs font-black uppercase tracking-wider text-gray-400">Días Cero</span>
                        </div>
                        <span className="text-4xl font-black tracking-tighter text-white">
                            {zeroSpendDays}
                        </span>
                        <p className="text-[10px] font-bold mt-2 text-gray-500 leading-tight">
                            Sin gastos variables
                        </p>
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm p-5 rounded-[2rem] border border-white/10 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden">
                    <div className="relative z-10 w-full">
                        <div className="flex items-center gap-2 mb-2">
                            <Layers size={16} className="text-gray-400" />
                            <span className="text-xs font-black uppercase tracking-wider text-gray-400">Rigidez</span>
                        </div>

                        <div className="flex items-end gap-1 mb-2">
                            <span className={`text-2xl font-black tracking-tighter ${fixedRatio > 50 ? 'text-red-400' : 'text-white'}`}>
                                {Math.round(fixedRatio)}%
                            </span>
                        </div>

                        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${fixedRatio > 50 ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(fixedRatio, 100)}%` }}></div>
                        </div>
                        <p className="text-[10px] font-bold mt-2 text-gray-500 leading-tight">
                            Ingreso comprometido
                        </p>
                    </div>
                </div>
            </div>

            {/* 3. Breakdown Pie Chart */}
            <Card className="overflow-visible relative">
                <div className="p-6">
                    <h3 className="text-lg font-black text-white mb-1">Distribución</h3>
                    <p className="text-xs text-gray-400 font-medium mb-6">¿A dónde va tu dinero?</p>

                    <div className="flex flex-col items-center gap-4">
                        <div className="h-64 w-full relative shrink-0">
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
                                        stroke="none"
                                        onMouseEnter={(_, index) => setActiveIndex(index)}
                                        onMouseLeave={() => setActiveIndex(null)}
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                                className="transition-all duration-300 outline-none"
                                                stroke={activeIndex === index ? 'rgba(255,255,255,0.2)' : 'none'}
                                                strokeWidth={2}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(20,20,20, 0.8)',
                                            backdropFilter: 'blur(12px)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '16px',
                                            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
                                            color: '#fff'
                                        }}
                                        itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                        formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Total</span>
                                <span className="text-xl font-black text-white">${spentThisCycle.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="w-full grid grid-cols-2 gap-2">
                            {categoryData.slice(0, 6).map((cat, index) => (
                                <div key={cat.name} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors cursor-default border border-transparent hover:border-white/5" onMouseEnter={() => setActiveIndex(index)} onMouseLeave={() => setActiveIndex(null)}>
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-[0_0_10px_currentColor]" style={{ backgroundColor: COLORS[index % COLORS.length], color: COLORS[index % COLORS.length] }}></div>
                                        <span className="text-xs font-bold text-gray-300 truncate">{cat.name}</span>
                                    </div>
                                    <span className="text-xs font-bold text-gray-500">
                                        {((cat.value / spentThisCycle) * 100).toFixed(0)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            {/* 4. Weekly Rhythm Chart */}
            <Card className="mx-4">
                <div className="p-6">
                    <h3 className="text-lg font-black text-white mb-1">Ritmo Semanal</h3>
                    <p className="text-xs text-gray-400 font-medium mb-4">Gasto vs Límite Sugerido</p>

                    <div className="h-48 w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 'bold' }}
                                    dy={10}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 8 }}
                                    contentStyle={{
                                        backgroundColor: 'rgba(20,20,20, 0.9)',
                                        backdropFilter: 'blur(12px)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '16px',
                                        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
                                        color: '#fff'
                                    }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}
                                    labelStyle={{ color: '#9ca3af', marginBottom: '0.25rem', fontWeight: 'bold' }}
                                />
                                <Bar dataKey="limit" fill="rgba(255,255,255,0.1)" radius={[4, 4, 4, 4]} name="Límite" maxBarSize={40} />
                                <Bar dataKey="spent" radius={[4, 4, 4, 4]} name="Gastado" maxBarSize={40}>
                                    {weeklyChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.spent > entry.limit ? '#ef4444' : '#6366f1'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </Card>

            {/* 5. Daily Average vs Limit */}
            <div className="bg-white/5 backdrop-blur-sm rounded-[2rem] p-6 shadow-sm border border-white/10 mx-4">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h3 className="text-white font-bold text-lg">Promedio Diario</h3>
                        <p className="text-gray-400 text-xs font-bold mt-1 uppercase tracking-wide">Real vs Permitido</p>
                    </div>
                    <div className="bg-white/10 p-2 rounded-2xl">
                        <CalendarClock size={20} className="text-indigo-300" />
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Real Spend Bar */}
                    <div>
                        <div className="flex justify-between text-xs font-bold mb-2">
                            <span className="text-gray-400">Gasto Promedio Actual</span>
                            <span className="text-white">${Math.round(dailyAverage).toLocaleString()} / día</span>
                        </div>
                        <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${dailyLimit > 0 ? Math.min(((dailyAverage / dailyLimit) * 100), 100) : 0}%` }}></div>
                        </div>
                    </div>

                    {/* Safe Limit Bar */}
                    <div>
                        <div className="flex justify-between text-xs font-bold mb-2">
                            <span className="text-gray-400">Límite Saludable</span>
                            <span className="text-white">${Math.round(dailyLimit).toLocaleString()} / día</span>
                        </div>
                        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden relative border border-white/10">
                            <div className="absolute inset-0 w-full h-full opacity-30 bg-[linear-gradient(45deg,currentColor_25%,transparent_25%,transparent_50%,currentColor_50%,currentColor_75%,transparent_75%,transparent)] bg-[length:8px_8px] text-gray-500"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 6. Top Expenses List */}
            <Card className="mx-4 overflow-hidden">
                <div className="p-6 pb-2">
                    <h3 className="text-lg font-black text-white mb-1">Mayores Gastos</h3>
                    <p className="text-xs text-gray-400 font-medium">Identifica tus fugas</p>
                </div>
                <div className="divide-y divide-white/5">
                    {topTransactions.map((t) => (
                        <div key={t.id} className="p-5 flex justify-between items-center hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="bg-red-500/10 text-red-400 w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border border-red-500/10">
                                    <TrendingDown size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-sm text-white truncate max-w-[150px]">{t.description}</p>
                                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-wider mt-0.5">{t.category}</p>
                                </div>
                            </div>
                            <span className="font-bold text-white text-sm">
                                -${t.amount.toLocaleString()}
                            </span>
                        </div>
                    ))}
                    {topTransactions.length === 0 && (
                        <div className="p-8 text-center text-gray-500 text-sm font-medium">Sin datos suficientes</div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default Insights;
