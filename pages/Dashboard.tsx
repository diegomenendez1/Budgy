import React, { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Wallet, 
  Sparkles, 
  ChevronRight,
  ShieldCheck,
  Calendar
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { totalDisposableIncome, currentBalance, spentThisCycle } = useFinance();

  const metrics = useMemo(() => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay = now.getDate();

    const remainingBudget = currentBalance;
    const dailyBudget = totalDisposableIncome / daysInMonth;
    const idealSpendToDate = dailyBudget * currentDay;
    const currentSurplus = idealSpendToDate - spentThisCycle;
    const isOverspending = currentSurplus < -10;

    return { remainingBudget, currentSurplus, isOverspending, currentDay };
  }, [totalDisposableIncome, currentBalance, spentThisCycle]);

  if (typeof totalDisposableIncome === 'undefined') {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-sm font-medium">Sincronizando...</p>
      </div>
    );
  }

  const { remainingBudget, currentSurplus, isOverspending } = metrics;

  return (
    <div className="animate-in space-y-6 pt-4">
      
      {/* 1. Modern Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Resumen</h1>
          <div className="flex items-center gap-1.5 mt-1">
             <Calendar size={12} className="text-gray-400" />
             <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Día {metrics.currentDay} del ciclo</p>
          </div>
        </div>
        <div className="bg-white p-2 rounded-full shadow-sm border border-gray-100">
           <ShieldCheck size={20} className="text-green-500" />
        </div>
      </div>

      {/* 2. Primary Status Card */}
      <div className="bg-gray-900 rounded-[28px] p-6 text-white shadow-xl shadow-gray-900/10 relative overflow-hidden">
         {/* Background accent */}
         <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500 rounded-full blur-[60px] opacity-20"></div>
         
         <div className="relative z-10 flex flex-col items-center justify-center py-4">
            <span className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Disponible Real</span>
            <span className={`text-5xl font-extrabold tracking-tighter mb-2 ${remainingBudget < 0 ? 'text-red-400' : 'text-white'}`}>
              ${remainingBudget.toLocaleString()}
            </span>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${currentSurplus >= 0 ? 'bg-green-500/20 text-green-300' : 'bg-orange-500/20 text-orange-300'}`}>
                {currentSurplus >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>
                  {currentSurplus > 0 ? '+' : ''}{Math.round(currentSurplus).toLocaleString()} vs. Ideal
                </span>
            </div>
         </div>
      </div>

      {/* 3. Status Band */}
      <div className={`rounded-2xl p-4 flex items-center gap-4 border shadow-sm transition-colors duration-500
        ${isOverspending 
          ? 'bg-white border-orange-100' 
          : currentSurplus > 50 
            ? 'bg-white border-green-100' 
            : 'bg-white border-gray-100'
        }`}
      >
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0
          ${isOverspending 
            ? 'bg-orange-50 text-orange-500' 
            : currentSurplus > 50 
              ? 'bg-green-50 text-green-500' 
              : 'bg-gray-50 text-gray-500'
          }`}
        >
          {isOverspending ? <AlertTriangle size={20} /> : currentSurplus > 50 ? <Sparkles size={20} /> : <CheckCircle2 size={20} />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-gray-900 mb-0.5">
            {isOverspending ? 'Cuidado con los gastos' : currentSurplus > 50 ? 'Excelente ahorro' : 'Ritmo balanceado'}
          </h3>
          <p className="text-xs text-gray-500 leading-snug truncate">
            {isOverspending 
              ? 'Has gastado más de lo ideal hoy.' 
              : currentSurplus > 50 
                ? 'Vas muy por debajo de tu límite.' 
                : 'Tus finanzas van según lo planeado.'}
          </p>
        </div>
      </div>

      {/* 4. Shortcuts Grid */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Accesos Directos</h3>
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => onNavigate('budget')}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-28 group active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-2">
              <Wallet size={20} />
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900 text-sm">Presupuesto</p>
              <p className="text-[10px] text-gray-500 font-medium mt-0.5">Ver detalles</p>
            </div>
          </button>

          <button 
            onClick={() => onNavigate('insights')}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-28 group active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 mb-2">
              <Sparkles size={20} />
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900 text-sm">Análisis IA</p>
              <p className="text-[10px] text-gray-500 font-medium mt-0.5">Consejos smart</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;