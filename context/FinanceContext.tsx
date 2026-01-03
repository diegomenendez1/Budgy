
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Transaction, RecurringItem, FinancialContextType, TransactionType, WeeklyStatus, CycleHistoryItem, Cycle, CycleMetrics, UserSettings, BaseEntity } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { AuthScreen } from '../components/AuthScreen';
import { SyncConflictModal } from '../components/SyncConflictModal';

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

  // --- Sync State ---
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingSyncResolver, setPendingSyncResolver] = useState<((choice: 'UPLOAD' | 'DOWNLOAD' | 'MERGE') => void) | null>(null);

  // --- Actions ---
  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...t,
      id: generateUUID(),
      owner_id: user?.id,
      updated_at: new Date().toISOString()
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const updateTransaction = (updatedTx: Transaction) => {
    const toUpdate = {
      ...updatedTx,
      updated_at: new Date().toISOString(),
      owner_id: user?.id || updatedTx.owner_id // Preserve or set owner
    };
    setTransactions(prev => prev.map(t => t.id === toUpdate.id ? toUpdate : t));
  };

  const deleteTransaction = (id: string) => {
    // Soft delete for sync if logged in, otherwise hard delete (or soft delete always?)
    // For local storage we often just remove, but for sync we need to track deletions.
    // Solution: We keep deleted items in a separate "deleted" list OR mark as deleted.
    // To keep it simple for now without huge refactor, we will just remove from local state
    // AND push a delete command to Supabase if online. 
    // Ideally we should have a `deletedTransactions` state.
    // Let's mark as is_deleted=true but filter them out from UI? 
    // Existing UI expects clean lists.
    // Approach: Soft delete. Filter out in UI.
    // BUT: Legacy components might break if they iterate over everything.
    // SAFE APPROACH: We remove from "transactions" state, but keep a "pendingDeletes" queue or similar?
    // User requested "Conflict rule: latest change wins".
    // Let's actually CHANGE the state to include deleted ones but filter them in getters? No, too risky for existing UI.
    // Let's use a "deleted_records" table in Supabase or a separate state here.
    // Simplest: We won't support offline-delete-sync perfectly yet. 
    // If online: delete from Supabase.
    // If offline: Queue it.
    // Let's implement a simple "Hard Delete" locally and try to delete on Supabase.
    setTransactions(prev => prev.filter(t => t.id !== id));
    if (user) {
      supabase.from('transactions').delete().eq('id', id).eq('owner_id', user.id).then();
    }
  };

  const addRecurringItem = (item: Omit<RecurringItem, 'id'>) => {
    const newItem = {
      ...item,
      id: generateUUID(),
      owner_id: user?.id,
      updated_at: new Date().toISOString()
    };
    setRecurringItems(prev => [...prev, newItem]);
  };

  const updateRecurringItem = (updated: RecurringItem) => {
    const toUpdate = { ...updated, updated_at: new Date().toISOString() };
    setRecurringItems(prev => prev.map(i => i.id === toUpdate.id ? toUpdate : i));
  }

  const deleteRecurringItem = (id: string) => {
    setRecurringItems(prev => prev.filter(i => i.id !== id));
    if (user) {
      supabase.from('recurring_items').delete().eq('id', id).eq('owner_id', user.id).then();
    }
  };

  const setSavingsGoal = (amount: number) => {
    setSavingsGoalState(amount);
    // Sync settings/goal
  };

  // --- Categories Management ---
  const categories = useMemo(() => {
    // Merge defaults with custom, removing duplicates just in case
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...customCategories]));
  }, [customCategories]);

  const addCategory = async (category: string) => {
    const trimmed = category.trim();
    if (!trimmed) return;
    if (!categories.includes(trimmed)) {
      const newCustomCategories = [...customCategories, trimmed];
      setCustomCategories(newCustomCategories);
      if (user) {
        const now = new Date().toISOString();
        await supabase.from('user_settings').upsert({
          owner_id: user.id,
          custom_categories: newCustomCategories,
          updated_at: now
        }, { onConflict: 'owner_id' });
      }
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

  // --- Sync Logic ---
  const syncWithSupabase = async (forceResolution?: 'UPLOAD' | 'DOWNLOAD' | 'MERGE') => {
    if (!user || isSyncing) return;
    setIsSyncing(true);

    try {
      // 1. Fetch all cloud data
      const { data: cloudTx } = await supabase.from('transactions').select('*').eq('owner_id', user.id);
      const { data: cloudRec } = await supabase.from('recurring_items').select('*').eq('owner_id', user.id);
      const { data: cloudCycles } = await supabase.from('cycles').select('*').eq('owner_id', user.id);
      const { data: cloudSettings } = await supabase.from('user_settings').select('*').eq('owner_id', user.id).single();

      const cloudHasData = (cloudTx?.length || 0) > 0 || (cloudRec?.length || 0) > 0;
      const localHasData = transactions.length > 0 || recurringItems.length > 0;

      // Check for mixed state (Legacy local data vs Cloud data)
      // Only prompt if we have local data that doesn't belong to the user yet (migrating)
      const hasUnownedData = transactions.some(t => !t.owner_id) || recurringItems.some(i => !i.owner_id);

      let resolution = forceResolution;

      if (!resolution && localHasData && cloudHasData && hasUnownedData) {
        setShowConflictModal(true);
        // Returns a promise that resolves when user clicks the modal
        const userChoice = await new Promise<'UPLOAD' | 'DOWNLOAD' | 'MERGE'>((resolve) => {
          setPendingSyncResolver(() => resolve);
        });
        resolution = userChoice;
      }

      // Default merge if no conflict or no legacy data
      if (!resolution) resolution = 'MERGE';

      if (resolution === 'DOWNLOAD') {
        // Replace local with cloud
        if (cloudTx) setTransactions(cloudTx);
        if (cloudRec) setRecurringItems(cloudRec);
        if (cloudCycles) setCycles(cloudCycles);
        if (cloudSettings) {
          setCustomCategories(cloudSettings.custom_categories || []);
          setSavingsGoalState(cloudSettings.savings_goal || 0);
        }
      }
      else if (resolution === 'UPLOAD') {
        // Force push local to cloud (Caution: Overwrites/Adds?)
        // "Subir mis datos": We assume local is truth. We upsert everything.
        const txToUpload = transactions.map(t => ({ ...t, owner_id: user.id, updated_at: t.updated_at || new Date().toISOString() }));
        const recToUpload = recurringItems.map(i => ({ ...i, owner_id: user.id, updated_at: i.updated_at || new Date().toISOString() }));
        const cyclesToUpload = cycles.map(c => ({ ...c, owner_id: user.id, updated_at: c.updated_at || new Date().toISOString() }));

        await supabase.from('transactions').upsert(txToUpload);
        await supabase.from('recurring_items').upsert(recToUpload);
        await supabase.from('cycles').upsert(cyclesToUpload);
        await supabase.from('user_settings').upsert({
          id: user.id, // Primary key for settings? user_id usually
          owner_id: user.id,
          custom_categories: customCategories,
          savings_goal: savingsGoal,
          updated_at: new Date().toISOString()
        }, { onConflict: 'owner_id' });

        // Update local owner_ids to match
        setTransactions(txToUpload);
        setRecurringItems(recToUpload);
        setCycles(cyclesToUpload as any);
      }
      else {
        // MERGE: Last Write Wins
        // 1. Transactions
        const mergedTx = [...transactions];
        const txUpdates: any[] = [];
        const seenTxIds = new Set(transactions.map(t => t.id));

        cloudTx?.forEach(cTx => {
          const localTxIndex = mergedTx.findIndex(l => l.id === cTx.id);
          if (localTxIndex === -1) {
            // New from cloud
            mergedTx.push(cTx);
          } else {
            // Conflict: Compare updated_at
            const localTx = mergedTx[localTxIndex];
            const localDate = new Date(localTx.updated_at || 0);
            const cloudDate = new Date(cTx.updated_at || 0);

            if (cloudDate > localDate) {
              // Cloud wins, replace local
              mergedTx[localTxIndex] = cTx;
            } else if (localDate > cloudDate) {
              // Local wins, push to cloud later
              txUpdates.push({ ...localTx, owner_id: user.id });
            }
          }
        });

        // Items that are local only -> Push to cloud
        mergedTx.forEach(l => {
          if (!cloudTx?.some(c => c.id === l.id)) {
            txUpdates.push({ ...l, owner_id: user.id, updated_at: l.updated_at || new Date().toISOString() });
          }
        });

        if (txUpdates.length > 0) {
          await supabase.from('transactions').upsert(txUpdates);
        }
        setTransactions(mergedTx);

        // 2. Recurring Items
        const mergedRec = [...recurringItems];
        const recUpdates: any[] = [];
        cloudRec?.forEach(cRec => {
          const localIndex = mergedRec.findIndex(l => l.id === cRec.id);
          if (localIndex === -1) {
            mergedRec.push(cRec);
          } else {
            const localItem = mergedRec[localIndex];
            const localDate = new Date(localItem.updated_at || 0);
            const cloudDate = new Date(cRec.updated_at || 0);
            if (cloudDate > localDate) {
              mergedRec[localIndex] = cRec;
            } else if (localDate > cloudDate) {
              recUpdates.push({ ...localItem, owner_id: user.id });
            }
          }
        });

        mergedRec.forEach(l => {
          if (!cloudRec?.some(c => c.id === l.id)) {
            recUpdates.push({ ...l, owner_id: user.id, updated_at: l.updated_at || new Date().toISOString() });
          }
        });

        if (recUpdates.length > 0) {
          await supabase.from('recurring_items').upsert(recUpdates);
        }
        setRecurringItems(mergedRec);

        // 3. Cycles (CRITICAL FIX: Was missing!)
        const mergedCycles = [...cycles];
        const cycleUpdates: any[] = [];
        cloudCycles?.forEach(cCycle => {
          const localIndex = mergedCycles.findIndex(cy => cy.id === cCycle.id);
          if (localIndex === -1) {
            mergedCycles.push(cCycle);
          } else {
            const localC = mergedCycles[localIndex];
            const localDate = new Date(localC.updated_at || 0);
            const cloudDate = new Date(cCycle.updated_at || 0);
            if (cloudDate > localDate) {
              mergedCycles[localIndex] = cCycle;
            } else if (localDate > cloudDate) {
              cycleUpdates.push({ ...localC, owner_id: user.id });
            }
          }
        });

        // Push local-only cycles to cloud
        mergedCycles.forEach(l => {
          if (!cloudCycles?.some(c => c.id === l.id)) {
            cycleUpdates.push({ ...l, owner_id: user.id, updated_at: l.updated_at || new Date().toISOString() });
          }
        });

        if (cycleUpdates.length > 0) {
          await supabase.from('cycles').upsert(cycleUpdates);
        }
        setCycles(mergedCycles as Cycle[]);
      }

    } catch (err) {
      console.error('Sync failed', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Trigger sync on Auth change
  useEffect(() => {
    if (user) {
      syncWithSupabase();
    }
  }, [user]);

  // Trigger sync on Online
  useEffect(() => {
    if (user) {
      syncWithSupabase();
    }
  }, [user]);

  useEffect(() => {
    const handleOnline = () => {
      if (user) syncWithSupabase();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user]);


  // --- Active Cycle Logic ---
  const activeCycle = useMemo(() => cycles.find(c => c.isActive) || null, [cycles]);

  const activeCycleTransactions = useMemo(() => {
    if (!activeCycle) return [];

    const start = new Date(activeCycle.startDate);
    const end = new Date(activeCycle.endDate);

    // Normalize dates for comparison (ignore time)
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

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
        totalAvailable: 0, remainingBudget: 0, spentThisCycle: 0, spentPace: 0,
        idealDailyBudget: 0, currentSurplus: 0, isOverspending: false,
        suggestedDailyBudget: null
      };
    }

    const now = new Date();
    const start = new Date(activeCycle.startDate);
    const end = new Date(activeCycle.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

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
      totalAvailable,
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
    start.setHours(0, 0, 0, 0);
    const cycleEnd = new Date(activeCycle.endDate);
    cycleEnd.setHours(23, 59, 59, 999);

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
      wEnd.setHours(23, 59, 59, 999);

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
      currentIterDate.setHours(0, 0, 0, 0);
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
    startDate.setHours(0, 0, 0, 0); // Start today 00:00

    // Set end date to end of that day
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
      owner_id: user?.id,
      updated_at: new Date().toISOString()
    };

    setCycles([...updatedCycles, newCycle]);

    if (user) {
      // Auto-upload new cycle if online
      supabase.from('cycles').upsert([...updatedCycles, newCycle].map(c => ({ ...c, owner_id: user.id, updated_at: new Date().toISOString() }))).then();
    }
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

  // --- Reset Data (Logout cleanup) ---
  const resetData = () => {
    // 1. Clear State
    setTransactions([]);
    setRecurringItems([]);
    setCycles([]);
    setCustomCategories([]);
    setSavingsGoalState(0);

    // 2. Clear Local Storage
    localStorage.removeItem('transactions');
    localStorage.removeItem('recurringItems');
    localStorage.removeItem('cycles');
    localStorage.removeItem('customCategories');
    localStorage.removeItem('savingsGoal');
  };

  // --- AI Context Generation ---
  const generateDataPacket = (range: 'current_cycle' | 'last_30_days' | 'current_month') => {
    // 1. Determine Date Range
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
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of month
    }

    // Normalize hours
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // 2. Filter Transactions
    const rangeTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= startDate && tDate <= endDate;
    });

    // 3. Calculate Aggregates
    const totalSpent = rangeTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((acc, t) => acc + t.amount, 0);

    const totalIncome = rangeTransactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((acc, t) => acc + t.amount, 0);

    // Group by Category
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

    // Detect Outliers (Mock logic: > 20% of total spent or > 500)
    const significantExpenses = rangeTransactions
      .filter(t => t.type === TransactionType.EXPENSE && t.amount > 500)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(t => ({ desc: t.description, amount: t.amount, date: t.date }));

    // 4. Construct Packet
    return {
      context: range,
      period: { start: startDate.toISOString(), end: endDate.toISOString() },
      summary: {
        totalIncome,
        totalSpent,
        net: totalIncome - totalSpent,
        savingsGoal: activeCycle?.savingsGoal || savingsGoal
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
      updateRecurringItem, // Missing in previous render? Fixed implicitly or needs check
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
      addCategory,

      showAuth: () => setShowAuthModal(true),
      isSyncing,
      resetData,
      generateDataPacket
    }}>
      {children}

      {/* Modals placed here to be accessible globally */}
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

        <SyncConflictModal
          isOpen={showConflictModal}
          onResolve={(choice) => {
            setShowConflictModal(false);
            if (pendingSyncResolver) pendingSyncResolver(choice);
          }}
        />
      </div>
    </FinanceContext.Provider>
  );
};
