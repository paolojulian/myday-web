import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../repository';
import { ExpenseWithCategory } from '../../services/expense-service/expense.service';

export const useRecentTransactionsLive = () => {
  const expensesWithCategories = useLiveQuery(async () => {
    const expenses = await db.expenses
      .orderBy('transaction_date')
      .limit(10)
      .reverse()
      .toArray();

    // Fetch categories for all expenses
    const result: ExpenseWithCategory[] = await Promise.all(
      expenses.map(async (expense) => {
        if (expense.category_id) {
          const category = await db.categories.get(expense.category_id);
          return { ...expense, category };
        }
        return { ...expense, category: null };
      })
    );

    return result;
  }, []); // Empty dependencies - this query doesn't depend on external state

  return expensesWithCategories;
};
