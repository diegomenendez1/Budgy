import React, { useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, ArrowRightLeft, CalendarDays } from 'lucide-react';
import { Cycle, CycleMetrics, WeeklyStatus } from '../../types';

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
    const currentWeekRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (showWeeklyDetail && currentWeekRef.current) {
            setTimeout(() => {
                currentWeekRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 150);
        }
    }, [showWeeklyDetail]);

    return (
        <div className="bg-card rounded-[2rem] shadow-sm border border-border/50 overflow-hidden transition-all duration-300">
            <button
                onClick={() => setShowWeeklyDetail(!showWeeklyDetail)}
                className="w-full p-6 flex justify-between items-center bg-card active:bg-muted/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="bg-muted p-2 rounded-xl text-muted-foreground">
                        <CalendarDays size={18} />
                    </div>
                    <div className="text-left">
                        <span className="font-bold text-foreground text-base block">Desglose Semanal</span>
                        <span className="text-xs text-muted-foreground font-medium">Gestiona tus límites por semana</span>
                    </div>
                </div>
                {showWeeklyDetail ? <ChevronUp size={20} className="text-muted-foreground" /> : <ChevronDown size={20} className="text-muted-foreground" />}
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
                                className={`p-4 rounded-[1.25rem] flex justify-between items-center transition-all border ${week.isCurrent
                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 border-primary/50 relative overflow-hidden'
                                        : 'bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/50'
                                    }`}
                            >
                                {/* Active Week Decorative Background */}
                                {week.isCurrent && (
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                                )}

                                <div className="flex-1 relative z-10">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${week.isCurrent ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
                                            {week.label}
                                        </span>
                                        {isSqueezed && week.remaining > 0 && (
                                            <span className="flex items-center gap-1 text-[9px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider border border-amber-500/30">
                                                <ArrowRightLeft size={8} /> Ajustado
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-0.5 mt-1">
                                        <p className={`text-[11px] font-medium ${week.isCurrent ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                                            {new Date(week.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - {new Date(week.endDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                        </p>
                                        <p className={`text-[11px] font-bold ${week.isCurrent ? 'text-primary-foreground/90' : 'text-foreground'}`}>
                                            Límite: ${Math.round(week.limit).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right relative z-10">
                                    <span className={`text-xs font-medium block mb-0.5 ${week.isCurrent ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>Disponible</span>
                                    <p className={`font-black text-lg tracking-tight ${week.remaining < 0
                                            ? week.isCurrent ? 'text-white' : 'text-destructive'
                                            : week.isCurrent ? 'text-white' : 'text-foreground'
                                        }`}>
                                        ${Math.round(week.remaining).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default WeeklyBreakdown;
