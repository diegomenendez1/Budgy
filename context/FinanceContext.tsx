import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction, RecurringItem, FinancialContextType, TransactionType, WeeklyStatus, CycleHistoryItem } from '../types';

const FinanceContext = createContext<FinancialContextType | undefined>(undefined);

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
};

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- State Persistence ---
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>(() => {
    const saved = localStorage.getItem('recurringItems');
    return saved ? JSON.parse(saved) : [];
  });

  const [cycleStartDate, setCycleStartDate] = useState<string>(() => {
    const saved = localStorage.getItem('cycleStartDate');
    // Default to 1st of current month if not set
    if (!saved) {
      const date = new Date();
      date.setDate(1);
      return date.toISOString();
    }
    return saved;
  });

  const [savingsGoal, setSavingsGoalState] = useState<number>(() => {
    const saved = localStorage.getItem('savingsGoal');
    return saved ? parseFloat(saved) : 0;
  });

  const [cycleHistory, setCycleHistory] = useState<CycleHistoryItem[]>(() => {
    const saved = localStorage.getItem('cycleHistory');
    return saved ? JSON.parse(saved) : [];
  });

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('recurringItems', JSON.stringify(recurringItems));
  }, [recurringItems]);

  useEffect(() => {
    localStorage.setItem('cycleStartDate', cycleStartDate);
  }, [cycleStartDate]);

  useEffect(() => {
    localStorage.setItem('savingsGoal', savingsGoal.toString());
  }, [savingsGoal]);

  useEffect(() => {
    localStorage.setItem('cycleHistory', JSON.stringify(cycleHistory));
  }, [cycleHistory]);

  // --- Actions ---
  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...t, id: crypto.randomUUID() };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const addRecurringItem = (item: Omit<RecurringItem, 'id'>) => {
    const newItem = { ...item, id: crypto.randomUUID() };
    setRecurringItems(prev => [...prev, newItem]);
  };

  const deleteRecurringItem = (id: string) => {
    setRecurringItems(prev => prev.filter(i => i.id !== id));
  };

  // --- Metrics Calculations (Needed for startNewCycle logic) ---
  const totalFixedIncome = recurringItems
    .filter(i => i.type === TransactionType.INCOME)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalFixedExpenses = recurringItems
    .filter(i => i.type === TransactionType.EXPENSE)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalDisposableIncome = totalFixedIncome - totalFixedExpenses;

  // Filter Transactions for Current Cycle
  const cycleStart = new Date(cycleStartDate);
  const cycleTransactions = transactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate >= cycleStart && t.type === TransactionType.EXPENSE;
  });

  const spentThisCycle = cycleTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  
  // Current Balance
  const currentBalance = totalDisposableIncome - savingsGoal - spentThisCycle;

  // --- Start New Cycle Logic ---
  const startNewCycle = () => {
    // 1. Snapshot current cycle performance
    // Surplus = what's left over + what we planned to save (since 'currentBalance' already deducted savingsGoal)
    // Actually, simple view: Income - Expense = Actual Savings.
    // Metric requested: Compare Savings Goal vs Achieved Surplus (Total Leftover).
    // Achieved Surplus = TotalDisposable - Spent.
    const achievedSurplus = totalDisposableIncome - spentThisCycle;

    const historyItem: CycleHistoryItem = {
      id: crypto.randomUUID(),
      endDate: new Date().toISOString(),
      savingsGoal: savingsGoal,
      achievedSurplus: achievedSurplus
    };

    setCycleHistory(prev => [...prev, historyItem]);

    // 2. Reset date
    setCycleStartDate(new Date().toISOString());
  };

  const setSavingsGoal = (amount: number) => {
    setSavingsGoalState(amount);
  };

  // --- Weekly Breakdown Logic ---
  const calculateWeeklyBreakdown = (): WeeklyStatus[] => {
    const weeks: WeeklyStatus[] = [];
    const cycleDate = new Date(cycleStartDate);
    const now = new Date();
    
    // Assume a 4-week cycle for simplicity or until next month
    // Let's generate 4 standard weeks from cycle start
    const totalBudgetForWeeks = totalDisposableIncome - savingsGoal;
    const budgetPerWeek = totalBudgetForWeeks / 4;

    for (let i = 0; i < 4; i++) {
      const start = new Date(cycleDate);
      start.setDate(cycleDate.getDate() + (i * 7));
      
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      // Filter transactions for this specific week
      const weekSpent = transactions
        .filter(t => {
          const tDate = new Date(t.date);
          return tDate >= start && tDate <= end && t.type === TransactionType.EXPENSE;
        })
        .reduce((acc, t) => acc + t.amount, 0);

      const isCurrent = now >= start && now <= end;

      weeks.push({
        weekNumber: i + 1,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        limit: budgetPerWeek,
        spent: weekSpent,
        remaining: budgetPerWeek - weekSpent,
        isCurrent
      });
    }
    return weeks;
  };

  const weeklyBreakdown = calculateWeeklyBreakdown();
  const currentWeekStatus = weeklyBreakdown.find(w => w.isCurrent) || null;

  return (
    <FinanceContext.Provider value={{
      transactions,
      recurringItems,
      addTransaction,
      deleteTransaction,
      addRecurringItem,
      deleteRecurringItem,
      
      totalDisposableIncome,
      currentBalance,
      spentThisCycle,
      
      cycleStartDate,
      savingsGoal,
      setSavingsGoal,
      startNewCycle,
      weeklyBreakdown,
      currentWeekStatus,
      cycleHistory
    }}>
      {children}
    </FinanceContext.Provider>
  );
};