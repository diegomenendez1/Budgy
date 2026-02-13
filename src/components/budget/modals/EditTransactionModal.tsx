import React, { useState, useEffect } from 'react';
import { X, ArrowUp, ArrowDown, AlertTriangle, Save } from 'lucide-react';
import { Transaction, TransactionType } from '../../../types';

interface EditTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: Transaction | null;
    onUpdate: (updatedTx: Transaction) => void;
    categories: string[];
    currency?: string;
}


const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
    isOpen,
    onClose,
    transaction,
    onUpdate,
    categories,
    currency = 'USD'
}) => {

    const [editAmount, setEditAmount] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [editType, setEditType] = useState<TransactionType>(TransactionType.EXPENSE);
    const [editIsExceptional, setEditIsExceptional] = useState(false);

    useEffect(() => {
        if (transaction && isOpen) {
            setEditAmount(transaction.amount.toString());
            setEditDesc(transaction.description);
            setEditCategory(transaction.category);
            setEditType(transaction.type);
            setEditIsExceptional(!!transaction.isExceptional);
        }
    }, [transaction, isOpen]);

    const handleUpdateTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        if (!transaction || !editAmount) return;

        onUpdate({
            ...transaction,
            amount: parseFloat(editAmount),
            description: editDesc || (editType === TransactionType.INCOME ? 'Ingreso' : 'Gasto'),
            category: editType === TransactionType.INCOME ? 'Ingreso' : editCategory,
            type: editType,
            isExceptional: editType === TransactionType.EXPENSE ? editIsExceptional : false
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
            <div className="bg-card w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 pb-safe sm:pb-8 shadow-2xl relative z-10 overflow-hidden animate-in sm:m-4 border border-border">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight italic leading-none">Editar Transacción</h3>
                    <button onClick={onClose} aria-label="Cerrar modal" className="bg-secondary p-2 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleUpdateTransaction} className="space-y-5">

                    {/* Type Switcher */}
                    <div className="flex bg-secondary p-1.5 rounded-[1.25rem] border border-border">
                        <button
                            type="button"
                            onClick={() => setEditType(TransactionType.EXPENSE)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${editType === TransactionType.EXPENSE ? 'bg-background text-red-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <ArrowUp size={16} /> Gasto
                        </button>
                        <button
                            type="button"
                            onClick={() => setEditType(TransactionType.INCOME)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${editType === TransactionType.INCOME ? 'bg-background text-green-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <ArrowDown size={16} /> Ingreso
                        </button>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 px-1">Monto</label>
                        <div className="relative">
                            <span className={`absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-black ${editType === TransactionType.INCOME ? 'text-green-500' : 'text-muted-foreground/30'}`}>{currency === 'EUR' ? '€' : '$'}</span>

                            <input
                                type="number"
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                className={`w-full text-4xl font-black border-b-2 border-border focus:border-primary focus:outline-none py-4 pl-6 bg-transparent transition-colors placeholder:text-muted-foreground/10 ${editType === TransactionType.INCOME ? 'text-green-600' : 'text-foreground'}`}
                                placeholder="0"
                                inputMode="decimal"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 px-1">Descripción</label>
                        <input
                            type="text"
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            className="w-full p-4 bg-secondary border border-border rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary font-black uppercase tracking-widest text-xs transition-all placeholder:text-muted-foreground/30"
                            placeholder="DESCRIPCIÓN..."
                        />
                    </div>

                    {editType === TransactionType.EXPENSE && (
                        <>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 px-1">Categoría</label>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setEditCategory(c)}
                                            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${editCategory === c ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-secondary border-transparent text-muted-foreground hover:bg-muted'}`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Exceptional Toggle */}
                            <div
                                onClick={() => setEditIsExceptional(!editIsExceptional)}
                                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${editIsExceptional ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-transparent'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${editIsExceptional ? 'bg-amber-100 text-amber-600' : 'bg-gray-200 text-gray-700'}`}>
                                        <AlertTriangle size={18} />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${editIsExceptional ? 'text-amber-900' : 'text-gray-700'}`}>Gasto Excepcional</p>
                                        <p className="text-xs text-gray-700">No afecta el ritmo diario habitual</p>
                                    </div>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${editIsExceptional ? 'border-amber-500 bg-amber-500' : 'border-gray-300'}`}>
                                    {editIsExceptional && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-primary text-white font-black uppercase tracking-widest py-5 rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2"
                    >
                        <Save size={20} /> Guardar Cambios
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditTransactionModal;
