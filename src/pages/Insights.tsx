import React, { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Card } from '../components/ui/Card';
import {
    TrendingDown,
    TrendingUp,
    Activity,
    CalendarClock,
    Target,
    Layers,
    CalendarCheck,
    Download,
    ArrowUpRight,
    ArrowDownRight,
    Wallet
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
import { formatCurrency } from '../lib/utils';
import { AICoachWidget } from '../components/insights/AICoachWidget';

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
        totalFixedIncome,
        currency,
        cycles
    } = useFinance();

    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    // Destructure metrics from the robust context calculation
    const {
        daysPassed,
        progressPercentage,
        totalAvailable,
        spentThisCycle,
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

    // Helper for Velocity Color
    const getVelocityColor = (v: number) => {
        if (v <= 0.9) return 'text-emerald-500';
        if (v <= 1.1) return 'text-amber-500';
        return 'text-rose-500';
    };

    // --- 6. Trend Analysis (Current vs Previous Cycle) ---


    const previousCycleMetrics = useMemo(() => {
        if (!activeCycle || cycles.length < 2) return null;

        // Find previous cycle (strictly before active)
        const sorted = [...cycles]
            .filter(c => c.id !== activeCycle.id)
            .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

        const prev = sorted[0];
        if (!prev) return null;

        // Calculate metrics for prev cycle
        // We need transactions for that cycle
        const prevStart = new Date(prev.startDate);
        const prevEnd = new Date(prev.endDate);
        prevStart.setHours(0, 0, 0, 0);
        prevEnd.setHours(23, 59, 59, 999);

        const prevTx = transactions.filter(t => {
            const d = new Date(t.date);
            return d >= prevStart && d <= prevEnd && t.type === TransactionType.EXPENSE;
        });

        const prevSpent = prevTx.reduce((sum, t) => sum + t.amount, 0);
        const prevDailyAvg = prevSpent / ((prevEnd.getTime() - prevStart.getTime()) / (1000 * 60 * 60 * 24));

        return {
            spent: prevSpent,
            dailyAvg: prevDailyAvg,
            label: prev.name || 'Ciclo Anterior'
        };
    }, [cycles, activeCycle, transactions]);

    const trendPercentage = previousCycleMetrics
        ? ((dailyAverage - previousCycleMetrics.dailyAvg) / previousCycleMetrics.dailyAvg) * 100
        : 0;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-8 pt-6 pb-32">
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight italic uppercase">Insights</h1>
                    <p className="text-muted-foreground text-sm font-medium">Radiografía de tus finanzas</p>
                </div>
                <button
                    onClick={() => exportTransactionsToCSV(transactions)}
                    aria-label="Exportar transacciones a CSV"
                    className="p-3 bg-secondary rounded-2xl border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all active:scale-95 backdrop-blur-sm"
                >
                    <Download size={20} />
                </button>
            </header>

            {/* --- AI COACH WIDGET --- */}
            <div className="px-4">
                <AICoachWidget />
            </div>

            {/* Trend Analysis Card (If Data Exists) */}
            {previousCycleMetrics && (
                <div className="px-4">
                    <Card className="p-5 bg-gradient-to-r from-blue-900/10 to-indigo-900/10 border-blue-500/20 relative overflow-hidden">
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-wider text-blue-400 mb-1">Tendencia vs {previousCycleMetrics.label}</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-3xl font-black tracking-tighter ${trendPercentage > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                        {Math.abs(trendPercentage).toFixed(1)}%
                                    </span>
                                    <span className={`text-xs font-bold uppercase ${trendPercentage > 0 ? 'text-rose-500/70' : 'text-emerald-500/70'}`}>
                                        {trendPercentage > 0 ? 'Más gasto' : 'Menos gasto'}
                                    </span>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-2 max-w-[200px]">
                                    Comparando el promedio de gasto diario actual ({formatCurrency(dailyAverage, currency)}) vs anterior ({formatCurrency(previousCycleMetrics.dailyAvg, currency)}).
                                </p>
                            </div>
                            <div className={`p-3 rounded-2xl ${trendPercentage > 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                {trendPercentage > 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* 1. High Power Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 px-4">
                {/* Velocity & Burn Rate */}
                <Card className="p-5 flex flex-col justify-between relative overflow-hidden backdrop-blur-sm bg-gradient-to-br from-secondary/50 to-secondary/10">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <div className={`p-2 rounded-xl bg-secondary/50 ${getVelocityColor(spendingVelocity)}`}>
                                <Activity size={18} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Velocidad</span>
                        </div>

                        <div className="flex items-baseline gap-1">
                            <span className={`text-4xl font-black tracking-tighter ${getVelocityColor(spendingVelocity)}`}>
                                {spendingVelocity.toFixed(1)}x
                            </span>
                        </div>

                        <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                                <span>Lento</span>
                                <span>Óptimo</span>
                                <span>Rápido</span>
                            </div>
                            <div className="h-1.5 w-full bg-secondary/80 rounded-full overflow-hidden flex">
                                <div className="w-[30%] bg-emerald-500/30"></div>
                                <div className="w-[40%] bg-amber-500/30"></div>
                                <div className="w-[30%] bg-rose-500/30"></div>

                                {/* Indicator */}
                                <div
                                    className="absolute h-1.5 w-1 bg-white shadow-[0_0_10px_white] transition-all duration-500"
                                    style={{
                                        left: `${Math.min(Math.max((spendingVelocity / 2) * 100, 5), 95)}%`,
                                        transform: 'translateX(-50%)'
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Projection Card */}
                <Card className="p-5 flex flex-col justify-between relative overflow-hidden backdrop-blur-sm bg-gradient-to-br from-secondary/50 to-secondary/10">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <div className={`p-2 rounded-xl bg-secondary/50 ${projectedBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                <Target size={18} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Cierre Mes</span>
                        </div>

                        <span className={`text-2xl font-black tracking-tighter ${projectedBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatCurrency(projectedBalance, currency)}
                        </span>

                        <div className="mt-3 flex items-center gap-2">
                            {projectedBalance >= 0 ? (
                                <ArrowUpRight size={16} className="text-emerald-500" />
                            ) : (
                                <ArrowDownRight size={16} className="text-rose-500" />
                            )}
                            <p className="text-[10px] font-bold opacity-70 leading-tight">
                                {projectedBalance >= 0 ? 'Superávit estimado' : 'Déficit proyectado'}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* 2. Zero Spend & Financial Structure */}
            <div className="grid grid-cols-2 gap-3 px-4">
                <div className="bg-secondary/40 backdrop-blur-md p-5 rounded-[2rem] border border-border shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group hover:bg-secondary/60 transition-colors">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <CalendarCheck size={16} className="text-primary group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Días Cero</span>
                        </div>
                        <span className="text-4xl font-black tracking-tighter text-foreground">
                            {zeroSpendDays}
                        </span>
                        <p className="text-[10px] font-bold mt-2 text-muted-foreground leading-tight">
                            Sin gastos variables
                        </p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 backdrop-blur-md p-5 rounded-[2rem] border border-white/5 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden">
                    <div className="relative z-10 w-full">
                        <div className="flex items-center gap-2 mb-2">
                            <Layers size={16} className="text-indigo-300" />
                            <span className="text-xs font-black uppercase tracking-wider text-indigo-300">Rigidez</span>
                        </div>

                        <div className="flex items-end gap-1 mb-2">
                            <span className={`text-2xl font-black tracking-tighter ${fixedRatio > 50 ? 'text-rose-400' : 'text-indigo-100'}`}>
                                {Math.round(fixedRatio)}%
                            </span>
                        </div>

                        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-1000 ${fixedRatio > 50 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(fixedRatio, 100)}%` }}></div>
                        </div>
                        <p className="text-[10px] font-bold mt-2 text-indigo-300/70 leading-tight">
                            Ingreso comprometido
                        </p>
                    </div>
                </div>
            </div>

            {/* 3. Breakdown Pie Chart */}
            <Card className="overflow-visible relative border-t-0 rounded-t-none sm:rounded-[2rem] sm:border-t">
                <div className="p-6">
                    <div className='flex items-center justify-between mb-6'>
                        <div>
                            <h3 className="text-lg font-black text-foreground mb-1">Distribución</h3>
                            <p className="text-xs text-muted-foreground font-medium">¿A dónde va tu dinero?</p>
                        </div>
                        <Wallet className='text-muted-foreground opacity-20' />
                    </div>

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
                                                className="transition-all duration-300 outline-none hover:opacity-80 cursor-pointer"
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
                                        formatter={(value: number) => [formatCurrency(value, currency), '']}

                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Total</span>
                                <span className="text-xl font-black text-foreground">{formatCurrency(spentThisCycle, currency)}</span>
                            </div>

                        </div>

                        {/* Legend */}
                        <div className="w-full grid grid-cols-2 gap-2">
                            {categoryData.slice(0, 6).map((cat, index) => (
                                <div key={cat.name} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5 group" onMouseEnter={() => setActiveIndex(index)} onMouseLeave={() => setActiveIndex(null)}>
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-[0_0_10px_currentColor] transition-transform group-hover:scale-125" style={{ backgroundColor: COLORS[index % COLORS.length], color: COLORS[index % COLORS.length] }}></div>
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
                    <h3 className="text-lg font-black text-foreground mb-1">Ritmo Semanal</h3>
                    <p className="text-xs text-muted-foreground font-medium mb-4">Gasto vs Límite Sugerido</p>

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
                                    cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 8 }}
                                    contentStyle={{
                                        backgroundColor: 'var(--card)',
                                        backdropFilter: 'blur(12px)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '16px',
                                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                                        color: 'var(--foreground)'
                                    }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--foreground)' }}
                                    labelStyle={{ color: 'var(--muted-foreground)', marginBottom: '0.25rem', fontWeight: 'bold' }}
                                />
                                <Bar dataKey="limit" fill="var(--secondary)" radius={[4, 4, 4, 4]} name="Límite" maxBarSize={40} />
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
            <div className="bg-card backdrop-blur-sm rounded-[2rem] p-6 shadow-sm border border-border mx-4">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h3 className="text-foreground font-bold text-lg">Promedio Diario</h3>
                        <p className="text-muted-foreground text-xs font-bold mt-1 uppercase tracking-wide">Real vs Permitido</p>
                    </div>
                    <div className="bg-secondary p-2 rounded-2xl">
                        <CalendarClock size={20} className="text-primary" />
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Real Spend Bar */}
                    <div>
                        <div className="flex justify-between text-xs font-bold mb-2">
                            <span className="text-gray-400">Gasto Promedio Actual</span>
                            <span className="text-foreground">{formatCurrency(dailyAverage, currency)} / día</span>
                        </div>

                        <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${dailyLimit > 0 ? Math.min(((dailyAverage / dailyLimit) * 100), 100) : 0}%` }}></div>
                        </div>
                    </div>

                    {/* Safe Limit Bar */}
                    <div>
                        <div className="flex justify-between text-xs font-bold mb-2">
                            <span className="text-muted-foreground">Límite Saludable</span>
                            <span className="text-foreground">{formatCurrency(dailyLimit, currency)} / día</span>
                        </div>

                        <div className="h-3 w-full bg-secondary rounded-full overflow-hidden relative border border-border">
                            <div className="absolute inset-0 w-full h-full opacity-30 bg-[linear-gradient(45deg,currentColor_25%,transparent_25%,transparent_50%,currentColor_50%,currentColor_75%,transparent_75%,transparent)] bg-[length:8px_8px] text-muted-foreground/20"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 6. Top Expenses List */}
            <Card className="mx-4 overflow-hidden">
                <div className="p-6 pb-2">
                    <h3 className="text-lg font-black text-foreground mb-1">Mayores Gastos</h3>
                    <p className="text-xs text-muted-foreground font-medium">Identifica tus fugas</p>
                </div>
                <div className="divide-y divide-border">
                    {topTransactions.map((t) => (
                        <div key={t.id} className="p-5 flex justify-between items-center hover:bg-secondary/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="bg-destructive/10 text-destructive w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border border-destructive/10">
                                    <TrendingDown size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-sm text-foreground truncate max-w-[150px]">{t.description}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider mt-0.5">{t.category}</p>
                                </div>
                            </div>
                            <span className="font-bold text-foreground text-sm">
                                {formatCurrency(-t.amount, currency)}
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
