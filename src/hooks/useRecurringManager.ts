import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { RecurringItem } from '../types';
import { RecurringItemSchema } from '../lib/validation';

// Helper for IDs
const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const useRecurringManager = (userId: string | undefined) => {
    const effectiveUserId = userId || 'local-user';

    const recurringItems = useLiveQuery(
        () => db.recurringItems.where('owner_id').equals(effectiveUserId).toArray()
    ) || [];

    const addRecurringItem = async (item: Omit<RecurringItem, 'id' | 'updated_at' | 'owner_id' | 'is_deleted'>) => {
        // Validation
        const validated = RecurringItemSchema.omit({ id: true, updated_at: true, owner_id: true, is_deleted: true }).parse(item);

        const newItem: RecurringItem = {
            ...validated,
            id: generateUUID(),
            owner_id: effectiveUserId,
            updated_at: new Date().toISOString(),
            is_deleted: false
        };
        await db.recurringItems.add(newItem);
    };

    const updateRecurringItem = async (updated: RecurringItem) => {
        const toUpdate = {
            ...updated,
            updated_at: new Date().toISOString(),
            owner_id: updated.owner_id || effectiveUserId
        };
        await db.recurringItems.put(toUpdate);
    };

    const deleteRecurringItem = async (id: string) => {
        await db.recurringItems.delete(id);
    };

    return {
        recurringItems,
        addRecurringItem,
        updateRecurringItem,
        deleteRecurringItem
    };
};
