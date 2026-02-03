import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Transaction } from '../types';
import { RefreshCcw, Settings, AlertTriangle } from 'lucide-react';

// Components
import CycleCard from '../components/budget/CycleCard';
import WeeklyBreakdown from '../components/budget/WeeklyBreakdown';
import TransactionList from '../components/budget/TransactionList';
import CycleModal from '../components/budget/modals/CycleModal';
import EditTransactionModal from '../components/budget/modals/EditTransactionModal';
import DeleteConfirmationModal from '../components/budget/modals/DeleteConfirmationModal';
import SettingsModal from '../components/budget/modals/SettingsModal';

const Budget: React.FC = () => {
  const {
    activeCycle,
    createCycle,
    cycleMetrics,
    weeklyBreakdown,
    currentWeekStatus,
    transactions,
    updateTransaction,
    deleteTransaction,
    currentSavingsGoal,
    setSavingsGoal,
    totalDisposableIncome,
    categories,
    currency
  } = useFinance();

  const [showWeeklyDetail, setShowWeeklyDetail] = useState(false);
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Delete Confirmation State
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  // Filter transactions for display
  const displayTransactions = activeCycle ? transactions.filter(t => {
    const d = new Date(t.date);
    const start = new Date(activeCycle.startDate);
    const end = new Date(activeCycle.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return d >= start && d <= end;
  }) : [];

  const outOfCycleTransactions = activeCycle ? transactions.filter(t => !displayTransactions.find(dt => dt.id === t.id)) : [];

  const handleEditSavings = () => {
    // In a real mobile app, use a custom modal instead of prompt
    const newGoal = prompt("Define tu meta de ahorro para este ciclo:", currentSavingsGoal.toString());
    if (newGoal !== null && !isNaN(parseFloat(newGoal))) {
      setSavingsGoal(parseFloat(newGoal));
    }
  };

  const toggleTxExpand = (id: string) => {
    setExpandedTxId(prev => prev === id ? null : id);
  };

  const openEditModal = (tx: Transaction) => {
    setEditingTx(tx);
    setIsEditModalOpen(true);
  };

  const handleUpdateTransaction = (updatedTx: Transaction) => {
    updateTransaction(updatedTx);
  };

  const confirmDelete = (id: string) => {
    setDeleteConfirmationId(id);
  };

  const executeDelete = () => {
    if (deleteConfirmationId) {
      deleteTransaction(deleteConfirmationId);
      setDeleteConfirmationId(null);
    }
  };

  if (!activeCycle) {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-[70vh] text-center px-6 animate-in zoom-in-95 duration-500">
          <div className="bg-muted p-5 rounded-full mb-6 text-muted-foreground shadow-inner">
            <RefreshCcw size={40} strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-3 tracking-tight">Sin Ciclo Activo</h2>
          <p className="text-muted-foreground text-sm mb-8 max-w-[280px] leading-relaxed">
            Comienza un nuevo ciclo financiero para rastrear tus gastos y proteger tu dinero.
          </p>
          <button
            onClick={() => setIsCycleModalOpen(true)}
            className="bg-primary text-primary-foreground px-8 py-4 rounded-[1.25rem] font-bold shadow-lg shadow-primary/25 active:scale-95 transition-all hover:bg-primary/90"
          >
            Iniciar Nuevo Ciclo
          </button>
        </div>


        {/* Fallback for transactions without cycle */}
        {
          transactions.length > 0 && (
            <div className="px-4 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-4 mb-6 opacity-60">
                <div className="h-px bg-border flex-1"></div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Reciente (Sin Ciclo)</span>
                <div className="h-px bg-border flex-1"></div>
              </div>
              <TransactionList
                displayTransactions={transactions.slice(0, 5)}
                currency={currency}
                expandedTxId={expandedTxId}
                toggleTxExpand={toggleTxExpand}
                openEditModal={openEditModal}
                confirmDelete={confirmDelete}
                handleOpenCycleModal={() => setIsCycleModalOpen(true)}
              />
            </div>
          )
        }

        <CycleModal
          isOpen={isCycleModalOpen}
          onClose={() => setIsCycleModalOpen(false)}
          onCreateCycle={createCycle}
          initialBudgetGuess={totalDisposableIncome}
        />
      </>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6 pt-4 relative pb-24">
      <header className="px-2 flex justify-between items-start mb-2">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Presupuesto</h1>
          <p className="text-muted-foreground text-sm font-medium">Control total en tus manos</p>
        </div>
        <button
          onClick={() => setIsSettingsModalOpen(true)}
          className="p-3 bg-card border border-border/50 rounded-2xl shadow-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all active:scale-95"
        >
          <Settings size={20} />
        </button>
      </header>

      <CycleCard
        activeCycle={activeCycle}
        cycleMetrics={cycleMetrics}
        currentWeekStatus={currentWeekStatus}
        currency={currency}
        onEditSavings={handleEditSavings}
        onOpenCycleModal={() => setIsCycleModalOpen(true)}
      />

      <WeeklyBreakdown
        weeklyBreakdown={weeklyBreakdown}
        activeCycle={activeCycle}
        cycleMetrics={cycleMetrics}
        showWeeklyDetail={showWeeklyDetail}
        setShowWeeklyDetail={setShowWeeklyDetail}
      />

      <TransactionList
        displayTransactions={displayTransactions}
        currency={currency}
        expandedTxId={expandedTxId}
        toggleTxExpand={toggleTxExpand}
        openEditModal={openEditModal}
        confirmDelete={confirmDelete}
        handleOpenCycleModal={() => setIsCycleModalOpen(true)}
      />

      {/* Out of Cycle Warning Section */}
      {outOfCycleTransactions.length > 0 && (
        <div className="px-1 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-[1.5rem] p-5 mb-4">
            <div className="flex items-center gap-3 mb-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
              <div className="bg-amber-500/20 p-1.5 rounded-lg">
                <AlertTriangle size={16} />
              </div>
              <span className="tracking-tight">Movimientos Fuera de Ciclo</span>
            </div>
            <p className="text-xs text-muted-foreground/80 leading-relaxed font-medium pl-1">
              Transacciones con fecha distinta al ciclo activo.
              <br />
              <span className="opacity-70 text-[10px] mt-1 block font-mono">
                Ciclo: {new Date(activeCycle?.startDate!).toLocaleDateString()} - {new Date(activeCycle?.endDate!).toLocaleDateString()}
              </span>
            </p>
          </div>

          <div className="opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 transition-all duration-300">
            <div className="bg-muted h-px w-full mb-6"></div>
            <TransactionList
              displayTransactions={outOfCycleTransactions}
              currency={currency}
              expandedTxId={expandedTxId}
              toggleTxExpand={toggleTxExpand}
              openEditModal={openEditModal}
              confirmDelete={confirmDelete}
              handleOpenCycleModal={() => { }}
            />
          </div>
        </div>
      )}

      <CycleModal
        isOpen={isCycleModalOpen}
        onClose={() => setIsCycleModalOpen(false)}
        onCreateCycle={createCycle}
        initialBudgetGuess={totalDisposableIncome}
      />

      <EditTransactionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        transaction={editingTx}
        onUpdate={handleUpdateTransaction}
        categories={categories}
      />

      <DeleteConfirmationModal
        isOpen={!!deleteConfirmationId}
        onClose={() => setDeleteConfirmationId(null)}
        onConfirm={executeDelete}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
};

export default Budget;
