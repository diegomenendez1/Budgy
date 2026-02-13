import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Transaction, TransactionType } from '../types';
import { RefreshCcw, Settings, AlertTriangle, Plus } from 'lucide-react';

// UI Components
import { Button } from '../components/ui/Button';

// Budget Components
import CycleCard from '../components/budget/CycleCard';
import WeeklyBreakdown from '../components/budget/WeeklyBreakdown';
import TransactionList from '../components/budget/TransactionList';
import CycleModal from '../components/budget/modals/CycleModal';
import EditTransactionModal from '../components/budget/modals/EditTransactionModal';
import DeleteConfirmationModal from '../components/budget/modals/DeleteConfirmationModal';
import SettingsModal from '../components/budget/modals/SettingsModal';
import CreateTransactionModal from '../components/budget/modals/CreateTransactionModal';

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
    currency,
    addTransaction
  } = useFinance();

  const [showWeeklyDetail, setShowWeeklyDetail] = useState(false);
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateTransaction = (amount: number, description: string, category: string, type: TransactionType, isExceptional: boolean) => {
    addTransaction({
      amount,
      description,
      category,
      type,
      isExceptional,
      date: new Date().toISOString()
    });
    setIsCreateModalOpen(false);
  };

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

  // RENDER EMPTY STATE (NO ACTIVE CYCLE)
  if (!activeCycle) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-8 animate-in fade-in zoom-in duration-700">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
          <div className="relative bg-card/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-border/50 shadow-2xl">
            <RefreshCcw size={48} className="text-primary animate-spin-slow" strokeWidth={1.5} />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-foreground mb-4 tracking-tight leading-tight">
          Tu nuevo comienzo <br /> <span className="text-primary">financiero</span>
        </h2>

        <p className="text-muted-foreground text-sm mb-10 max-w-[300px] leading-relaxed">
          Define tus metas y toma el control. Un ciclo te ayuda a saber exactamente cuánto puedes gastar sin culpa.
        </p>

        <Button
          onClick={() => setIsCycleModalOpen(true)}
          size="lg"
          className="w-full max-w-xs text-lg h-14 rounded-2xl shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          ¡Empezar Ciclo Ahora!
        </Button>

        {/* Recent Transactions fall-through for users without cycle */}
        {transactions.length > 0 && (
          <div className="w-full mt-12 px-2 pb-24 text-left max-w-md mx-auto">
            <div className="flex items-center gap-4 mb-6 opacity-60">
              <div className="h-px bg-white/10 flex-1"></div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Movimientos Recientes</span>
              <div className="h-px bg-white/10 flex-1"></div>
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
        )}

        <CycleModal
          isOpen={isCycleModalOpen}
          onClose={() => setIsCycleModalOpen(false)}
          onCreateCycle={createCycle}
          initialBudgetGuess={totalDisposableIncome}
        />
      </div>
    );
  }

  // RENDER BUDGET VIEW (ACTIVE CYCLE)
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-8 pt-6 relative pb-32">
      <header className="flex justify-between items-center px-1">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight italic uppercase">Presupuesto</h1>
          <p className="text-muted-foreground text-sm font-medium">Control total en tus manos</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="glass"
            size="icon"
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-full w-12 h-12 bg-primary/20 hover:bg-primary/30 text-primary border-primary/20"
          >
            <Plus size={24} />
          </Button>
          <Button
            variant="glass"
            size="icon"
            onClick={() => setIsSettingsModalOpen(true)}
            className="rounded-full w-12 h-12"
          >
            <Settings size={20} />
          </Button>
        </div>
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

      {outOfCycleTransactions.length > 0 && (
        <div className="px-4 py-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-[1.5rem] p-5 mb-4 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-2 text-amber-400 font-bold text-sm">
              <div className="bg-amber-500/20 p-1.5 rounded-lg">
                <AlertTriangle size={16} />
              </div>
              <span className="tracking-tight">Movimientos Fuera de Ciclo</span>
            </div>
            <p className="text-xs text-muted-foreground/80 leading-relaxed font-medium pl-1">
              Transacciones con fecha distinta al ciclo activo.
            </p>
          </div>

          <div className="opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 transition-all duration-300">
            <div className="bg-white/10 h-px w-full mb-6"></div>
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

      <CreateTransactionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateTransaction}
        categories={categories}
        currency={currency}
      />
    </div>
  );
};

export default Budget;
