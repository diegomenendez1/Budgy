export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum Frequency {
  MONTHLY = 'MONTHLY',
  ONE_TIME = 'ONE_TIME',
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  date: string;
  category: string;
  isExceptional?: boolean; // Flag for one-off large expenses
}

export interface RecurringItem {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
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

export interface Cycle {
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
  deleteTransaction: (id: string) => void;
  addRecurringItem: (item: Omit<RecurringItem, 'id'>) => void;
  deleteRecurringItem: (id: string) => void;
  
  // Planning Data (Live)
  totalFixedIncome: number;
  totalFixedExpenses: number;
  totalDisposableIncome: number; // Live "Free Money" calculation
  currentSavingsGoal: number;
  setSavingsGoal: (amount: number) => void;

  // Cycle Management
  cycles: Cycle[];
  activeCycle: Cycle | null;
  createCycle: (endDate: Date, initialBudget: number) => void;
  
  // Active Cycle Metrics
  cycleMetrics: CycleMetrics;
  weeklyBreakdown: WeeklyStatus[];
  currentWeekStatus: WeeklyStatus | null;
  
  // History
  cycleHistory: CycleHistoryItem[];

  // Categories
  categories: string[];
  addCategory: (category: string) => void;
}