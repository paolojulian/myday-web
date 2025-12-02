import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../repository';
import { getStartAndEndOfMonth } from '../../lib/dates.utils';

export const useSpentThisMonthLive = (date: Date = new Date()) => {
  const spentThisMonth = useLiveQuery(async () => {
    const { startOfMonth, endOfMonth } = getStartAndEndOfMonth(date);

    const expenses = await db.expenses
      .where('transaction_date')
      .between(startOfMonth, endOfMonth, true, true)
      .toArray();

    return expenses.reduce((total, expense) => total + expense.amount, 0);
  }, [date]); // Dependency on date parameter

  return spentThisMonth ?? 0;
};
