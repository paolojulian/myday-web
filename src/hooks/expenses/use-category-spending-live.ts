import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../repository';
import { getStartAndEndOfMonth } from '../../lib/dates.utils';

export type CategorySpending = {
  categoryId: string | null;
  categoryName: string;
  total: number;
  percentage: number;
};

export const useCategorySpendingLive = (date: Date = new Date()): CategorySpending[] => {
  const result = useLiveQuery(async () => {
    const { startOfMonth, endOfMonth } = getStartAndEndOfMonth(date);

    const expenses = await db.expenses
      .where('transaction_date')
      .between(startOfMonth, endOfMonth, true, true)
      .toArray();

    const totals = new Map<string, { name: string; total: number }>();
    let grandTotal = 0;

    for (const expense of expenses) {
      if (expense.amount <= 0) continue;
      grandTotal += expense.amount;

      const key = expense.category_id ?? '__uncategorized__';
      if (!totals.has(key)) {
        const name = expense.category_id
          ? (await db.categories.get(expense.category_id))?.name ?? 'Unknown'
          : 'Uncategorized';
        totals.set(key, { name, total: 0 });
      }
      totals.get(key)!.total += expense.amount;
    }

    const sorted: CategorySpending[] = Array.from(totals.entries())
      .map(([key, { name, total }]) => ({
        categoryId: key === '__uncategorized__' ? null : key,
        categoryName: name,
        total,
        percentage: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return sorted;
  }, [date.getFullYear(), date.getMonth()]);

  return result ?? [];
};
