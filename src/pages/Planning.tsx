import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { TransactionType, RecurringItem } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Trash2,
  Plus,
  CheckCircle2,
  X,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Tag,
} from 'lucide-react';

// Category color mappings for badges
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Vivienda': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  'Servicios': { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
  'Transporte': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  'Suscripciones': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  'Seguros': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  'Educación': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
  'Salud': { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' },
  'Otros': { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
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
    <div className="animate-in pt-6 pb-24 space-y-8">
      <header className="px-4">
        <h1 className="text-3xl font-black text-white tracking-tight">Planificación</h1>
        <p className="text-indigo-200 text-sm font-medium">Diseña tu mes ideal</p>
      </header>

      {/* 1. Dashboard Math Panel */}
      <Card className="mx-4 relative overflow-hidden bg-gradient-to-br from-indigo-900 to-purple-900 border-white/10 shadow-2xl">
        {/* Background accent */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-blue-500 rounded-full blur-[60px] opacity-30"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-purple-500 rounded-full blur-[60px] opacity-20"></div>

        <div className="p-6 relative z-10">
          <div className="flex justify-between items-center mb-8">
            <div>
              <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1">Resultado Final</p>
              <h2 className={`text-4xl font-black tracking-tighter ${freeMoney < 0 ? 'text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]' : 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]'}`}>
                ${freeMoney.toLocaleString()}
              </h2>
              <p className="text-indigo-200 text-xs font-bold mt-1">Disponible (Variable)</p>
            </div>
            <div className={`h-12 w-12 rounded-full border backdrop-blur-md flex items-center justify-center shadow-lg ${freeMoney < 0 ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-green-500/20 border-green-500/30 text-green-400'}`}>
              <CheckCircle2 size={24} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-emerald-500/20 p-1.5 rounded-full">
                  <TrendingUp size={12} className="text-emerald-400" />
                </div>
                <span className="text-xs text-white/90 font-bold uppercase tracking-wide">Ingresos</span>
              </div>
              <span className="text-xl font-black text-white">+${totalFixedIncome.toLocaleString()}</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-red-500/20 p-1.5 rounded-full">
                  <TrendingDown size={12} className="text-red-400" />
                </div>
                <span className="text-xs text-white/90 font-bold uppercase tracking-wide">Fijos</span>
              </div>
              <span className="text-xl font-black text-white">-${totalFixedExpenses.toLocaleString()}</span>
            </div>
          </div>

          {/* Savings Input */}
          <div className="bg-black/20 rounded-2xl p-4 border border-white/5 flex items-center justify-between backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 p-2 rounded-xl border border-blue-500/10">
                <PiggyBank size={18} className="text-blue-300" />
              </div>
              <span className="text-sm text-white font-bold tracking-wide">Meta Ahorro</span>
            </div>
            <div className="flex items-center gap-1 bg-white/5 px-4 py-2 rounded-xl border border-white/10 shadow-inner group focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
              <span className="text-blue-300 text-sm font-bold">$</span>
              <input
                type="number"
                value={localSavings}
                onChange={(e) => setLocalSavings(e.target.value)}
                onBlur={handleSavingsBlur}
                className="w-20 text-right font-bold text-white bg-transparent focus:outline-none placeholder-white/20"
                placeholder="0"
                inputMode="decimal"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Lists */}
      <div className="space-y-8 px-4">
        {/* Incomes */}
        <div>
          <div className="flex justify-between items-end mb-4 px-1">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Ingresos Fijos</h3>
            <Button
              size="sm"
              variant="glass"
              onClick={() => openModal(TransactionType.INCOME)}
              className="h-8 text-[10px] uppercase tracking-wider bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20"
            >
              <Plus size={12} strokeWidth={3} className="mr-1" /> Agregar
            </Button>
          </div>
          <div className="space-y-3">
            {incomes.map(item => {
              const catColors = CATEGORY_COLORS[item.category || 'Otros'] || CATEGORY_COLORS['Otros'];
              return (
                <div key={item.id} onClick={() => openModal(TransactionType.INCOME, item)} className="bg-white/5 backdrop-blur-sm p-4 rounded-[1.5rem] border border-white/10 flex justify-between items-center shadow-sm active:scale-[0.98] transition-all cursor-pointer hover:bg-white/10 group">
                  <div className="flex flex-col gap-1.5">
                    <p className="font-bold text-white group-hover:text-emerald-300 transition-colors">{item.description}</p>
                    {item.category && (
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${catColors.bg} ${catColors.text} ${catColors.border} border w-fit`}>
                        {item.category}
                      </span>
                    )}
                  </div>
                  <span className="font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl text-sm border border-emerald-500/10 shadow-inner">+${item.amount.toLocaleString()}</span>
                </div>
              )
            })}
            {incomes.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-[2rem] bg-white/5 backdrop-blur-sm">
                <p className="text-gray-500 text-xs font-bold">Sin ingresos registrados</p>
              </div>
            )}
          </div>
        </div>

        {/* Expenses */}
        <div>
          <div className="flex justify-between items-end mb-4 px-1">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Gastos Fijos</h3>
            <Button
              size="sm"
              variant="glass"
              onClick={() => openModal(TransactionType.EXPENSE)}
              className="h-8 text-[10px] uppercase tracking-wider bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20"
            >
              <Plus size={12} strokeWidth={3} className="mr-1" /> Agregar
            </Button>
          </div>
          <div className="space-y-3">
            {expenses.map(item => {
              const catColors = CATEGORY_COLORS[item.category || 'Otros'] || CATEGORY_COLORS['Otros'];
              return (
                <div key={item.id} onClick={() => openModal(TransactionType.EXPENSE, item)} className="bg-white/5 backdrop-blur-sm p-4 rounded-[1.5rem] border border-white/10 flex justify-between items-center shadow-sm active:scale-[0.98] transition-all cursor-pointer hover:bg-white/10 group">
                  <div className="flex flex-col gap-1.5">
                    <p className="font-bold text-white group-hover:text-red-300 transition-colors">{item.description}</p>
                    {item.category && (
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${catColors.bg} ${catColors.text} ${catColors.border} border w-fit`}>
                        {item.category}
                      </span>
                    )}
                  </div>
                  <span className="font-black text-white/90 bg-white/5 px-3 py-1 rounded-xl text-sm border border-white/10 shadow-inner">${item.amount.toLocaleString()}</span>
                </div>
              )
            })}
            {expenses.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-[2rem] bg-white/5 backdrop-blur-sm">
                <p className="text-gray-500 text-xs font-bold">Sin gastos fijos registrados</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setIsModalOpen(false)} />
          <div className="bg-[#1c1c1e] w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6 pb-safe pointer-events-auto shadow-2xl transform transition-transform animate-in slide-in-from-bottom duration-300 m-0 sm:m-4 border border-white/10 relative">

            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-white tracking-tight">
                {editingItem ? 'Editar' : 'Nuevo'} {modalType === TransactionType.INCOME ? 'Ingreso' : 'Gasto'}
              </h3>
              <Button onClick={() => setIsModalOpen(false)} variant="glass" size="icon" className="rounded-full w-10 h-10">
                <X size={20} />
              </Button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Descripción</label>
                <Input
                  type="text"
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  placeholder="Ej. Netflix"
                  autoFocus
                  className="h-14 text-lg font-semibold bg-white/5 border-white/10 focus:border-indigo-500/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Monto Mensual</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                  <Input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-8 h-14 text-lg font-bold bg-white/5 border-white/10 focus:border-indigo-500/50"
                    inputMode="decimal"
                  />
                </div>
              </div>

              {/* Category Selector */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-gray-400" />
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Categoría (opcional)</span>
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
                        className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all ${isSelected
                          ? `${catColors.bg} ${catColors.text} ${catColors.border} ring-2 ring-offset-1 ring-offset-[#1c1c1e] ring-indigo-500`
                          : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <Button
                  type="submit"
                  className={`w-full h-14 text-lg font-bold ${modalType === TransactionType.INCOME ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'}`}
                >
                  Guardar
                </Button>

                {editingItem && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => { deleteRecurringItem(editingItem.id); setIsModalOpen(false); }}
                    className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 size={16} className="mr-2" /> Eliminar Elemento
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Planning;