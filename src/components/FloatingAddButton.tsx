import React, { useState, useEffect } from 'react';
import { Plus, AlertTriangle, Check, Sparkles, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { TransactionType } from '../types';
import { parseTransactionInput } from '../services/aiService';
import MagicInput from './transaction/MagicInput';
import TransactionForm from './transaction/TransactionForm';
import { cn } from '../lib/utils';

const FloatingAddButton: React.FC<{ currentTab?: string }> = ({ currentTab }) => {
    const { addTransaction, addRecurringItem, categories, addCategory, activeCycle, cycleMetrics, transferSavingsToBudget, apiKey } = useFinance();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => { setIsOpen(false); }, [currentTab]);

    const [txType, setTxType] = useState<TransactionType>(TransactionType.EXPENSE);
    const [amount, setAmount] = useState('');
    const [desc, setDesc] = useState('');
    const [category, setCategory] = useState('');
    const [isExceptional, setIsExceptional] = useState(false);
    const [isRecurring, setIsRecurring] = useState(false);
    const [isMagicMode, setIsMagicMode] = useState(false);
    const [magicInput, setMagicInput] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isManualInstallment, setIsManualInstallment] = useState(false);
    const [manualInstallmentsCount, setManualInstallmentsCount] = useState(3);
    const [showSavingsAlert, setShowSavingsAlert] = useState(false);

    useEffect(() => {
        if (categories.length > 0 && !category) setCategory(categories[0]);
    }, [categories, category]);

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const normalizedAmount = amount.replace(',', '.');
        const numAmount = parseFloat(normalizedAmount);
        if (isNaN(numAmount) || numAmount <= 0) return;

        if (txType === TransactionType.EXPENSE && activeCycle && activeCycle.savingsGoal > 0 && numAmount > cycleMetrics.remainingBudget && !showSavingsAlert) {
            setShowSavingsAlert(true);
            return;
        }

        if (txType === TransactionType.EXPENSE && isManualInstallment && manualInstallmentsCount > 1) {
            const installmentAmt = numAmount / manualInstallmentsCount;
            addRecurringItem({ description: `${desc || category} (Cuota)`, amount: installmentAmt, type: TransactionType.EXPENSE, isInstallment: true, totalInstallments: manualInstallmentsCount, startDate: new Date().toISOString() });
            addTransaction({ description: `${desc || category} (1/${manualInstallmentsCount})`, amount: installmentAmt, category, type: TransactionType.EXPENSE, date: new Date().toISOString(), isExceptional });
        } else if (txType === TransactionType.EXPENSE && isRecurring) {
            addRecurringItem({ description: desc || category, amount: numAmount, type: TransactionType.EXPENSE, category, startDate: new Date().toISOString() });
            addTransaction({ description: desc || category, amount: numAmount, category, type: TransactionType.EXPENSE, date: new Date().toISOString(), isExceptional: false });
        } else {
            addTransaction({ description: desc || (txType === TransactionType.INCOME ? 'Ingreso Extra' : category), amount: numAmount, category: txType === TransactionType.INCOME ? 'Ingreso' : category, date: new Date().toISOString(), type: txType, isExceptional: txType === TransactionType.EXPENSE ? isExceptional : false });
        }
        resetForm();
    };

    const handleMagicAnalyze = async () => {
        if (!magicInput.trim()) return;
        setIsAnalyzing(true);
        const result = await parseTransactionInput(magicInput, apiKey);
        setIsAnalyzing(false);
        if (result) {
            if (result.isInstallment && result.totalInstallments > 1) {
                const installmentAmt = result.amount / result.totalInstallments;
                addRecurringItem({ description: `${result.description} (Cuota)`, amount: installmentAmt, type: TransactionType.EXPENSE, isInstallment: true, totalInstallments: result.totalInstallments, startDate: result.startDate || new Date().toISOString() });
                addTransaction({ description: `${result.description} (1/${result.totalInstallments})`, amount: installmentAmt, category: result.category || 'Compras', type: TransactionType.EXPENSE, date: new Date().toISOString() });
            } else {
                addTransaction({ description: result.description, amount: result.amount, category: result.category || 'Otros', type: result.type === 'INCOME' ? TransactionType.INCOME : TransactionType.EXPENSE, date: new Date().toISOString() });
            }
            resetForm();
        }
    };

    const resetForm = () => {
        setAmount(''); setDesc(''); setIsExceptional(false); setIsRecurring(false);
        setIsManualInstallment(false); setManualInstallmentsCount(3); setIsOpen(false);
        setShowSavingsAlert(false); setTxType(TransactionType.EXPENSE); setMagicInput(''); setIsMagicMode(false);
    };

    const handleUseSavings = () => {
        transferSavingsToBudget();
        setTimeout(() => handleSubmit(), 50);
    };

    const handleAddNewCategory = () => {
        if (newCategoryName.trim()) {
            addCategory(newCategoryName);
            setCategory(newCategoryName.trim());
            setIsAddingCategory(false);
            setNewCategoryName('');
        } else { setIsAddingCategory(false); }
    };

    return (
        <div className="fixed bottom-[calc(5.5rem+var(--sab,0px)+8px)] right-4 z-40 pointer-events-none">
            <div className="mx-auto max-w-lg pointer-events-none relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Agregar transaccion"
                    className={cn(
                        "absolute right-0 bottom-0 pointer-events-auto tap-transparent",
                        "w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center transition-all duration-200",
                        isOpen
                            ? "bg-slate-900 text-white rotate-45 scale-90"
                            : "bg-gradient-to-r from-[#0052FF] to-[#4D7CFF] text-white hover:scale-105 active:scale-95 shadow-lg shadow-[#0052FF]/30"
                    )}
                >
                    <Plus size={24} strokeWidth={2.5} />
                </button>
            </div>

            {isOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center animate-fade-in pointer-events-auto">
                    <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-title"
                        className="bg-white text-card-foreground w-full max-w-md p-5 pb-8 shadow-xl relative z-10 overflow-y-auto max-h-[90vh] border border-slate-200 rounded-t-2xl sm:rounded-2xl sm:pb-5 sm:m-4 animate-slide-in-bottom"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-5">
                            <div className="flex items-center gap-2.5">
                                <button onClick={() => setIsMagicMode(!isMagicMode)}
                                    className={cn(
                                        "p-2 rounded-lg transition-all flex items-center gap-1.5 border text-xs font-medium",
                                        isMagicMode ? "bg-primary/10 text-primary border-primary/15" : "bg-secondary text-muted-foreground border-border hover:text-foreground"
                                    )}>
                                    <Sparkles size={14} className={isMagicMode ? 'animate-pulse' : ''} />
                                    <span className="hidden sm:inline">{isMagicMode ? 'Magia' : 'IA'}</span>
                                </button>
                                <h3 id="modal-title" className="text-base font-sans font-semibold">
                                    {isMagicMode ? 'Registro IA' : (txType === TransactionType.INCOME ? 'Nuevo Ingreso' : 'Nuevo Gasto')}
                                </h3>
                            </div>
                            <button onClick={() => setIsOpen(false)} aria-label="Cerrar"
                                className="text-muted-foreground p-2 hover:bg-secondary rounded-lg transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {showSavingsAlert ? (
                            <div className="flex flex-col items-center text-center pt-2">
                                <div className="bg-amber-500/10 p-3.5 rounded-xl mb-4 text-amber-400 border border-amber-500/15">
                                    <AlertTriangle size={28} />
                                </div>
                                <h3 className="text-lg font-sans font-bold mb-1.5">Presupuesto Excedido</h3>
                                <p className="text-muted-foreground mb-5 text-sm">Este gasto supera tu disponible actual.</p>
                                <div className="w-full space-y-2.5">
                                    <button onClick={handleUseSavings}
                                        className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.97] transition-transform">
                                        <Check size={16} /> Usar ahorros
                                    </button>
                                    <button onClick={() => handleSubmit()}
                                        className="w-full bg-secondary text-secondary-foreground font-medium py-3 rounded-xl active:scale-[0.97] transition-transform">
                                        Continuar igual
                                    </button>
                                </div>
                            </div>
                        ) : isMagicMode ? (
                            <MagicInput magicInput={magicInput} setMagicInput={setMagicInput} handleMagicAnalyze={handleMagicAnalyze} isAnalyzing={isAnalyzing} />
                        ) : (
                            <TransactionForm
                                handleSubmit={handleSubmit} txType={txType} setTxType={setTxType}
                                amount={amount} setAmount={setAmount} desc={desc} setDesc={setDesc}
                                categories={categories} category={category} setCategory={setCategory}
                                isAddingCategory={isAddingCategory} setIsAddingCategory={setIsAddingCategory}
                                newCategoryName={newCategoryName} setNewCategoryName={setNewCategoryName}
                                handleAddNewCategory={handleAddNewCategory}
                                isRecurring={isRecurring} setIsRecurring={setIsRecurring}
                                isExceptional={isExceptional} setIsExceptional={setIsExceptional}
                                isManualInstallment={isManualInstallment} setIsManualInstallment={setIsManualInstallment}
                                manualInstallmentsCount={manualInstallmentsCount} setManualInstallmentsCount={setManualInstallmentsCount}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FloatingAddButton;
