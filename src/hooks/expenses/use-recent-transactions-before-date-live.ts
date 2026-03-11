import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../repository';
import { ExpenseWithCategory } from '../../services/expense-service/expense.service';
import dayjs from 'dayjs';

export const useRecentTransactionsBeforeDateLive = (
  date: Date,
  limit: number = 10
) => {
  const expenses = useLiveQuery(async () => {
    const endOfPreviousDay = dayjs(date).startOf('day').subtract(1, 'ms').toDate();

    const results = await db.expenses
      .where('transaction_date')
      .belowOrEqual(endOfPreviousDay)
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
