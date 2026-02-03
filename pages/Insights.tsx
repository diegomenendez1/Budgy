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
    YAxis,
    Tooltip,
    CartesianGrid
} from 'recharts';
import { TransactionType } from '../types';
import { exportTransactionsToCSV } from '../services/exportService';

// Modern, vibrant palette for dark/light modes
const COLORS = [
    'hsl(var(--primary))',      // Primary Blue
    'hsl(142, 76%, 36%)',       // Green
    'hsl(35, 92%, 60%)',        // Orange/Amber
    'hsl(var(--destructive))',  // Red
    'hsl(262, 83%, 58%)',       // Purple
    'hsl(190, 85%, 45%)',       // Cyan
    'hsl(var(--muted-foreground))' // Gray
];

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
        totalAvailable,
        spentThisCycle,
        spentPace,
        idealDailyBudget,
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
            case 'danger': return 'bg-gradient-to-br from-red-600 to-red-800 text-white shadow-2xl shadow-red-900/40 border border-red-500/50';
            case 'warning': return 'bg-gradient-to-br from-amber-500 to-orange-700 text-white shadow-2xl shadow-orange-900/40 border border-orange-500/50';
            case 'info': return 'bg-gradient-to-br from-blue-600 to-indigo-800 text-white shadow-2xl shadow-blue-900/40 border border-blue-500/50';
            case 'success': return 'bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-2xl shadow-green-900/40 border border-green-500/50';
            default: return 'bg-card text-card-foreground border';
        }
    };

    if (!activeCycle) {
        return (
            <div className="pt-20 flex flex-col items-center justify-center text-center opacity-50 min-h-[60vh]">
                <Activity size={48} className="mb-4 text-muted-foreground" />
                <p className="font-medium text-muted-foreground">Configura un ciclo en el Dashboard</p>
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
        <div className="animate-fade-in space-y-6 pt-4 pb-24">
            <header className="px-2 mb-2 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight">Insights</h1>
                    <p className="text-muted-foreground text-sm font-medium">Radiografía de tus finanzas</p>
                </div>
                <button
                    onClick={() => exportTransactionsToCSV(transactions)}
                    aria-label="Exportar transacciones a CSV"
                    className="p-3 bg-card border border-border/50 rounded-2xl shadow-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all active:scale-95"
                >
                    <Download size={20} />
                </button>
            </header>

            {/* --- COACH CARD --- */}
            <div className={`mx-1 rounded-[2rem] p-6 relative overflow-hidden transition-all duration-500 ${getCoachStyles(coachInsight.theme)}`}>
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-40 h-40 bg-black opacity-10 rounded-full blur-3xl"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md shadow-inner">
                            <coachInsight.icon size={20} className="text-white" strokeWidth={3} />
                        </div>
                        <h2 className="text-sm font-bold tracking-widest uppercase opacity-90">Coach IA</h2>
                    </div>

                    <h3 className="text-2xl font-black mb-3 text-white leading-tight">
                        {coachInsight.title}
                    </h3>
                    <p className="text-white/90 font-medium leading-relaxed mb-6 text-[15px]">
                        {coachInsight.message}
                    </p>

                    <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/20 flex gap-4 items-start shadow-sm">
                        <Lightbulb className="text-yellow-200 shrink-0 mt-0.5" size={20} fill="currentColor" fillOpacity={0.4} />
                        <div>
                            <span className="block text-[10px] font-black uppercase tracking-wider text-white/70 mb-1">Recomendación Táctica</span>
                            <p className="text-sm font-bold text-white leading-snug">
                                {coachInsight.action}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 1. Velocity Cards Grid */}
            <div className="grid grid-cols-2 gap-3 px-1">
                <div className={`p-5 rounded-[2rem] border flex flex-col justify-between h-36 relative overflow-hidden ${spendingVelocity > 1.1 ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-card border-border text-foreground'}`}>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 opacity-70">
                            <Activity size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">Velocidad</span>
                        </div>
                        <span className="text-4xl font-black tracking-tighter">
                            {spendingVelocity.toFixed(1)}x
                        </span>
                        <p className="text-[10px] font-bold mt-2 opacity-80 leading-tight text-balance">
                            {spendingVelocity > 1.1 ? 'Gastas más rápido que el tiempo' : 'Ritmo saludable'}
                        </p>
                    </div>
                </div>

                <div className={`p-5 rounded-[2rem] border flex flex-col justify-between h-36 relative overflow-hidden ${projectedBalance < 0 ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400'}`}>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 opacity-70">
                            <Target size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">Proyección</span>
                        </div>
                        <span className="text-3xl font-black tracking-tighter">
                            {projectedBalance >= 0 ? '+' : ''}${Math.round(projectedBalance).toLocaleString()}
                        </span>
                        <p className="text-[10px] font-bold mt-2 opacity-80 leading-tight">
                            Estimado al final del ciclo
                        </p>
                    </div>
                </div>
            </div>

            {/* 2. Zero Spend & Financial Structure */}
            <div className="grid grid-cols-2 gap-3 px-1">
                <div className="bg-card p-5 rounded-[2rem] border border-border shadow-sm flex flex-col justify-between h-36 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <CalendarCheck size={16} className="text-primary" />
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Días Cero</span>
                        </div>
                        <span className="text-4xl font-black tracking-tighter text-foreground">
                            {zeroSpendDays}
                        </span>
                        <p className="text-[10px] font-bold mt-2 text-muted-foreground leading-tight">
                            Sin gastos variables
                        </p>
                    </div>
                </div>

                <div className="bg-card p-5 rounded-[2rem] border border-border shadow-sm flex flex-col justify-between h-36 relative overflow-hidden">
                    <div className="relative z-10 w-full">
                        <div className="flex items-center gap-2 mb-2">
                            <Layers size={16} className="text-muted-foreground" />
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rigidez</span>
                        </div>

                        <div className="flex items-end gap-1 mb-2">
                            <span className={`text-2xl font-black tracking-tighter ${fixedRatio > 50 ? 'text-destructive' : 'text-foreground'}`}>
                                {Math.round(fixedRatio)}%
                            </span>
                        </div>

                        <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${fixedRatio > 50 ? 'bg-destructive' : 'bg-primary'}`} style={{ width: `${Math.min(fixedRatio, 100)}%` }}></div>
                        </div>
                        <p className="text-[10px] font-bold mt-2 text-muted-foreground leading-tight">
                            Ingreso comprometido
                        </p>
                    </div>
                </div>
            </div>

            {/* 3. Breakdown Pie Chart */}
            <Card title="Distribución de Gastos" subtitle="¿A dónde va tu dinero?" className="overflow-visible mx-1">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-56 w-56 relative shrink-0 my-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={95}
                                    paddingAngle={4}
                                    dataKey="value"
                                    stroke="none"
                                    onMouseEnter={(_, index) => setActiveIndex(index)}
                                    onMouseLeave={() => setActiveIndex(null)}
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            opacity={activeIndex === null || activeIndex === index ? 1 : 0.5}
                                            className="transition-all duration-300"
                                        />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Total</span>
                            <span className="text-xl font-black text-foreground">${spentThisCycle.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="w-full grid grid-cols-2 gap-2">
                        {categoryData.slice(0, 6).map((cat, index) => (
                            <div key={cat.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors" onMouseEnter={() => setActiveIndex(index)} onMouseLeave={() => setActiveIndex(null)}>
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    <span className="text-xs font-bold text-foreground truncate">{cat.name}</span>
                                </div>
                                <span className="text-xs font-medium text-muted-foreground">
                                    {((cat.value / spentThisCycle) * 100).toFixed(0)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            {/* 4. Weekly Rhythm Chart */}
            <Card title="Ritmo Semanal" subtitle="Gasto vs Límite Sugerido" className="mx-1">
                <div className="h-48 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 'bold' }}
                                dy={10}
                            />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3, radius: 8 }}
                                contentStyle={{ borderRadius: '16px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.2)' }}
                                itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: 'hsl(var(--foreground))' }}
                                labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '0.25rem' }}
                            />
                            <Bar dataKey="limit" fill="hsl(var(--muted))" radius={[6, 6, 6, 6]} name="Límite" maxBarSize={40} />
                            <Bar dataKey="spent" radius={[6, 6, 6, 6]} name="Gastado" maxBarSize={40}>
                                {weeklyChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.spent > entry.limit ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* 5. Daily Average vs Limit */}
            <div className="bg-card rounded-[2rem] p-6 shadow-sm border border-border mx-1">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h3 className="text-foreground font-bold text-lg">Promedio Diario</h3>
                        <p className="text-muted-foreground text-xs font-bold mt-1 uppercase tracking-wide">Real vs Permitido</p>
                    </div>
                    <div className="bg-muted p-2 rounded-2xl">
                        <CalendarClock size={20} className="text-foreground" />
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Real Spend Bar */}
                    <div>
                        <div className="flex justify-between text-xs font-bold mb-2">
                            <span className="text-muted-foreground">Gasto Promedio Actual</span>
                            <span className="text-foreground">${Math.round(dailyAverage).toLocaleString()} / día</span>
                        </div>
                        <div className="h-4 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${dailyLimit > 0 ? Math.min(((dailyAverage / dailyLimit) * 100), 100) : 0}%` }}></div>
                        </div>
                    </div>

                    {/* Safe Limit Bar */}
                    <div>
                        <div className="flex justify-between text-xs font-bold mb-2">
                            <span className="text-muted-foreground">Límite Saludable</span>
                            <span className="text-foreground">${Math.round(dailyLimit).toLocaleString()} / día</span>
                        </div>
                        <div className="h-4 w-full bg-muted/50 rounded-full overflow-hidden relative border border-muted">
                            <div className="absolute inset-0 w-full h-full opacity-20 bg-[linear-gradient(45deg,currentColor_25%,transparent_25%,transparent_50%,currentColor_50%,currentColor_75%,transparent_75%,transparent)] bg-[length:8px_8px] text-muted-foreground"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 6. Top Expenses List */}
            <Card title="Mayores Gastos" subtitle="Identifica tus fugas" noPadding className="mx-1">
                <div className="divide-y divide-border/50">
                    {topTransactions.map((t) => (
                        <div key={t.id} className="p-5 flex justify-between items-center hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="bg-destructive/10 text-destructive w-11 h-11 rounded-2xl flex items-center justify-center shrink-0">
                                    <TrendingDown size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-sm text-foreground truncate max-w-[150px]">{t.description}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider mt-0.5">{t.category}</p>
                                </div>
                            </div>
                            <span className="font-bold text-foreground text-sm">
                                -${t.amount.toLocaleString()}
                            </span>
                        </div>
                    ))}
                    {topTransactions.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground text-sm font-medium">Sin datos suficientes</div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default Insights;
