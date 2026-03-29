import { Transaction, TransactionType, Cycle, CycleMetrics, WeeklyStatus } from '../types';

export const calculateCycleMetrics = (
    activeCycle: Cycle | null,
    activeCycleTransactions: Transaction[]
): CycleMetrics => {
    if (!activeCycle) {
        return {
            daysPassed: 0,
            daysTotal: 30,
            daysLeft: 30,
            progressPercentage: 0,
            totalAvailable: 0,
            spendableBudget: 0,
            remainingBudget: 0,
            spentThisCycle: 0,
            spentPace: 0,
            exceptionalSpent: 0,
            idealDailyBudget: 0,
            currentSurplus: 0,
            isOverspending: false,
            isBudgetExceeded: false,
            suggestedDailyBudget: null,
        };
    }

    const now = new Date();
    const start = new Date(activeCycle.startDate);
    const end = new Date(activeCycle.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const totalTime = end.getTime() - start.getTime();
    const daysTotal = Math.round(totalTime / (1000 * 3600 * 24)) || 1;

    const cycleEnded = now > end;
    const elapsedTime = Math.min(Math.max(0, now.getTime() - start.getTime()), totalTime);
    const daysPassed = Math.ceil(elapsedTime / (1000 * 3600 * 24)) || 1;
    // daysLeft = remaining days including today (min 1 while cycle active)
    const daysLeft = cycleEnded ? 0 : Math.max(1, daysTotal - daysPassed);

    const progressPercentage = Math.min(100, (daysPassed / daysTotal) * 100);

    // --- Totals ---
    const spentThisCycle = activeCycleTransactions
        .filter((t) => t.type === TransactionType.EXPENSE)
        .reduce((acc, t) => acc + t.amount, 0);

    const incomeThisCycle = activeCycleTransactions
        .filter((t) => t.type === TransactionType.INCOME)
        .reduce((acc, t) => acc + t.amount, 0);

    const exceptionalSpent = activeCycleTransactions
        .filter((t) => t.type === TransactionType.EXPENSE && t.isExceptional)
        .reduce((acc, t) => acc + t.amount, 0);

    const spentPace = activeCycleTransactions
        .filter((t) => t.type === TransactionType.EXPENSE && !t.isExceptional)
        .reduce((acc, t) => acc + t.amount, 0);

    // --- Budget hierarchy ---
    // totalAvailable: all money in the cycle (initial + variable income)
    const totalAvailable = activeCycle.initialBudget + incomeThisCycle;
    // spendableBudget: what can actually be spent (subtract savings goal)
    const spendableBudget = totalAvailable - activeCycle.savingsGoal;
    // remainingBudget: real money left after ALL expenses
    const remainingBudget = spendableBudget - spentThisCycle;

    // --- Pace logic ---
    // paceBudget: spendable minus exceptional (the pool for regular daily spending)
    const paceBudget = Math.max(0, spendableBudget - exceptionalSpent);
    const idealDailyBudget = paceBudget / daysTotal;
    const idealSpendToDate = idealDailyBudget * daysPassed;
    const currentSurplus = idealSpendToDate - spentPace;
    const isOverspending = currentSurplus < 0;
    const isBudgetExceeded = remainingBudget < 0;

    // --- Suggested daily: always based on REAL remaining budget ---
    const suggestedDailyBudget = daysLeft > 0
        ? Math.max(0, remainingBudget / daysLeft)
        : null;

    return {
        daysPassed,
        daysTotal,
        daysLeft,
        progressPercentage,
        totalAvailable,
        spendableBudget,
        remainingBudget,
        spentThisCycle,
        spentPace,
        exceptionalSpent,
        idealDailyBudget,
        currentSurplus,
        isOverspending,
        isBudgetExceeded,
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
    start.setHours(0, 0, 0, 0);
    const cycleEnd = new Date(activeCycle.endDate);
    cycleEnd.setHours(23, 59, 59, 999);

    const now = new Date();

    const totalTime = cycleEnd.getTime() - start.getTime();
    const cycleTotalDays = Math.round(totalTime / (1000 * 3600 * 24)) || 1;

    // Total income across the cycle (same base as calculateCycleMetrics)
    const totalCycleIncome = activeCycleTransactions
        .filter((t) => t.type === TransactionType.INCOME)
        .reduce((acc, t) => acc + t.amount, 0);

    // Spendable budget = initial + ALL income - savings goal (matches metrics)
    const spendableBudget = activeCycle.initialBudget + totalCycleIncome - activeCycle.savingsGoal;
    const dailyRate = spendableBudget / cycleTotalDays;

    let currentIterDate = new Date(start);
    let weekNum = 1;
    let accumulatedSpentPast = 0;
    let accumulatedAllocated = 0;
    let daysPassedTotal = 0;

    // For future weeks: compute a single daily rate once (after current week)
    let futureDailyRate: number | null = null;

    while (currentIterDate <= cycleEnd) {
        const wStart = new Date(currentIterDate);
        const wEnd = new Date(currentIterDate);
        wEnd.setDate(wStart.getDate() + 6);
        wEnd.setHours(23, 59, 59, 999);

        if (wEnd > cycleEnd) {
            wEnd.setTime(cycleEnd.getTime());
        }

        const isCurrent = now >= wStart && now <= wEnd;
        const isPast = wEnd < now && !isCurrent;
        const isFuture = wStart > now;

        const daysInWeek = Math.ceil((wEnd.getTime() - wStart.getTime()) / (1000 * 3600 * 24));
        const effectiveDaysInWeek = Math.max(1, daysInWeek);

        const weekTransactions = activeCycleTransactions.filter((t) => {
            const d = new Date(t.date);
            d.setHours(0, 0, 0, 0);
            return d >= wStart && d <= wEnd;
        });

        const weekSpent = weekTransactions
            .filter((t) => t.type === TransactionType.EXPENSE)
            .reduce((acc, t) => acc + t.amount, 0);

        let limit = 0;

        if (isPast) {
            // Past weeks: limit = max(what was spent, pro-rata allocation)
            // This way, past limits reflect reality and don't over-claim budget
            const proRataLimit = dailyRate * effectiveDaysInWeek;
            limit = Math.max(weekSpent, proRataLimit);

            accumulatedSpentPast += weekSpent;
            accumulatedAllocated += limit;
            daysPassedTotal += effectiveDaysInWeek;
        } else if (isCurrent) {
            // Balance = total budget minus what was ALLOCATED to past weeks (not just spent)
            const balanceAfterPast = spendableBudget - accumulatedAllocated;
            const balanceNow = balanceAfterPast - weekSpent;

            const daysRemainingInCycle = cycleTotalDays - daysPassedTotal;
            const daysPassedInWeek = Math.max(0, Math.floor((now.getTime() - wStart.getTime()) / (1000 * 3600 * 24)));
            const daysLeftInWeek = Math.max(1, effectiveDaysInWeek - daysPassedInWeek);
            const daysLeftInCycleFromTomorrow = Math.max(1, daysRemainingInCycle - daysPassedInWeek);

            const newDailyBudget = balanceAfterPast > 0
                ? balanceAfterPast / daysRemainingInCycle
                : 0;

            limit = weekSpent + Math.max(0, newDailyBudget) * daysLeftInWeek;

            accumulatedSpentPast += weekSpent;
            accumulatedAllocated += limit;
            daysPassedTotal += effectiveDaysInWeek;

            // Future daily rate from unallocated balance
            const futureDaysRemaining = cycleTotalDays - daysPassedTotal;
            const futureBalance = spendableBudget - accumulatedAllocated;
            futureDailyRate = futureDaysRemaining > 0
                ? Math.max(0, futureBalance / futureDaysRemaining)
                : 0;
        } else if (isFuture) {
            if (futureDailyRate === null) {
                const futureBalance = spendableBudget - accumulatedAllocated;
                const futureDaysRemaining = Math.max(1, cycleTotalDays - daysPassedTotal);
                futureDailyRate = Math.max(0, futureBalance / futureDaysRemaining);
            }

            limit = futureDailyRate * effectiveDaysInWeek;
            accumulatedAllocated += limit;
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
        currentIterDate.setDate(currentIterDate.getDate() + 1);
        currentIterDate.setHours(0, 0, 0, 0);
        weekNum++;
    }

    return weeks;
};
