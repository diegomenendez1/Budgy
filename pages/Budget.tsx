import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { TransactionType } from '../types';
import { 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  RefreshCcw, 
  Edit3, 
  Trash2, 
  ShoppingBag,
  Coffee,
  Car,
  Home,
  Zap,
  MoreHorizontal,
  PiggyBank
} from 'lucide-react';

const Budget: React.FC = () => {
  const { 
    totalDisposableIncome, 
    currentBalance, 
    spentThisCycle, 
    savingsGoal, 
    weeklyBreakdown, 
    currentWeekStatus,
    transactions,
    deleteTransaction,
    setSavingsGoal,
    startNewCycle
  } = useFinance();

  const [showWeeklyDetail, setShowWeeklyDetail] = useState(false);
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const currentWeekRef = useRef<HTMLDivElement>(null);

  const effectiveTotalBudget = totalDisposableIncome - savingsGoal;
  const spendPercentage = effectiveTotalBudget > 0 
    ? (spentThisCycle / effectiveTotalBudget) * 100 
    : 0;

  // Modern progress bar colors
  let progressBarColor = 'bg-gray-900';
  if (spendPercentage >= 80) progressBarColor = 'bg-orange-500';
  if (spendPercentage >= 100) progressBarColor = 'bg-red-500';

  const handleEditSavings = () => {
    const newGoal = prompt("Define tu meta de ahorro para este ciclo:", savingsGoal.toString());
    if (newGoal !== null && !isNaN(parseFloat(newGoal))) {
      setSavingsGoal(parseFloat(newGoal));
    }
  };

  const handleNewCycle = () => {
    if (window.confirm("¿Estás seguro de iniciar un nuevo ciclo?")) {
      startNewCycle();
    }
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

  return (
    <div className="animate-in space-y-6 pt-2">
      
      {/* 1. Main Cycle Card */}
      <div className="bg-white rounded-[32px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 relative overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Presupuesto Activo</h2>
          <button onClick={handleNewCycle} className="p-2 -mr-2 text-gray-300 hover:text-gray-900 transition-colors bg-gray-50 rounded-full">
            <RefreshCcw size={16} />
          </button>
        </div>

        <div className="flex flex-col items-center mb-8">
          <span className={`text-5xl font-extrabold tracking-tighter mb-2 ${currentBalance < 0 ? 'text-red-500' : 'text-gray-900'}`}>
            ${currentBalance.toLocaleString()}
          </span>
          <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-semibold text-gray-500">
            Restante del ciclo
          </span>
        </div>

        {/* Custom Progress Bar */}
        <div className="relative h-4 bg-gray-100 rounded-full mb-3 overflow-hidden">
          <div 
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${progressBarColor}`} 
            style={{ width: `${Math.min(spendPercentage, 100)}%` }}
          />
        </div>

        <div className="flex justify-between text-[11px] font-bold uppercase text-gray-400 mb-8 tracking-wide">
          <span>Gastado ${spentThisCycle.toLocaleString()}</span>
          <span>Límite ${effectiveTotalBudget.toLocaleString()}</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-2xl p-4">
            <span className="text-xs text-gray-400 font-bold uppercase block mb-1">Semana Actual</span>
            <span className={`text-xl font-bold tracking-tight ${currentWeekStatus && currentWeekStatus.remaining < 0 ? 'text-orange-600' : 'text-gray-900'}`}>
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
              ${savingsGoal.toLocaleString()}
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
                      Semana {week.weekNumber}
                    </span>
                  </div>
                  <p className={`text-[10px] mt-0.5 font-medium ${week.isCurrent ? 'text-blue-200' : 'text-gray-400'}`}>
                    {new Date(week.startDate).getDate()} - {new Date(week.endDate).getDate()} {new Date(week.endDate).toLocaleDateString('es-ES', { month: 'short' })}
                  </p>
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
          {transactions.length === 0 ? (
             <div className="text-center py-12 px-6 bg-white rounded-3xl border border-dashed border-gray-200">
               <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                 <MoreHorizontal size={32} />
               </div>
               <p className="text-gray-900 font-semibold text-sm">Sin movimientos recientes</p>
               <p className="text-xs text-gray-400 mt-1 max-w-[200px] mx-auto">Tus transacciones de este ciclo aparecerán aquí.</p>
             </div>
          ) : (
            transactions
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
                      onClick={(e) => { e.stopPropagation(); if(window.confirm('¿Borrar?')) deleteTransaction(t.id); }}
                      className="flex items-center gap-2 text-xs font-bold text-red-600 bg-white border border-gray-200 px-4 py-2.5 rounded-xl hover:bg-red-50 shadow-sm"
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
    </div>
  );
};

export default Budget;