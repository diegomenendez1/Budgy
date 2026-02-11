import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Cycle } from '../../types';

const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const useCycleManager = (userId: string | undefined, savingsGoal: number) => {
    const effectiveUserId = userId || 'local-user';

    const cycles = useLiveQuery(
        () => db.cycles.where('owner_id').equals(effectiveUserId).toArray()
    ) || [];

    const createCycle = async (endDate: Date, initialBudget: number) => {
        // 1. Deactivate current cycle
        const cyclesToDeactivate = cycles
            .filter(c => c.isActive)
            .map(c => ({ ...c, isActive: false, updated_at: new Date().toISOString() }));

        if (cyclesToDeactivate.length > 0) {
            await db.cycles.bulkPut(cyclesToDeactivate);
        }

        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        const monthName = endDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        const capitalizedName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

        const newCycle: Cycle = {
            id: generateUUID(),
            name: capitalizedName,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            initialBudget: initialBudget,
            savingsGoal: savingsGoal,
            isActive: true,
            owner_id: effectiveUserId,
            updated_at: new Date().toISOString(),
            is_deleted: false
        };

        await db.cycles.add(newCycle);
    };

    return {
        cycles,
        createCycle
    };
};
