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
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 px-2">Movimientos</h3>

            <div className="space-y-3 pb-24">
                {displayTransactions.length === 0 ? (
                    <button
                        onClick={handleOpenCycleModal}
                        className="w-full text-center py-16 px-6 bg-card rounded-[2rem] border border-dashed border-border group transition-all active:scale-95"
                    >
                        <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground group-hover:scale-110 transition-transform">
                            <MoreHorizontal size={32} />
                        </div>
                        <p className="text-foreground font-bold text-sm">Sin movimientos</p>
                        <span className="text-xs text-primary mt-2 font-bold block">
                            Toca para configurar ciclo
                        </span>
                    </button>
                ) : (
                    displayTransactions
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((t) => (
                            <div key={t.id} className="bg-card rounded-[1.5rem] shadow-sm border border-border/50 overflow-hidden transition-all duration-300">
                                <div
                                    onClick={() => toggleTxExpand(t.id)}
                                    className="p-4 flex items-center justify-between active:bg-muted/50 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-border/10
                                            ${t.type === TransactionType.INCOME
                                                ? 'bg-gradient-to-br from-green-500/20 to-emerald-600/20 text-green-600 dark:text-green-400'
                                                : 'bg-muted text-foreground'
                                            }`}
                                        >
                                            {t.type === TransactionType.INCOME ? <RefreshCcw size={20} /> : getCategoryIcon(t.category)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-foreground text-[15px] truncate max-w-[160px]">
                                                {t.description || 'Sin descripción'}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                                                {new Date(t.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                                {t.isExceptional && (
                                                    <span className="flex items-center gap-0.5 text-orange-600 bg-orange-500/10 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border border-orange-500/20">
                                                        Excepcional
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`font-black text-[15px] whitespace-nowrap tabular-nums ${t.type === TransactionType.INCOME ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                                        {t.type === TransactionType.INCOME ? '+' : '-'}{currency === 'EUR' ? '€' : '$'}{t.amount.toLocaleString()}
                                    </span>
                                </div>

                                {expandedTxId === t.id && (
                                    <div className="bg-muted/30 px-4 py-3 flex justify-end gap-3 border-t border-border/50 animate-in slide-in-from-top-2 duration-200">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openEditModal(t);
                                            }}
                                            className="flex items-center gap-2 text-xs font-bold text-foreground bg-card border border-border px-4 py-2.5 rounded-xl hover:bg-muted shadow-sm active:scale-95 transition-all"
                                        >
                                            <Edit3 size={14} /> Editar
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                confirmDelete(t.id);
                                            }}
                                            className="flex items-center gap-2 text-xs font-bold text-destructive bg-card border border-border px-4 py-2.5 rounded-xl hover:bg-destructive/10 shadow-sm active:scale-95 transition-all"
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
