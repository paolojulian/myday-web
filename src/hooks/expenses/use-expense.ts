import { useLiveQuery } from 'dexie-react-hooks';
import { Expense, db } from '@/repository';

export const useExpense = (id: Expense['id'] | undefined) => {
  const data = useLiveQuery(() => (id ? db.expenses.get(id) : undefined), [id]);

  return {
    data,
    isLoading: data === undefined,
  };
};
