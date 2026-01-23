
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Transaction, RecurringItem, FinancialContextType, TransactionType, Cycle, CycleMetrics, CycleHistoryItem } from '../types';
import { calculateCycleMetrics, calculateWeeklyBreakdown } from '../src/lib/financeLogic';
import { useAuth } from './AuthContext';
import { AuthScreen } from '../components/AuthScreen';
import { db, migrateFromLocalStorage } from '../src/db/db';
import { useLiveQuery } from 'dexie-react-hooks';

const FinanceContext = createContext<FinancialContextType | undefined>(undefined);

// Helper robusto para generar IDs unicos
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
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
  const [isSyncing, setIsSyncing] = useState(false); // Kept for UI compat, but won't be true often

  // --- Initialization / Migration ---
  useEffect(() => {
    migrateFromLocalStorage();
  }, []);

  // --- Live Queries (Dexie) ---
  // We filter by owner_id or just take all for the local user. 
  // Since we assume single user locally, we can query all, OR query by the 'local-user' ID we set in AuthContext.
  // For safety, let's just query everything as "My Data" in this local-first world.

  const transactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const recurringItems = useLiveQuery(() => db.recurringItems.toArray()) || [];
  const cycles = useLiveQuery(() => db.cycles.toArray()) || [];

  // Settings is a bit specific, it's a singleton per user
  const userSettings = useLiveQuery(() => db.userSettings.get(user?.id || 'local-user'));

  const customCategories = userSettings?.custom_categories || [];
  const savingsGoal = userSettings?.savings_goal || 0;
  const currency = userSettings?.currency || 'USD';

  // --- Actions (Dexie) ---
  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...t,
      id: generateUUID(),
      owner_id: user?.id || 'local-user',
      updated_at: new Date().toISOString()
    };
    await db.transactions.add(newTransaction);
  };

  const updateTransaction = async (updatedTx: Transaction) => {
    const toUpdate = {
      ...updatedTx,
      updated_at: new Date().toISOString(),
      owner_id: user?.id || updatedTx.owner_id || 'local-user'
    };
    await db.transactions.put(toUpdate);
  };

  const deleteTransaction = async (id: string) => {
    await db.transactions.delete(id);
  };

  const addRecurringItem = async (item: Omit<RecurringItem, 'id'>) => {
    const newItem = {
      ...item,
      id: generateUUID(),
      owner_id: user?.id || 'local-user',
      updated_at: new Date().toISOString()
    };
    await db.recurringItems.add(newItem);
  };

  const updateRecurringItem = async (updated: RecurringItem) => {
    const toUpdate = { ...updated, updated_at: new Date().toISOString() };
    await db.recurringItems.put(toUpdate);
  };

  const deleteRecurringItem = async (id: string) => {
    await db.recurringItems.delete(id);
  };

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
      updated_at: new Date().toISOString()
    });
  };

  // --- Categories Management ---
  const categories = useMemo(() => {
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...customCategories]));
  }, [customCategories]);

  const addCategory = async (category: string) => {
    const trimmed = category.trim();
    if (!trimmed) return;
    if (!categories.includes(trimmed)) {
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

  // --- Planning Metrics (Live) ---
  const totalFixedIncome = recurringItems
    .filter(i => i.type === TransactionType.INCOME)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalFixedExpenses = recurringItems
    .filter(i => i.type === TransactionType.EXPENSE)
    .filter(item => {
      if (!item.isInstallment) return true;
      if (!item.startDate || !item.totalInstallments) return true;

      const start = new Date(item.startDate);
      const now = new Date();
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
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= start && tDate <= end;
    });
  }, [activeCycle, transactions]);

  // --- Cycle Metrics Calculation ---
  const cycleMetrics: CycleMetrics = useMemo(() => {
    return calculateCycleMetrics(activeCycle || null, activeCycleTransactions);
  }, [activeCycle, activeCycleTransactions]);

  // --- Weekly Breakdown Logic ---
  const weeklyBreakdown = useMemo(() => {
    return calculateWeeklyBreakdown(activeCycle || null, activeCycleTransactions);
  }, [activeCycle, activeCycleTransactions, cycleMetrics]);

  const currentWeekStatus = weeklyBreakdown.find(w => w.isCurrent) || null;

  // --- Active Installments ---
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

  // --- Create Cycle ---
  const createCycle = async (endDate: Date, customInitialBudget: number) => {
    // 1. Deactivate current cycle
    const cyclesToDeactivate = cycles.filter(c => c.isActive).map(c => ({ ...c, isActive: false, updated_at: new Date().toISOString() }));

    if (cyclesToDeactivate.length > 0) {
      await db.cycles.bulkPut(cyclesToDeactivate);
    }

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const monthName = endDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    const capitalizedName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    const newCycle: Cycle = {
      id: generateUUID(),
      name: capitalizedName,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      initialBudget: customInitialBudget,
      savingsGoal: savingsGoal,
      isActive: true,
      owner_id: user?.id || 'local-user',
      updated_at: new Date().toISOString()
    };

    await db.cycles.add(newCycle);
  };

  // --- Transfer Savings to Budget ---
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

  // --- Security & Data Privacy (Reset) ---
  const wipeAllUserData = async () => {
    if (!confirm("Are you sure? This will delete all local data.")) return;
    await db.delete();
    // Re-open/Create fresh DB
    await db.open();
    // Usually reload is best
    window.location.reload();
  };

  const resetData = wipeAllUserData; // Same functionality really in local node

  // --- AI Context Generation ---
  const generateDataPacket = (range: 'current_cycle' | 'last_30_days' | 'current_month') => {
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
    rangeTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      });

    const topCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([cat, amount]) => ({ category: cat, amount }));

    const significantExpenses = rangeTransactions
      .filter(t => t.type === TransactionType.EXPENSE && t.amount > 500)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(t => ({ desc: t.description, amount: t.amount, date: t.date }));

    return {
      context: range,
      period: { start: startDate.toISOString(), end: endDate.toISOString() },
      summary: {
        totalIncome,
        totalSpent,
        net: totalIncome - totalSpent,
        savingsGoal: activeCycle?.savingsGoal || savingsGoal,
        currency: currency
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
      transactions,
      recurringItems,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addRecurringItem,
      updateRecurringItem,
      deleteRecurringItem,

      totalFixedIncome,
      totalFixedExpenses,
      totalDisposableIncome,
      currentSavingsGoal: savingsGoal,
      setSavingsGoal,
      setCurrency,

      cycles,
      activeCycle,
      currency,
      createCycle,
      transferSavingsToBudget,

      cycleMetrics,
      weeklyBreakdown,
      currentWeekStatus,
      activeInstallments,
      cycleHistory,

      categories,
      addCategory,

      showAuth: () => setShowAuthModal(true),
      isSyncing,
      resetData,
      generateDataPacket,
      wipeAllUserData
    }}>
      {children}

      <div className="relative z-50">
        {showAuthModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="relative w-full max-w-md">
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 z-10 text-white bg-black/20 hover:bg-black/40 rounded-full p-2"
              >
                ✕
              </button>
              <AuthScreen />
            </div>
          </div>
        )}
      </div>
    </FinanceContext.Provider>
  );
};
