import React, { useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, ArrowRightLeft, CalendarDays } from 'lucide-react';
import { Cycle, CycleMetrics, WeeklyStatus } from '../../types';
import { Card } from '../ui/Card';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../lib/utils';


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
        <Card className="border border-border bg-card overflow-hidden transition-all duration-300 shadow-sm">
            <button
                onClick={() => setShowWeeklyDetail(!showWeeklyDetail)}
                className="w-full p-5 flex justify-between items-center bg-transparent active:bg-white/5 transition-colors"
                aria-expanded={showWeeklyDetail}
            >
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2.5 rounded-xl text-primary border border-primary/10">
                        <CalendarDays size={20} />
                    </div>
                    <div className="text-left">
                        <span className="font-bold text-foreground text-base block tracking-tight">Desglose Semanal</span>
                        <span className="text-xs text-muted-foreground font-medium">Gestiona tus límites por semana</span>
                    </div>
                </div>
                <div className={`text-muted-foreground bg-secondary p-1.5 rounded-full transition-transform duration-300 ${showWeeklyDetail ? 'rotate-180 bg-primary/10 text-primary' : ''}`}>
                    <ChevronDown size={18} />
                </div>
            </button>

            {showWeeklyDetail && (
                <div className="px-4 pb-4 space-y-2.5 animate-in slide-in-from-top-2 duration-300">
                    {weeklyBreakdown.map((week) => {
                        // Calculate if this week is "squeezed" compared to the original average
                        const originalDailyAverage = activeCycle ? activeCycle.initialBudget / cycleMetrics.daysTotal : 0;
                        const originalWeekLimit = originalDailyAverage * 7;
                        // If limit is < 95% of original, it means it was adjusted down due to overspending elsewhere
                        const isSqueezed = !week.isCurrent && new Date(week.startDate) > new Date() && week.limit < (originalWeekLimit * 0.95);

                        return (
                            <div
                                key={week.weekNumber}
                                ref={week.isCurrent ? currentWeekRef : null}
                                className={`p-4 rounded-[1.25rem] flex justify-between items-center transition-all border relative overflow-hidden ${week.isCurrent
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 border-primary'
                                    : 'bg-secondary text-muted-foreground border-transparent hover:bg-secondary/80'
                                    }`}
                            >
                                {/* Active Week Decorative Background */}
                                {week.isCurrent && (
                                    <>
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[40px] pointer-events-none"></div>
                                    </>
                                )}

                                <div className="flex-1 relative z-10">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${week.isCurrent ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                                            {week.label}
                                        </span>
                                        {isSqueezed && week.remaining > 0 && (
                                            <span className="flex items-center gap-1 text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider border border-amber-500/30">
                                                <ArrowRightLeft size={8} /> Ajustado
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-0.5 mt-1">
                                        <p className={`text-[11px] font-medium ${week.isCurrent ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                                            {new Date(week.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - {new Date(week.endDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                        </p>
                                        <p className={`text-[11px] font-bold ${week.isCurrent ? 'text-primary-foreground' : 'text-foreground'}`}>
                                            Límite: {formatCurrency(week.limit, currency)}
                                        </p>

                                    </div>
                                </div>
                                <div className="text-right relative z-10">
                                    <span className={`text-xs font-medium block mb-0.5 ${week.isCurrent ? 'text-white/70' : 'text-gray-500'}`}>Disponible</span>
                                    <p className={`font-black text-lg tracking-tight ${week.remaining < 0
                                        ? week.isCurrent ? 'text-red-200 drop-shadow-md' : 'text-red-400'
                                        : week.isCurrent ? 'text-white drop-shadow-sm' : 'text-white'
                                        }`}>
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
