import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Transaction, TransactionType } from '../types';
import { TransactionInputSchema } from '../lib/validation';

// Helper for IDs
const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const useTransactionManager = (userId: string | undefined) => {
    const effectiveUserId = userId || 'local-user';

    // Live Query for all transactions
    // In a real multi-user app we filter by owner_id, but here 'local-user' is default
    const transactions = useLiveQuery(
        () => db.transactions.where('owner_id').equals(effectiveUserId).reverse().sortBy('date') // Optimized query
    ) || [];

    // Fallback if index isn't created or simple array needed:
    // const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray()) || [];


    const addTransaction = async (t: Omit<Transaction, 'id' | 'updated_at' | 'owner_id' | 'is_deleted'>) => {
        // Validate input
        const validated = TransactionInputSchema.parse(t);

        const newTransaction: Transaction = {
            ...validated,
            id: generateUUID(),
            owner_id: effectiveUserId,
            updated_at: new Date().toISOString(),
            is_deleted: false,
            isExceptional: t.isExceptional ?? validated.isExceptional,
            date: validated.date as string
        };
        await db.transactions.add(newTransaction);
    };

    const updateTransaction = async (updatedTx: Transaction) => {
        const toUpdate = {
            ...updatedTx,
            updated_at: new Date().toISOString(),
            owner_id: updatedTx.owner_id || effectiveUserId
        };
        await db.transactions.put(toUpdate);
    };

    const deleteTransaction = async (id: string) => {
        // Soft delete? Hard delete for now as per original logic
        await db.transactions.delete(id);
    };

    return {
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction
    };
};
