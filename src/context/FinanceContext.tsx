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

const filterTransactionsByDateRange = (
  txs: Transaction[],
  startDate: string,
  endDate: string
): Transaction[] => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return txs.filter(t => {
    const tDate = new Date(t.date);
    // Normalize to local midnight to handle date-only strings parsed as UTC
    tDate.setHours(0, 0, 0, 0);
    return tDate >= start && tDate <= end;
  });
};

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
  const settingsId = user?.id || 'local-user';

  const updateSettings = async (fields: Record<string, unknown>) => {
    const exists = await db.userSettings.get(settingsId);
    if (exists) {
      await db.userSettings.update(settingsId, { ...fields, updated_at: new Date().toISOString() });
    } else {
      await db.userSettings.put({
        id: settingsId,
        owner_id: settingsId,
        savings_goal: 0,
        custom_categories: [],
        currency: 'USD',
        ...fields,
        updated_at: new Date().toISOString()
      });
    }
  };

  const setSavingsGoal = async (amount: number) => {
    await updateSettings({ savings_goal: amount });
  };

  const setCurrency = async (curr: string) => {
    await updateSettings({ currency: curr });
  };

  const setApiKey = async (key: string) => {
    await updateSettings({ openai_api_key: key });
  };

  const addCategory = async (category: string) => {
    const trimmed = category.trim();
    if (!trimmed) return;
    const current = await db.userSettings.get(settingsId);
    const existing = current?.custom_categories || [];
    const allCategories = new Set([...DEFAULT_CATEGORIES, ...existing]);
    if (!allCategories.has(trimmed)) {
      await updateSettings({ custom_categories: [...existing, trimmed] });
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
      if (!item.isInstallment) return true;
      if (!item.startDate || !item.totalInstallments) return true;

      // Normalize to local date parts to avoid UTC month-boundary shifts
      const start = new Date(item.startDate);
      start.setHours(0, 0, 0, 0);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const monthsPassed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
      return monthsPassed >= 0 && monthsPassed < item.totalInstallments;
    })
    .reduce((acc, curr) => acc + curr.amount, 0);

  // --- Active Cycle Logic ---
  const activeCycle = useMemo(() => cycles.find(c => c.isActive) || null, [cycles]);

  // Use active cycle's snapshot when available, global setting for planning only
  const effectiveSavingsGoal = activeCycle ? activeCycle.savingsGoal : savingsGoal;
  const totalDisposableIncome = totalFixedIncome - totalFixedExpenses - effectiveSavingsGoal;

  const activeCycleTransactions = useMemo(() => {
    if (!activeCycle) return [];
    return filterTransactionsByDateRange(transactions, activeCycle.startDate, activeCycle.endDate);
  }, [activeCycle, transactions]);

  const cycleMetrics: CycleMetrics = useMemo(() => {
    return calculateCycleMetrics(activeCycle || null, activeCycleTransactions);
  }, [activeCycle, activeCycleTransactions]);

  const weeklyBreakdown = useMemo(() => {
    return calculateWeeklyBreakdown(activeCycle || null, activeCycleTransactions);
  }, [activeCycle, activeCycleTransactions]);

  const currentWeekStatus = weeklyBreakdown.find(w => w.isCurrent) || null;

  // --- Installments ---
  const activeInstallments = useMemo(() => {
    return recurringItems
      .filter(item => item.isInstallment && item.startDate && item.totalInstallments)
      .map(item => {
        const start = new Date(item.startDate!);
        start.setHours(0, 0, 0, 0);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
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
    if (activeCycle.savingsGoal <= 0) return;

    // Atomic: read current DB state to prevent double-tap inflation
    await db.transaction('rw', db.cycles, async () => {
      const current = await db.cycles.get(activeCycle.id);
      if (!current || current.savingsGoal <= 0) return;

      await db.cycles.update(activeCycle.id, {
        savingsGoal: 0,
        updated_at: new Date().toISOString()
      });
    });
  };

  const cycleHistory: CycleHistoryItem[] = useMemo(() => cycles
    .filter(c => !c.isActive)
    .map(c => {
      const cTransactions = filterTransactionsByDateRange(transactions, c.startDate, c.endDate);
      const spent = cTransactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((acc, t) => acc + t.amount, 0);
      const income = cTransactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((acc, t) => acc + t.amount, 0);
      return {
        id: c.id,
        endDate: c.endDate,
        savingsGoal: c.savingsGoal,
        achievedSurplus: (c.initialBudget + income) - spent - c.savingsGoal
      };
    }), [cycles, transactions]);

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
      tDate.setHours(0, 0, 0, 0);
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
