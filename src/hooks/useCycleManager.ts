import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Cycle } from '../types';

const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const useCycleManager = (userId: string | undefined, savingsGoal: number) => {
    const effectiveUserId = userId || 'local-user';

    const cycles = useLiveQuery(
        () => db.cycles.where('owner_id').equals(effectiveUserId).toArray(),
        [effectiveUserId]
    ) || [];

    const createCycle = async (endDate: Date, initialBudget: number) => {
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

        // Atomic transaction: deactivate old cycles, truncate their endDate, create new
        await db.transaction('rw', db.cycles, async () => {
            const activeCycles = await db.cycles
                .where('owner_id').equals(effectiveUserId)
                .filter(c => c.isActive)
                .toArray();

            if (activeCycles.length > 0) {
                const yesterday = new Date(startDate);
                yesterday.setDate(yesterday.getDate() - 1);
                yesterday.setHours(23, 59, 59, 999);

                await db.cycles.bulkPut(
                    activeCycles.map(c => {
                        const oldEnd = new Date(c.endDate);
                        const oldStart = new Date(c.startDate);
                        // Only truncate if old endDate overlaps AND yesterday >= old startDate
                        // (prevents creating invalid cycles where endDate < startDate)
                        const shouldTruncate = oldEnd >= startDate && yesterday >= oldStart;
                        return {
                            ...c,
                            isActive: false,
                            endDate: shouldTruncate ? yesterday.toISOString() : c.endDate,
                            updated_at: new Date().toISOString()
                        };
                    })
                );
            }

            await db.cycles.add(newCycle);
        });
    };

    return {
        cycles,
        createCycle
    };
};
