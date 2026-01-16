
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Transaction, RecurringItem, FinancialContextType, TransactionType, WeeklyStatus, CycleHistoryItem, Cycle, CycleMetrics, UserSettings, BaseEntity } from '../types';
import { supabase } from '../lib/supabase';
import { calculateCycleMetrics, calculateWeeklyBreakdown } from '../src/lib/financeLogic';
import { useAuth } from './AuthContext';
import { AuthScreen } from '../components/AuthScreen';
import { SyncConflictModal } from '../components/SyncConflictModal';

const FinanceContext = createContext<FinancialContextType | undefined>(undefined);

type PendingOperation = {
  id: string;
  type: 'INSERT' | 'UPDATE' | 'DELETE' | 'UPSERT';
  table: 'transactions' | 'recurring_items' | 'cycles' | 'user_settings';
  data: any;
  timestamp: string;
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
};

// Helper para leer datos de forma segura. Si falla el parseo, devuelve el valor por defecto.
// Helper para leer datos de forma segura. Si falla el parseo, intenta usar el string directo o devuelve el valor por defecto.
const getSavedData = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return defaultValue;

    // Intentar asumiendo que es JSON
    try {
      return JSON.parse(saved);
    } catch (e) {
      // Si falla y esperamos un string, puede que se haya guardado sin comillas
      if (typeof defaultValue === 'string') {
        return saved as unknown as T;
      }
      throw e; // Si no es string, es un error real
    }
  } catch (error) {
    console.warn(`Error recuperando datos para ${key}, reseteando a default.`, error);
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

  const [currency, setCurrencyState] = useState<string>(() =>
    getSavedData<string>('currency', 'USD')
  );

  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>(() =>
    getSavedData<PendingOperation[]>('pendingOperations', [])
  );

  // --- Effects (Auto-save) ---
  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('recurringItems', JSON.stringify(recurringItems));
  }, [recurringItems]);

  useEffect(() => {
    localStorage.setItem('savingsGoal', JSON.stringify(savingsGoal));
  }, [savingsGoal]);

  useEffect(() => {
    localStorage.setItem('cycles', JSON.stringify(cycles));
  }, [cycles]);

  useEffect(() => {
    localStorage.setItem('customCategories', JSON.stringify(customCategories));
  }, [customCategories]);

  useEffect(() => {
    localStorage.setItem('currency', JSON.stringify(currency));
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('pendingOperations', JSON.stringify(pendingOperations));
  }, [pendingOperations]);

  // --- Sync State ---
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingSyncResolver, setPendingSyncResolver] = useState<((choice: 'UPLOAD' | 'DOWNLOAD' | 'MERGE') => void) | null>(null);

  // --- Auto-sync on reconnection ---
  useEffect(() => {
    const handleOnline = () => {
      console.log('App back online, triggering sync...');
      syncWithSupabase();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user, pendingOperations]); // depends on these to ensure it's up to date

  // --- Actions ---
  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...t,
      id: generateUUID(),
      owner_id: user?.id,
      updated_at: new Date().toISOString()
    };
    setTransactions(prev => [newTransaction, ...prev]);

    if (user) {
      const dbTransaction = {
        id: newTransaction.id,
        description: newTransaction.description,
        amount: newTransaction.amount,
        type: newTransaction.type,
        date: newTransaction.date,
        category: newTransaction.category,
        is_exceptional: newTransaction.isExceptional,
        owner_id: newTransaction.owner_id,
        updated_at: newTransaction.updated_at
      };

      try {
        const { error } = await supabase.from('transactions').insert(dbTransaction);
        if (error) throw error;
      } catch (err) {
        console.warn('Queueing transaction insert due to error:', err);
        setPendingOperations(prev => [...prev, {
          id: generateUUID(),
          type: 'INSERT',
          table: 'transactions',
          data: dbTransaction,
          timestamp: new Date().toISOString()
        }]);
      }
    }
  };

  const updateTransaction = async (updatedTx: Transaction) => {
    const toUpdate = {
      ...updatedTx,
      updated_at: new Date().toISOString(),
      owner_id: user?.id || updatedTx.owner_id
    };
    setTransactions(prev => prev.map(t => t.id === toUpdate.id ? toUpdate : t));

    if (user) {
      const dbTransaction = {
        id: toUpdate.id,
        description: toUpdate.description,
        amount: toUpdate.amount,
        type: toUpdate.type,
        date: toUpdate.date,
        category: toUpdate.category,
        is_exceptional: toUpdate.isExceptional,
        owner_id: toUpdate.owner_id,
        updated_at: toUpdate.updated_at
      };

      try {
        const { error } = await supabase.from('transactions').upsert(dbTransaction);
        if (error) throw error;
      } catch (err) {
        console.warn('Queueing transaction update due to error:', err);
        setPendingOperations(prev => [...prev, {
          id: generateUUID(),
          type: 'UPSERT',
          table: 'transactions',
          data: dbTransaction,
          timestamp: new Date().toISOString()
        }]);
      }
    }
  };

  const deleteTransaction = async (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    if (user) {
      try {
        const { error } = await supabase.from('transactions').delete().eq('id', id).eq('owner_id', user.id);
        if (error) throw error;
      } catch (err) {
        console.warn('Queueing transaction delete due to error:', err);
        setPendingOperations(prev => [...prev, {
          id: generateUUID(),
          type: 'DELETE',
          table: 'transactions',
          data: { id, owner_id: user.id },
          timestamp: new Date().toISOString()
        }]);
      }
    }
  };

  const addRecurringItem = async (item: Omit<RecurringItem, 'id'>) => {
    const newItem = {
      ...item,
      id: generateUUID(),
      owner_id: user?.id,
      updated_at: new Date().toISOString()
    };
    setRecurringItems(prev => [...prev, newItem]);

    if (user) {
      const dbItem = {
        id: newItem.id,
        description: newItem.description,
        amount: newItem.amount,
        type: newItem.type,
        category: newItem.category,
        is_installment: newItem.isInstallment,
        total_installments: newItem.totalInstallments,
        start_date: newItem.startDate,
        owner_id: newItem.owner_id,
        updated_at: newItem.updated_at
      };

      try {
        const { error } = await supabase.from('recurring_items').insert(dbItem);
        if (error) throw error;
      } catch (err) {
        console.warn('Queueing recurring item insert due to error:', err);
        setPendingOperations(prev => [...prev, {
          id: generateUUID(),
          type: 'INSERT',
          table: 'recurring_items',
          data: dbItem,
          timestamp: new Date().toISOString()
        }]);
      }
    }
  };

  const updateRecurringItem = async (updated: RecurringItem) => {
    const toUpdate = { ...updated, updated_at: new Date().toISOString() };
    setRecurringItems(prev => prev.map(i => i.id === toUpdate.id ? toUpdate : i));

    if (user) {
      const dbItem = {
        id: toUpdate.id,
        description: toUpdate.description,
        amount: toUpdate.amount,
        type: toUpdate.type,
        category: toUpdate.category,
        is_installment: toUpdate.isInstallment,
        total_installments: toUpdate.totalInstallments,
        start_date: toUpdate.startDate,
        owner_id: toUpdate.owner_id,
        updated_at: toUpdate.updated_at
      };

      try {
        const { error } = await supabase.from('recurring_items').upsert(dbItem);
        if (error) throw error;
      } catch (err) {
        console.warn('Queueing recurring item update due to error:', err);
        setPendingOperations(prev => [...prev, {
          id: generateUUID(),
          type: 'UPSERT',
          table: 'recurring_items',
          data: dbItem,
          timestamp: new Date().toISOString()
        }]);
      }
    }
  }

  const deleteRecurringItem = async (id: string) => {
    setRecurringItems(prev => prev.filter(i => i.id !== id));
    if (user) {
      try {
        const { error } = await supabase.from('recurring_items').delete().eq('id', id).eq('owner_id', user.id);
        if (error) throw error;
      } catch (err) {
        console.warn('Queueing recurring item delete due to error:', err);
        setPendingOperations(prev => [...prev, {
          id: generateUUID(),
          type: 'DELETE',
          table: 'recurring_items',
          data: { id, owner_id: user.id },
          timestamp: new Date().toISOString()
        }]);
      }
    }
  };

  const setSavingsGoal = (amount: number) => {
    setSavingsGoalState(amount);
  };

  const setCurrency = async (curr: string) => {
    setCurrencyState(curr);
    if (user) {
      const now = new Date().toISOString();
      await supabase.from('user_settings').upsert({
        owner_id: user.id,
        currency: curr,
        updated_at: now
      }, { onConflict: 'owner_id' });
    }
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
    .filter(item => {
      if (!item.isInstallment) return true; // Normal recurrent items (Netflix, Rent) always active
      if (!item.startDate || !item.totalInstallments) return true; // Safety fallback

      const start = new Date(item.startDate);
      const now = new Date();

      // Calculate months passed since start
      const monthsPassed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());

      // Active if we are within the [0, total - 1] range
      return monthsPassed >= 0 && monthsPassed < item.totalInstallments;
    })
    .reduce((acc, curr) => acc + curr.amount, 0);

  // This is the "Free Money" available for allocation
  const totalDisposableIncome = totalFixedIncome - totalFixedExpenses - savingsGoal;

  // --- Sync Logic ---
  const syncWithSupabase = async (forceResolution?: 'UPLOAD' | 'DOWNLOAD' | 'MERGE') => {
    if (!user || isSyncing) return;
    setIsSyncing(true);

    try {
      // 0. Process Pending Queue first
      if (pendingOperations.length > 0) {
        const stillPending: PendingOperation[] = [];
        for (const op of pendingOperations) {
          try {
            let error;
            if (op.type === 'DELETE') {
              const { error: err } = await supabase.from(op.table).delete().eq('id', op.data.id).eq('owner_id', user.id);
              error = err;
            } else {
              const { error: err } = await supabase.from(op.table).upsert(op.data);
              error = err;
            }
            if (error) throw error;
          } catch (err) {
            console.error(`Failed to process queued operation ${op.id}`, err);
            stillPending.push(op);
          }
        }
        setPendingOperations(stillPending);
        if (stillPending.length > 0) {
          // If queue failed to clear, maybe network is still flaky, but let's try to proceed with GET sync
          console.warn('Some operations are still pending after sync attempt.');
        }
      }

      // 1. Fetch all cloud data
      const { data: cloudTx } = await supabase.from('transactions').select('*').eq('owner_id', user.id);
      const { data: cloudRec } = await supabase.from('recurring_items').select('*').eq('owner_id', user.id);
      const { data: cloudCycles } = await supabase.from('cycles').select('*').eq('owner_id', user.id);
      const { data: cloudSettings, error: settingsError } = await supabase.from('user_settings').select('*').eq('owner_id', user.id).maybeSingle();

      if (settingsError && settingsError.code !== 'PGRST116') { // PGRST116 is code for 'no rows' in some versions, but maybeSingle handles it. Still, robustness.
        console.warn('Error fetching settings:', settingsError);
      }

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
      // CHANGED: We now default to 'MERGE' to preserve local changes that haven't reached the server yet.
      // 'DOWNLOAD' was causing data loss by overwriting local state with stale server state.
      if (!resolution) resolution = 'MERGE';

      if (resolution === 'DOWNLOAD') {
        // Replace local with cloud, mapping snake_case to camelCase
        if (cloudTx) {
          setTransactions(cloudTx.map((t: any) => ({
            id: t.id,
            description: t.description,
            amount: t.amount,
            type: t.type,
            date: t.date,
            category: t.category,
            isExceptional: t.is_exceptional,
            owner_id: t.owner_id,
            updated_at: t.updated_at
          })));
        }
        if (cloudRec) setRecurringItems(cloudRec);
        if (cloudCycles) {
          setCycles(cloudCycles.map((c: any) => ({
            id: c.id,
            name: c.name,
            startDate: c.start_date,
            endDate: c.end_date,
            initialBudget: c.initial_budget,
            savingsGoal: c.savings_goal,
            isActive: c.is_active,
            owner_id: c.owner_id,
            updated_at: c.updated_at
          })));
        }
        if (cloudSettings) {
          setCustomCategories(cloudSettings.custom_categories || []);
          setSavingsGoalState(cloudSettings.savings_goal || 0);
          setCurrencyState(cloudSettings.currency || 'USD');
        }
      }
      else if (resolution === 'UPLOAD') {
        // Force push local to cloud (Caution: Overwrites/Adds?)
        // "Subir mis datos": We assume local is truth. We upsert everything.
        const txToUpload = transactions.map(t => ({
          id: t.id,
          description: t.description,
          amount: t.amount,
          type: t.type,
          category: t.category,
          date: t.date,
          is_exceptional: t.isExceptional,
          owner_id: user.id,
          updated_at: t.updated_at || new Date().toISOString()
        }));
        const recToUpload = recurringItems.map(i => ({
          id: i.id,
          description: i.description,
          amount: i.amount,
          type: i.type,
          category: i.category,
          is_installment: i.isInstallment,
          total_installments: i.totalInstallments,
          start_date: i.startDate,
          owner_id: user.id,
          updated_at: i.updated_at || new Date().toISOString()
        }));
        const cyclesToUpload = cycles.map(c => ({
          id: c.id,
          name: c.name,
          start_date: c.startDate,
          end_date: c.endDate,
          initial_budget: c.initialBudget,
          savings_goal: c.savingsGoal,
          is_active: c.isActive,
          owner_id: user.id,
          updated_at: c.updated_at || new Date().toISOString()
        }));

        await supabase.from('transactions').upsert(txToUpload);
        await supabase.from('recurring_items').upsert(recToUpload);
        await supabase.from('cycles').upsert(cyclesToUpload);
        await supabase.from('user_settings').upsert({
          id: user.id, // Primary key for settings? user_id usually
          owner_id: user.id,
          custom_categories: customCategories,
          savings_goal: savingsGoal,
          currency: currency,
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
              txUpdates.push({
                id: localTx.id,
                description: localTx.description,
                amount: localTx.amount,
                type: localTx.type,
                category: localTx.category,
                date: localTx.date,
                is_exceptional: localTx.isExceptional,
                owner_id: user.id,
                updated_at: localTx.updated_at
              });
            }
          }
        });

        // Items that are local only -> Push to cloud
        mergedTx.forEach(l => {
          if (!cloudTx?.some(c => c.id === l.id)) {
            txUpdates.push({
              id: l.id,
              description: l.description,
              amount: l.amount,
              type: l.type,
              category: l.category,
              date: l.date,
              is_exceptional: l.isExceptional,
              owner_id: user.id,
              updated_at: l.updated_at || new Date().toISOString()
            });
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
              recUpdates.push({
                id: localItem.id,
                description: localItem.description,
                amount: localItem.amount,
                type: localItem.type,
                category: localItem.category,
                is_installment: localItem.isInstallment,
                total_installments: localItem.totalInstallments,
                start_date: localItem.startDate,
                owner_id: user.id,
                updated_at: localItem.updated_at || new Date().toISOString()
              });
            }
          }
        });

        mergedRec.forEach(l => {
          if (!cloudRec?.some(c => c.id === l.id)) {
            recUpdates.push({
              id: l.id,
              description: l.description,
              amount: l.amount,
              type: l.type,
              category: l.category,
              is_installment: l.isInstallment,
              total_installments: l.totalInstallments,
              start_date: l.startDate,
              owner_id: user.id,
              updated_at: l.updated_at || new Date().toISOString()
            });
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
              cycleUpdates.push({
                id: localC.id,
                name: localC.name,
                start_date: localC.startDate,
                end_date: localC.endDate,
                initial_budget: localC.initialBudget,
                savings_goal: localC.savingsGoal,
                is_active: localC.isActive,
                owner_id: user.id,
                updated_at: localC.updated_at
              });
            }
          }
        });

        // Push local-only cycles to cloud
        mergedCycles.forEach(l => {
          if (!cloudCycles?.some(c => c.id === l.id)) {
            cycleUpdates.push({
              id: l.id,
              name: l.name,
              start_date: l.startDate,
              end_date: l.endDate,
              initial_budget: l.initialBudget,
              savings_goal: l.savingsGoal,
              is_active: l.isActive,
              owner_id: user.id,
              updated_at: l.updated_at || new Date().toISOString()
            });
          }
        });

        if (cycleUpdates.length > 0) {
          await supabase.from('cycles').upsert(cycleUpdates);
        }
        setCycles(mergedCycles as Cycle[]);
      }

    } catch (err) {
      console.error('Sync failed', err);
      // Optional: Add a retry mechanism or alert user
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
    return calculateCycleMetrics(activeCycle || null, activeCycleTransactions);
  }, [activeCycle, activeCycleTransactions]);

  // --- Weekly Breakdown Logic (Dynamic / Self-Adjusting) ---
  const weeklyBreakdown = useMemo(() => {
    return calculateWeeklyBreakdown(activeCycle || null, activeCycleTransactions);
  }, [activeCycle, activeCycleTransactions, cycleMetrics]);

  const currentWeekStatus = weeklyBreakdown.find(w => w.isCurrent) || null;

  // --- Active Installments (BNPL Visibility) ---
  const activeInstallments = useMemo(() => {
    return recurringItems
      .filter(item => item.isInstallment && item.startDate && item.totalInstallments)
      .map(item => {
        const start = new Date(item.startDate!);
        const now = new Date();
        const monthsPassed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());

        // Only include if it's currently active (or slightly in future/past context)
        // We show it if it's active OR if it just finished this month for visibility
        if (monthsPassed >= 0 && monthsPassed < item.totalInstallments!) {
          return {
            ...item,
            currentInstallment: monthsPassed + 1,
            remaining: item.totalInstallments! - (monthsPassed + 1)
          };
        }
        return null;
      })
      .filter((i): i is NonNullable<typeof i> => i !== null); // Filter out nulls
  }, [recurringItems]);

  // --- Create Cycle ---
  const createCycle = async (endDate: Date, customInitialBudget: number) => {
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
      const dbCycles = [...updatedCycles, newCycle].map(c => ({
        id: c.id,
        name: c.name,
        start_date: c.startDate,
        end_date: c.endDate,
        initial_budget: c.initialBudget,
        savings_goal: c.savingsGoal,
        is_active: c.isActive,
        owner_id: user.id,
        updated_at: new Date().toISOString()
      }));

      try {
        const { error } = await supabase.from('cycles').upsert(dbCycles);
        if (error) throw error;
      } catch (err) {
        console.warn('Queueing cycles upsert due to error:', err);
        setPendingOperations(prev => [...prev, {
          id: generateUUID(),
          type: 'UPSERT',
          table: 'cycles',
          data: dbCycles,
          timestamp: new Date().toISOString()
        }]);
      }
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

  // --- Security & Data Privacy ---
  const wipeAllUserData = async () => {
    if (!user) return;

    setIsSyncing(true);
    try {
      // 1. Delete from all tables in Supabase for this owner
      const tables = ['transactions', 'recurring_items', 'cycles', 'user_settings'] as const;

      for (const table of tables) {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('owner_id', user.id);

        if (error) console.error(`Error wiping table ${table}:`, error);
      }

      // 2. Clear local data
      resetData();

      // 3. Clear pending operations
      setPendingOperations([]);
      localStorage.removeItem('pendingOperations');

      console.log('User data successfully wiped from cloud and local storage.');
    } catch (err) {
      console.error('Failed to wipe user data:', err);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  // --- Reset Data (Logout cleanup) ---
  const resetData = () => {
    // 1. Clear State
    // 1. Clear State
    setTransactions([]);
    setRecurringItems([]);
    setCycles([]);
    setCustomCategories([]);
    setSavingsGoalState(0);
    setCurrencyState('USD');

    // 2. Clear Local Storage
    localStorage.removeItem('transactions');
    localStorage.removeItem('recurringItems');
    localStorage.removeItem('cycles');
    localStorage.removeItem('customCategories');
    localStorage.removeItem('savingsGoal');
    localStorage.removeItem('currency');
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
      updateRecurringItem, // Missing in previous render? Fixed implicitly or needs check
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
