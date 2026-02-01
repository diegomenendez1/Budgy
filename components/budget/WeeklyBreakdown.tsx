import React, { useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, ArrowRightLeft } from 'lucide-react';
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
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all">
            <button
                onClick={() => setShowWeeklyDetail(!showWeeklyDetail)}
                className="w-full p-5 flex justify-between items-center bg-white active:bg-gray-50"
            >
                <span className="font-bold text-gray-900 text-[15px]">Desglose Semanal</span>
                {showWeeklyDetail ? <ChevronUp size={20} className="text-gray-600" /> : <ChevronDown size={20} className="text-gray-600" />}
            </button>

            {showWeeklyDetail && (
                <div className="px-5 pb-5 space-y-2">
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
                                className={`p-3 rounded-2xl flex justify-between items-center transition-colors ${week.isCurrent ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-50 text-gray-600'}`}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold uppercase ${week.isCurrent ? 'text-blue-100' : 'text-gray-600'}`}>
                                            {week.label}
                                        </span>
                                        {isSqueezed && week.remaining > 0 && (
                                            <span className="flex items-center gap-1 text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider border border-amber-200">
                                                <ArrowRightLeft size={8} /> Ajustado
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className={`text-[10px] font-medium ${week.isCurrent ? 'text-blue-200' : 'text-gray-600'}`}>
                                            {new Date(week.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - {new Date(week.endDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                        </p>
                                        <p className={`text-[10px] font-medium ${week.isCurrent ? 'text-blue-200' : 'text-gray-600'}`}>
                                            • Límite: ${Math.round(week.limit).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold text-sm ${week.remaining < 0 ? 'text-red-400' : ''}`}>
                                        ${Math.round(week.remaining).toLocaleString()}
                                    </p>
                                    {week.isCurrent && (
                                        <p className="text-[9px] text-blue-200 font-medium">Disponible</p>
                                    )}
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
