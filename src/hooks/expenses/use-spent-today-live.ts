import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../repository';
import { getStartAndEndOfDay } from '../../lib/dates.utils';

export const useSpentTodayLive = (date: Date = new Date()) => {
  const spentToday = useLiveQuery(async () => {
    const { startOfDay, endOfDay } = getStartAndEndOfDay(date);

    const expenses = await db.expenses
      .where('transaction_date')
      .between(startOfDay, endOfDay, true, true)
      .toArray();

    return expenses.reduce((prev, curr) => {
      return prev + curr.amount;
    }, 0);
  }, [date.getTime()]);

  return spentToday ?? 0;
};
