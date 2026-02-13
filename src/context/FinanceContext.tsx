import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Transaction, RecurringItem, FinancialContextType, TransactionType, Cycle, CycleMetrics, CycleHistoryItem } from '../types';
import { calculateCycleMetrics, calculateWeeklyBreakdown } from '../lib/financeLogic';
import { useAuth } from './AuthContext';
import { AuthScreen } from '../components/AuthScreen';
import { migrateFromLocalStorage, db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTransactionManager } from '../hooks/useTransactionManager';
import { useRecurringManager } from '../hooks/useRecurringManager';
import { useCycleManager } from '../hooks/useCycleManager';

const FinanceContext = createContext<FinancialContextType | undefined>(undefined);

const DEFAULT_CATEGORIES = ["Comida", "Transporte", "Ocio", "Salud", "Compras", "Otros"];

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
};

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSyncing] = useState(false);

  // --- Initialization / Migration ---
  useEffect(() => {
    migrateFromLocalStorage();
  }, []);

  // --- Settings (Local Logic for now) ---
  const userSettings = useLiveQuery(() => db.userSettings.get(user?.id || 'local-user'), [user?.id]);
  const customCategories = userSettings?.custom_categories || [];
  const savingsGoal = userSettings?.savings_goal || 0;
  const currency = userSettings?.currency || 'USD';
  const apiKey = userSettings?.openai_api_key || '';

  // --- Modular Hooks ---
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useTransactionManager(user?.id);
  const { recurringItems, addRecurringItem, updateRecurringItem, deleteRecurringItem } = useRecurringManager(user?.id);
  const { cycles, createCycle } = useCycleManager(user?.id, savingsGoal);

  // --- Settings Actions ---
  // (In a full refactor, this would be useFinanceSettings hook)
  const setSavingsGoal = async (amount: number) => {
    await db.userSettings.put({
      id: user?.id || 'local-user',
      owner_id: user?.id || 'local-user',
      savings_goal: amount,
      custom_categories: customCategories,
      currency: currency,
      updated_at: new Date().toISOString()
    });
  };

  const setCurrency = async (curr: string) => {
    await db.userSettings.put({
      id: user?.id || 'local-user',
      owner_id: user?.id || 'local-user',
      savings_goal: savingsGoal,
      custom_categories: customCategories,
      currency: curr,
      openai_api_key: apiKey,
      updated_at: new Date().toISOString()
    });
  };

  const setApiKey = async (key: string) => {
    await db.userSettings.put({
      id: user?.id || 'local-user',
      owner_id: user?.id || 'local-user',
      savings_goal: savingsGoal,
      custom_categories: customCategories,
      currency: currency,
      openai_api_key: key,
      updated_at: new Date().toISOString()
    });
  };

  const addCategory = async (category: string) => {
    const trimmed = category.trim();
    if (!trimmed) return;
    // Optimized check
    const allCategories = new Set([...DEFAULT_CATEGORIES, ...customCategories]);
    if (!allCategories.has(trimmed)) {
      const newCustomCategories = [...customCategories, trimmed];
      await db.userSettings.put({
        id: user?.id || 'local-user',
        owner_id: user?.id || 'local-user',
        savings_goal: savingsGoal,
        custom_categories: newCustomCategories,
        currency: currency,
        updated_at: new Date().toISOString()
      });
    }
  };

  const categories = useMemo(() => {
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...customCategories]));
  }, [customCategories]);


  // --- Computed Business Logic ---

  const totalFixedIncome = recurringItems
    .filter(i => i.type === TransactionType.INCOME)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalFixedExpenses = recurringItems
    .filter(i => i.type === TransactionType.EXPENSE)
    .filter(item => {
      // Logic for active installment filtering
      if (!item.isInstallment) return true;
      if (!item.startDate || !item.totalInstallments) return true;

      const start = new Date(item.startDate);
      const now = new Date();
      // Month difference
      const monthsPassed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
      return monthsPassed >= 0 && monthsPassed < item.totalInstallments;
    })
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalDisposableIncome = totalFixedIncome - totalFixedExpenses - savingsGoal;

  // --- Active Cycle Logic ---
  const activeCycle = useMemo(() => cycles.find(c => c.isActive) || null, [cycles]);

  const activeCycleTransactions = useMemo(() => {
    if (!activeCycle) return [];
    const start = new Date(activeCycle.startDate);
    const end = new Date(activeCycle.endDate);
    // Ensure full day coverage
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= start && tDate <= end;
    });
  }, [activeCycle, transactions]);

  const cycleMetrics: CycleMetrics = useMemo(() => {
    return calculateCycleMetrics(activeCycle || null, activeCycleTransactions);
  }, [activeCycle, activeCycleTransactions]);

  const weeklyBreakdown = useMemo(() => {
    return calculateWeeklyBreakdown(activeCycle || null, activeCycleTransactions);
  }, [activeCycle, activeCycleTransactions, cycleMetrics]);

  const currentWeekStatus = weeklyBreakdown.find(w => w.isCurrent) || null;

  // --- Installments ---
  const activeInstallments = useMemo(() => {
    return recurringItems
      .filter(item => item.isInstallment && item.startDate && item.totalInstallments)
      .map(item => {
        const start = new Date(item.startDate!);
        const now = new Date();
        const monthsPassed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
        if (monthsPassed >= 0 && monthsPassed < item.totalInstallments!) {
          return {
            ...item,
            currentInstallment: monthsPassed + 1,
            remaining: item.totalInstallments! - (monthsPassed + 1)
          };
        }
        return null;
      })
      .filter((i): i is NonNullable<typeof i> => i !== null);
  }, [recurringItems]);

  // --- Utilities ---

  const transferSavingsToBudget = async () => {
    if (!activeCycle) return;
    const amountToTransfer = activeCycle.savingsGoal;
    if (amountToTransfer <= 0) return;

    await db.cycles.put({
      ...activeCycle,
      initialBudget: activeCycle.initialBudget + amountToTransfer,
      savingsGoal: 0,
      updated_at: new Date().toISOString()
    });
  };

  const cycleHistory: CycleHistoryItem[] = cycles
    .filter(c => !c.isActive)
    .map(c => {
      const cTransactions = transactions.filter(t => {
        const d = new Date(t.date);
        return d >= new Date(c.startDate) && d <= new Date(c.endDate) && t.type === TransactionType.EXPENSE;
      });
      const spent = cTransactions.reduce((acc, t) => acc + t.amount, 0);
      return {
        id: c.id,
        endDate: c.endDate,
        savingsGoal: c.savingsGoal,
        achievedSurplus: c.initialBudget - spent
      };
    });

  const wipeAllUserData = async () => {
    if (!confirm("Are you sure? This will delete all local data.")) return;
    await db.delete();
    await db.open();
    window.location.reload();
  };
  const resetData = wipeAllUserData;

  const generateDataPacket = (range: 'current_cycle' | 'last_30_days' | 'current_month') => {
    // ... (Logic kept same for AI context packet)
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    if (range === 'current_cycle' && activeCycle) {
      startDate = new Date(activeCycle.startDate);
      endDate = new Date(activeCycle.endDate);
    } else if (range === 'last_30_days') {
      startDate.setDate(now.getDate() - 30);
    } else if (range === 'current_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const rangeTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= startDate && tDate <= endDate;
    });

    const totalSpent = rangeTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((acc, t) => acc + t.amount, 0);

    const totalIncome = rangeTransactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((acc, t) => acc + t.amount, 0);

    const categoryTotals: Record<string, number> = {};
    rangeTransactions.filter(t => t.type === TransactionType.EXPENSE).forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    const topCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([cat, amount]) => ({ category: cat, amount }));

    const significantExpenses = rangeTransactions
      .filter(t => t.type === TransactionType.EXPENSE && t.amount > 500)
      .slice(0, 5)
      .map(t => ({ desc: t.description, amount: t.amount, date: t.date }));

    return {
      context: range,
      period: { start: startDate.toISOString(), end: endDate.toISOString() },
      summary: {
        totalIncome, totalSpent, net: totalIncome - totalSpent,
        savingsGoal: activeCycle?.savingsGoal || savingsGoal,
        currency
      },
      topCategories,
      significantExpenses,
      budgetStatus: activeCycle ? {
        remaining: cycleMetrics.remainingBudget,
        dailyIdeal: cycleMetrics.idealDailyBudget,
        isOverspending: cycleMetrics.isOverspending
      } : 'No active cycle'
    };
  };

  return (
    <FinanceContext.Provider value={{
      transactions, recurringItems,
      addTransaction, updateTransaction, deleteTransaction,
      addRecurringItem, updateRecurringItem, deleteRecurringItem,
      totalFixedIncome, totalFixedExpenses, totalDisposableIncome,
      currentSavingsGoal: savingsGoal, setSavingsGoal,
      setCurrency, apiKey, setApiKey,
      cycles, activeCycle, currency, createCycle, transferSavingsToBudget,
      cycleMetrics, weeklyBreakdown, currentWeekStatus,
      activeInstallments, cycleHistory,
      categories, addCategory,
      showAuth: () => setShowAuthModal(true),
      isSyncing, resetData, generateDataPacket, wipeAllUserData
    }}>
      {children}
      <div className="relative z-50">
        {showAuthModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="relative w-full max-w-md">
              <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 z-10 text-white bg-black/20 hover:bg-black/40 rounded-full p-2">✕</button>
              <AuthScreen />
            </div>
          </div>
        )}
      </div>
    </FinanceContext.Provider>
  );
};
