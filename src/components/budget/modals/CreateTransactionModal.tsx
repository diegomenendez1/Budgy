import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowUp, ArrowDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { TransactionType } from '../../../types';

interface CreateTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (amount: number, description: string, category: string, type: TransactionType, isExceptional: boolean) => void;
    categories: string[];
    currency?: string;
}

const CreateTransactionModal: React.FC<CreateTransactionModalProps> = ({
    isOpen,
    onClose,
    onCreate,
    categories,
    currency = 'USD'
}) => {

    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
    const [isExceptional, setIsExceptional] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount) return;

        onCreate(
            parseFloat(amount),
            description || (type === TransactionType.INCOME ? 'Ingreso' : 'Gasto'),
            type === TransactionType.INCOME ? 'Ingreso' : (category || 'Otros'),
            type,
            type === TransactionType.EXPENSE ? isExceptional : false
        );

        // Reset and close
        setAmount('');
        setDescription('');
        setCategory('');
        setIsExceptional(false);
        onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-md animate-in fade-in" onClick={onClose} />
            <div className="bg-card w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl relative z-10 overflow-y-auto max-h-[90vh] animate-in slide-in-from-bottom border border-border"
                 style={{ paddingBottom: 'calc(var(--sab, 0px) + 1.5rem)' }}>
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight italic leading-none">Nuevo Gasto</h3>
                    <button onClick={onClose} aria-label="Cerrar modal" className="bg-secondary p-2 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Type Switcher */}
                    <div className="flex bg-secondary p-1.5 rounded-[1.25rem] border border-border">
                        <button
                            type="button"
                            onClick={() => setType(TransactionType.EXPENSE)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${type === TransactionType.EXPENSE ? 'bg-background text-red-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <ArrowUp size={16} /> Gasto
                        </button>
                        <button
                            type="button"
                            onClick={() => setType(TransactionType.INCOME)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${type === TransactionType.INCOME ? 'bg-background text-green-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <ArrowDown size={16} /> Ingreso
                        </button>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 px-1">Monto</label>
                        <div className="relative">
                            <span className={`absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-black ${type === TransactionType.INCOME ? 'text-green-500' : 'text-muted-foreground/30'}`}>{currency === 'EUR' ? '€' : '$'}</span>

                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className={`w-full text-3xl font-black border-b-2 border-border focus:border-primary focus:outline-none py-3 pl-7 bg-transparent transition-colors placeholder:text-muted-foreground/10 ${type === TransactionType.INCOME ? 'text-green-600' : 'text-foreground'}`}
                                placeholder="0"
                                inputMode="decimal"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 px-1">Descripción</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-4 bg-secondary border border-border rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary font-black uppercase tracking-widest text-xs transition-all placeholder:text-muted-foreground/30"
                            placeholder="¿EN QUÉ GASTASTE?"
                        />
                    </div>

                    {type === TransactionType.EXPENSE && (
                        <>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 px-1">Categoría</label>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setCategory(c)}
                                            className={`px-3.5 py-2.5 min-h-[40px] rounded-full text-[11px] font-bold uppercase tracking-wider transition-all border tap-transparent ${category === c ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-secondary border-transparent text-muted-foreground hover:bg-muted'}`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Exceptional Toggle */}
                            <div
                                onClick={() => setIsExceptional(!isExceptional)}
                                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${isExceptional ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-transparent'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${isExceptional ? 'bg-amber-100 text-amber-600' : 'bg-gray-200 text-gray-700'}`}>
                                        <AlertTriangle size={18} />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${isExceptional ? 'text-amber-900' : 'text-gray-700'}`}>Gasto Excepcional</p>
                                        <p className="text-xs text-gray-700">No afecta el ritmo diario habitual</p>
                                    </div>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isExceptional ? 'border-amber-500 bg-amber-500' : 'border-gray-300'}`}>
                                    {isExceptional && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-primary text-white font-black uppercase tracking-widest py-5 rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2"
                    >
                        <CheckCircle size={20} /> Confirmar Gasto
                    </button>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default CreateTransactionModal;
