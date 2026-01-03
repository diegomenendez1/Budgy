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
  ArrowRight,
  User
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
    <div className="space-y-6 pb-20 animate-in pt-4">
      {/* 1. Header with greeting and date */}
      <div className="flex justify-between items-start pt-2 px-1">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Hola</h2>
          <div className="flex items-center gap-1.5 mt-1">
            <Calendar size={12} className="text-gray-400" />
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">
              Día {daysPassed} • {activeCycle.name}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Primary Status Card */}
      <div className="bg-gradient-to-br from-gray-900 to-blue-950 rounded-[32px] p-8 text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden group">
        {/* Decorative elements */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500 rounded-full blur-[80px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-500 rounded-full blur-[60px] opacity-10"></div>

        <div className="relative z-10 flex flex-col items-center justify-center">
          <span className="text-blue-200/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-3">Disponible Real</span>
          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-2xl font-bold text-blue-200/40">$</span>
            <span className={`text-6xl font-black tracking-tighter ${remainingBudget < 0 ? 'text-amber-400' : 'text-white'}`}>
              {Math.abs(Math.round(remainingBudget)).toLocaleString()}
            </span>
          </div>

          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border ${currentSurplus >= 0 ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'}`}>
            {currentSurplus >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>
              {currentSurplus > 0 ? '+' : ''}{Math.round(currentSurplus).toLocaleString()} vs. Ideal
            </span>
          </div>
        </div>
      </div>

      {/* 3. Status Band (Refined) */}
      <div className={`rounded-3xl p-5 flex items-center gap-5 border transition-all duration-500 shadow-sm bg-white
        ${isOverspending ? 'border-orange-100' : currentSurplus > (totalDisposableIncome * 0.1) ? 'border-green-100' : 'border-gray-100'}`}
      >
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner
          ${isOverspending ? 'bg-orange-50 text-orange-500' : currentSurplus > (totalDisposableIncome * 0.1) ? 'bg-green-50 text-green-500' : 'bg-gray-50 text-gray-500'}`}
        >
          {isOverspending ? <AlertTriangle size={24} /> : currentSurplus > (totalDisposableIncome * 0.1) ? <Sparkles size={24} /> : <CheckCircle2 size={24} />}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 text-base mb-0.5">
            {isOverspending ? 'Ajusta el ritmo' : currentSurplus > (totalDisposableIncome * 0.1) ? '¡Vas excelente!' : 'Todo bajo control'}
          </h3>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            {isOverspending
              ? 'Trata de reducir gastos variables hoy.'
              : currentSurplus > (totalDisposableIncome * 0.1)
                ? 'Estás ahorrando más de lo planeado.'
                : 'Tus gastos están alineados con tu meta.'}
          </p>
        </div>
      </div>

      {/* 4. Shortcuts Grid (Premium) */}
      <div className="px-1">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-4">Accesos Directos</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onNavigate('budget')}
            className="bg-white p-5 rounded-[28px] shadow-sm border border-gray-100 flex flex-col items-start justify-between h-36 active:scale-95 transition-all hover:border-blue-200 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Wallet size={24} />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Gestionar Ciclo</p>
              <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">Presupuesto</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('insights')}
            className="bg-white p-5 rounded-[28px] shadow-sm border border-gray-100 flex flex-col items-start justify-between h-36 active:scale-95 transition-all hover:border-purple-200 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Sparkles size={24} />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Asistente IA</p>
              <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">Análisis</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;