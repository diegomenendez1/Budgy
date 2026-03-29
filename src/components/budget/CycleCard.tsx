import React from 'react';
import { RefreshCcw, Edit3, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import { Cycle, CycleMetrics, WeeklyStatus } from '../../types';
import { Button } from '../ui/Button';
import { formatCurrency, cn } from '../../lib/utils';

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
    const percentageOfBudget = activeCycle && cycleMetrics.spendableBudget > 0
        ? (cycleMetrics.spentThisCycle / cycleMetrics.spendableBudget) * 100
        : 0;

    const isOverBudget = cycleMetrics.remainingBudget < 0;

    const getProgressGradient = () => {
        if (percentageOfBudget >= 100) return 'bg-gradient-to-r from-red-500 to-red-600';
        if (percentageOfBudget >= 80) return 'bg-gradient-to-r from-amber-500 to-orange-500';
        return 'bg-gradient-to-r from-[#0052FF] to-[#4D7CFF]';
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            {/* Subtle top accent */}
            <div className="h-1 bg-gradient-to-r from-[#0052FF] via-[#4D7CFF] to-[#7DA0FF]" />

            <div className="p-5">
                {/* Header */}
                <div className="flex justify-between items-center mb-5">
                    <div>
                        <p className="text-xs text-slate-500 font-medium">Dinero disponible</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{activeCycle?.name}</p>
                    </div>
                    <button
                        onClick={onOpenCycleModal}
                        aria-label="Nuevo ciclo"
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors tap-transparent"
                    >
                        <RefreshCcw size={15} />
                    </button>
                </div>

                {/* Main Balance */}
                <div className="text-center mb-6">
                    <p className={cn(
                        "text-[2rem] font-bold tracking-tight tabular-nums",
                        isOverBudget ? "text-red-600" : "text-slate-900"
                    )}>
                        {formatCurrency(cycleMetrics.remainingBudget, currency)}
                    </p>
                    <span className={cn(
                        "inline-block mt-2.5 px-3 py-1 rounded-lg text-[11px] font-medium",
                        isOverBudget
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : 'bg-[#0052FF]/[0.06] text-[#0052FF] border border-[#0052FF]/20'
                    )}>
                        {isOverBudget ? 'Presupuesto Excedido' : 'Disponible para gastar'}
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="relative h-2 bg-slate-100 rounded-full mb-2 overflow-hidden">
                    <div
                        className={cn(
                            "absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out",
                            getProgressGradient()
                        )}
                        style={{ width: `${Math.min(percentageOfBudget, 100)}%` }}
                    />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 mb-6">
                    <span className="tabular-nums">Gastado {formatCurrency(cycleMetrics.spentThisCycle, currency)}</span>
                    <span className="tabular-nums">Total {formatCurrency(cycleMetrics.spendableBudget, currency)}</span>
                </div>

                {/* Bottom Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Week Remaining */}
                    <div className={cn(
                        "rounded-xl p-3.5 flex flex-col gap-2",
                        currentWeekStatus && currentWeekStatus.remaining < 0
                            ? 'bg-red-50 border border-red-200'
                            : 'bg-slate-50 border border-slate-200'
                    )}>
                        <div className="flex justify-between items-center">
                            <span className="text-[11px] text-slate-500 font-medium">Semana</span>
                            {currentWeekStatus && currentWeekStatus.remaining < 0
                                ? <TrendingDown size={13} className="text-red-600" />
                                : <TrendingUp size={13} className="text-blue-600" />
                            }
                        </div>
                        <span className={cn(
                            "text-lg font-bold tracking-tight tabular-nums",
                            currentWeekStatus && currentWeekStatus.remaining < 0 ? 'text-red-600' : 'text-slate-900'
                        )}>
                            {formatCurrency(currentWeekStatus ? currentWeekStatus.remaining : 0, currency)}
                        </span>
                    </div>

                    {/* Savings Button */}
                    <button
                        onClick={onEditSavings}
                        className="bg-emerald-50 hover:bg-emerald-100 rounded-xl p-3.5 active:scale-[0.97] transition-all border border-emerald-200 flex flex-col gap-2 text-left"
                    >
                        <div className="flex justify-between items-center w-full">
                            <span className="text-[11px] text-emerald-700 font-medium">Ahorro</span>
                            <PiggyBank size={13} className="text-emerald-600" />
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-lg font-bold tracking-tight text-emerald-700 tabular-nums">
                                {formatCurrency(activeCycle?.savingsGoal || 0, currency)}
                            </span>
                            <Edit3 size={10} className="text-emerald-400" />
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CycleCard;
