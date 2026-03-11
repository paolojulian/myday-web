import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../repository';
import { getStartAndEndOfDay } from '../../lib/dates.utils';
import { ExpenseWithCategory } from '../../services/expense-service/expense.service';

export const useExpensesByDayLive = (date: Date, limit: number = 10) => {
  const expenses = useLiveQuery(async () => {
    const { startOfDay, endOfDay } = getStartAndEndOfDay(date);

    const results = await db.expenses
      .where('transaction_date')
      .between(startOfDay, endOfDay, true, true)
      .reverse()
      .limit(limit)
      .toArray();

    const withCategories: ExpenseWithCategory[] = await Promise.all(
      results.map(async (expense) => {
        if (expense.category_id) {
          const category = await db.categories.get(expense.category_id);
          return { ...expense, category };
        }
        return { ...expense, category: null };
      })
    );

    return withCategories;
  }, [date.getTime(), limit]);

  return expenses;
};
