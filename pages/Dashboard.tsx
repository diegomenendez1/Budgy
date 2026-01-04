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
import { useAuth } from '../context/AuthContext';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const {
    activeCycle,
    cycleMetrics,
    totalDisposableIncome,
    showAuth,
    isSyncing,
    currency
  } = useFinance();
  const { user } = useAuth();

  if (!activeCycle) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center animate-in relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-[-10%] right-[-20%] w-[80%] h-[40%] bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-20%] w-[80%] h-[40%] bg-indigo-100/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-sm">
          <div className="w-24 h-24 bg-gradient-to-tr from-white to-blue-50 rounded-[2rem] flex items-center justify-center shadow-xl shadow-blue-900/5 mb-8 border border-white mx-auto transform rotate-[-5deg]">
            <Wallet size={40} className="text-blue-600" strokeWidth={1.5} />
          </div>

          <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Tu Dashboard <br /><span className="text-blue-600">te espera</span></h2>
          <p className="text-slate-500 text-base mb-10 leading-relaxed font-medium">
            Para ver tus finanzas aquí, necesitas activar tu primer ciclo mensual.
          </p>

          <button
            onClick={() => onNavigate('budget')}
            className="w-full group relative bg-slate-900 text-white p-5 rounded-2xl shadow-xl shadow-slate-900/20 active:scale-[0.98] transition-all flex items-center justify-between overflow-hidden"
          >
            <div className="relative z-10 flex flex-col items-start">
              <span className="font-bold text-lg">Crear Ciclo</span>
              <span className="text-xs text-slate-400 font-medium mt-0.5">Empezar de cero</span>
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <ArrowRight size={24} className="text-white" />
            </div>
          </button>

          <div className="mt-8">
            <button onClick={showAuth} className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              ¿Ya tienes datos? Inicia Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Use the pre-calculated metrics from context
  const {
    remainingBudget,
    currentSurplus,
    isOverspending,
    daysPassed,
    spentThisCycle
  } = cycleMetrics;

  const hasActivity = spentThisCycle > 0;

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
        <button
          onClick={showAuth}
          className="bg-white p-2 rounded-full shadow-sm border border-gray-100 relative hover:bg-gray-50 transition-colors"
        >
          <User size={20} className={user ? "text-blue-600" : "text-gray-400"} />
          {isSyncing && (
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white animate-pulse"></span>
          )}
        </button>
      </div>

      {/* 2. Primary Status Card */}
      <div className="bg-gradient-to-br from-gray-900 to-blue-950 rounded-[32px] p-8 text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden group">
        {/* Decorative elements */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500 rounded-full blur-[80px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-500 rounded-full blur-[60px] opacity-10"></div>

        <div className="relative z-10 flex flex-col items-center justify-center">
          <span className="text-blue-200/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-3">Disponible Real</span>
          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-2xl font-bold text-blue-200/40">{currency === 'EUR' ? '€' : '$'}</span>
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

      {/* Empty State: Nudge to Add First Transaction */}
      {!hasActivity && (
        <div className="bg-white border-2 border-dashed border-blue-200 rounded-3xl p-6 text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <span className="text-2xl">👇</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">¡Estrena tu mes!</h3>
          <p className="text-slate-500 text-sm mb-0">
            Toca el botón <span className="font-bold text-black">+</span> para registrar tu primer gasto.
          </p>
        </div>
      )}

      {/* 3. Status Band (Refined) */}
      {hasActivity && (
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
      )}

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