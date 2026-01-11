
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum Frequency {
  MONTHLY = 'MONTHLY',
  ONE_TIME = 'ONE_TIME',
}

export interface BaseEntity {
  owner_id?: string;
  updated_at?: string; // ISO string
  is_deleted?: boolean; // Soft delete for sync
}

export interface UserSettings extends BaseEntity {
  id: string; // usually 'settings' or user_id
  custom_categories: string[];
  savings_goal: number;
  currency?: string;
}

export interface Transaction extends BaseEntity {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  date: string;
  category: string;
  isExceptional?: boolean; // Flag for one-off large expenses
}

export interface RecurringItem extends BaseEntity {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  // Installment / BNPL logic
  isInstallment?: boolean;
  totalInstallments?: number; // e.g., 3, 6, 12
  startDate?: string; // ISO Date required to calculate expiration
}

export interface WeeklyStatus {
  weekNumber: number;
  startDate: string;
  endDate: string;
  limit: number;
  spent: number;
  remaining: number;
  isCurrent: boolean;
  label: string; // e.g., "Días 1-7"
}

export interface Cycle extends BaseEntity {
  id: string;
  name: string; // e.g., "Octubre 2024"
  startDate: string;
  endDate: string;
  initialBudget: number; // Snapshot of "Free Money" at cycle start
  savingsGoal: number;   // Snapshot of savings goal at cycle start
  isActive: boolean;
}

export interface CycleMetrics {
  daysPassed: number;
  daysTotal: number;
  progressPercentage: number;
  totalAvailable: number;
  remainingBudget: number;
  spentThisCycle: number;
  spentPace: number; // Spend excluding exceptional items
  idealDailyBudget: number;
  currentSurplus: number; // + or - based on ideal pace
  isOverspending: boolean;
  suggestedDailyBudget: number | null; // If overspending, how much to spend to catch up
}

export interface CycleHistoryItem {
  id: string;
  endDate: string;
  savingsGoal: number;
  achievedSurplus: number;
}

export interface FinancialContextType {
  transactions: Transaction[];
  recurringItems: RecurringItem[];
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  updateTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addRecurringItem: (item: Omit<RecurringItem, 'id'>) => void;
  updateRecurringItem: (item: RecurringItem) => void;
  deleteRecurringItem: (id: string) => void;

  // Planning Data (Live)
  totalFixedIncome: number;
  totalFixedExpenses: number;
  totalDisposableIncome: number; // Live "Free Money" calculation
  currentSavingsGoal: number;
  setSavingsGoal: (amount: number) => void;
  setCurrency: (currency: string) => void;

  // Cycle Management
  cycles: Cycle[];
  activeCycle: Cycle | null;
  currency: string;
  createCycle: (endDate: Date, initialBudget: number) => void;
  transferSavingsToBudget: () => void;

  // Active Cycle Metrics
  cycleMetrics: CycleMetrics;
  weeklyBreakdown: WeeklyStatus[];
  currentWeekStatus: WeeklyStatus | null;

  // Installments / BNPL
  activeInstallments: (RecurringItem & { currentInstallment: number, remaining: number })[];

  // History
  cycleHistory: CycleHistoryItem[];

  // Categories
  categories: string[];
  addCategory: (category: string) => void;

  // Auth & Sync
  showAuth: () => void;
  isSyncing: boolean;
  resetData: () => void;

  // AI Coach
  generateDataPacket: (range: 'current_cycle' | 'last_30_days' | 'current_month') => any;
}
