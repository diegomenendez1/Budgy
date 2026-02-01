import React, { useState, useEffect } from 'react';
import { Plus, AlertTriangle, Check, Sparkles } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { TransactionType } from '../types';
import { parseTransactionInput } from '../services/aiService';
import MagicInput from './transaction/MagicInput';
import TransactionForm from './transaction/TransactionForm';

const FloatingAddButton: React.FC = () => {
    const { addTransaction, addRecurringItem, categories, addCategory, activeCycle, cycleMetrics, transferSavingsToBudget, apiKey } = useFinance();
    const [isOpen, setIsOpen] = useState(false);

    // Transaction Type State
    const [txType, setTxType] = useState<TransactionType>(TransactionType.EXPENSE);

    // Form State
    const [amount, setAmount] = useState('');
    const [desc, setDesc] = useState('');
    const [category, setCategory] = useState('');
    const [isExceptional, setIsExceptional] = useState(false);
    const [isRecurring, setIsRecurring] = useState(false);

    // Magic AI State
    const [isMagicMode, setIsMagicMode] = useState(false);
    const [magicInput, setMagicInput] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // New Category State
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    // Manual Installment State
    const [isManualInstallment, setIsManualInstallment] = useState(false);
    const [manualInstallmentsCount, setManualInstallmentsCount] = useState(3);

    // Emergency / Overspending State
    const [showSavingsAlert, setShowSavingsAlert] = useState(false);

    // Set default category when categories load
    useEffect(() => {
        if (categories.length > 0 && !category) {
            setCategory(categories[0]);
        }
    }, [categories, category]);

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        // Handle comma as decimal separator for flexibility
        const normalizedAmount = amount.replace(',', '.');
        const numAmount = parseFloat(normalizedAmount);
        if (isNaN(numAmount) || numAmount <= 0) return;

        // Check for Overspending Logic
        if (
            txType === TransactionType.EXPENSE &&
            activeCycle &&
            activeCycle.savingsGoal > 0 &&
            numAmount > cycleMetrics.remainingBudget &&
            !showSavingsAlert
        ) {
            setShowSavingsAlert(true);
            return;
        }

        // Installment Logic
        if (txType === TransactionType.EXPENSE && isManualInstallment && manualInstallmentsCount > 1) {
            const installmentAmt = numAmount / manualInstallmentsCount;

            // 1. Create the Recurring Item (The Debt Plan)
            addRecurringItem({
                description: `${desc || category} (Cuota)`,
                amount: installmentAmt,
                type: TransactionType.EXPENSE,
                isInstallment: true,
                totalInstallments: manualInstallmentsCount,
                startDate: new Date().toISOString()
            });

            addTransaction({
                description: `${desc || category} (1/${manualInstallmentsCount})`,
                amount: installmentAmt,
                category: category,
                type: TransactionType.EXPENSE,
                date: new Date().toISOString(),
                isExceptional: isExceptional
            });
        } else if (txType === TransactionType.EXPENSE && isRecurring) {
            // Recurring Expense Logic (Subscription)
            // 1. Add to Recurring Items (Planning)
            addRecurringItem({
                description: desc || category,
                amount: numAmount,
                type: TransactionType.EXPENSE,
                category: category,
                startDate: new Date().toISOString()
            });

            // 2. Add immediate transaction (Reality)
            addTransaction({
                description: desc || category,
                amount: numAmount,
                category: category,
                type: TransactionType.EXPENSE,
                date: new Date().toISOString(),
                isExceptional: false // Recurring expenses are not exceptional, they are regular
            });
        } else {
            // Normal One-Time Transaction
            addTransaction({
                description: desc || (txType === TransactionType.INCOME ? 'Ingreso Extra' : category),
                amount: numAmount,
                category: txType === TransactionType.INCOME ? 'Ingreso' : category,
                date: new Date().toISOString(),
                type: txType,
                isExceptional: txType === TransactionType.EXPENSE ? isExceptional : false
            });
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
                // It's an installment plan! Add to Recurring Items (Managed Debt)
                const installmentAmt = result.amount / result.totalInstallments;
                addRecurringItem({
                    description: `${result.description} (Cuota)`,
                    amount: installmentAmt,
                    type: TransactionType.EXPENSE,
                    isInstallment: true,
                    totalInstallments: result.totalInstallments,
                    startDate: result.startDate || new Date().toISOString()
                });
                // Also add the FIRST transaction immediately so it reflects in today's cash
                addTransaction({
                    description: `${result.description} (1/${result.totalInstallments})`,
                    amount: installmentAmt,
                    category: result.category || 'Compras',
                    type: TransactionType.EXPENSE,
                    date: new Date().toISOString()
                });
            } else {
                // Normal transaction
                addTransaction({
                    description: result.description,
                    amount: result.amount,
                    category: result.category || 'Otros',
                    type: result.type === 'INCOME' ? TransactionType.INCOME : TransactionType.EXPENSE,
                    date: new Date().toISOString()
                });
            }
            resetForm();
        }
    };

    const resetForm = () => {
        setAmount('');
        setDesc('');
        setIsExceptional(false);
        setIsRecurring(false);
        setIsManualInstallment(false);
        setManualInstallmentsCount(3);
        setIsOpen(false);
        setShowSavingsAlert(false);
        setTxType(TransactionType.EXPENSE);
        setMagicInput('');
        setIsMagicMode(false);
    };

    const handleUseSavings = () => {
        transferSavingsToBudget();
        setTimeout(() => {
            handleSubmit();
        }, 50);
    };

    const handleAddNewCategory = () => {
        if (newCategoryName.trim()) {
            addCategory(newCategoryName);
            setCategory(newCategoryName.trim());
            setIsAddingCategory(false);
            setNewCategoryName('');
        } else {
            setIsAddingCategory(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Agregar transacción"
                className={`
                    fixed bottom-24 right-6 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 z-50
                    ${isOpen ? 'bg-black text-white rotate-45 scale-90' : 'bg-black text-white hover:scale-105 active:scale-95'}
                `}
            >
                <Plus size={32} strokeWidth={2.5} />
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/60 z-[70] flex items-end sm:items-center justify-center backdrop-blur-sm animate-fade-in">
                    <div className="absolute inset-0" onClick={() => setIsOpen(false)}></div>

                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-title"
                        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 pb-safe sm:pb-6 shadow-2xl relative z-10 overflow-y-auto max-h-[90vh] transition-colors duration-300"
                    >

                        {/* Header with Magic Toggle */}
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsMagicMode(!isMagicMode)}
                                    aria-label={isMagicMode ? "Desactivar Modo Magia" : "Activar Modo Magia"}
                                    className={`p-2.5 rounded-xl transition-all flex items-center gap-2 ${isMagicMode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100'}`}
                                >
                                    <Sparkles size={20} className={isMagicMode ? 'animate-pulse' : ''} />
                                    <span className="text-xs font-bold uppercase tracking-wider">{isMagicMode ? 'Modo Magia' : 'Magia'}</span>
                                </button>
                                <h3 id="modal-title" className="text-xl font-bold text-gray-900 dark:text-white">
                                    {isMagicMode ? 'Registro Inteligente' : (txType === TransactionType.INCOME ? 'Nuevo Ingreso' : 'Nuevo Gasto')}
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                aria-label="Cancelar y cerrar"
                                className="text-gray-500 dark:text-slate-400 font-medium p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>

                        {showSavingsAlert ? (
                            /* ... Savings Alert ... */
                            <div className="animate-in flex flex-col items-center text-center pt-2">
                                <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-full mb-4 text-amber-600 dark:text-amber-400 shadow-lg shadow-amber-500/20">
                                    <AlertTriangle size={32} strokeWidth={2.5} />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">Presupuesto Excedido</h3>
                                <p className="text-gray-500 dark:text-slate-400 mb-6 text-sm px-4">
                                    Este gasto supera tu disponible actual.
                                </p>
                                <div className="w-full space-y-3">
                                    <button onClick={handleUseSavings} className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/30">
                                        <Check size={20} /> Usar ahorros
                                    </button>
                                    <button onClick={() => handleSubmit()} className="w-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 font-bold py-3 rounded-2xl">
                                        Continuar igual
                                    </button>
                                </div>
                            </div>
                        ) : isMagicMode ? (
                            <MagicInput
                                magicInput={magicInput}
                                setMagicInput={setMagicInput}
                                handleMagicAnalyze={handleMagicAnalyze}
                                isAnalyzing={isAnalyzing}
                            />
                        ) : (
                            <TransactionForm
                                handleSubmit={handleSubmit}
                                txType={txType}
                                setTxType={setTxType}
                                amount={amount}
                                setAmount={setAmount}
                                desc={desc}
                                setDesc={setDesc}
                                categories={categories}
                                category={category}
                                setCategory={setCategory}
                                isAddingCategory={isAddingCategory}
                                setIsAddingCategory={setIsAddingCategory}
                                newCategoryName={newCategoryName}
                                setNewCategoryName={setNewCategoryName}
                                handleAddNewCategory={handleAddNewCategory}
                                isRecurring={isRecurring}
                                setIsRecurring={setIsRecurring}
                                isExceptional={isExceptional}
                                setIsExceptional={setIsExceptional}
                                isManualInstallment={isManualInstallment}
                                setIsManualInstallment={setIsManualInstallment}
                                manualInstallmentsCount={manualInstallmentsCount}
                                setManualInstallmentsCount={setManualInstallmentsCount}
                            />
                        )}

                    </div>
                </div >
            )}
        </>
    );
};

export default FloatingAddButton;