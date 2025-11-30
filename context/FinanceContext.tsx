
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Transaction, RecurringItem, FinancialContextType, TransactionType, WeeklyStatus, CycleHistoryItem, Cycle, CycleMetrics } from '../types';

const FinanceContext = createContext<FinancialContextType | undefined>(undefined);

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
};

// Helper para leer datos de forma segura. Si falla el parseo, devuelve el valor por defecto.
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

// Helper robusto para generar IDs unicos incluso en entornos inseguros (HTTP)
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback para entornos donde crypto no está disponible
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const DEFAULT_CATEGORIES = ["Comida", "Transporte", "Ocio", "Salud", "Compras", "Otros"];

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

  const [customCategories, setCustomCategories] = useState<string[]>(() => 
    getSavedData<string[]>('customCategories', [])
  );

  // --- Effects (Auto-save) ---
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

  useEffect(() => {
    localStorage.setItem('customCategories', JSON.stringify(customCategories));
  }, [customCategories]);

  // --- Actions ---
  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...t, id: generateUUID() };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const updateTransaction = (updatedTx: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const addRecurringItem = (item: Omit<RecurringItem, 'id'>) => {
    const newItem = { ...item, id: generateUUID() };
    setRecurringItems(prev => [...prev, newItem]);
  };

  const deleteRecurringItem = (id: string) => {
    setRecurringItems(prev => prev.filter(i => i.id !== id));
  };

  const setSavingsGoal = (amount: number) => {
    setSavingsGoalState(amount);
  };

  // --- Categories Management ---
  const categories = useMemo(() => {
    // Merge defaults with custom, removing duplicates just in case
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...customCategories]));
  }, [customCategories]);

  const addCategory = (category: string) => {
    const trimmed = category.trim();
    if (!trimmed) return;
    if (!categories.includes(trimmed)) {
      setCustomCategories(prev => [...prev, trimmed]);
    }
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
      // CHANGE: We now include both INCOME and EXPENSE to track variable income
      return tDate >= start && tDate <= end;
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

    // Calculate Totals
    const spentThisCycle = activeCycleTransactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((acc, t) => acc + t.amount, 0);
    
    const incomeThisCycle = activeCycleTransactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((acc, t) => acc + t.amount, 0);
    
    // Calculate Pace: Exclude exceptional expenses AND incomes
    const spentPace = activeCycleTransactions
        .filter(t => t.type === TransactionType.EXPENSE && !t.isExceptional) 
        .reduce((acc, t) => acc + t.amount, 0);

    // Initial Budget is what was "Free Money" when cycle started
    // Plus any extra variable income registered during the cycle
    const totalAvailable = activeCycle.initialBudget + incomeThisCycle;
    
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

  // --- Weekly Breakdown Logic (Dynamic / Self-Adjusting) ---
  const weeklyBreakdown = useMemo(() => {
    if (!activeCycle) return [];

    const weeks: WeeklyStatus[] = [];
    const start = new Date(activeCycle.startDate);
    start.setHours(0,0,0,0);
    const cycleEnd = new Date(activeCycle.endDate);
    cycleEnd.setHours(23,59,59,999);
    
    const now = new Date();
    
    const totalTime = cycleEnd.getTime() - start.getTime();
    const cycleTotalDays = Math.ceil(totalTime / (1000 * 3600 * 24)) || 1;
    const initialTotalBudget = activeCycle.initialBudget;
    
    // Original static average for reference (based on INITIAL budget only)
    const originalDailyAverage = initialTotalBudget / cycleTotalDays;

    let currentIterDate = new Date(start);
    let weekNum = 1;
    let accumulatedSpentPast = 0;
    let accumulatedIncome = 0; // Track variable income over time
    let daysPassedTotal = 0;

    while (currentIterDate <= cycleEnd) {
        const wStart = new Date(currentIterDate);
        const wEnd = new Date(currentIterDate);
        wEnd.setDate(wStart.getDate() + 6);
        wEnd.setHours(23,59,59,999);

        if (wEnd > cycleEnd) {
            wEnd.setTime(cycleEnd.getTime());
        }

        const isCurrent = now >= wStart && now <= wEnd;
        const isPast = wEnd < now && !isCurrent;
        const isFuture = wStart > now;

        const daysInWeek = Math.ceil((wEnd.getTime() - wStart.getTime()) / (1000 * 3600 * 24));
        const effectiveDaysInWeek = Math.max(1, daysInWeek);

        // Get transactions for this week
        const weekTransactions = activeCycleTransactions.filter(t => {
            const d = new Date(t.date);
            return d >= wStart && d <= wEnd;
        });

        const weekSpent = weekTransactions
            .filter(t => t.type === TransactionType.EXPENSE)
            .reduce((acc, t) => acc + t.amount, 0);

        const weekIncome = weekTransactions
            .filter(t => t.type === TransactionType.INCOME)
            .reduce((acc, t) => acc + t.amount, 0);

        let limit = 0;

        if (isPast) {
            // Past weeks keep limits based on when they happened.
            limit = originalDailyAverage * effectiveDaysInWeek;
            
            accumulatedSpentPast += weekSpent;
            accumulatedIncome += weekIncome;
            daysPassedTotal += effectiveDaysInWeek;
        } 
        else if (isCurrent) {
            // DYNAMIC LOGIC:
            const totalAvailablePool = initialTotalBudget + accumulatedIncome + weekIncome;
            const balanceNow = totalAvailablePool - accumulatedSpentPast - weekSpent;
            
            // Days remaining in cycle total (including this week)
            const daysRemainingTotal = cycleTotalDays - daysPassedTotal;
            
            // Calculate days passed WITHIN this week
            const daysPassedInWeek = Math.max(0, Math.ceil((now.getTime() - wStart.getTime()) / (1000 * 3600 * 24)));
            const daysLeftInWeek = effectiveDaysInWeek - daysPassedInWeek;
            const daysLeftInCycleFromTomorrow = daysRemainingTotal - daysPassedInWeek;
            
            // The "New Daily Budget" for the future is based on Balance NOW divided by Future Days
            const newDailyBudget = daysLeftInCycleFromTomorrow > 0 ? (balanceNow / daysLeftInCycleFromTomorrow) : 0;
            
            // The limit for THIS week is: What we spent + (New Daily * Days Left in Week)
            limit = weekSpent + (newDailyBudget * daysLeftInWeek);
            
            // Sanity check
            if (balanceNow < 0) {
                 limit = weekSpent; 
            }

            accumulatedSpentPast += weekSpent;
            accumulatedIncome += weekIncome;
            daysPassedTotal += effectiveDaysInWeek;
        } 
        else if (isFuture) {
            // FUTURE WEEKS:
            const totalAvailablePool = initialTotalBudget + accumulatedIncome;
            const balanceRemaining = totalAvailablePool - accumulatedSpentPast;
            const daysRemaining = Math.max(1, cycleTotalDays - daysPassedTotal);
            
            const adjustedDaily = balanceRemaining / daysRemaining;
            
            limit = adjustedDaily * effectiveDaysInWeek;
            
            if (balanceRemaining <= 0) limit = 0;
            
            accumulatedSpentPast += weekSpent;
            accumulatedIncome += weekIncome;
            daysPassedTotal += effectiveDaysInWeek;
        }

        weeks.push({
          weekNumber: weekNum,
          startDate: wStart.toISOString(),
          endDate: wEnd.toISOString(),
          limit: limit,
          spent: weekSpent,
          remaining: limit - weekSpent,
          isCurrent,
          label: `Semana ${weekNum}`
        });

        currentIterDate = new Date(wEnd);
        currentIterDate.setDate(currentIterDate.getDate() + 1);
        currentIterDate.setHours(0,0,0,0);
        weekNum++;
    }

    return weeks;
  }, [activeCycle, activeCycleTransactions, cycleMetrics]);

  const currentWeekStatus = weeklyBreakdown.find(w => w.isCurrent) || null;

  // --- Create Cycle ---
  const createCycle = (endDate: Date, customInitialBudget: number) => {
    // 1. Deactivate current cycle
    const updatedCycles = cycles.map(c => ({ ...c, isActive: false }));

    const startDate = new Date();
    startDate.setHours(0,0,0,0); // Start today 00:00

    // Set end date to end of that day
    endDate.setHours(23,59,59,999);

    const monthName = endDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    const capitalizedName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    const newCycle: Cycle = {
      id: generateUUID(), // Usando generador robusto
      name: capitalizedName,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      initialBudget: customInitialBudget, // Use passed budget
      savingsGoal: savingsGoal,
      isActive: true
    };

    setCycles([...updatedCycles, newCycle]);
  };

  // --- Transfer Savings to Budget (Emergency Fund) ---
  const transferSavingsToBudget = () => {
    if (!activeCycle) return;
    
    // Check if we actually have savings to transfer
    const amountToTransfer = activeCycle.savingsGoal;
    if (amountToTransfer <= 0) return;

    const updatedCycles = cycles.map(c => {
        if (c.id === activeCycle.id) {
            return {
                ...c,
                // Add savings to the budget pool
                initialBudget: c.initialBudget + amountToTransfer,
                // Set savings to 0 to indicate they've been used
                savingsGoal: 0
            };
        }
        return c;
    });

    setCycles(updatedCycles);
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
      updateTransaction,
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
      transferSavingsToBudget,
      
      cycleMetrics,
      weeklyBreakdown,
      currentWeekStatus,
      cycleHistory,
      
      categories,
      addCategory
    }}>
      {children}
    </FinanceContext.Provider>
  );
};
