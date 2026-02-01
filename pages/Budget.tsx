import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Transaction, TransactionType } from '../types';
import { RefreshCcw } from 'lucide-react';

// Components
import CycleCard from '../components/budget/CycleCard';
import WeeklyBreakdown from '../components/budget/WeeklyBreakdown';
import TransactionList from '../components/budget/TransactionList';
import CycleModal from '../components/budget/modals/CycleModal';
import EditTransactionModal from '../components/budget/modals/EditTransactionModal';
import DeleteConfirmationModal from '../components/budget/modals/DeleteConfirmationModal';
import SettingsModal from '../components/budget/modals/SettingsModal';
import { Settings } from 'lucide-react';

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
        <div className="flex flex-col items-center justify-center h-[70vh] text-center px-6">
          <div className="bg-gray-100 p-4 rounded-full mb-4 text-gray-600">
            <RefreshCcw size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sin Ciclo Activo</h2>
          <p className="text-gray-700 text-sm mb-6">Comienza un nuevo ciclo para rastrear tus gastos y metas.</p>
          <button
            onClick={() => setIsCycleModalOpen(true)}
            className="bg-black text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-gray-200 active:scale-95 transition-transform"
          >
            Iniciar Nuevo Ciclo
          </button>
        </div>


        {/* Fallback for transactions without cycle */}
        {
          transactions.length > 0 && (
            <div className="px-4 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-2 mb-4 opacity-50">
                <div className="h-px bg-gray-300 flex-1"></div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Historial Reciente (Sin Ciclo)</span>
                <div className="h-px bg-gray-300 flex-1"></div>
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
    <div className="animate-in space-y-6 pt-2 relative">
      <button
        onClick={() => setIsSettingsModalOpen(true)}
        className="absolute top-0 right-2 z-10 p-2 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
      >
        <Settings size={20} />
      </button>

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
        <div className="px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Transacciones Fuera de Ciclo
            </div>
            <p className="text-xs text-amber-600/80 dark:text-amber-500/80 mb-0">
              Estas transacciones tienen una fecha que no coincide con el ciclo activo ({new Date(activeCycle?.startDate!).toLocaleDateString()} - {new Date(activeCycle?.endDate!).toLocaleDateString()}).
            </p>
          </div>

          <div className="opacity-70 grayscale-[0.3]">
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
