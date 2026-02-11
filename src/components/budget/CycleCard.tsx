import React from 'react';
import { RefreshCcw, Edit3, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import { Cycle, CycleMetrics, WeeklyStatus } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

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
    // Progress Bar Logic
    let progressBarColor = 'bg-gradient-to-r from-indigo-500 to-purple-500';
    const totalAvailable = cycleMetrics.remainingBudget + cycleMetrics.spentThisCycle;
    const percentageOfBudget = activeCycle && totalAvailable > 0
        ? (cycleMetrics.spentThisCycle / totalAvailable) * 100
        : 0;

    if (percentageOfBudget >= 80) progressBarColor = 'bg-gradient-to-r from-amber-500 to-orange-500';
    if (percentageOfBudget >= 100) progressBarColor = 'bg-gradient-to-r from-red-500 to-rose-600';

    return (
        <Card className="relative overflow-hidden border-0 bg-white/10 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
            <div className="p-6 relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Dinero disponible</h2>
                        <p className="text-white/70 text-xs font-bold mt-0.5">
                            {activeCycle?.name}
                        </p>
                    </div>
                    <Button
                        variant="glass"
                        size="icon"
                        onClick={onOpenCycleModal}
                        aria-label="Refrescar o iniciar nuevo ciclo"
                        className="rounded-full w-9 h-9"
                    >
                        <RefreshCcw size={14} />
                    </Button>
                </div>

                <div className="flex flex-col items-center mb-8">
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-white/40">{currency === 'EUR' ? '€' : '$'}</span>
                        <span className={`text-6xl font-black tracking-tighter ${cycleMetrics.remainingBudget < 0 ? 'text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]' : 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]'}`}>
                            {cycleMetrics.remainingBudget.toLocaleString()}
                        </span>
                    </div>
                    <span className={`mt-2 px-3 py-1 rounded-full text-xs font-bold border ${cycleMetrics.remainingBudget < 0 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                        {cycleMetrics.remainingBudget < 0 ? 'Presupuesto Excedido' : 'Disponible para gastar'}
                    </span>
                </div>

                {/* Custom Progress Bar */}
                <div className="relative h-4 bg-black/20 rounded-full mb-3 overflow-hidden backdrop-blur-sm border border-white/5">
                    <div
                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)] ${progressBarColor}`}
                        style={{ width: `${Math.min(percentageOfBudget, 100)}%` }}
                    />
                </div>

                <div className="flex justify-between text-[10px] font-black uppercase text-gray-400 mb-8 tracking-widest px-1">
                    <span>Gastado ${cycleMetrics.spentThisCycle.toLocaleString()}</span>
                    <span>Total ${activeCycle?.initialBudget.toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className={`rounded-2xl p-4 border flex flex-col justify-between h-24 backdrop-blur-sm ${currentWeekStatus && currentWeekStatus.remaining < 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex justify-between items-start">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${currentWeekStatus && currentWeekStatus.remaining < 0 ? 'text-red-400' : 'text-gray-400'}`}>Semana</span>
                            {currentWeekStatus && currentWeekStatus.remaining < 0 ? <TrendingDown size={14} className="text-red-400" /> : <TrendingUp size={14} className="text-emerald-400" />}
                        </div>

                        <span className={`text-xl font-black tracking-tight ${currentWeekStatus && currentWeekStatus.remaining < 0 ? 'text-red-400' : 'text-white'}`}>
                            {currency === 'EUR' ? '€' : '$'}{currentWeekStatus ? currentWeekStatus.remaining.toLocaleString() : '0'}
                        </span>
                    </div>

                    <button
                        onClick={onEditSavings}
                        className="bg-blue-500/10 hover:bg-blue-500/20 rounded-2xl p-4 active:scale-95 transition-all border border-blue-500/20 flex flex-col justify-between h-24 text-left group/saving backdrop-blur-sm"
                    >
                        <div className="flex justify-between items-start w-full">
                            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Ahorro</span>
                            <PiggyBank size={14} className="text-blue-400 group-hover/saving:scale-110 transition-transform" />
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xl font-black tracking-tight text-blue-300">
                                ${activeCycle?.savingsGoal.toLocaleString()}
                            </span>
                            <div className="bg-blue-500/20 p-1 rounded-md">
                                <Edit3 size={10} className="text-blue-400" />
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px] pointer-events-none -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600/20 rounded-full blur-[60px] pointer-events-none -ml-10 -mb-10"></div>
        </Card>
    );
};

export default CycleCard;
