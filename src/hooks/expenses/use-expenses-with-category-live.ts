import { useLiveQuery } from 'dexie-react-hooks';
import { getStartAndEndOfMonth } from '../../lib/dates.utils';
import { db } from '../../repository';
import { ExpenseWithCategory } from '../../services/expense-service/expense.service';

export const useExpensesWithCategoryLive = (date: Date) => {
  const expenses = useLiveQuery(async () => {
    const { startOfMonth, endOfMonth } = getStartAndEndOfMonth(date);

    const results = await db.expenses
      .where('transaction_date')
      .between(startOfMonth, endOfMonth, true, true)
      .reverse()
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
  }, [date.getTime()]);

  return expenses;
};
