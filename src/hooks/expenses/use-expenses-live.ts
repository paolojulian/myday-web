import { useLiveQuery } from 'dexie-react-hooks';
import { getStartAndEndOfMonth } from '../../lib/dates.utils';
import { db } from '../../repository';
import { ExpenseRecurrence } from '../../repository/expense.db';

export type ListFilter = {
  filterType: ExpenseRecurrence;
  transactionDate: Date;
};

export const useExpensesLive = (filter: ListFilter) => {
  const expenses = useLiveQuery(async () => {
    const { startOfMonth, endOfMonth } = getStartAndEndOfMonth(
      filter.transactionDate
    );

    const result = await db.expenses
      .where('transaction_date')
      .between(startOfMonth, endOfMonth, true, true)
      .reverse()
      .toArray();

    return result;
  }, [filter.transactionDate, filter.filterType]); // Dependencies array

  return expenses;
};
