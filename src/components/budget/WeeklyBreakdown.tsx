import React, { useRef, useEffect } from 'react';
import { ChevronDown, ArrowRightLeft, CalendarDays } from 'lucide-react';
import { Cycle, CycleMetrics, WeeklyStatus } from '../../types';
import { Card } from '../ui/Card';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, cn } from '../../lib/utils';

interface WeeklyBreakdownProps {
    weeklyBreakdown: WeeklyStatus[];
    activeCycle: Cycle | null;
    cycleMetrics: CycleMetrics;
    showWeeklyDetail: boolean;
    setShowWeeklyDetail: (val: boolean) => void;
}

const WeeklyBreakdown: React.FC<WeeklyBreakdownProps> = ({
    weeklyBreakdown,
    activeCycle,
    cycleMetrics,
    showWeeklyDetail,
    setShowWeeklyDetail
}) => {
    const { currency } = useFinance();
    const currentWeekRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (showWeeklyDetail && currentWeekRef.current) {
            setTimeout(() => {
                currentWeekRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 150);
        }
    }, [showWeeklyDetail]);

    return (
        <Card className="overflow-hidden">
            <button
                onClick={() => setShowWeeklyDetail(!showWeeklyDetail)}
                className="w-full p-4 flex justify-between items-center hover:bg-slate-50 transition-colors"
                aria-expanded={showWeeklyDetail}
            >
                <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-2 rounded-lg text-blue-600 border border-blue-200">
                        <CalendarDays size={18} />
                    </div>
                    <div className="text-left">
                        <span className="font-semibold text-slate-900 text-sm block">Desglose Semanal</span>
                        <span className="text-[11px] text-slate-500">Limites por semana</span>
                    </div>
                </div>
                <div className={cn(
                    "text-slate-400 p-1.5 rounded-lg transition-transform duration-200",
                    showWeeklyDetail && "rotate-180 text-blue-600"
                )}>
                    <ChevronDown size={16} />
                </div>
            </button>

            {showWeeklyDetail && (
                <div className="px-3 pb-3 space-y-2 animate-in fade-in duration-200">
                    {weeklyBreakdown.map((week) => {
                        const originalDailyAverage = activeCycle ? cycleMetrics.spendableBudget / cycleMetrics.daysTotal : 0;
                        const originalWeekLimit = originalDailyAverage * 7;
                        const isSqueezed = !week.isCurrent && new Date(week.startDate) > new Date() && week.limit < (originalWeekLimit * 0.95);

                        return (
                            <div
                                key={week.weekNumber}
                                ref={week.isCurrent ? currentWeekRef : null}
                                className={cn(
                                    "p-3.5 rounded-xl flex justify-between items-center transition-all border",
                                    week.isCurrent
                                        ? 'bg-gradient-to-r from-[#0052FF] to-[#4D7CFF] text-white border-[#0052FF]/30'
                                        : 'bg-slate-50 border-slate-200/60 hover:bg-slate-100'
                                )}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-xs font-semibold",
                                            week.isCurrent ? 'text-white' : 'text-slate-600'
                                        )}>
                                            {week.label}
                                        </span>
                                        {isSqueezed && week.remaining > 0 && (
                                            <span className="flex items-center gap-1 text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium border border-amber-200">
                                                <ArrowRightLeft size={8} /> Ajustado
                                            </span>
                                        )}
                                    </div>
                                    <p className={cn(
                                        "text-[11px] mt-0.5",
                                        week.isCurrent ? 'text-white/70' : 'text-slate-500'
                                    )}>
                                        {new Date(week.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - {new Date(week.endDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                    </p>
                                    <p className={cn(
                                        "text-[11px] font-medium mt-0.5",
                                        week.isCurrent ? 'text-white/80' : 'text-slate-600'
                                    )}>
                                        Limite: {formatCurrency(week.limit, currency)}
                                    </p>
                                </div>

                                <div className="text-right">
                                    <span className={cn(
                                        "text-[10px] block mb-0.5",
                                        week.isCurrent ? 'text-white/60' : 'text-slate-500'
                                    )}>
                                        Disponible
                                    </span>
                                    <p className={cn(
                                        "font-bold text-base tracking-tight tabular-nums",
                                        week.remaining < 0
                                            ? week.isCurrent ? 'text-red-200' : 'text-red-600'
                                            : week.isCurrent ? 'text-white' : 'text-slate-900'
                                    )}>
                                        {formatCurrency(week.remaining, currency)}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
};

export default WeeklyBreakdown;
