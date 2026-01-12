import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { TransactionType, RecurringItem } from '../types';
import Card from '../components/Card';
import {
  Trash2,
  Edit2,
  Plus,
  CheckCircle2,
  X,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Tag,
  ChevronDown
} from 'lucide-react';

// Category color mappings for badges
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Vivienda': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Servicios': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  'Transporte': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  'Suscripciones': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Seguros': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  'Educación': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'Salud': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  'Otros': { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
};

const EXPENSE_CATEGORIES = ['Vivienda', 'Servicios', 'Transporte', 'Suscripciones', 'Seguros', 'Educación', 'Salud', 'Otros'];
const INCOME_CATEGORIES = ['Salario', 'Freelance', 'Inversiones', 'Alquiler', 'Otros'];

const Planning: React.FC = () => {
  const {
    recurringItems,
    addRecurringItem,
    deleteRecurringItem,
    currentSavingsGoal,
    setSavingsGoal
  } = useFinance();

  const [localSavings, setLocalSavings] = useState(currentSavingsGoal.toString());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>(TransactionType.INCOME);
  const [editingItem, setEditingItem] = useState<RecurringItem | null>(null);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    setLocalSavings(currentSavingsGoal.toString());
  }, [currentSavingsGoal]);

  const incomes = recurringItems.filter(i => i.type === TransactionType.INCOME);
  const expenses = recurringItems.filter(i => i.type === TransactionType.EXPENSE);
  const totalFixedIncome = incomes.reduce((a, c) => a + c.amount, 0);
  const totalFixedExpenses = expenses.reduce((a, c) => a + c.amount, 0);
  const currentSavingsValue = parseFloat(localSavings) || 0;
  const freeMoney = totalFixedIncome - totalFixedExpenses - currentSavingsValue;

  const handleSavingsBlur = () => {
    const val = parseFloat(localSavings);
    if (!isNaN(val)) setSavingsGoal(val);
    else setLocalSavings(currentSavingsGoal.toString());
  };

  const openModal = (type: TransactionType, item?: RecurringItem) => {
    setModalType(type);
    if (item) {
      setEditingItem(item);
      setDesc(item.description);
      setAmount(item.amount.toString());
      setCategory(item.category || '');
    } else {
      setEditingItem(null);
      setDesc('');
      setAmount('');
      setCategory('');
    }
    setIsModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount) return;
    const val = parseFloat(amount);
    if (isNaN(val)) return;

    if (editingItem) deleteRecurringItem(editingItem.id);

    addRecurringItem({
      description: desc,
      amount: val,
      type: modalType,
      category: category || undefined,
    });
    setIsModalOpen(false);
    setCategory('');
  };

  return (
    <div className="animate-in pt-2">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Planificación</h1>
        <p className="text-gray-700 dark:text-slate-400 text-sm font-medium">Diseña tu mes ideal</p>
      </header>

      {/* 1. Dashboard Math Panel */}
      <div className="bg-gray-900 rounded-3xl p-6 text-white shadow-xl shadow-gray-900/10 mb-8 relative overflow-hidden">
        {/* Background accent to match Dashboard style */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500 rounded-full blur-[50px] opacity-20"></div>

        <div className="relative z-10 pb-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest mb-1">Resultado Final</p>
              <h2 className={`text-4xl font-bold tracking-tight ${freeMoney < 0 ? 'text-red-400' : 'text-white'}`}>
                ${freeMoney.toLocaleString()}
              </h2>
              <p className="text-gray-600 text-xs font-medium mt-1">Disponible para gastar (Variable)</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-sm">
              <CheckCircle2 className={freeMoney < 0 ? 'text-red-400' : 'text-green-400'} size={24} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/5 rounded-2xl p-3 border border-white/5 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="bg-green-500/20 p-1 rounded-full">
                  <TrendingUp size={12} className="text-green-400" />
                </div>
                <span className="text-xs text-white/90 font-bold">Ingresos</span>
              </div>
              <span className="text-lg font-bold text-white">+${totalFixedIncome.toLocaleString()}</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 border border-white/5 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="bg-red-500/20 p-1 rounded-full">
                  <TrendingDown size={12} className="text-red-400" />
                </div>
                <span className="text-xs text-white/90 font-bold">Fijos</span>
              </div>
              <span className="text-lg font-bold text-white">-${totalFixedExpenses.toLocaleString()}</span>
            </div>
          </div>

          {/* Savings Input inside dark card */}
          <div className="bg-blue-600/20 rounded-2xl p-4 border border-blue-500/30 flex items-center justify-between backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 p-1.5 rounded-lg">
                <PiggyBank size={18} className="text-blue-300" />
              </div>
              <span className="text-sm text-white font-bold tracking-wide">Meta Ahorro</span>
            </div>
            <div className="flex items-center gap-1 bg-black/20 px-3 py-1.5 rounded-xl border border-white/5">
              <span className="text-blue-300 text-sm font-bold">$</span>
              <input
                type="number"
                value={localSavings}
                onChange={(e) => setLocalSavings(e.target.value)}
                onBlur={handleSavingsBlur}
                className="w-20 text-right font-bold text-white bg-transparent focus:outline-none placeholder-white/30"
                placeholder="0"
                inputMode="decimal"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Lists */}
      <div className="space-y-8">
        <div>
          <div className="flex justify-between items-end mb-3 px-2">
            <h3 className="text-xs font-extrabold text-gray-700 dark:text-slate-500 uppercase tracking-widest">Ingresos Fijos</h3>
            <button onClick={() => openModal(TransactionType.INCOME)} className="text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
              <Plus size={12} strokeWidth={3} /> Agregar
            </button>
          </div>
          <div className="space-y-3">
            {incomes.map(item => {
              const catColors = CATEGORY_COLORS[item.category || 'Otros'] || CATEGORY_COLORS['Otros'];
              return (
                <div key={item.id} onClick={() => openModal(TransactionType.INCOME, item)} className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-200 dark:border-slate-800 flex justify-between items-center shadow-sm active:scale-[0.99] transition-transform cursor-pointer hover:border-green-200 dark:hover:border-green-500/50 group">
                  <div className="flex flex-col gap-1">
                    <p className="font-bold text-gray-900 dark:text-white group-hover:text-green-800 dark:group-hover:text-green-400 transition-colors">{item.description}</p>
                    {item.category && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${catColors.bg} ${catColors.text} ${catColors.border} dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 border w-fit`}>
                        {item.category}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg text-sm">+${item.amount.toLocaleString()}</span>
                </div>
              )
            })}
            {incomes.length === 0 && (
              <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                <p className="text-gray-600 text-xs font-bold">Sin ingresos registrados</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-end mb-3 px-2">
            <h3 className="text-xs font-extrabold text-gray-700 dark:text-slate-500 uppercase tracking-widest">Gastos Fijos</h3>
            <button onClick={() => openModal(TransactionType.EXPENSE)} className="text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
              <Plus size={12} strokeWidth={3} /> Agregar
            </button>
          </div>
          <div className="space-y-3">
            {expenses.map(item => {
              const catColors = CATEGORY_COLORS[item.category || 'Otros'] || CATEGORY_COLORS['Otros'];
              return (
                <div key={item.id} onClick={() => openModal(TransactionType.EXPENSE, item)} className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-200 dark:border-slate-800 flex justify-between items-center shadow-sm active:scale-[0.99] transition-transform cursor-pointer hover:border-red-200 dark:hover:border-red-500/50 group">
                  <div className="flex flex-col gap-1">
                    <p className="font-bold text-gray-900 dark:text-white group-hover:text-red-800 dark:group-hover:text-red-400 transition-colors">{item.description}</p>
                    {item.category && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${catColors.bg} ${catColors.text} ${catColors.border} dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 border w-fit`}>
                        {item.category}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-gray-900 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-sm">${item.amount.toLocaleString()}</span>
                </div>
              )
            })}
            {expenses.length === 0 && (
              <div className="text-center py-6 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-3xl bg-gray-50/50 dark:bg-slate-900/50">
                <p className="text-gray-600 dark:text-slate-500 text-xs font-bold">Sin gastos fijos registrados</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6 pb-safe pointer-events-auto shadow-2xl transform transition-transform animate-in m-0 sm:m-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingItem ? 'Editar' : 'Nuevo'} {modalType === TransactionType.INCOME ? 'Ingreso' : 'Gasto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} aria-label="Cerrar modal" className="bg-gray-100 dark:bg-slate-800 p-2 rounded-full text-gray-700 dark:text-slate-400">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-5">
              <input
                type="text"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="Descripción (ej. Netflix)"
                className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 text-gray-900 dark:text-white"
                autoFocus
              />
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 dark:text-slate-500 font-bold">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-4 pl-8 bg-gray-50 dark:bg-slate-800 rounded-2xl font-bold text-lg focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 text-gray-900 dark:text-white"
                  inputMode="decimal"
                />
              </div>

              {/* Category Selector */}
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Tag size={14} className="text-gray-600 dark:text-slate-500" />
                  <span className="text-sm font-semibold text-gray-600 dark:text-slate-400">Categoría (opcional)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(modalType === TransactionType.EXPENSE ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => {
                    const catColors = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Otros'];
                    const isSelected = category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(isSelected ? '' : cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${isSelected
                          ? `${catColors.bg} ${catColors.text} ${catColors.border} dark:bg-slate-800 dark:text-white dark:border-white/20 ring-2 ring-offset-1 ring-gray-300 dark:ring-slate-700`
                          : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button
                type="submit"
                className={`w-full py-4 rounded-2xl font-bold text-white text-lg shadow-lg active:scale-95 transition-transform 
                        ${modalType === TransactionType.INCOME ? 'bg-green-600 shadow-green-200' : 'bg-red-600 shadow-red-200'}`}
              >
                Guardar
              </button>
              {editingItem && (
                <button
                  type="button"
                  onClick={() => { deleteRecurringItem(editingItem.id); setIsModalOpen(false); }}
                  className="w-full py-3 text-red-500 font-semibold text-sm"
                >
                  Eliminar Elemento
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Planning;