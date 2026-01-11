import { strict as assert } from 'node:assert';
import { calculateCycleMetrics, calculateWeeklyBreakdown } from '../src/lib/financeLogic';
import { Transaction, TransactionType, Cycle } from '../types';

// Mock Data
const mockCycle: Cycle = {
    id: 'test-cycle',
    name: 'November Test',
    startDate: '2025-11-01T00:00:00.000Z',
    endDate: '2025-11-30T23:59:59.999Z',
    initialBudget: 3000,
    savingsGoal: 500,
    isActive: true,
};

const mockTransactions: Transaction[] = [
    {
        id: 't1',
        description: 'Groceries',
        amount: 100,
        type: TransactionType.EXPENSE,
        date: '2025-11-02T10:00:00.000Z',
        category: 'Food',
    },
    {
        id: 't2',
        description: 'Rent',
        amount: 1000,
        type: TransactionType.EXPENSE,
        date: '2025-11-01T09:00:00.000Z',
        category: 'Housing',
    },
    {
        id: 't3',
        description: 'Freelance Gig',
        amount: 500,
        type: TransactionType.INCOME,
        date: '2025-11-15T10:00:00.000Z',
        category: 'Work',
    },
    {
        id: 't4',
        description: 'Emergency Repair',
        amount: 2000,
        type: TransactionType.EXPENSE,
        date: '2025-11-20T10:00:00.000Z',
        category: 'Emergency',
        isExceptional: true, // Should be excluded from Pace
    },
];

console.log('🧪 Starting Power User Logic Tests...');
console.log('====================================');

// --- Test 1: Cycle Logic & Rollover ---
// Verify Total Available updates with extra income
console.log('\n[TEST 1] Cycle Metrics & Totals');
const metrics = calculateCycleMetrics(mockCycle, mockTransactions);

try {
    assert.equal(metrics.daysTotal, 30, 'Total days should be 30');
    // Initial (3000) + Freelance (500) = 3500
    assert.equal(metrics.totalAvailable, 3500, 'Total Available should include extra income');
    // Spent: 100 + 1000 + 2000 = 3100
    assert.equal(metrics.spentThisCycle, 3100, 'Spent This Cycle should include ALL expenses');
    // Remaining: 3500 - 3100 = 400
    assert.equal(metrics.remainingBudget, 400, 'Remaining Budget verification');

    console.log('✅ PASS: Basic Totals & Math');
} catch (e) {
    console.error('❌ FAIL: Basic Totals', e);
}

// --- Test 2: Pacing Logic (The Power User Obsession) ---
// "Pace" should exclude exceptional items
console.log('\n[TEST 2] Pacing Logic (Excluding Exceptional)');
try {
    // Pace Spent: 100 (Groceries) + 1000 (Rent) = 1100.
    // Should EXCLUDE the 2000 Emergency Repair.
    assert.equal(metrics.spentPace, 1100, 'Spent Pace should exclude exceptional items');

    // Ideal Daily Budget = 3500 / 30 = 116.666...
    const expectedIdealDaily = 3500 / 30;
    assert.ok(Math.abs(metrics.idealDailyBudget - expectedIdealDaily) < 0.01, 'Ideal Daily calculation');

    console.log('✅ PASS: Pacing & Exceptional Exclusion');
} catch (e) {
    console.error('❌ FAIL: Pacing Logic', e);
}

// --- Test 3: Weekly Breakdown & Dynamic Adjustment ---
console.log('\n[TEST 3] Weekly Breakdown Structure');
const weeks = calculateWeeklyBreakdown(mockCycle, mockTransactions);

try {
    assert.ok(weeks.length >= 4, 'Should generate weeks for the month');
    // Check first week
    const week1 = weeks[0];
    // Transactions in week 1 (Nov 1-7): Rent (1000) + Groceries (100) = 1100
    // Note: Depending on week start logic (Sunday vs Monday), dates might shift slightly.
    // Our logic splits 7 days chunks from start date.
    // T2 (Nov 1) and T1 (Nov 2) should be in Week 1.
    assert.equal(week1.spent, 1100, 'Week 1 spent should be 1100');

    console.log('✅ PASS: Weekly Breakdown generation');
} catch (e) {
    console.error('❌ FAIL: Weekly Breakdown', e);
}

console.log('\n====================================');
console.log('Tests Completed.');
