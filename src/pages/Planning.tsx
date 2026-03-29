import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { TransactionType, RecurringItem } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Trash2, Plus, CheckCircle2, X, TrendingUp, TrendingDown, PiggyBank, Tag, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { cn } from '../lib/utils';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Vivienda': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Servicios': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Transporte': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  'Suscripciones': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Seguros': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  'Educacion': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'Salud': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  'Otros': { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
};

const INCOME_CATEGORIES = ['Salario', 'Freelance', 'Inversiones', 'Alquiler', 'Otros'];

const Planning: React.FC = () => {
  const { recurringItems, addRecurringItem, deleteRecurringItem, currentSavingsGoal, setSavingsGoal, currency, categories } = useFinance();

  const [localSavings, setLocalSavings] = useState(currentSavingsGoal.toString());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>(TransactionType.INCOME);
  const [editingItem, setEditingItem] = useState<RecurringItem | null>(null);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => { setLocalSavings(currentSavingsGoal.toString()); }, [currentSavingsGoal]);

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
      setEditingItem(null); setDesc(''); setAmount(''); setCategory('');
    }
    setIsModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount) return;
    const val = parseFloat(amount);
    if (isNaN(val)) return;
    if (editingItem) deleteRecurringItem(editingItem.id);
    addRecurringItem({ description: desc, amount: val, type: modalType, category: category || undefined });
    setIsModalOpen(false);
    setCategory('');
  };

  return (
    <div className="pt-6 pb-8 space-y-6">
      <header>
        <h1 className="text-2xl font-bold font-sans text-slate-900 tracking-tight">Planificacion</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Disena tu mes ideal</p>
      </header>

      {/* Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="p-5">
          <div className="flex justify-between items-start mb-5">
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">Resultado Final</p>
              <p className={cn(
                "text-3xl font-bold font-sans tracking-tight tabular-nums",
                freeMoney < 0 ? 'text-red-600' : 'text-emerald-700'
              )}>
                {formatCurrency(freeMoney, currency)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Disponible (Variable)</p>
            </div>
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center border",
              freeMoney < 0
                ? 'bg-red-50 border-red-200 text-red-600'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            )}>
              <CheckCircle2 size={20} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-emerald-50/50 rounded-xl p-3.5 border border-emerald-100">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center">
                  <ArrowUpRight size={12} className="text-emerald-700" />
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Ingresos</span>
              </div>
              <span className="text-lg font-bold font-sans text-slate-900 tabular-nums">{formatCurrency(totalFixedIncome, currency)}</span>
            </div>
            <div className="bg-red-50/50 rounded-xl p-3.5 border border-red-100">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-5 h-5 rounded-md bg-red-100 flex items-center justify-center">
                  <ArrowDownRight size={12} className="text-red-600" />
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Gastos Fijos</span>
              </div>
              <span className="text-lg font-bold font-sans text-slate-900 tabular-nums">{formatCurrency(-totalFixedExpenses, currency)}</span>
            </div>
          </div>

          {/* Savings Input */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="bg-blue-50 p-2 rounded-lg border border-blue-200">
                <PiggyBank size={16} className="text-blue-600" />
              </div>
              <span className="text-sm text-slate-900 font-medium">Meta Ahorro</span>
            </div>
            <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-slate-200 focus-within:border-blue-400 transition-colors">
              <span className="text-slate-500 text-sm font-medium">$</span>
              <input
                type="number"
                inputMode="decimal"
                value={localSavings}
                onChange={(e) => setLocalSavings(e.target.value)}
                onBlur={handleSavingsBlur}
                className="w-20 text-right font-semibold text-slate-900 bg-transparent focus:outline-none placeholder-slate-300 tabular-nums"
                placeholder="0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Incomes */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold font-sans text-slate-900">Ingresos Fijos</h3>
          <Button size="sm" variant="income" onClick={() => openModal(TransactionType.INCOME)} className="h-8 text-xs">
            <Plus size={14} className="mr-1" /> Agregar
          </Button>
        </div>
        <div className="space-y-2">
          {incomes.map(item => {
            const catColors = CATEGORY_COLORS[item.category || 'Otros'] || CATEGORY_COLORS['Otros'];
            return (
              <div key={item.id} onClick={() => openModal(TransactionType.INCOME, item)}
                className="bg-white border border-slate-200/60 rounded-xl p-3.5 flex justify-between items-center hover:bg-slate-50 transition-colors active:scale-[0.98] cursor-pointer">
                <div className="flex flex-col gap-1">
                  <p className="font-medium text-sm text-slate-900">{item.description}</p>
                  {item.category && (
                    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-md w-fit border", catColors.bg, catColors.text, catColors.border)}>
                      {item.category}
                    </span>
                  )}
                </div>
                <span className="font-semibold text-emerald-700 text-sm tabular-nums">{formatCurrency(item.amount, currency)}</span>
              </div>
            );
          })}
          {incomes.length === 0 && (
            <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl">
              <p className="text-slate-500 text-xs">Sin ingresos registrados</p>
            </div>
          )}
        </div>
      </section>

      {/* Expenses */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold font-sans text-slate-900">Gastos Fijos</h3>
          <Button size="sm" variant="expense" onClick={() => openModal(TransactionType.EXPENSE)} className="h-8 text-xs">
            <Plus size={14} className="mr-1" /> Agregar
          </Button>
        </div>
        <div className="space-y-2">
          {expenses.map(item => {
            const catColors = CATEGORY_COLORS[item.category || 'Otros'] || CATEGORY_COLORS['Otros'];
            return (
              <div key={item.id} onClick={() => openModal(TransactionType.EXPENSE, item)}
                className="bg-white border border-slate-200/60 rounded-xl p-3.5 flex justify-between items-center hover:bg-slate-50 transition-colors active:scale-[0.98] cursor-pointer">
                <div className="flex flex-col gap-1">
                  <p className="font-medium text-sm text-slate-900">{item.description}</p>
                  {item.category && (
                    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-md w-fit border", catColors.bg, catColors.text, catColors.border)}>
                      {item.category}
                    </span>
                  )}
                </div>
                <span className="font-semibold text-red-600 text-sm tabular-nums">{formatCurrency(-item.amount, currency)}</span>
              </div>
            );
          })}
          {expenses.length === 0 && (
            <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl">
              <p className="text-slate-500 text-xs">Sin gastos fijos registrados</p>
            </div>
          )}
        </div>
      </section>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-5 pointer-events-auto shadow-2xl animate-slide-in-bottom border border-slate-200 relative z-10 sm:m-4 max-h-[90vh] overflow-y-auto"
               style={{ paddingBottom: 'calc(var(--sab, 0px) + 1.25rem)' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold font-sans text-slate-900">
                {editingItem ? 'Editar' : 'Nuevo'} {modalType === TransactionType.INCOME ? 'Ingreso' : 'Gasto'}
              </h3>
              <Button onClick={() => setIsModalOpen(false)} variant="ghost" size="icon" className="w-9 h-9 rounded-lg">
                <X size={18} />
              </Button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 ml-0.5">Descripcion</label>
                <Input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ej. Netflix" autoFocus className="h-12 bg-slate-50 border-slate-200" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 ml-0.5">Monto Mensual</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">{currency === 'EUR' ? '\u20AC' : '$'}</span>
                  <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="pl-8 h-12 bg-slate-50 border-slate-200" inputMode="decimal" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Tag size={12} className="text-slate-500" />
                  <span className="text-xs font-medium text-slate-500">Categoria (opcional)</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(modalType === TransactionType.EXPENSE ? categories : INCOME_CATEGORIES).map(cat => {
                    const catColors = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Otros'];
                    const isSelected = category === cat;
                    return (
                      <button key={cat} type="button" onClick={() => setCategory(isSelected ? '' : cat)}
                        className={cn(
                          "px-3.5 py-2.5 rounded-lg text-[11px] font-medium border transition-all min-h-[44px] flex items-center",
                          isSelected
                            ? `${catColors.bg} ${catColors.text} ${catColors.border} ring-1 ring-blue-300`
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        )}>
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 space-y-2.5">
                <Button type="submit" className={cn(
                  "w-full h-12 font-semibold",
                  modalType === TransactionType.INCOME
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/25'
                    : 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/25'
                )}>
                  Guardar
                </Button>
                {editingItem && (
                  <Button type="button" variant="ghost" onClick={() => { deleteRecurringItem(editingItem.id); setIsModalOpen(false); }}
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 size={14} className="mr-2" /> Eliminar
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
