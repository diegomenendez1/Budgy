import React from 'react';
import { MoreHorizontal, Coffee, Car, Home, Zap, ShoppingBag, Edit3, Trash2, ArrowUpRight } from 'lucide-react';
import { Transaction, TransactionType } from '../../types';
import { Button } from '../ui/Button';
import { formatCurrency, cn } from '../../lib/utils';

interface TransactionListProps {
    displayTransactions: Transaction[];
    currency: string;
    expandedTxId: string | null;
    toggleTxExpand: (id: string) => void;
    openEditModal: (tx: Transaction) => void;
    confirmDelete: (id: string) => void;
    handleOpenCycleModal: () => void;
}

const getCategoryIcon = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('comida') || c.includes('restaurante')) return <Coffee size={16} />;
    if (c.includes('transporte') || c.includes('auto')) return <Car size={16} />;
    if (c.includes('casa') || c.includes('hogar')) return <Home size={16} />;
    if (c.includes('servicios') || c.includes('luz')) return <Zap size={16} />;
    return <ShoppingBag size={16} />;
};

const TransactionList: React.FC<TransactionListProps> = ({
    displayTransactions,
    currency,
    expandedTxId,
    toggleTxExpand,
    openEditModal,
    confirmDelete,
    handleOpenCycleModal
}) => {
    return (
        <div>
            <h3 className="text-xs font-semibold text-slate-500 mb-3">Movimientos</h3>

            <div className="space-y-2 pb-8">
                {displayTransactions.length === 0 ? (
                    <button
                        onClick={handleOpenCycleModal}
                        className="w-full text-center py-10 px-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 transition-all active:scale-[0.98] hover:bg-slate-100 hover:border-blue-300"
                    >
                        <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 text-blue-600 border border-blue-200">
                            <MoreHorizontal size={24} />
                        </div>
                        <p className="text-slate-900 font-medium text-sm">Sin movimientos</p>
                        <span className="text-xs text-blue-600 mt-1.5 block">Toca para configurar ciclo</span>
                    </button>
                ) : (
                    displayTransactions
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((t) => {
                            const isIncome = t.type === TransactionType.INCOME;
                            const isExpanded = expandedTxId === t.id;

                            return (
                                <div
                                    key={t.id}
                                    className="bg-white rounded-xl border border-slate-200/60 overflow-hidden hover:bg-slate-50 transition-colors"
                                >
                                    <div
                                        onClick={() => toggleTxExpand(t.id)}
                                        className="p-3.5 flex items-center justify-between active:bg-slate-100 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border",
                                                isIncome
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : 'bg-slate-100 text-slate-500 border-slate-200'
                                            )}>
                                                {isIncome ? <ArrowUpRight size={16} /> : getCategoryIcon(t.category)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-slate-900 text-sm truncate max-w-[160px]">
                                                    {t.description || 'Sin descripcion'}
                                                </p>
                                                <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                                    {new Date(t.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                                    {t.isExceptional && (
                                                        <span className="text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium border border-amber-200">
                                                            Excepcional
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "font-semibold text-sm whitespace-nowrap tabular-nums",
                                            isIncome ? 'text-emerald-700' : 'text-slate-900'
                                        )}>
                                            {formatCurrency(isIncome ? t.amount : -t.amount, currency)}
                                        </span>
                                    </div>

                                    {isExpanded && (
                                        <div className="bg-slate-50 px-3.5 py-2 flex justify-end gap-2 border-t border-slate-200 animate-in fade-in duration-150">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => { e.stopPropagation(); openEditModal(t); }}
                                                className="h-11 px-4 text-xs"
                                            >
                                                <Edit3 size={13} className="mr-1.5" /> Editar
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={(e) => { e.stopPropagation(); confirmDelete(t.id); }}
                                                className="h-11 px-4 text-xs"
                                            >
                                                <Trash2 size={13} className="mr-1.5" /> Eliminar
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                )}
            </div>
        </div>
    );
};

export default TransactionList;
