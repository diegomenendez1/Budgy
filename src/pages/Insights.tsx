import React, { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Card } from '../components/ui/Card';
import {
    TrendingDown, TrendingUp, Activity, CalendarClock, Target, Layers,
    CalendarCheck, Download, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid
} from 'recharts';
import { TransactionType } from '../types';
import { exportTransactionsToCSV } from '../services/exportService';
import { formatCurrency } from '../lib/utils';
import { AICoachWidget } from '../components/insights/AICoachWidget';
import { cn } from '../lib/utils';

const COLORS = ['#3B82F6', '#06B6D4', '#F59E0B', '#EF4444', '#8B5CF6', '#10B981', '#EC4899', '#64748B'];

const Insights: React.FC = () => {
    const { transactions, activeCycle, cycleMetrics, weeklyBreakdown, totalFixedExpenses, totalFixedIncome, currency, cycles } = useFinance();
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const { daysPassed, progressPercentage, totalAvailable, spentThisCycle } = cycleMetrics;

    const effectiveBudget = totalAvailable;
    const daysTotal = cycleMetrics.daysTotal || 30;
    const dailyLimit = daysTotal > 0 ? effectiveBudget / daysTotal : 0;
    const burnRate = effectiveBudget > 0 ? (spentThisCycle / effectiveBudget) * 100 : 0;
    const spendingVelocity = progressPercentage > 0 ? burnRate / progressPercentage : 0;
    const dailyAverage = daysPassed > 0 ? spentThisCycle / daysPassed : 0;
    const projectedSpend = dailyAverage * daysTotal;
    const projectedBalance = effectiveBudget - projectedSpend;

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
        expenses.forEach(t => { const cat = t.category || 'Otros'; grouped[cat] = (grouped[cat] || 0) + t.amount; });
        return Object.entries(grouped).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [transactions, activeCycle]);

    const weeklyChartData = useMemo(() => {
        return weeklyBreakdown.map(w => ({
            name: w.label.replace('Semana ', 'S'),
            spent: w.spent, limit: w.limit, status: w.remaining < 0 ? 'bad' : 'good'
        }));
    }, [weeklyBreakdown]);

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
            if (!hasTx && d.toDateString() !== new Date().toDateString()) count++;
        }
        return count;
    }, [activeCycle, transactions]);

    const totalIncome = totalFixedIncome;
    const fixedRatio = totalIncome > 0 ? (totalFixedExpenses / totalIncome) * 100 : 0;

    if (!activeCycle) {
        return (
            <div className="pt-32 flex flex-col items-center justify-center text-center min-h-[60vh]">
                <Activity size={40} className="mb-4 text-slate-500" />
                <p className="font-medium text-slate-500 text-sm">Configura un ciclo para ver insights</p>
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

    const getVelocityColor = (v: number) => {
        if (v <= 0.9) return 'text-emerald-600';
        if (v <= 1.1) return 'text-amber-600';
        return 'text-red-600';
    };

    const previousCycleMetrics = useMemo(() => {
        if (!activeCycle || cycles.length < 2) return null;
        const sorted = [...cycles].filter(c => c.id !== activeCycle.id).sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
        const prev = sorted[0];
        if (!prev) return null;
        const prevStart = new Date(prev.startDate);
        const prevEnd = new Date(prev.endDate);
        prevStart.setHours(0, 0, 0, 0);
        prevEnd.setHours(23, 59, 59, 999);
        const prevTx = transactions.filter(t => { const d = new Date(t.date); return d >= prevStart && d <= prevEnd && t.type === TransactionType.EXPENSE; });
        const prevSpent = prevTx.reduce((sum, t) => sum + t.amount, 0);
        const prevDailyAvg = prevSpent / ((prevEnd.getTime() - prevStart.getTime()) / (1000 * 60 * 60 * 24));
        return { spent: prevSpent, dailyAvg: prevDailyAvg, label: prev.name || 'Ciclo Anterior' };
    }, [cycles, activeCycle, transactions]);

    const trendPercentage = previousCycleMetrics ? ((dailyAverage - previousCycleMetrics.dailyAvg) / previousCycleMetrics.dailyAvg) * 100 : 0;

    const chartTooltipStyle = {
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        fontSize: '12px',
        color: '#0F172A',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    };

    return (
        <div className="space-y-6 pt-6 pb-8">
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold font-sans text-slate-900 tracking-tight">Insights</h1>
                    <p className="text-slate-500 text-xs font-medium mt-0.5">Radiografia de tus finanzas</p>
                </div>
                <button
                    onClick={() => exportTransactionsToCSV(transactions)}
                    aria-label="Exportar CSV"
                    className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors active:scale-95"
                >
                    <Download size={18} />
                </button>
            </header>

            <AICoachWidget />

            {/* Trend Card */}
            {previousCycleMetrics && (
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-slate-500 font-medium mb-1">Tendencia vs {previousCycleMetrics.label}</p>
                            <div className="flex items-baseline gap-2">
                                <span className={cn(
                                    "text-2xl font-bold font-sans tracking-tight tabular-nums",
                                    trendPercentage > 0 ? 'text-red-600' : 'text-emerald-700'
                                )}>
                                    {Math.abs(trendPercentage).toFixed(1)}%
                                </span>
                                <span className={cn("text-[11px] font-medium", trendPercentage > 0 ? 'text-red-600/70' : 'text-emerald-700/70')}>
                                    {trendPercentage > 0 ? 'Mas gasto' : 'Menos gasto'}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1.5">
                                Promedio: {formatCurrency(dailyAverage, currency)} vs {formatCurrency(previousCycleMetrics.dailyAvg, currency)}
                            </p>
                        </div>
                        <div className={cn("p-2.5 rounded-xl", trendPercentage > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700')}>
                            {trendPercentage > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                        </div>
                    </div>
                </div>
            )}

            {/* Metrics Grid - Velocity & Projection */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <div className={cn("p-1.5 rounded-lg bg-slate-50 border border-slate-200", getVelocityColor(spendingVelocity))}>
                            <Activity size={14} />
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">Velocidad</span>
                    </div>
                    <p className={cn("text-2xl font-bold font-sans tracking-tight tabular-nums", getVelocityColor(spendingVelocity))}>
                        {spendingVelocity.toFixed(1)}x
                    </p>
                    <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-[9px] text-slate-500">
                            <span>Lento</span><span>Optimo</span><span>Rapido</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex relative border border-slate-200">
                            <div className="w-[30%] bg-emerald-100"></div>
                            <div className="w-[40%] bg-amber-100"></div>
                            <div className="w-[30%] bg-red-100"></div>
                            <div className="absolute h-1.5 w-1 bg-slate-900 rounded-full shadow-sm transition-all duration-500"
                                style={{ left: `${Math.min(Math.max((spendingVelocity / 2) * 100, 3), 97)}%`, transform: 'translateX(-50%)' }} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <div className={cn("p-1.5 rounded-lg bg-slate-50 border border-slate-200", projectedBalance >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                            <Target size={14} />
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">Cierre Mes</span>
                    </div>
                    <p className={cn("text-xl font-bold font-sans tracking-tight tabular-nums", projectedBalance >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                        {formatCurrency(projectedBalance, currency)}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5">
                        {projectedBalance >= 0 ? <ArrowUpRight size={12} className="text-emerald-600" /> : <ArrowDownRight size={12} className="text-red-600" />}
                        <p className="text-[10px] text-slate-500">{projectedBalance >= 0 ? 'Superavit estimado' : 'Deficit proyectado'}</p>
                    </div>
                </div>
            </div>

            {/* Zero Spend & Rigidity */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 flex flex-col justify-between h-32">
                    <div className="flex items-center gap-2">
                        <CalendarCheck size={14} className="text-blue-600" />
                        <span className="text-[11px] text-slate-500 font-medium">Dias Cero</span>
                    </div>
                    <div>
                        <p className="text-3xl font-bold font-sans tracking-tight text-slate-900 tabular-nums">{zeroSpendDays}</p>
                        <p className="text-[10px] text-slate-500 mt-1">Sin gastos variables</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 flex flex-col justify-between h-32">
                    <div className="flex items-center gap-2">
                        <Layers size={14} className="text-blue-600" />
                        <span className="text-[11px] text-slate-500 font-medium">Rigidez</span>
                    </div>
                    <div>
                        <p className={cn("text-xl font-bold font-sans tracking-tight tabular-nums", fixedRatio > 50 ? 'text-red-600' : 'text-slate-900')}>
                            {Math.round(fixedRatio)}%
                        </p>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2 border border-slate-200">
                            <div className={cn("h-full rounded-full transition-all duration-700", fixedRatio > 50 ? 'bg-red-500' : 'bg-blue-600')}
                                style={{ width: `${Math.min(fixedRatio, 100)}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Ingreso comprometido</p>
                    </div>
                </div>
            </div>

            {/* Pie Chart */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm">
                <div className="p-5">
                    <h3 className="text-sm font-bold font-sans text-slate-900 mb-1">Distribucion</h3>
                    <p className="text-[11px] text-slate-500 mb-4">A donde va tu dinero</p>

                    <div className="flex flex-col items-center gap-4">
                        <div className="h-56 w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none"
                                        onMouseEnter={(_, index) => setActiveIndex(index)} onMouseLeave={() => setActiveIndex(null)}>
                                        {categoryData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}
                                                className="transition-opacity duration-200 outline-none cursor-pointer"
                                                opacity={activeIndex === null || activeIndex === index ? 1 : 0.4} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={chartTooltipStyle}
                                        itemStyle={{ color: '#0F172A', fontWeight: '600' }}
                                        formatter={(value: number) => [formatCurrency(value, currency), '']}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-[10px] text-slate-500 mb-0.5">Total</span>
                                <span className="text-lg font-bold font-sans text-slate-900 tabular-nums">
                                    {formatCurrency(spentThisCycle, currency)}
                                </span>
                            </div>
                        </div>

                        <div className="w-full grid grid-cols-2 gap-1">
                            {categoryData.slice(0, 6).map((cat, index) => (
                                <div key={cat.name} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                                    onMouseEnter={() => setActiveIndex(index)} onMouseLeave={() => setActiveIndex(null)}>
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        <span className="text-xs text-slate-500 truncate">{cat.name}</span>
                                    </div>
                                    <span className="text-xs font-medium text-slate-900/70 tabular-nums">
                                        {((cat.value / spentThisCycle) * 100).toFixed(0)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Weekly Bar Chart */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm">
                <div className="p-5">
                    <h3 className="text-sm font-bold font-sans text-slate-900 mb-1">Ritmo Semanal</h3>
                    <p className="text-[11px] text-slate-500 mb-4">Gasto vs Limite Sugerido</p>

                    <div className="h-44 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B', fontWeight: '500' }} dy={8} />
                                <Tooltip cursor={{ fill: 'rgba(59,130,246,0.04)', radius: 8 }}
                                    contentStyle={chartTooltipStyle}
                                    itemStyle={{ fontSize: '12px', fontWeight: '600', color: '#0F172A' }}
                                    labelStyle={{ color: '#64748B', marginBottom: '4px' }} />
                                <Bar dataKey="limit" fill="rgba(59,130,246,0.15)" radius={[4, 4, 4, 4]} name="Limite" maxBarSize={32} />
                                <Bar dataKey="spent" radius={[4, 4, 4, 4]} name="Gastado" maxBarSize={32}>
                                    {weeklyChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.spent > entry.limit ? '#EF4444' : '#3B82F6'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Daily Average */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm">
                <div className="p-5">
                    <div className="flex justify-between items-center mb-5">
                        <div>
                            <h3 className="text-sm font-bold font-sans text-slate-900">Promedio Diario</h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">Real vs Permitido</p>
                        </div>
                        <CalendarClock size={16} className="text-slate-500" />
                    </div>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-[11px] mb-1.5">
                                <span className="text-slate-500">Gasto Promedio</span>
                                <span className="text-slate-900 font-medium tabular-nums">{formatCurrency(dailyAverage, currency)} / dia</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                <div className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full transition-all duration-700"
                                    style={{ width: `${dailyLimit > 0 ? Math.min(((dailyAverage / dailyLimit) * 100), 100) : 0}%` }} />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-[11px] mb-1.5">
                                <span className="text-slate-500">Limite Saludable</span>
                                <span className="text-slate-900 font-medium tabular-nums">{formatCurrency(dailyLimit, currency)} / dia</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                <div className="h-full w-full bg-slate-200 rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Expenses */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="p-5 pb-3">
                    <h3 className="text-sm font-bold font-sans text-slate-900">Mayores Gastos</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Identifica tus fugas</p>
                </div>
                <div className="divide-y divide-slate-100">
                    {topTransactions.map((t) => (
                        <div key={t.id} className="px-4 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                            <div className="bg-red-50 text-red-600 w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-red-100">
                                <TrendingDown size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm text-slate-900 truncate">{t.description}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{t.category}</p>
                            </div>
                            <span className="font-semibold text-slate-900 text-sm tabular-nums shrink-0">{formatCurrency(-t.amount, currency)}</span>
                        </div>
                    ))}
                    {topTransactions.length === 0 && (
                        <div className="p-8 text-center text-slate-500 text-xs">Sin datos suficientes</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Insights;
