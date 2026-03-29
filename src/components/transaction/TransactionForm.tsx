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
    currency?: string;
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
    setManualInstallmentsCount,
    currency = 'USD'
}) => {

    return (
        <form onSubmit={handleSubmit} className="space-y-5 animate-in">

            {/* Type Switcher */}
            <div className="flex bg-secondary p-1 rounded-2xl">
                <button
                    type="button"
                    onClick={() => setTxType(TransactionType.EXPENSE)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${txType === TransactionType.EXPENSE ? 'bg-background text-red-600 shadow-sm' : 'text-muted-foreground'}`}
                >
                    <ArrowUp size={16} /> Gasto
                </button>
                <button
                    type="button"
                    onClick={() => setTxType(TransactionType.INCOME)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${txType === TransactionType.INCOME ? 'bg-background text-green-600 shadow-sm' : 'text-muted-foreground'}`}
                >
                    <ArrowDown size={16} /> Ingreso
                </button>
            </div>

            <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 px-1">Monto</label>
                <div className="relative">
                    <span className={`absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-black ${txType === TransactionType.INCOME ? 'text-green-500' : 'text-muted-foreground/30'}`}>{currency === 'EUR' ? '€' : '$'}</span>

                    <input
                        type="text"
                        value={amount}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (/^[0-9]*[.,]?[0-9]*$/.test(val)) {
                                setAmount(val);
                            }
                        }}
                        className={`w-full text-3xl font-black border-b-2 border-border focus:border-primary focus:outline-none py-2 pl-7 bg-transparent transition-colors placeholder:text-muted-foreground/20 ${txType === TransactionType.INCOME ? 'text-green-600' : 'text-foreground'}`}
                        placeholder="0"
                        autoFocus
                        inputMode="decimal"
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 px-1">Descripción</label>
                <input
                    type="text"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="w-full p-4 bg-secondary rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold text-lg text-foreground placeholder:text-muted-foreground/40 border border-border"
                    placeholder={txType === TransactionType.INCOME ? "Venta, Regalo..." : "¿En qué gastaste?"}
                />
            </div>

            {txType === TransactionType.EXPENSE && (
                <>
                    <div>
                        <div className="flex justify-between items-center mb-2 px-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Categoría</label>
                            {!isAddingCategory && (
                                <button
                                    type="button"
                                    onClick={() => setIsAddingCategory(true)}
                                    className="text-[10px] font-black text-primary uppercase tracking-widest"
                                >
                                    + Nueva
                                </button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {categories.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setCategory(c)}
                                    className={`px-3.5 py-2.5 min-h-[44px] rounded-full text-sm font-bold transition-all tap-transparent ${category === c ? 'bg-foreground text-background shadow-md transform scale-105' : 'bg-secondary text-muted-foreground hover:bg-muted border border-border'}`}
                                >
                                    {c}
                                </button>
                            ))}

                            {isAddingCategory && (
                                <div className="flex items-center bg-secondary rounded-full px-3 py-1.5 border border-primary min-h-[44px]">
                                    <input
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        onBlur={handleAddNewCategory}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddNewCategory()}
                                        className="bg-transparent border-none focus:outline-none text-sm font-bold text-foreground w-28"
                                        placeholder="Nueva..."
                                        autoFocus
                                    />
                                    <button onMouseDown={handleAddNewCategory} aria-label="Confirmar nueva categoría" className="bg-primary text-primary-foreground p-1.5 rounded-full ml-1 tap-transparent"><Check size={14} /></button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recurring / Fixed Expense Toggle */}
                    <div
                        onClick={() => {
                            const newVal = !isRecurring;
                            setIsRecurring(newVal);
                            if (newVal) setIsExceptional(false);
                        }}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors mb-2 ${isRecurring ? 'bg-primary/5 border-primary/20' : 'bg-secondary border-border'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${isRecurring ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                <RefreshCcw size={18} />
                            </div>
                            <div>
                                <p className={`text-sm font-bold ${isRecurring ? 'text-foreground' : 'text-muted-foreground'}`}>Gasto Fijo / Recurrente</p>
                                <p className="text-[10px] text-primary/60 font-black uppercase tracking-widest">Suscripciones, Servicios</p>
                            </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isRecurring ? 'border-primary bg-primary' : 'border-border'}`}>
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
                            if (newVal) setIsRecurring(false);
                        }}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${isExceptional ? 'bg-amber-50 border-amber-200' : 'bg-secondary border-border'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${isExceptional ? 'bg-amber-100 text-amber-600' : 'bg-muted text-muted-foreground'}`}><AlertTriangle size={18} /></div>
                            <div>
                                <p className={`text-sm font-bold ${isExceptional ? 'text-amber-900' : 'text-muted-foreground'}`}>Gasto Único / Excepcional</p>
                                <p className="text-[10px] text-amber-600/60 font-black uppercase tracking-widest">No afecta tu ahorro diario</p>
                            </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isExceptional ? 'border-amber-500 bg-amber-500' : 'border-border'}`}>{isExceptional && <div className="w-2 h-2 bg-white rounded-full" />}</div>
                    </div>
                </>
            )}

            <div className="sticky bottom-0 bg-white pt-3 -mx-5 px-5 pb-2">
                <button
                    type="submit"
                    className={`w-full font-bold uppercase tracking-wider py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all text-sm min-h-[52px] tap-transparent ${txType === TransactionType.INCOME ? 'bg-primary text-primary-foreground shadow-primary/20' : 'bg-foreground text-background shadow-foreground/10'}`}
                >
                    {txType === TransactionType.INCOME ? 'Registrar Ingreso' : 'Confirmar Gasto'}
                </button>
            </div>
        </form>
    );
};

export default TransactionForm;
