import React from 'react';
import { MoreHorizontal, RefreshCcw, Coffee, Car, Home, Zap, ShoppingBag, Edit3, Trash2 } from 'lucide-react';
import { Transaction, TransactionType } from '../../types';

interface TransactionListProps {
    displayTransactions: Transaction[];
    currency: string;
    expandedTxId: string | null;
    toggleTxExpand: (id: string) => void;
    openEditModal: (tx: Transaction) => void;
    confirmDelete: (id: string) => void;
    handleOpenCycleModal: () => void;
}

const TransactionList: React.FC<TransactionListProps> = ({
    displayTransactions,
    currency,
    expandedTxId,
    toggleTxExpand,
    openEditModal,
    confirmDelete,
    handleOpenCycleModal
}) => {
    const getCategoryIcon = (cat: string) => {
        const c = cat.toLowerCase();
        if (c.includes('comida') || c.includes('restaurante')) return <Coffee size={20} />;
        if (c.includes('transporte') || c.includes('auto')) return <Car size={20} />;
        if (c.includes('casa') || c.includes('hogar')) return <Home size={20} />;
        if (c.includes('servicios') || c.includes('luz')) return <Zap size={20} />;
        return <ShoppingBag size={20} />;
    };

    return (
        <div>
            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-4 px-2">Movimientos</h3>

            <div className="space-y-3 pb-4">
                {displayTransactions.length === 0 ? (
                    <div className="text-center py-12 px-6 bg-white rounded-3xl border border-dashed border-gray-200">
                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <MoreHorizontal size={32} />
                        </div>
                        <p className="text-gray-900 font-semibold text-sm">Sin movimientos en este ciclo</p>
                        <button onClick={handleOpenCycleModal} className="text-xs text-blue-500 mt-2 font-bold">
                            Asegúrate de tener un ciclo activo
                        </button>
                    </div>
                ) : (
                    displayTransactions
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((t) => (
                            <div key={t.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                                <div
                                    onClick={() => toggleTxExpand(t.id)}
                                    className="p-4 flex items-center justify-between active:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 
                      ${t.type === TransactionType.INCOME ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-700'}`}>
                                            {t.type === TransactionType.INCOME ? <RefreshCcw size={22} /> : getCategoryIcon(t.category)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-gray-900 text-[15px] truncate">
                                                {t.description || 'Sin descripción'}
                                            </p>
                                            <p className="text-xs text-gray-700 font-medium flex items-center gap-1.5 mt-0.5">
                                                {new Date(t.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                                                {t.isExceptional && (
                                                    <span className="flex items-center gap-0.5 text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                                        Excepcional
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`font-bold text-[15px] whitespace-nowrap tabular-nums ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-gray-900'}`}>
                                        {t.type === TransactionType.INCOME ? '+' : '-'}{currency === 'EUR' ? '€' : '$'}{t.amount.toLocaleString()}
                                    </span>
                                </div>

                                {expandedTxId === t.id && (
                                    <div className="bg-gray-50 px-4 py-3 flex justify-end gap-3 border-t border-gray-100 animate-in">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openEditModal(t);
                                            }}
                                            className="flex items-center gap-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 px-4 py-2.5 rounded-xl hover:bg-gray-100 shadow-sm active:scale-95 transition-transform"
                                        >
                                            <Edit3 size={14} /> Editar
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                confirmDelete(t.id);
                                            }}
                                            className="flex items-center gap-2 text-xs font-bold text-red-600 bg-white border border-gray-200 px-4 py-2.5 rounded-xl hover:bg-red-50 shadow-sm active:scale-95 transition-transform"
                                        >
                                            <Trash2 size={14} /> Eliminar
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                )}
            </div>
        </div>
    );
};

export default TransactionList;
