import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Transaction, TransactionType } from '../types';
import { Settings, AlertTriangle, Plus, Wallet } from 'lucide-react';
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
    activeCycle, createCycle, cycleMetrics, weeklyBreakdown, currentWeekStatus,
    transactions, updateTransaction, deleteTransaction, currentSavingsGoal,
    setSavingsGoal, totalBudgetBeforeSavings, categories, currency, addTransaction
  } = useFinance();

  const [showWeeklyDetail, setShowWeeklyDetail] = useState(false);
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  const handleCreateTransaction = (amount: number, description: string, category: string, type: TransactionType, isExceptional: boolean) => {
    addTransaction({ amount, description, category, type, isExceptional, date: new Date().toISOString() });
    setIsCreateModalOpen(false);
  };

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
    if (newGoal !== null && !isNaN(parseFloat(newGoal))) setSavingsGoal(parseFloat(newGoal));
  };

  const toggleTxExpand = (id: string) => setExpandedTxId(prev => prev === id ? null : id);
  const openEditModal = (tx: Transaction) => { setEditingTx(tx); setIsEditModalOpen(true); };
  const handleUpdateTransaction = (updatedTx: Transaction) => updateTransaction(updatedTx);
  const confirmDelete = (id: string) => setDeleteConfirmationId(id);
  const executeDelete = () => { if (deleteConfirmationId) { deleteTransaction(deleteConfirmationId); setDeleteConfirmationId(null); } };

  // EMPTY STATE
  if (!activeCycle) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-200 mb-6">
          <Wallet size={28} className="text-blue-600" />
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-2 font-sans">
          Tu nuevo comienzo financiero
        </h2>
        <p className="text-slate-500 text-sm mb-8 max-w-[280px] leading-relaxed font-sans">
          Un ciclo te ayuda a saber exactamente cuanto puedes gastar sin culpa.
        </p>

        <button
          onClick={() => setIsCycleModalOpen(true)}
          className="w-full max-w-xs h-12 px-8 text-base font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.97] transition-all duration-150 shadow-sm font-sans"
        >
          Empezar Ciclo
        </button>

        {transactions.length > 0 && (
          <div className="w-full mt-10 text-left max-w-md mx-auto">
            <p className="text-xs text-slate-500 font-medium mb-4 px-1 font-sans">Movimientos Recientes</p>
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

        <CycleModal isOpen={isCycleModalOpen} onClose={() => setIsCycleModalOpen(false)} onCreateCycle={createCycle} initialBudgetGuess={totalBudgetBeforeSavings} />
      </div>
    );
  }

  // ACTIVE CYCLE
  return (
    <div className="space-y-6 pt-6 pb-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">Presupuesto</h1>
          <p className="text-slate-500 text-xs font-medium font-sans">Control total en tus manos</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-colors"
          >
            <Plus size={20} className="text-slate-700" />
          </button>
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-colors"
          >
            <Settings size={18} className="text-slate-700" />
          </button>
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
        <div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-3">
            <div className="flex items-center gap-2 mb-1 text-amber-700 font-medium text-sm font-sans">
              <AlertTriangle size={14} />
              <span>Fuera de Ciclo</span>
            </div>
            <p className="text-[11px] text-amber-600 leading-relaxed font-sans">
              Transacciones con fecha distinta al ciclo activo.
            </p>
          </div>
          <div className="opacity-50 hover:opacity-100 transition-opacity duration-300">
            <TransactionList
              displayTransactions={outOfCycleTransactions}
              currency={currency}
              expandedTxId={expandedTxId}
              toggleTxExpand={toggleTxExpand}
              openEditModal={openEditModal}
              confirmDelete={confirmDelete}
              handleOpenCycleModal={() => {}}
            />
          </div>
        </div>
      )}

      <CycleModal isOpen={isCycleModalOpen} onClose={() => setIsCycleModalOpen(false)} onCreateCycle={createCycle} initialBudgetGuess={totalBudgetBeforeSavings} />
      <EditTransactionModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} transaction={editingTx} onUpdate={handleUpdateTransaction} categories={categories} />
      <DeleteConfirmationModal isOpen={!!deleteConfirmationId} onClose={() => setDeleteConfirmationId(null)} onConfirm={executeDelete} />
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
      <CreateTransactionModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreate={handleCreateTransaction} categories={categories} currency={currency} />
    </div>
  );
};

export default Budget;
