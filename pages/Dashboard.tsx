import React from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Wallet,
  Sparkles,
  ShieldCheck,
  Calendar,
  ArrowRight
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const {
    activeCycle,
    cycleMetrics,
    totalDisposableIncome
  } = useFinance();

  if (!activeCycle) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] px-10 text-center animate-in">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg shadow-gray-200/60 mb-6 border border-white/50 relative group">
          <div className="absolute inset-0 bg-blue-500/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Wallet size={32} className="text-gray-900" strokeWidth={1.5} />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Bienvenido a Budgy</h2>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          Para ver tu resumen financiero, necesitas configurar tu presupuesto y empezar un ciclo.
        </p>

        <button
          onClick={() => onNavigate('budget')}
          className="bg-black text-white px-8 py-3.5 rounded-2xl font-bold shadow-xl shadow-gray-900/10 active:scale-95 transition-all flex items-center gap-2"
        >
          <span>Ir a Presupuesto</span>
          <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  // Use the pre-calculated metrics from context
  const {
    remainingBudget,
    currentSurplus,
    isOverspending,
    daysPassed
  } = cycleMetrics;

  return (
    <div className="animate-in space-y-6 pt-4">

      {/* 1. Modern Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Resumen</h1>
          <div className="flex items-center gap-1.5 mt-1">
            <Calendar size={12} className="text-gray-400" />
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">
              Día {daysPassed} • {activeCycle.name}
            </p>
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
          <span className={`text - 5xl font - extrabold tracking - tighter mb - 2 ${remainingBudget < 0 ? 'text-amber-400' : 'text-white'} `}>
            ${remainingBudget.toLocaleString()}
          </span>
          <div className={`flex items - center gap - 1.5 px - 3 py - 1 rounded - full text - xs font - bold ${currentSurplus >= 0 ? 'bg-green-500/20 text-green-300' : 'bg-orange-500/20 text-orange-300'} `}>
            {currentSurplus >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>
              {currentSurplus > 0 ? '+' : ''}{Math.round(currentSurplus).toLocaleString()} vs. Ideal
            </span>
          </div>
        </div>
      </div>

      {/* 3. Status Band */}
      <div className={`rounded - 2xl p - 4 flex items - center gap - 4 border shadow - sm transition - colors duration - 500
        ${isOverspending
          ? 'bg-white border-orange-100'
          : currentSurplus > (totalDisposableIncome * 0.1) // Just an example threshold 
            ? 'bg-white border-green-100'
            : 'bg-white border-gray-100'
        } `}
      >
        <div className={`w - 12 h - 12 rounded - full flex items - center justify - center shrink - 0
          ${isOverspending
            ? 'bg-orange-50 text-orange-500'
            : currentSurplus > (totalDisposableIncome * 0.1)
              ? 'bg-green-50 text-green-500'
              : 'bg-gray-50 text-gray-500'
          } `}
        >
          {isOverspending ? <AlertTriangle size={20} /> : currentSurplus > (totalDisposableIncome * 0.1) ? <Sparkles size={20} /> : <CheckCircle2 size={20} />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-gray-900 mb-0.5">
            {isOverspending ? 'Ritmo acelerado' : currentSurplus > (totalDisposableIncome * 0.1) ? 'Excelente superávit' : 'Ritmo balanceado'}
          </h3>
          <p className="text-xs text-gray-500 leading-snug truncate">
            {isOverspending
              ? 'Estás consumiendo el presupuesto muy rápido.'
              : currentSurplus > (totalDisposableIncome * 0.1)
                ? 'Vas muy por debajo de tu límite de gasto.'
                : 'Tus finanzas van alineadas al calendario.'}
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
              <p className="text-[10px] text-gray-500 font-medium mt-0.5">Gestión de ciclos</p>
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
              <p className="font-bold text-gray-900 text-sm">Análisis</p>
              <p className="text-[10px] text-gray-500 font-medium mt-0.5">Coach financiero</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;