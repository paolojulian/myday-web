import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../repository';
import { getStartAndEndOfDay } from '../../lib/dates.utils';

export const useSpentTodayLive = () => {
  const spentToday = useLiveQuery(async () => {
    const { startOfDay, endOfDay } = getStartAndEndOfDay(new Date());

    const expenses = await db.expenses
      .where('transaction_date')
      .between(startOfDay, endOfDay, true, true)
      .toArray();

    return expenses.reduce((prev, curr) => {
      return prev + curr.amount;
    }, 0);
  }, []); // Empty dependencies - always uses current date

  return spentToday ?? 0;
};
