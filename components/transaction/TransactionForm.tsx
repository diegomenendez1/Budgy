import React from 'react';
import { ArrowUp, ArrowDown, Check, Plus, RefreshCcw, AlertTriangle } from 'lucide-react';
import { TransactionType } from '../../types';
import InstallmentOptions from './InstallmentOptions';

interface TransactionFormProps {
    handleSubmit: (e?: React.FormEvent) => void;
    txType: TransactionType;
    setTxType: (type: TransactionType) => void;
    amount: string;
    setAmount: (val: string) => void;
    desc: string;
    setDesc: (val: string) => void;
    categories: string[];
    category: string;
    setCategory: (val: string) => void;
    isAddingCategory: boolean;
    setIsAddingCategory: (val: boolean) => void;
    newCategoryName: string;
    setNewCategoryName: (val: string) => void;
    handleAddNewCategory: () => void;
    isRecurring: boolean;
    setIsRecurring: (val: boolean) => void;
    isExceptional: boolean;
    setIsExceptional: (val: boolean) => void;
    isManualInstallment: boolean;
    setIsManualInstallment: (val: boolean) => void;
    manualInstallmentsCount: number;
    setManualInstallmentsCount: (val: number) => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
    handleSubmit,
    txType,
    setTxType,
    amount,
    setAmount,
    desc,
    setDesc,
    categories,
    category,
    setCategory,
    isAddingCategory,
    setIsAddingCategory,
    newCategoryName,
    setNewCategoryName,
    handleAddNewCategory,
    isRecurring,
    setIsRecurring,
    isExceptional,
    setIsExceptional,
    isManualInstallment,
    setIsManualInstallment,
    manualInstallmentsCount,
    setManualInstallmentsCount
}) => {
    return (
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
                            const newVal = !isRecurring;
                            setIsRecurring(newVal);
                            if (newVal) setIsExceptional(false); // Recurring cannot be exceptional
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

                    <InstallmentOptions
                        isManualInstallment={isManualInstallment}
                        setIsManualInstallment={setIsManualInstallment}
                        manualInstallmentsCount={manualInstallmentsCount}
                        setManualInstallmentsCount={setManualInstallmentsCount}
                        amount={amount}
                    />

                    <div
                        onClick={() => {
                            const newVal = !isExceptional;
                            setIsExceptional(newVal);
                            if (newVal) setIsRecurring(false); // Exceptional cannot be recurring
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
    );
};

export default TransactionForm;
