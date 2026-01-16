import React, { useState, useEffect } from 'react';
import { Plus, AlertTriangle, Check, ArrowDown, ArrowUp, Sparkles, Loader2, ArrowRight, RefreshCcw } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { TransactionType } from '../types';
import { parseTransactionInput } from '../services/geminiService';

const FloatingAddButton: React.FC = () => {
    const { addTransaction, addRecurringItem, categories, addCategory, activeCycle, cycleMetrics, transferSavingsToBudget } = useFinance();
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

        const result = await parseTransactionInput(magicInput);
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
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 right-6 bg-black text-white p-4 rounded-full shadow-xl shadow-black/20 active:scale-95 transition-transform z-[60] hover:bg-gray-800 flex items-center justify-center"
                aria-label="Agregar Gasto"
            >
                <Plus size={28} strokeWidth={2.5} />
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
                            /* MAGIC INPUT MODE */
                            <div className="space-y-4 animate-in">
                                <div className="relative">
                                    <textarea
                                        value={magicInput}
                                        onChange={(e) => setMagicInput(e.target.value)}
                                        placeholder="Ej: Compré zapatos en Zara por $2000 a 3 meses sin intereses..."
                                        className="w-full p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-lg font-medium resize-none h-32 text-indigo-900 dark:text-indigo-100 placeholder:text-indigo-300 dark:placeholder:text-indigo-800"
                                        autoFocus
                                    />
                                    <div className="absolute bottom-3 right-3">
                                        <Sparkles size={16} className="text-indigo-300" />
                                    </div>
                                </div>
                                <button
                                    onClick={handleMagicAnalyze}
                                    disabled={isAnalyzing || !magicInput.trim()}
                                    className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isAnalyzing ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                                    {isAnalyzing ? 'Analizando...' : 'Procesar con IA'}
                                </button>
                                <p className="text-center text-xs text-gray-400 dark:text-slate-500">
                                    Detecta automáticamente plazos (MSI), categorías y montos.
                                </p>
                            </div>
                        ) : (
                            /* NORMAL FORM MODE */
                            <form onSubmit={handleSubmit} className="space-y-5 animate-in">

                                {/* Type Switcher */}
                                <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-2xl">
                                    <button
                                        type="button"
                                        onClick={() => setTxType(TransactionType.EXPENSE)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${txType === TransactionType.EXPENSE ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-sm' : 'text-gray-500 dark:text-slate-500'}`}
                                    >
                                        <ArrowUp size={16} /> Gasto
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTxType(TransactionType.INCOME)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${txType === TransactionType.INCOME ? 'bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 shadow-sm' : 'text-gray-500 dark:text-slate-500'}`}
                                    >
                                        <ArrowDown size={16} /> Ingreso
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-500 dark:text-slate-400 mb-1">Monto</label>
                                    <div className="relative">
                                        <span className={`absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-bold ${txType === TransactionType.INCOME ? 'text-green-500 dark:text-green-400' : 'text-gray-400 dark:text-slate-600'}`}>$</span>
                                        <input
                                            type="text"
                                            value={amount}
                                            onChange={(e) => {
                                                // Allow only numbers, one dot or one comma
                                                const val = e.target.value;
                                                if (/^[0-9]*[.,]?[0-9]*$/.test(val)) {
                                                    setAmount(val);
                                                }
                                            }}
                                            className={`w-full text-4xl font-bold border-b-2 border-gray-100 dark:border-slate-800 focus:border-black dark:focus:border-white focus:outline-none py-2 pl-6 bg-transparent transition-colors placeholder:text-gray-300 dark:placeholder:text-slate-800 ${txType === TransactionType.INCOME ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}
                                            placeholder="0"
                                            autoFocus
                                            inputMode="decimal"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-500 dark:text-slate-400 mb-2">Descripción</label>
                                    <input
                                        type="text"
                                        value={desc}
                                        onChange={(e) => setDesc(e.target.value)}
                                        className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 font-medium text-lg text-gray-900 dark:text-white"
                                        placeholder={txType === TransactionType.INCOME ? "Venta, Regalo..." : "¿En qué gastaste?"}
                                    />
                                </div>

                                {txType === TransactionType.EXPENSE && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-500 dark:text-slate-400 mb-2">Categoría</label>
                                            <div className="flex flex-wrap gap-2">
                                                {categories.map(c => (
                                                    <button
                                                        key={c}
                                                        type="button"
                                                        onClick={() => setCategory(c)}
                                                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${category === c ? 'bg-black dark:bg-white text-white dark:text-black shadow-md transform scale-105' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                                                    >
                                                        {c}
                                                    </button>
                                                ))}

                                                {isAddingCategory ? (
                                                    <div className="flex items-center bg-gray-100 dark:bg-slate-800 rounded-full px-2 pl-3 py-1">
                                                        <input
                                                            value={newCategoryName}
                                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                                            onBlur={handleAddNewCategory}
                                                            onKeyDown={(e) => e.key === 'Enter' && handleAddNewCategory()}
                                                            className="bg-transparent border-none focus:outline-none text-sm font-bold text-gray-900 dark:text-white w-24"
                                                            placeholder="Nueva..."
                                                            autoFocus
                                                        />
                                                        <button onMouseDown={handleAddNewCategory} aria-label="Confirmar nueva categoría" className="bg-black dark:bg-white text-white dark:text-black p-1 rounded-full ml-1"><Check size={12} /></button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsAddingCategory(true)}
                                                        aria-label="Agregar nueva categoría"
                                                        className="px-3 py-2 rounded-full text-sm font-bold bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 hover:bg-gray-200 dark:hover:bg-slate-700 border border-dashed border-gray-300 dark:border-slate-700"
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Recurring / Fixed Expense Toggle */}
                                        <div
                                            onClick={() => {
                                                setIsRecurring(!isRecurring);
                                                if (!isRecurring) setIsExceptional(false); // Recurring cannot be exceptional usually
                                            }}
                                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors mb-2 ${isRecurring ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-900/50' : 'bg-gray-50 dark:bg-slate-800/50 border-transparent'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${isRecurring ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400'}`}>
                                                    <RefreshCcw size={18} />
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-bold ${isRecurring ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-700 dark:text-slate-300'}`}>Gasto Fijo / Recurrente</p>
                                                    <p className="text-[10px] text-indigo-600/60 dark:text-indigo-400/60 font-medium">Se repetirá cada mes (Suscripciones, Servicios)</p>
                                                </div>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isRecurring ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300 dark:border-slate-700'}`}>
                                                {isRecurring && <div className="w-2 h-2 bg-white rounded-full" />}
                                            </div>
                                        </div>

                                        {/* Manual Installment Toggle */}
                                        <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl border border-gray-100 dark:border-slate-800 mb-3">
                                            <div
                                                onClick={() => setIsManualInstallment(!isManualInstallment)}
                                                className="flex items-center justify-between cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-full ${isManualInstallment ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400'}`}>
                                                        <ArrowRight size={18} className={isManualInstallment ? "rotate-45" : ""} />
                                                    </div>
                                                    <div>
                                                        <p className={`text-sm font-bold ${isManualInstallment ? 'text-purple-900 dark:text-purple-100' : 'text-gray-700 dark:text-slate-300'}`}>Compra a Plazos (MSI)</p>
                                                        <p className="text-xs text-gray-500 dark:text-slate-500">Pagar en varias cuotas mensuales</p>
                                                    </div>
                                                </div>
                                                <div className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${isManualInstallment ? 'bg-purple-600 justify-end' : 'bg-gray-300 dark:bg-slate-700 justify-start'}`}>
                                                    <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                                                </div>
                                            </div>

                                            {/* Installment Details (Collapsible) */}
                                            {isManualInstallment && (
                                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700 animate-in pl-11">
                                                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">¿A cuántos meses?</label>
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="range"
                                                            min="2" max="24" step="1"
                                                            value={manualInstallmentsCount}
                                                            onChange={(e) => setManualInstallmentsCount(parseInt(e.target.value))}
                                                            className="flex-1 accent-purple-600 h-2 bg-gray-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                                                        />
                                                        <span className="font-black text-purple-600 dark:text-purple-400 w-8 text-center">{manualInstallmentsCount}</span>
                                                    </div>
                                                    <p className="text-xs text-purple-500 dark:text-purple-400 mt-2 font-medium text-right">
                                                        Pagarás <span className="font-bold">${amount ? (parseFloat(amount) / manualInstallmentsCount).toFixed(0) : '0'} / mes</span>
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div
                                            onClick={() => {
                                                setIsExceptional(!isExceptional);
                                                if (!isExceptional) setIsRecurring(false); // Exceptional cannot be recurring
                                            }}
                                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${isExceptional ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/50' : 'bg-gray-50 dark:bg-slate-800/50 border-transparent'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${isExceptional ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400'}`}><AlertTriangle size={18} /></div>
                                                <div>
                                                    <p className={`text-sm font-bold ${isExceptional ? 'text-amber-900 dark:text-amber-100' : 'text-gray-700 dark:text-slate-300'}`}>Gasto Único / Excepcional</p>
                                                    <p className="text-[10px] text-amber-600/60 dark:text-amber-400/60 font-medium">No afecta tu ritmo diario</p>
                                                </div>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isExceptional ? 'border-amber-500 bg-amber-500' : 'border-gray-300 dark:border-slate-700'}`}>{isExceptional && <div className="w-2 h-2 bg-white rounded-full" />}</div>
                                        </div>
                                    </>
                                )}

                                <button
                                    type="submit"
                                    className={`w-full font-bold py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all text-lg mt-2 ${txType === TransactionType.INCOME ? 'bg-green-600 text-white shadow-green-500/30' : 'bg-ios-blue text-white shadow-blue-500/30'}`}
                                >
                                    {txType === TransactionType.INCOME ? 'Registrar Ingreso' : 'Agregar Gasto'}
                                </button>
                            </form>
                        )}

                    </div>
                </div >
            )}
        </>
    );
};

export default FloatingAddButton;