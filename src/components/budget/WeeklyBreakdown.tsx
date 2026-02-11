import React, { useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, ArrowRightLeft, CalendarDays } from 'lucide-react';
import { Cycle, CycleMetrics, WeeklyStatus } from '../../types';
import { Card } from '../ui/Card';

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
        <Card className="border-0 bg-white/5 backdrop-blur-md overflow-hidden transition-all duration-300">
            <button
                onClick={() => setShowWeeklyDetail(!showWeeklyDetail)}
                className="w-full p-5 flex justify-between items-center bg-transparent active:bg-white/5 transition-colors"
                aria-expanded={showWeeklyDetail}
            >
                <div className="flex items-center gap-3">
                    <div className="bg-white/10 p-2.5 rounded-xl text-indigo-300 backdrop-blur-sm border border-white/5 shadow-inner">
                        <CalendarDays size={20} />
                    </div>
                    <div className="text-left">
                        <span className="font-bold text-white text-base block tracking-tight">Desglose Semanal</span>
                        <span className="text-xs text-gray-400 font-medium">Gestiona tus límites por semana</span>
                    </div>
                </div>
                <div className={`text-gray-400 bg-white/5 p-1.5 rounded-full transition-transform duration-300 ${showWeeklyDetail ? 'rotate-180 bg-white/10 text-white' : ''}`}>
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
                                    ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-[0_8px_16px_rgba(79,70,229,0.3)] border-white/10'
                                    : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10'
                                    }`}
                            >
                                {/* Active Week Decorative Background */}
                                {week.isCurrent && (
                                    <>
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[40px] pointer-events-none"></div>
                                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-[30px] pointer-events-none"></div>
                                    </>
                                )}

                                <div className="flex-1 relative z-10">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${week.isCurrent ? 'text-white/90' : 'text-gray-500'}`}>
                                            {week.label}
                                        </span>
                                        {isSqueezed && week.remaining > 0 && (
                                            <span className="flex items-center gap-1 text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider border border-amber-500/30">
                                                <ArrowRightLeft size={8} /> Ajustado
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-0.5 mt-1">
                                        <p className={`text-[11px] font-medium ${week.isCurrent ? 'text-white/80' : 'text-gray-400'}`}>
                                            {new Date(week.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - {new Date(week.endDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                        </p>
                                        <p className={`text-[11px] font-bold ${week.isCurrent ? 'text-white' : 'text-gray-300'}`}>
                                            Límite: ${Math.round(week.limit).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right relative z-10">
                                    <span className={`text-xs font-medium block mb-0.5 ${week.isCurrent ? 'text-white/70' : 'text-gray-500'}`}>Disponible</span>
                                    <p className={`font-black text-lg tracking-tight ${week.remaining < 0
                                        ? week.isCurrent ? 'text-red-200 drop-shadow-md' : 'text-red-400'
                                        : week.isCurrent ? 'text-white drop-shadow-sm' : 'text-white'
                                        }`}>
                                        ${Math.round(week.remaining).toLocaleString()}
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
