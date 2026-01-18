import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../repository';
import { getStartAndEndOfMonth } from '../../lib/dates.utils';

export type SpentBreakdown = {
  bills: number;
  nonBills: number;
  total: number;
};

export const useSpentThisMonthDetailedLive = (
  date: Date = new Date()
): SpentBreakdown => {
  const breakdown = useLiveQuery(async () => {
    const { startOfMonth, endOfMonth } = getStartAndEndOfMonth(date);

    const expenses = await db.expenses
      .where('transaction_date')
      .between(startOfMonth, endOfMonth, true, true)
      .toArray();
    console.log({ expenses })

    let bills = 0;
    let nonBills = 0;

    for (const expense of expenses) {
      if (expense.category_id) {
        const category = await db.categories.get(expense.category_id);
        if (category?.name === 'Bills') {
          bills += expense.amount;
        } else {
          nonBills += expense.amount;
        }
      } else {
        // If no category, treat as non-bills
        nonBills += expense.amount;
      }
    }

    return {
      bills,
      nonBills,
      total: bills + nonBills,
    };
  }, [date]);

  return (
    breakdown ?? {
      bills: 0,
      nonBills: 0,
      total: 0,
    }
  );
};
