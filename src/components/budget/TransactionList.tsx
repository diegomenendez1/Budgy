import React from 'react';
import { MoreHorizontal, RefreshCcw, Coffee, Car, Home, Zap, ShoppingBag, Edit3, Trash2 } from 'lucide-react';
import { Transaction, TransactionType } from '../../types';
import { Button } from '../ui/Button';

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
        if (c.includes('comida') || c.includes('restaurante')) return <Coffee size={18} />;
        if (c.includes('transporte') || c.includes('auto')) return <Car size={18} />;
        if (c.includes('casa') || c.includes('hogar')) return <Home size={18} />;
        if (c.includes('servicios') || c.includes('luz')) return <Zap size={18} />;
        return <ShoppingBag size={18} />;
    };

    return (
        <div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-2">Movimientos</h3>

            <div className="space-y-3 pb-24">
                {displayTransactions.length === 0 ? (
                    <button
                        onClick={handleOpenCycleModal}
                        className="w-full text-center py-12 px-6 bg-white/5 rounded-[2rem] border border-dashed border-white/10 group transition-all active:scale-95 hover:bg-white/10 backdrop-blur-sm"
                    >
                        <div className="bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 group-hover:scale-110 transition-transform group-hover:text-white group-hover:bg-white/20">
                            <MoreHorizontal size={32} />
                        </div>
                        <p className="text-white font-bold text-sm">Sin movimientos</p>
                        <span className="text-xs text-indigo-400 mt-2 font-bold block">
                            Toca para configurar ciclo
                        </span>
                    </button>
                ) : (
                    displayTransactions
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((t) => (
                            <div key={t.id} className="bg-white/5 rounded-[1.5rem] shadow-sm border border-white/10 overflow-hidden transition-all duration-300 backdrop-blur-sm hover:bg-white/10">
                                <div
                                    onClick={() => toggleTxExpand(t.id)}
                                    className="p-4 flex items-center justify-between active:bg-white/5 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner border border-white/5
                                            ${t.type === TransactionType.INCOME
                                                ? 'bg-emerald-500/10 text-emerald-400'
                                                : 'bg-white/5 text-gray-300'
                                            }`}
                                        >
                                            {t.type === TransactionType.INCOME ? <RefreshCcw size={20} /> : getCategoryIcon(t.category)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-white text-[15px] truncate max-w-[160px]">
                                                {t.description || 'Sin descripción'}
                                            </p>
                                            <p className="text-[11px] text-gray-400 font-medium flex items-center gap-1.5 mt-0.5">
                                                {new Date(t.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                                {t.isExceptional && (
                                                    <span className="flex items-center gap-0.5 text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border border-amber-500/20">
                                                        Excepcional
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`font-black text-[15px] whitespace-nowrap tabular-nums ${t.type === TransactionType.INCOME ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]' : 'text-white'}`}>
                                        {t.type === TransactionType.INCOME ? '+' : '-'}{currency === 'EUR' ? '€' : '$'}{t.amount.toLocaleString()}
                                    </span>
                                </div>

                                {expandedTxId === t.id && (
                                    <div className="bg-black/20 px-4 py-3 flex justify-end gap-3 border-t border-white/5 animate-in slide-in-from-top-2 duration-200">
                                        <Button
                                            size="sm"
                                            variant="glass"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openEditModal(t);
                                            }}
                                            className="h-9 px-4 text-xs"
                                        >
                                            <Edit3 size={14} className="mr-2" /> Editar
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                confirmDelete(t.id);
                                            }}
                                            className="h-9 px-4 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                                        >
                                            <Trash2 size={14} className="mr-2" /> Eliminar
                                        </Button>
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
