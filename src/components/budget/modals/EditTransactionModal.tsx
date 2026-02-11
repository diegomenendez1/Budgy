import React, { useState, useEffect } from 'react';
import { X, ArrowUp, ArrowDown, AlertTriangle, Save } from 'lucide-react';
import { Transaction, TransactionType } from '../../../types';

interface EditTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: Transaction | null;
    onUpdate: (updatedTx: Transaction) => void;
    categories: string[];
}

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
    isOpen,
    onClose,
    transaction,
    onUpdate,
    categories
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
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 pb-safe sm:pb-6 shadow-2xl relative z-10 overflow-hidden animate-in sm:m-4">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Editar Transacción</h3>
                    <button onClick={onClose} aria-label="Cerrar modal" className="bg-gray-100 p-2 rounded-full text-gray-700">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleUpdateTransaction} className="space-y-5">

                    {/* Type Switcher */}
                    <div className="flex bg-gray-100 p-1 rounded-2xl">
                        <button
                            type="button"
                            onClick={() => setEditType(TransactionType.EXPENSE)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${editType === TransactionType.EXPENSE ? 'bg-white text-red-600 shadow-sm' : 'text-gray-700'}`}
                        >
                            <ArrowUp size={16} /> Gasto
                        </button>
                        <button
                            type="button"
                            onClick={() => setEditType(TransactionType.INCOME)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${editType === TransactionType.INCOME ? 'bg-white text-green-600 shadow-sm' : 'text-gray-700'}`}
                        >
                            <ArrowDown size={16} /> Ingreso
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Monto</label>
                        <div className="relative">
                            <span className={`absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-bold ${editType === TransactionType.INCOME ? 'text-green-500' : 'text-gray-600'}`}>$</span>
                            <input
                                type="number"
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                className={`w-full text-4xl font-bold border-b-2 border-gray-100 focus:border-black focus:outline-none py-2 pl-6 bg-transparent transition-colors placeholder:text-gray-300 ${editType === TransactionType.INCOME ? 'text-green-600' : 'text-gray-900'}`}
                                placeholder="0"
                                inputMode="decimal"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                        <input
                            type="text"
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            className="w-full p-4 bg-gray-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 font-medium text-lg"
                            placeholder="Descripción..."
                        />
                    </div>

                    {editType === TransactionType.EXPENSE && (
                        <>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría</label>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setEditCategory(c)}
                                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${editCategory === c ? 'bg-black text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
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
                        className="w-full bg-black text-white font-bold py-4 rounded-2xl shadow-lg shadow-black/20 active:scale-[0.98] transition-all text-lg flex items-center justify-center gap-2"
                    >
                        <Save size={20} /> Guardar Cambios
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditTransactionModal;
