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
  isExceptional?: boolean; // New: Flag for one-off large expenses
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
  
  // Metrics
  totalDisposableIncome: number;
  currentBalance: number;
  spentThisCycle: number;
  
  // Cycle & Savings
  cycleStartDate: string;
  savingsGoal: number;
  setSavingsGoal: (amount: number) => void;
  startNewCycle: () => void;
  weeklyBreakdown: WeeklyStatus[];
  currentWeekStatus: WeeklyStatus | null;
  
  // History
  cycleHistory: CycleHistoryItem[];
}