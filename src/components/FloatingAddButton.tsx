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

    // Close modal on tab change to avoid UX friction
    useEffect(() => {
        setIsOpen(false);
    }, [currentTab]);

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
        const normalizedAmount = amount.replace(',', '.');
        const numAmount = parseFloat(normalizedAmount);
        if (isNaN(numAmount) || numAmount <= 0) return;

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

        if (txType === TransactionType.EXPENSE && isManualInstallment && manualInstallmentsCount > 1) {
            const installmentAmt = numAmount / manualInstallmentsCount;
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
            addRecurringItem({
                description: desc || category,
                amount: numAmount,
                type: TransactionType.EXPENSE,
                category: category,
                startDate: new Date().toISOString()
            });

            addTransaction({
                description: desc || category,
                amount: numAmount,
                category: category,
                type: TransactionType.EXPENSE,
                date: new Date().toISOString(),
                isExceptional: false
            });
        } else {
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
                const installmentAmt = result.amount / result.totalInstallments;
                addRecurringItem({
                    description: `${result.description} (Cuota)`,
                    amount: installmentAmt,
                    type: TransactionType.EXPENSE,
                    isInstallment: true,
                    totalInstallments: result.totalInstallments,
                    startDate: result.startDate || new Date().toISOString()
                });
                addTransaction({
                    description: `${result.description} (1/${result.totalInstallments})`,
                    amount: installmentAmt,
                    category: result.category || 'Compras',
                    type: TransactionType.EXPENSE,
                    date: new Date().toISOString()
                });
            } else {
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
        <div className={cn("fixed bottom-[calc(5rem+var(--sab))] right-4 z-40 pointer-events-none")}>
            <div className="mx-auto max-w-lg pointer-events-none relative h-full">
                {/* Floating Button Container - relative to max-w-lg to align with app width */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Agregar transacción"
                    className={cn(
                        "absolute right-0 bottom-0 pointer-events-auto",
                        "w-14 h-14 rounded-full shadow-lg shadow-primary/20 flex items-center justify-center transition-all duration-300",
                        isOpen
                            ? "bg-foreground text-background rotate-45 scale-90"
                            : "bg-primary text-primary-foreground hover:scale-105 active:scale-95"
                    )}
                >
                    <Plus size={28} strokeWidth={2.5} />
                </button>
            </div>

            {isOpen && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center animate-fade-in pointer-events-auto">
                    <div className="absolute inset-0" onClick={() => setIsOpen(false)}></div>

                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-title"
                        className={cn(
                            "bg-card text-card-foreground w-full max-w-md p-6 shadow-2xl relative z-10",
                            "overflow-y-auto max-h-[85vh] transition-all duration-300 border border-border/50",
                            "rounded-t-[2rem] sm:rounded-[2rem] pb-safe-nav sm:pb-6",
                            "animate-in slide-in-from-bottom-5 fade-in duration-300"
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >

                        {/* Header */}
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsMagicMode(!isMagicMode)}
                                    className={cn(
                                        "p-2 rounded-xl transition-all flex items-center gap-2 border",
                                        isMagicMode
                                            ? "bg-primary/10 text-primary border-primary/20"
                                            : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                                    )}
                                >
                                    <Sparkles size={18} className={isMagicMode ? 'animate-pulse' : ''} />
                                    <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">{isMagicMode ? 'Modo Magia' : 'Magia'}</span>
                                </button>
                                <h3 id="modal-title" className="text-lg font-bold tracking-tight">
                                    {isMagicMode ? 'Registro IA' : (txType === TransactionType.INCOME ? 'Nuevo Ingreso' : 'Nuevo Gasto')}
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                aria-label="Cerrar"
                                className="text-muted-foreground p-2 hover:bg-muted rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {showSavingsAlert ? (
                            <div className="animate-in flex flex-col items-center text-center pt-2">
                                <div className="bg-amber-100 p-4 rounded-full mb-4 text-amber-600">
                                    <AlertTriangle size={32} strokeWidth={2.5} />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Presupuesto Excedido</h3>
                                <p className="text-muted-foreground mb-6 text-sm">
                                    Este gasto supera tu disponible actual.
                                </p>
                                <div className="w-full space-y-3">
                                    <button onClick={handleUseSavings} className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                                        <Check size={18} /> Usar ahorros
                                    </button>
                                    <button onClick={() => handleSubmit()} className="w-full bg-secondary text-secondary-foreground font-semibold py-3.5 rounded-xl active:scale-[0.98] transition-transform">
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
        </div>
    );
};

export default FloatingAddButton;