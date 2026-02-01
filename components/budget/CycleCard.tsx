import React from 'react';
import { RefreshCcw, Edit3 } from 'lucide-react';
import { Cycle, CycleMetrics, WeeklyStatus } from '../../types';

interface CycleCardProps {
    activeCycle: Cycle | null;
    cycleMetrics: CycleMetrics;
    currentWeekStatus: WeeklyStatus | null;
    currency: string;
    onEditSavings: () => void;
    onOpenCycleModal: () => void;
}

const CycleCard: React.FC<CycleCardProps> = ({
    activeCycle,
    cycleMetrics,
    currentWeekStatus,
    currency,
    onEditSavings,
    onOpenCycleModal
}) => {
    // Modern progress bar logic
    let progressBarColor = 'bg-gray-900';
    const totalAvailable = cycleMetrics.remainingBudget + cycleMetrics.spentThisCycle;
    const percentageOfBudget = activeCycle && totalAvailable > 0
        ? (cycleMetrics.spentThisCycle / totalAvailable) * 100
        : 0;

    if (percentageOfBudget >= 80) progressBarColor = 'bg-orange-500';
    if (percentageOfBudget >= 100) progressBarColor = 'bg-red-500';

    return (
        <div className="bg-white rounded-[32px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-gray-600 text-xs font-bold uppercase tracking-widest">Dinero disponible este ciclo</h2>
                    <p className="text-gray-300 text-[10px] font-medium mt-0.5">
                        {activeCycle?.name}
                    </p>
                </div>
                <button onClick={onOpenCycleModal} aria-label="Refrescar o iniciar nuevo ciclo" className="p-2 -mr-2 text-gray-300 hover:text-gray-900 transition-colors bg-gray-50 rounded-full">
                    <RefreshCcw size={16} />
                </button>
            </div>

            <div className="flex flex-col items-center mb-8">
                <span className={`text-5xl font-extrabold tracking-tighter mb-2 ${cycleMetrics.remainingBudget < 0 ? 'text-amber-500' : 'text-gray-900'}`}>
                    {currency === 'EUR' ? '€' : '$'}{cycleMetrics.remainingBudget.toLocaleString()}
                </span>
                <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-semibold text-gray-700">
                    {cycleMetrics.remainingBudget < 0 ? 'Excedido' : 'Disponible'}
                </span>
            </div>

            {/* Custom Progress Bar */}
            <div className="relative h-4 bg-gray-100 rounded-full mb-3 overflow-hidden">
                <div
                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${progressBarColor}`}
                    style={{ width: `${Math.min(percentageOfBudget, 100)}%` }}
                />
            </div>

            <div className="flex justify-between text-[11px] font-bold uppercase text-gray-600 mb-8 tracking-wide">
                <span>Gastado ${cycleMetrics.spentThisCycle.toLocaleString()}</span>
                <span>Total ${activeCycle?.initialBudget.toLocaleString()}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className={`rounded-2xl p-4 border ${currentWeekStatus && currentWeekStatus.remaining < 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-transparent'}`}>
                    <span className={`text-xs font-bold uppercase block mb-1 ${currentWeekStatus && currentWeekStatus.remaining < 0 ? 'text-red-400' : 'text-gray-600'}`}>Semana Actual</span>
                    <span className={`text-xl font-bold tracking-tight ${currentWeekStatus && currentWeekStatus.remaining < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {currency === 'EUR' ? '€' : '$'}{currentWeekStatus ? currentWeekStatus.remaining.toLocaleString() : '0'}
                    </span>
                </div>
                <div
                    onClick={onEditSavings}
                    className="bg-blue-50/50 rounded-2xl p-4 cursor-pointer active:scale-95 transition-transform border border-blue-100/50"
                >
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-xs text-blue-400 font-bold uppercase">Ahorro</span>
                        <Edit3 size={12} className="text-blue-300" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-blue-900">
                        ${activeCycle?.savingsGoal.toLocaleString()}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CycleCard;
