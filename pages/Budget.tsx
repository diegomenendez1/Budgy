import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { TransactionType } from '../types';
import { 
  ChevronDown, 
  ChevronUp, 
  RefreshCcw, 
  Edit3, 
  Trash2, 
  ShoppingBag, 
  Coffee, 
  Car, 
  Home, 
  Zap, 
  MoreHorizontal, 
  X, 
  Calendar as CalendarIcon, 
  DollarSign 
} from 'lucide-react';

const Budget: React.FC = () => {
  const { 
    activeCycle,
    createCycle,
    cycleMetrics,
    weeklyBreakdown, 
    currentWeekStatus,
    transactions, 
    deleteTransaction,
    currentSavingsGoal,
    setSavingsGoal,
    totalDisposableIncome
  } = useFinance();

  const [showWeeklyDetail, setShowWeeklyDetail] = useState(false);
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  
  // Cycle Modal State
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [initialBudgetInput, setInitialBudgetInput] = useState('');

  const currentWeekRef = useRef<HTMLDivElement>(null);

  // Helper to open modal and initialize budget with current planning value
  const handleOpenCycleModal = () => {
    // UX Improvement: If value is 0, keep empty to show placeholder. If > 0, show value.
    const initialValue = totalDisposableIncome > 0 ? totalDisposableIncome.toString() : '';
    setInitialBudgetInput(initialValue);
    setIsCycleModalOpen(true);
  };

  // Filter transactions for display
  const displayTransactions = activeCycle ? transactions.filter(t => {
      const d = new Date(t.date);
      const start = new Date(activeCycle.startDate);
      const end = new Date(activeCycle.endDate);
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
      return d >= start && d <= end;
  }) : [];

  // Modern progress bar logic
  let progressBarColor = 'bg-gray-900';
  const percentageOfBudget = activeCycle ? (cycleMetrics.spentThisCycle / activeCycle.initialBudget) * 100 : 0;
  
  if (percentageOfBudget >= 80) progressBarColor = 'bg-orange-500';
  if (percentageOfBudget >= 100) progressBarColor = 'bg-red-500';

  const handleEditSavings = () => {
    const newGoal = prompt("Define tu meta de ahorro para este ciclo:", currentSavingsGoal.toString());
    if (newGoal !== null && !isNaN(parseFloat(newGoal))) {
      setSavingsGoal(parseFloat(newGoal));
    }
  };

  const handleCreateCycle = () => {
    // Construct end date: Last day of selected month
    const endDate = new Date(selectedYear, selectedMonth + 1, 0); // Day 0 of next month is last day of current
    
    if (endDate < new Date()) {
        alert("La fecha de fin no puede ser anterior a hoy.");
        return;
    }

    // UX Improvement: Treat empty input as 0
    let budgetAmount = parseFloat(initialBudgetInput);
    if (initialBudgetInput.trim() === '') {
        budgetAmount = 0;
    }

    if (isNaN(budgetAmount)) {
        alert("Por favor ingresa un monto válido.");
        return;
    }

    createCycle(endDate, budgetAmount);
    setIsCycleModalOpen(false);
  };

  const toggleTxExpand = (id: string) => {
    setExpandedTxId(prev => prev === id ? null : id);
  };

  useEffect(() => {
    if (showWeeklyDetail && currentWeekRef.current) {
      setTimeout(() => {
        currentWeekRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  }, [showWeeklyDetail]);

  const getCategoryIcon = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('comida') || c.includes('restaurante')) return <Coffee size={20} />;
    if (c.includes('transporte') || c.includes('auto')) return <Car size={20} />;
    if (c.includes('casa') || c.includes('hogar')) return <Home size={20} />;
    if (c.includes('servicios') || c.includes('luz')) return <Zap size={20} />;
    return <ShoppingBag size={20} />;
  };

  // Generate Year Options
  const years = [new Date().getFullYear(), new Date().getFullYear() + 1];
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const ModalContent = () => (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCycleModalOpen(false)} />
        <div className="bg-white w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6 pb-safe pointer-events-auto shadow-2xl transform transition-transform animate-in m-0 sm:m-4 relative z-10">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Nuevo Ciclo</h3>
                <button onClick={() => setIsCycleModalOpen(false)} className="bg-gray-100 p-2 rounded-full text-gray-500">
                    <X size={20} />
                </button>
            </div>
            
            <p className="text-gray-500 text-sm mb-6">
                El ciclo comenzará hoy. Configura cuándo termina y tu presupuesto inicial.
            </p>

            <div className="space-y-6 mb-8">
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Mes de Cierre</label>
                    <div className="grid grid-cols-3 gap-2">
                        {months.map((m, i) => (
                            <button 
                                key={m}
                                onClick={() => setSelectedMonth(i)}
                                className={`py-2 rounded-xl text-xs font-bold transition-all ${selectedMonth === i ? 'bg-black text-white' : 'bg-gray-50 text-gray-600'}`}
                            >
                                {m.slice(0,3)}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                     <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Año</label>
                     <div className="flex gap-2">
                        {years.map(y => (
                            <button
                                key={y}
                                onClick={() => setSelectedYear(y)}
                                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${selectedYear === y ? 'bg-black text-white' : 'bg-gray-50 text-gray-600'}`}
                            >
                                {y}
                            </button>
                        ))}
                     </div>
                </div>

                {/* Initial Budget Input */}
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Presupuesto Inicial</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                        <input 
                            type="number"
                            value={initialBudgetInput}
                            onChange={(e) => setInitialBudgetInput(e.target.value)}
                            onFocus={(e) => e.target.select()} // Auto-select for easy editing
                            className="w-full bg-gray-50 rounded-2xl p-4 pl-8 text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10"
                            placeholder="0"
                            inputMode="decimal"
                        />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 ml-1">
                        Sugerido según tu Planificación (${totalDisposableIncome.toLocaleString()}). Puedes editarlo si tienes saldo anterior.
                    </p>
                </div>
            </div>

            <button 
                onClick={handleCreateCycle}
                className="w-full bg-ios-blue text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all text-lg"
            >
                Confirmar e Iniciar
            </button>
        </div>
    </div>
  );

  if (!activeCycle) {
      return (
          <>
            <div className="flex flex-col items-center justify-center h-[70vh] text-center px-6">
                <div className="bg-gray-100 p-4 rounded-full mb-4 text-gray-400">
                    <RefreshCcw size={32} />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Sin Ciclo Activo</h2>
                <p className="text-gray-500 text-sm mb-6">Comienza un nuevo ciclo para rastrear tus gastos y metas.</p>
                <button 
                  onClick={handleOpenCycleModal}
                  className="bg-black text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-gray-200 active:scale-95 transition-transform"
                >
                    Iniciar Nuevo Ciclo
                </button>
            </div>
            {isCycleModalOpen && <ModalContent />}
          </>
      );
  }

  return (
    <div className="animate-in space-y-6 pt-2">
      
      {/* 1. Main Cycle Card */}
      <div className="bg-white rounded-[32px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 relative overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <div>
              <h2 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Dinero disponible este ciclo</h2>
              <p className="text-gray-300 text-[10px] font-medium mt-0.5">
                  {activeCycle?.name}
              </p>
          </div>
          <button onClick={handleOpenCycleModal} className="p-2 -mr-2 text-gray-300 hover:text-gray-900 transition-colors bg-gray-50 rounded-full">
            <RefreshCcw size={16} />
          </button>
        </div>

        <div className="flex flex-col items-center mb-8">
          <span className={`text-5xl font-extrabold tracking-tighter mb-2 ${cycleMetrics.remainingBudget < 0 ? 'text-amber-500' : 'text-gray-900'}`}>
            ${cycleMetrics.remainingBudget.toLocaleString()}
          </span>
          <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-semibold text-gray-500">
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

        <div className="flex justify-between text-[11px] font-bold uppercase text-gray-400 mb-8 tracking-wide">
          <span>Gastado ${cycleMetrics.spentThisCycle.toLocaleString()}</span>
          <span>Total ${activeCycle?.initialBudget.toLocaleString()}</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className={`rounded-2xl p-4 border ${currentWeekStatus && currentWeekStatus.remaining < 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-transparent'}`}>
            <span className={`text-xs font-bold uppercase block mb-1 ${currentWeekStatus && currentWeekStatus.remaining < 0 ? 'text-red-400' : 'text-gray-400'}`}>Semana Actual</span>
            <span className={`text-xl font-bold tracking-tight ${currentWeekStatus && currentWeekStatus.remaining < 0 ? 'text-red-600' : 'text-gray-900'}`}>
              ${currentWeekStatus ? currentWeekStatus.remaining.toLocaleString() : '0'}
            </span>
          </div>
          <div 
            onClick={handleEditSavings}
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

      {/* 2. Weekly Accordion */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all">
        <button 
          onClick={() => setShowWeeklyDetail(!showWeeklyDetail)}
          className="w-full p-5 flex justify-between items-center bg-white active:bg-gray-50"
        >
          <span className="font-bold text-gray-900 text-[15px]">Desglose Semanal</span>
          {showWeeklyDetail ? <ChevronUp size={20} className="text-gray-400"/> : <ChevronDown size={20} className="text-gray-400"/>}
        </button>
        
        {showWeeklyDetail && (
          <div className="px-5 pb-5 space-y-2">
            {weeklyBreakdown.map((week) => (
              <div 
                key={week.weekNumber} 
                ref={week.isCurrent ? currentWeekRef : null}
                className={`p-3 rounded-2xl flex justify-between items-center transition-colors ${week.isCurrent ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-50 text-gray-600'}`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold uppercase ${week.isCurrent ? 'text-blue-100' : 'text-gray-400'}`}>
                      {week.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                      <p className={`text-[10px] font-medium ${week.isCurrent ? 'text-blue-200' : 'text-gray-400'}`}>
                        {new Date(week.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - {new Date(week.endDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </p>
                      <p className={`text-[10px] font-medium ${week.isCurrent ? 'text-blue-200' : 'text-gray-400'}`}>
                         • Sugerido: ${Math.round(week.limit).toLocaleString()}
                      </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${week.remaining < 0 && !week.isCurrent ? 'text-red-500' : ''}`}>
                    ${week.remaining.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Transaction List */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Movimientos</h3>

        <div className="space-y-3 pb-4">
          {displayTransactions.length === 0 ? (
             <div className="text-center py-12 px-6 bg-white rounded-3xl border border-dashed border-gray-200">
               <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                 <MoreHorizontal size={32} />
               </div>
               <p className="text-gray-900 font-semibold text-sm">Sin movimientos en este ciclo</p>
               <button onClick={handleOpenCycleModal} className="text-xs text-blue-500 mt-2 font-bold">
                   Asegúrate de tener un ciclo activo
               </button>
             </div>
          ) : (
            displayTransactions
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((t) => (
              <div key={t.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div 
                  onClick={() => toggleTxExpand(t.id)}
                  className="p-4 flex items-center justify-between active:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 
                      ${t.type === TransactionType.INCOME ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      {t.type === TransactionType.INCOME ? <RefreshCcw size={22} /> : getCategoryIcon(t.category)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-[15px] truncate">
                        {t.description || 'Sin descripción'}
                      </p>
                      <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mt-0.5">
                        {new Date(t.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                        {t.isExceptional && (
                          <span className="flex items-center gap-0.5 text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                             Excepcional
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className={`font-bold text-[15px] whitespace-nowrap tabular-nums ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-gray-900'}`}>
                    {t.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toLocaleString()}
                  </span>
                </div>

                {expandedTxId === t.id && (
                  <div className="bg-gray-50 px-4 py-3 flex justify-end gap-3 border-t border-gray-100 animate-in">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        // Eliminamos window.confirm para evitar bloqueos en mobile.
                        // La accion es inmediata y fluida.
                        deleteTransaction(t.id); 
                      }}
                      className="flex items-center gap-2 text-xs font-bold text-red-600 bg-white border border-gray-200 px-4 py-2.5 rounded-xl hover:bg-red-50 shadow-sm active:scale-95 transition-transform"
                    >
                      <Trash2 size={14} /> Eliminar
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      
      {isCycleModalOpen && <ModalContent />}
    </div>
  );
};

export default Budget;