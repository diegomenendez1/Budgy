import { Transaction, TransactionType, Cycle, CycleMetrics, WeeklyStatus } from '../types';

export const calculateCycleMetrics = (
    activeCycle: Cycle | null,
    activeCycleTransactions: Transaction[]
): CycleMetrics => {
    if (!activeCycle) {
        return {
            daysPassed: 0,
            daysTotal: 30,
            progressPercentage: 0,
            totalAvailable: 0,
            remainingBudget: 0,
            spentThisCycle: 0,
            spentPace: 0,
            idealDailyBudget: 0,
            currentSurplus: 0,
            isOverspending: false,
            suggestedDailyBudget: null,
        };
    }

    const now = new Date();
    const start = new Date(activeCycle.startDate);
    const end = new Date(activeCycle.endDate);
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);

    const totalTime = end.getTime() - start.getTime();
    const daysTotal = Math.ceil(totalTime / (1000 * 3600 * 24)) || 1;

    const elapsedTime = Math.min(Math.max(0, now.getTime() - start.getTime()), totalTime);
    const daysPassed = Math.ceil(elapsedTime / (1000 * 3600 * 24)) || 1; // 1-based index

    const progressPercentage = Math.min(100, (daysPassed / daysTotal) * 100);

    // Calculate Totals
    const spentThisCycle = activeCycleTransactions
        .filter((t) => t.type === TransactionType.EXPENSE)
        .reduce((acc, t) => acc + t.amount, 0);

    const incomeThisCycle = activeCycleTransactions
        .filter((t) => t.type === TransactionType.INCOME)
        .reduce((acc, t) => acc + t.amount, 0);

    // Calculate Pace: Exclude exceptional expenses AND incomes
    const spentPace = activeCycleTransactions
        .filter((t) => t.type === TransactionType.EXPENSE && !t.isExceptional)
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
        suggestedDailyBudget,
    };
};

export const calculateWeeklyBreakdown = (
    activeCycle: Cycle | null,
    activeCycleTransactions: Transaction[]
): WeeklyStatus[] => {
    if (!activeCycle) return [];

    const weeks: WeeklyStatus[] = [];
    const start = new Date(activeCycle.startDate);
    start.setUTCHours(0, 0, 0, 0);
    const cycleEnd = new Date(activeCycle.endDate);
    cycleEnd.setUTCHours(23, 59, 59, 999);

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
        wEnd.setUTCDate(wStart.getUTCDate() + 6);
        wEnd.setUTCHours(23, 59, 59, 999);

        if (wEnd > cycleEnd) {
            wEnd.setTime(cycleEnd.getTime());
        }

        // Is Current logic strictly needs careful timezone handling too, but for breakdown simulation we check overlap
        const isCurrent = now >= wStart && now <= wEnd;
        const isPast = wEnd < now && !isCurrent;
        const isFuture = wStart > now;

        const daysInWeek = Math.ceil((wEnd.getTime() - wStart.getTime()) / (1000 * 3600 * 24));
        const effectiveDaysInWeek = Math.max(1, daysInWeek);

        // Get transactions for this week
        const weekTransactions = activeCycleTransactions.filter((t) => {
            const d = new Date(t.date);
            return d >= wStart && d <= wEnd;
        });

        const weekSpent = weekTransactions
            .filter((t) => t.type === TransactionType.EXPENSE)
            .reduce((acc, t) => acc + t.amount, 0);

        const weekIncome = weekTransactions
            .filter((t) => t.type === TransactionType.INCOME)
            .reduce((acc, t) => acc + t.amount, 0);

        let limit = 0;

        if (isPast) {
            // Past weeks keep limits based on when they happened.
            limit = originalDailyAverage * effectiveDaysInWeek;

            accumulatedSpentPast += weekSpent;
            accumulatedIncome += weekIncome;
            daysPassedTotal += effectiveDaysInWeek;
        } else if (isCurrent) {
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
            const newDailyBudget = daysLeftInCycleFromTomorrow > 0 ? balanceNow / daysLeftInCycleFromTomorrow : 0;

            // The limit for THIS week is: What we spent + (New Daily * Days Left in Week)
            limit = weekSpent + newDailyBudget * daysLeftInWeek;

            // Sanity check
            if (balanceNow < 0) {
                limit = weekSpent;
            }

            accumulatedSpentPast += weekSpent;
            accumulatedIncome += weekIncome;
            daysPassedTotal += effectiveDaysInWeek;
        } else if (isFuture) {
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
            label: `Semana ${weekNum}`,
        });

        currentIterDate = new Date(wEnd);
        currentIterDate.setUTCDate(currentIterDate.getUTCDate() + 1);
        currentIterDate.setUTCHours(0, 0, 0, 0);
        weekNum++;
    }

    return weeks;
};
