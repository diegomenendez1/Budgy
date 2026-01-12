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
  User,
  Eye,
  EyeOff,
  Moon,
  Sun,
  LogOut,
  Download,
  Trash2,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

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
    currency,
    activeInstallments
  } = useFinance();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isPrivacyMode, setIsPrivacyMode] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);

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
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Hola</h2>
          <div className="flex items-center gap-1.5 mt-1">
            <Calendar size={12} className="text-gray-600 dark:text-slate-500" />
            <p className="text-gray-700 dark:text-slate-400 text-xs font-semibold uppercase tracking-wide">
              Día {daysPassed} • {activeCycle.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPrivacyMode(!isPrivacyMode)}
            aria-label={isPrivacyMode ? "Desactivar modo privacidad" : "Activar modo privacidad"}
            className="bg-white dark:bg-slate-900 p-2 rounded-full shadow-sm border border-gray-100 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition-colors"
          >
            {isPrivacyMode ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
          <button
            onClick={() => setIsProfileOpen(true)}
            aria-label="Perfil de usuario e inicio de sesión"
            className="bg-white dark:bg-slate-900 p-2 rounded-full shadow-sm border border-gray-100 dark:border-slate-800 relative hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            <User size={20} className={user ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-slate-400"} />
            {isSyncing && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
            )}
          </button>
        </div>
      </div>

      {/* User Profile Modal */}
      <AnimatePresence>
        {isProfileOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-8 shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">Perfil</h3>
                <button
                  onClick={() => setIsProfileOpen(false)}
                  aria-label="Cerrar perfil"
                  className="p-2 bg-gray-100 dark:bg-slate-800 rounded-full text-gray-500 dark:text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* User Info */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <User size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{user?.email || 'Usuario Invitado'}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-500">{user ? 'Cuenta activa' : 'Sin iniciar sesión'}</p>
                  </div>
                </div>

                {/* Theme Toggle */}
                <div className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 dark:bg-indigo-900/30 text-amber-600 dark:text-indigo-400 rounded-xl">
                      {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">Modo {theme === 'light' ? 'Claro' : 'Oscuro'}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-500">Cambiar apariencia</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleTheme}
                    aria-label={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
                    className={`w-14 h-8 rounded-full flex items-center px-1 transition-colors duration-300 ${theme === 'dark' ? 'bg-indigo-600 justify-end' : 'bg-gray-200 justify-start'}`}
                  >
                    <motion.div layout className="w-6 h-6 bg-white rounded-full shadow-md" />
                  </button>
                </div>

                <div className="h-px bg-gray-100 dark:bg-slate-800 w-full" />

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 text-gray-700 dark:text-slate-300 active:scale-95 transition-all">
                    <Download size={20} />
                    <span className="text-xs font-bold">Exportar</span>
                  </button>
                  <button
                    onClick={() => {
                      signOut();
                      setIsProfileOpen(false);
                    }}
                    className="flex flex-col items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 active:scale-95 transition-all"
                  >
                    <LogOut size={20} />
                    <span className="text-xs font-bold">Salir</span>
                  </button>
                </div>

                <button className="w-full flex items-center justify-center gap-2 p-4 text-gray-400 dark:text-slate-600 hover:text-red-500 transition-colors text-xs font-bold">
                  <Trash2 size={16} /> Eliminar Cuenta
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Primary Status Card */}
      <div className="bg-gradient-to-br from-gray-900 to-blue-950 rounded-[32px] p-8 text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden group">
        {/* Decorative elements */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500 rounded-full blur-[80px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-500 rounded-full blur-[60px] opacity-10"></div>

        <div className="relative z-10 flex flex-col items-center justify-center">
          <span className="text-blue-200/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-3">Disponible Real</span>
          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-2xl font-bold text-blue-200/40">{currency === 'EUR' ? '€' : '$'}</span>
            <span className={`text-6xl font-black tracking-tighter ${remainingBudget < 0 ? 'text-amber-400' : 'text-white'} ${isPrivacyMode ? 'blur-md select-none' : ''}`}>
              {isPrivacyMode ? '99,999' : Math.abs(Math.round(remainingBudget)).toLocaleString()}
            </span>
          </div>

          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border ${currentSurplus >= 0 ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'}`}>
            {currentSurplus >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>
              {currentSurplus > 0 ? '+' : ''}{isPrivacyMode ? '***' : Math.round(currentSurplus).toLocaleString()} vs. Ideal
            </span>
          </div>
        </div>
      </div>

      {/* Empty State: Nudge to Add First Transaction */}
      {!hasActivity && (
        <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-blue-200 dark:border-blue-900/30 rounded-3xl p-6 text-center">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <span className="text-2xl">👇</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">¡Estrena tu mes!</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-0">
            Toca el botón <span className="font-bold text-black dark:text-white">+</span> para registrar tu primer gasto.
          </p>
        </div>
      )}

      {/* 3. Status Band (Refined) */}
      {hasActivity && (
        <div className={`rounded-3xl p-5 flex items-center gap-5 border transition-all duration-500 shadow-sm bg-white dark:bg-slate-900
        ${isOverspending ? 'border-orange-100 dark:border-orange-900/30' : currentSurplus > (totalDisposableIncome * 0.1) ? 'border-green-100 dark:border-green-900/30' : 'border-gray-100 dark:border-slate-800'}`}
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner
          ${isOverspending ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-500' : currentSurplus > (totalDisposableIncome * 0.1) ? 'bg-green-50 dark:bg-green-950/30 text-green-500' : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-400'}`}
          >
            {isOverspending ? <AlertTriangle size={24} /> : currentSurplus > (totalDisposableIncome * 0.1) ? <Sparkles size={24} /> : <CheckCircle2 size={24} />}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 dark:text-white text-base mb-0.5">
              {isOverspending ? 'Ajusta el ritmo' : currentSurplus > (totalDisposableIncome * 0.1) ? '¡Vas excelente!' : 'Todo bajo control'}
            </h3>
            <p className="text-xs text-gray-700 dark:text-slate-400 font-medium leading-relaxed">
              {isOverspending
                ? 'Trata de reducir gastos variables hoy.'
                : currentSurplus > (totalDisposableIncome * 0.1)
                  ? 'Estás ahorrando más de lo planeado.'
                  : 'Tus gastos están alineados con tu meta.'}
            </p>
          </div>
        </div>
      )}

      {/* 3.5 Active Installments (BNPL) Section */}
      {activeInstallments.length > 0 && (
        <div className="px-1">
          <h3 className="text-[10px] font-black text-gray-600 dark:text-slate-500 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
            Plazos Activos
          </h3>
          <div className="space-y-3">
            {activeInstallments.map((inst) => {
              const progress = (inst.currentInstallment / (inst.totalInstallments || 1)) * 100;
              return (
                <div key={inst.id} className="bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col gap-3 relative overflow-hidden group">
                  {/* Progress Background Hint */}
                  <div className="absolute left-0 bottom-0 h-1 bg-indigo-50 dark:bg-indigo-900/20 transition-all duration-1000 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40" style={{ width: `${progress}%` }}></div>

                  <div className="flex justify-between items-start z-10">
                    <div>
                      <span className="block font-bold text-gray-900 dark:text-white text-sm mb-1">{inst.description}</span>
                      <span className="text-[10px] font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wider bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded-md inline-block">
                        {currency === 'EUR' ? '€' : '$'}{inst.amount.toLocaleString()}/mes
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-indigo-600 dark:text-indigo-400 font-black text-xl">{inst.remaining}</span>
                      <span className="text-[9px] text-gray-600 dark:text-slate-500 font-bold uppercase">Restantes</span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden relative z-10">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-1000"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex justify-between z-10">
                    <p className="text-[10px] text-gray-600 dark:text-slate-500 font-medium">Cuota {inst.currentInstallment} de {inst.totalInstallments}</p>
                    {progress > 80 && <p className="text-[10px] text-green-500 dark:text-green-400 font-bold">¡Casi terminas!</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 4. Shortcuts Grid (Premium) */}
      <div className="px-1">
        <h3 className="text-[10px] font-black text-gray-600 dark:text-slate-500 uppercase tracking-[0.15em] mb-4">Accesos Directos</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onNavigate('budget')}
            className="bg-white dark:bg-slate-900 p-5 rounded-[28px] shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col items-start justify-between h-36 active:scale-95 transition-all hover:border-blue-200 dark:hover:border-blue-500/50 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 group-hover:bg-blue-600 dark:group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <Wallet size={24} />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-sm">Ver Presupuesto</p>
              <p className="text-[10px] text-gray-600 dark:text-slate-500 font-bold mt-1 uppercase tracking-wider">Detalles</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('insights')}
            className="bg-white dark:bg-slate-900 p-5 rounded-[28px] shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col items-start justify-between h-36 active:scale-95 transition-all hover:border-purple-200 dark:hover:border-purple-500/50 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4 group-hover:bg-purple-600 dark:group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <Sparkles size={24} />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-sm">Asistente IA</p>
              <p className="text-[10px] text-gray-600 dark:text-slate-500 font-bold mt-1 uppercase tracking-wider">Análisis</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;