import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Transaction } from '../types';
import { RefreshCcw, Settings, AlertTriangle } from 'lucide-react';

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
          <div className="bg-white/10 p-5 rounded-full mb-6 text-white shadow-[0_0_30px_rgba(255,255,255,0.1)] backdrop-blur-md border border-white/20">
            <RefreshCcw size={40} strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Sin Ciclo Activo</h2>
          <p className="text-gray-400 text-sm mb-8 max-w-[280px] leading-relaxed">
            Comienza un nuevo ciclo financiero para rastrear tus gastos y proteger tu dinero.
          </p>
          <Button
            onClick={() => setIsCycleModalOpen(true)}
            size="lg"
            variant="premium"
            className="w-full max-w-xs text-lg h-14"
          >
            Iniciar Nuevo Ciclo
          </Button>
        </div>


        {/* Fallback for transactions without cycle */}
        {
          transactions.length > 0 && (
            <div className="px-4 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-4 mb-6 opacity-60">
                <div className="h-px bg-white/10 flex-1"></div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reciente (Sin Ciclo)</span>
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
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-8 pt-6 relative pb-32">
      {/* Header */}
      <header className="px-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Presupuesto</h1>
          <p className="text-indigo-200 text-sm font-medium">Control total en tus manos</p>
        </div>
        <Button
          variant="glass"
          size="icon"
          onClick={() => setIsSettingsModalOpen(true)}
          className="rounded-full w-12 h-12"
        >
          <Settings size={20} />
        </Button>
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
        <div className="px-4 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-[1.5rem] p-5 mb-4 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-2 text-amber-400 font-bold text-sm">
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
    </div>
  );
};

export default Budget;
