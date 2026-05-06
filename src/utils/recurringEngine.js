/**
 * recurringEngine.js
 *
 * Detects monthly recurring budgets that have been paid and whose next cycle
 * date has arrived, then creates new pending budget entries for the new month.
 *
 * Design principle:
 *  - We NEVER mutate existing records. We only INSERT new budget rows.
 *  - Idempotent: we tag each generated entry with `generatedFromId` + `cycleMonth`
 *    so we never duplicate for the same month.
 *  - This runs once at app boot via ExpenseContext useEffect.
 */

import { addMonths, format, parseISO, isAfter, startOfDay } from 'date-fns';
import { generateId } from './helpers';

/**
 * Returns an array of NEW budget objects that should be dispatched as ADD_BUDGET.
 *
 * @param {Array}  budgets  - current budgets from state
 * @param {Array}  payments - current payments from state
 * @returns {Array}          newly generated budget entries (may be empty)
 */
export function computeRecurringBudgets(budgets, payments) {
  const today = startOfDay(new Date());
  const paidBudgetIds = new Set(payments.map((p) => p.budgetId));
  const newEntries = [];

  // Build a lookup of (generatedFromId::cycleMonth) that already exist,
  // so we never generate the same cycle twice.
  const existingCycles = new Set(
    budgets
      .filter((b) => b.generatedFromId && b.cycleMonth)
      .map((b) => `${b.generatedFromId}::${b.cycleMonth}`)
  );

  budgets.forEach((b) => {
    // Only process monthly recurring budgets
    if (b.repeat !== 'monthly') return;

    // Walk forward month by month from the original date
    // until we reach a future date (stop generating).
    let cursor;
    try {
      cursor = parseISO(b.date);
    } catch {
      return;
    }

    // The source budget to track generations from:
    // If it was itself generated, walk from its root; but to keep it simple
    // we use the original `id` (or `generatedFromId` if this is already a copy).
    const rootId = b.generatedFromId ?? b.id;

    // Max 12 months ahead to avoid infinite loops
    for (let i = 0; i < 12; i++) {
      const nextDate = addMonths(cursor, 1);

      // Stop if next cycle is in the future beyond today
      if (isAfter(nextDate, today)) break;

      const cycleMonth = format(nextDate, 'yyyy-MM');
      const cycleKey = `${rootId}::${cycleMonth}`;

      // Already generated for this cycle → skip
      if (existingCycles.has(cycleKey)) {
        cursor = nextDate;
        continue;
      }

      // Check if the current cycle (cursor date) budget was paid.
      // For the original budget itself, check paidBudgetIds.
      // For already-generated copies, find them and check if paid.
      const cursorMonthStr = format(cursor, 'yyyy-MM');
      const cursorBudget = budgets.find(
        (x) =>
          (x.id === rootId || x.generatedFromId === rootId) &&
          x.date.startsWith(cursorMonthStr)
      );

      const cursorPaid = cursorBudget
        ? paidBudgetIds.has(cursorBudget.id)
        : paidBudgetIds.has(b.id);

      // Only auto-generate the next cycle if the current cycle was paid
      if (!cursorPaid) break;

      // Create the new budget for the next month
      const newEntry = {
        id: generateId(),
        date: format(nextDate, 'yyyy-MM-dd'),
        description: b.description,
        type: b.type,
        amount: b.amount,
        repeat: 'monthly',
        generatedFromId: rootId,
        cycleMonth,
        createdAt: new Date().toISOString(),
      };

      newEntries.push(newEntry);
      existingCycles.add(cycleKey); // prevent duplicates within same run

      cursor = nextDate;
    }
  });

  return newEntries;
}
