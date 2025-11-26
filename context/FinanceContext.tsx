import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Transaction, RecurringItem, FinancialContextType, TransactionType, WeeklyStatus, CycleHistoryItem, Cycle, CycleMetrics } from '../types';

const FinanceContext = createContext<FinancialContextType | undefined>(undefined);

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
};

// Helper para leer datos de forma segura. Si falla el parseo, devuelve el valor por defecto
// y no rompe la aplicación.
const getSavedData = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return defaultValue;
    return JSON.parse(saved);
  } catch (error) {
    console.warn(`Error recuperando datos para ${key}, usando valor por defecto.`, error);
    return defaultValue;
  }
};

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- State Persistence (Robust) ---
  const [transactions, setTransactions] = useState<Transaction[]>(() => 
    getSavedData<Transaction[]>('transactions', [])
  );

  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>(() => 
    getSavedData<RecurringItem[]>('recurringItems', [])
  );

  const [savingsGoal, setSavingsGoalState] = useState<number>(() => 
    getSavedData<number>('savingsGoal', 0)
  );

  const [cycles, setCycles] = useState<Cycle[]>(() => 
    getSavedData<Cycle[]>('cycles', [])
  );

  // --- Effects (Auto-save) ---
  // Estos efectos se ejecutan cada vez que cambian los datos, guardándolos automáticamente.
  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('recurringItems', JSON.stringify(recurringItems));
  }, [recurringItems]);

  useEffect(() => {
    localStorage.setItem('savingsGoal', savingsGoal.toString());
  }, [savingsGoal]);

  useEffect(() => {
    localStorage.setItem('cycles', JSON.stringify(cycles));
  }, [cycles]);

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

  const setSavingsGoal = (amount: number) => {
    setSavingsGoalState(amount);
  };

  // --- Planning Metrics (Live) ---
  const totalFixedIncome = recurringItems
    .filter(i => i.type === TransactionType.INCOME)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalFixedExpenses = recurringItems
    .filter(i => i.type === TransactionType.EXPENSE)
    .reduce((acc, curr) => acc + curr.amount, 0);

  // This is the "Free Money" available for allocation
  const totalDisposableIncome = totalFixedIncome - totalFixedExpenses - savingsGoal;

  // --- Active Cycle Logic ---
  const activeCycle = useMemo(() => cycles.find(c => c.isActive) || null, [cycles]);

  const activeCycleTransactions = useMemo(() => {
    if (!activeCycle) return [];
    
    const start = new Date(activeCycle.startDate);
    const end = new Date(activeCycle.endDate);
    
    // Normalize dates for comparison (ignore time)
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);

    return transactions.filter(t => {
      const tDate = new Date(t.date);
      // Logic: Transaction is in cycle if date is within range
      return tDate >= start && tDate <= end && t.type === TransactionType.EXPENSE;
    });
  }, [activeCycle, transactions]);

  // --- Cycle Metrics Calculation ---
  const cycleMetrics: CycleMetrics = useMemo(() => {
    if (!activeCycle) {
      return {
        daysPassed: 0, daysTotal: 30, progressPercentage: 0,
        remainingBudget: 0, spentThisCycle: 0, spentPace: 0,
        idealDailyBudget: 0, currentSurplus: 0, isOverspending: false,
        suggestedDailyBudget: null
      };
    }

    const now = new Date();
    const start = new Date(activeCycle.startDate);
    const end = new Date(activeCycle.endDate);
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);

    const totalTime = end.getTime() - start.getTime();
    const daysTotal = Math.ceil(totalTime / (1000 * 3600 * 24)) || 1;
    
    const elapsedTime = Math.min(Math.max(0, now.getTime() - start.getTime()), totalTime);
    const daysPassed = Math.ceil(elapsedTime / (1000 * 3600 * 24)) || 1; // 1-based index
    
    const progressPercentage = Math.min(100, (daysPassed / daysTotal) * 100);

    const spentThisCycle = activeCycleTransactions.reduce((acc, t) => acc + t.amount, 0);
    
    // Calculate Pace: Exclude exceptional expenses if they exist
    const spentPace = activeCycleTransactions
        .filter(t => !t.isExceptional) 
        .reduce((acc, t) => acc + t.amount, 0);

    // Initial Budget is what was "Free Money" when cycle started
    const totalAvailable = activeCycle.initialBudget;
    
    const remainingBudget = totalAvailable - spentThisCycle;

    // Pace Logic
    const idealDailyBudget = totalAvailable / daysTotal;
    const idealSpendToDate = idealDailyBudget * daysPassed;
    
    // Surplus
    const currentSurplus = idealSpendToDate - spentPace;
    
    // Overspending if deficit is significant
    const isOverspending = currentSurplus < 0;

    let suggestedDailyBudget = null;
    if (isOverspending) {
      const daysLeft = daysTotal - daysPassed;
      if (daysLeft > 0) {
        // Remaining from the 'Pace' budget perspective
        const remainingForPace = totalAvailable - spentPace; 
        suggestedDailyBudget = Math.max(0, remainingForPace / daysLeft);
      }
    }

    return {
      daysPassed,
      daysTotal,
      progressPercentage,
      remainingBudget,
      spentThisCycle,
      spentPace,
      idealDailyBudget,
      currentSurplus,
      isOverspending,
      suggestedDailyBudget
    };
  }, [activeCycle, activeCycleTransactions]);

  // --- Weekly Breakdown Logic (Dynamic Weeks) ---
  const weeklyBreakdown = useMemo(() => {
    if (!activeCycle) return [];

    const weeks: WeeklyStatus[] = [];
    const start = new Date(activeCycle.startDate);
    start.setHours(0,0,0,0);
    const cycleEnd = new Date(activeCycle.endDate);
    cycleEnd.setHours(23,59,59,999);
    
    const now = new Date();
    
    // Calculate actual total days for daily budget distribution
    const totalTime = cycleEnd.getTime() - start.getTime();
    const cycleTotalDays = Math.ceil(totalTime / (1000 * 3600 * 24)) || 1;
    const totalBudget = activeCycle.initialBudget;
    const dailyBudget = totalBudget / cycleTotalDays;

    let currentIterDate = new Date(start);
    let weekNum = 1;

    // Iterate dynamically week by week until we cover the whole cycle
    while (currentIterDate <= cycleEnd) {
        const wStart = new Date(currentIterDate);
        
        // End of week is start + 6 days (7 days total)
        const wEnd = new Date(currentIterDate);
        wEnd.setDate(wStart.getDate() + 6);
        wEnd.setHours(23,59,59,999);

        // If the calculated week end goes beyond cycle end, clamp it
        if (wEnd > cycleEnd) {
            wEnd.setTime(cycleEnd.getTime());
        }

        const isCurrent = now >= wStart && now <= wEnd;

        // Filter transactions strictly for this date range
        const weekSpent = activeCycleTransactions
          .filter(t => {
            const d = new Date(t.date);
            return d >= wStart && d <= wEnd;
          })
          .reduce((acc, t) => acc + t.amount, 0);

        // Calculate exact days in this week segment (last week might be short)
        const daysInWeek = Math.ceil((wEnd.getTime() - wStart.getTime()) / (1000 * 3600 * 24));
        const effectiveDays = Math.max(1, daysInWeek); 
        
        const weekLimit = dailyBudget * effectiveDays;

        weeks.push({
          weekNumber: weekNum,
          startDate: wStart.toISOString(),
          endDate: wEnd.toISOString(),
          limit: weekLimit,
          spent: weekSpent,
          remaining: weekLimit - weekSpent,
          isCurrent,
          label: `Semana ${weekNum}`
        });

        // Prepare for next iteration: Start date is day after current wEnd
        currentIterDate = new Date(wEnd);
        currentIterDate.setDate(currentIterDate.getDate() + 1);
        currentIterDate.setHours(0,0,0,0);
        weekNum++;
    }

    return weeks;
  }, [activeCycle, activeCycleTransactions]);

  const currentWeekStatus = weeklyBreakdown.find(w => w.isCurrent) || null;

  // --- Create Cycle ---
  const createCycle = (endDate: Date) => {
    // 1. Deactivate current cycle
    const updatedCycles = cycles.map(c => ({ ...c, isActive: false }));

    // 2. Calculate Initial Budget from Planning
    const initialBudget = totalDisposableIncome; 

    const startDate = new Date();
    startDate.setHours(0,0,0,0); // Start today 00:00

    // Set end date to end of that day
    endDate.setHours(23,59,59,999);

    const monthName = endDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    const capitalizedName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    const newCycle: Cycle = {
      id: crypto.randomUUID(),
      name: capitalizedName,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      initialBudget: initialBudget,
      savingsGoal: savingsGoal,
      isActive: true
    };

    setCycles([...updatedCycles, newCycle]);
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

  return (
    <FinanceContext.Provider value={{
      transactions,
      recurringItems,
      addTransaction,
      deleteTransaction,
      addRecurringItem,
      deleteRecurringItem,
      
      totalFixedIncome,
      totalFixedExpenses,
      totalDisposableIncome,
      currentSavingsGoal: savingsGoal,
      setSavingsGoal,
      
      cycles,
      activeCycle,
      createCycle,
      
      cycleMetrics,
      weeklyBreakdown,
      currentWeekStatus,
      cycleHistory
    }}>
      {children}
    </FinanceContext.Provider>
  );
};