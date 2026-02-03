import React from 'react';
import { RefreshCcw, Edit3, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
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
    // Progress Bar Logic
    let progressBarColor = 'bg-primary';
    const totalAvailable = cycleMetrics.remainingBudget + cycleMetrics.spentThisCycle;
    const percentageOfBudget = activeCycle && totalAvailable > 0
        ? (cycleMetrics.spentThisCycle / totalAvailable) * 100
        : 0;

    if (percentageOfBudget >= 80) progressBarColor = 'bg-amber-500';
    if (percentageOfBudget >= 100) progressBarColor = 'bg-destructive';

    return (
        <div className="bg-card rounded-[2rem] p-6 shadow-sm border border-border/50 relative overflow-hidden group">
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[50px] pointer-events-none group-hover:bg-primary/10 transition-colors duration-500"></div>

            <div className="flex justify-between items-center mb-6 relative z-10">
                <div>
                    <h2 className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Dinero disponible</h2>
                    <p className="text-foreground/70 text-xs font-bold mt-0.5">
                        {activeCycle?.name}
                    </p>
                </div>
                <button
                    onClick={onOpenCycleModal}
                    aria-label="Refrescar o iniciar nuevo ciclo"
                    className="p-2.5 -mr-1 text-muted-foreground hover:text-foreground transition-all bg-muted hover:bg-muted/80 rounded-full active:scale-95"
                >
                    <RefreshCcw size={16} />
                </button>
            </div>

            <div className="flex flex-col items-center mb-8 relative z-10">
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-muted-foreground/50">{currency === 'EUR' ? '€' : '$'}</span>
                    <span className={`text-6xl font-black tracking-tighter ${cycleMetrics.remainingBudget < 0 ? 'text-destructive' : 'text-foreground'}`}>
                        {cycleMetrics.remainingBudget.toLocaleString()}
                    </span>
                </div>
                <span className={`mt-2 px-3 py-1 rounded-full text-xs font-bold border ${cycleMetrics.remainingBudget < 0 ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                    {cycleMetrics.remainingBudget < 0 ? 'Presupuesto Excedido' : 'Disponible para gastar'}
                </span>
            </div>

            {/* Custom Progress Bar */}
            <div className="relative h-5 bg-muted rounded-full mb-3 overflow-hidden shadow-inner border border-border/50">
                <div
                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${progressBarColor}`}
                    style={{ width: `${Math.min(percentageOfBudget, 100)}%` }}
                />
            </div>

            <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground mb-8 tracking-widest px-1">
                <span>Gastado ${cycleMetrics.spentThisCycle.toLocaleString()}</span>
                <span>Total ${activeCycle?.initialBudget.toLocaleString()}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 relative z-10">
                <div className={`rounded-2xl p-4 border flex flex-col justify-between h-24 ${currentWeekStatus && currentWeekStatus.remaining < 0 ? 'bg-destructive/10 border-destructive/20' : 'bg-muted/50 border-border/50'}`}>
                    <div className="flex justify-between items-start">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${currentWeekStatus && currentWeekStatus.remaining < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>Semana</span>
                        {currentWeekStatus && currentWeekStatus.remaining < 0 ? <TrendingDown size={14} className="text-destructive" /> : <TrendingUp size={14} className="text-primary" />}
                    </div>

                    <span className={`text-xl font-black tracking-tight ${currentWeekStatus && currentWeekStatus.remaining < 0 ? 'text-destructive' : 'text-foreground'}`}>
                        {currency === 'EUR' ? '€' : '$'}{currentWeekStatus ? currentWeekStatus.remaining.toLocaleString() : '0'}
                    </span>
                </div>

                <button
                    onClick={onEditSavings}
                    className="bg-blue-500/10 hover:bg-blue-500/20 rounded-2xl p-4 active:scale-95 transition-all border border-blue-500/20 flex flex-col justify-between h-24 text-left group/saving"
                >
                    <div className="flex justify-between items-start w-full">
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Ahorro</span>
                        <PiggyBank size={14} className="text-blue-500 dark:text-blue-400 group-hover/saving:scale-110 transition-transform" />
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black tracking-tight text-blue-700 dark:text-blue-300">
                            ${activeCycle?.savingsGoal.toLocaleString()}
                        </span>
                        <div className="bg-blue-500/20 p-1 rounded-md">
                            <Edit3 size={10} className="text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default CycleCard;
