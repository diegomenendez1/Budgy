import Dexie, { Table } from 'dexie';
import { Cycle, RecurringItem, Transaction, UserSettings } from '../../types';

export interface ChatSession {
    id: string;
    user_id: string;
    title: string;
    created_at?: string;
    updated_at?: string;
}

export interface ChatMessage {
    id: string;
    session_id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at?: string;
}

export class BudgyDatabase extends Dexie {
    transactions!: Table<Transaction>;
    recurringItems!: Table<RecurringItem>;
    cycles!: Table<Cycle>;
    userSettings!: Table<UserSettings>;
    chatSessions!: Table<ChatSession>;
    chatMessages!: Table<ChatMessage>;

    constructor() {
        super('BudgyDatabase');

        // Schema definition
        // &id = unique primary key (string UUID)
        this.version(1).stores({
            transactions: '&id, date, type, category',
            recurringItems: '&id, type, category',
            cycles: '&id, isActive',
            userSettings: '&owner_id',
            chatSessions: '&id, user_id, updated_at',
            chatMessages: '&id, session_id, created_at'
        });
    }
}

export const db = new BudgyDatabase();

// --- Migration Utility ---
export const migrateFromLocalStorage = async () => {
    try {
        const hasMigrated = localStorage.getItem('budgy_migrated_to_dexie');
        if (hasMigrated) return;

        console.log('Starting migration from localStorage to Dexie...');

        const getSaved = <T>(key: string): T | null => {
            const saved = localStorage.getItem(key);
            if (!saved) return null;
            try {
                return JSON.parse(saved);
            } catch {
                return null;
            }
        };

        const transactions = getSaved<Transaction[]>('transactions') || [];
        const recurringItems = getSaved<RecurringItem[]>('recurringItems') || [];
        const cycles = getSaved<Cycle[]>('cycles') || [];
        const customCategories = getSaved<string[]>('customCategories') || [];
        const savingsGoal = getSaved<number>('savingsGoal') || 0;
        const currency = getSaved<string>('currency') || 'USD';

        // Helper to ensure owner_id exists (local user)
        const LOCAL_USER_ID = 'local-user';

        await db.transaction('rw', db.transactions, db.recurringItems, db.cycles, db.userSettings, async () => {
            // 1. Transactions
            if (transactions.length > 0) {
                const cleanTx = transactions.map(t => ({ ...t, owner_id: t.owner_id || LOCAL_USER_ID }));
                await db.transactions.bulkPut(cleanTx);
            }

            // 2. Recurring Items
            if (recurringItems.length > 0) {
                const cleanRec = recurringItems.map(i => ({ ...i, owner_id: i.owner_id || LOCAL_USER_ID }));
                await db.recurringItems.bulkPut(cleanRec);
            }

            // 3. Cycles
            if (cycles.length > 0) {
                const cleanCycles = cycles.map(c => ({ ...c, owner_id: c.owner_id || LOCAL_USER_ID }));
                await db.cycles.bulkPut(cleanCycles);
            }

            // 4. User Settings
            await db.userSettings.put({
                id: LOCAL_USER_ID,
                owner_id: LOCAL_USER_ID,
                custom_categories: customCategories,
                savings_goal: savingsGoal,
                currency: currency,
                updated_at: new Date().toISOString()
            });
        });

        localStorage.setItem('budgy_migrated_to_dexie', 'true');
        console.log('Migration completed successfully.');

    } catch (error) {
        console.error('Migration failed:', error);
    }
};
