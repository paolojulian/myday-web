import { DBError } from '../../config/errors.constants';
import {
  getStartAndEndOfDay,
  getStartAndEndOfMonth,
} from '../../lib/dates.utils';
import { handleError } from '../../lib/handle-error.utils';
import { db, type Expense, type Category } from '../../repository';
import { ExpenseRecurrence } from '../../repository/expense.db';

export type ExpenseWithCategory = Expense & {
  category?: Category | null;
};
class ExpenseService {
  public async add(expenseToAdd: AddExpenseParams): Promise<Error | null> {
    const dateNow = new Date();
    const id = `exp${crypto.randomUUID()}`;

    try {
      await db.expenses.add({
        id,
        ...expenseToAdd,
        created_at: dateNow,
        updated_at: dateNow,
      });
      return null;
    } catch (e) {
      return handleError(e, new DBError('Unable to add expense'));
    }
  }

  public async list(filters: ListFilter): Promise<Expense[]> {
    const { startOfMonth, endOfMonth } = getStartAndEndOfMonth(
      filters.transactionDate
    );

    const expenses = await db.expenses
      .where('transaction_date')
      .between(startOfMonth, endOfMonth, true, true)
      .reverse()
      .toArray();

    return expenses;
  }

  public async getById(id: Expense['id']): Promise<Expense | undefined> {
    const expense = await db.expenses.get(id);

    return expense;
  }

  public async recentTransactions(): Promise<ExpenseWithCategory[]> {
    const expenses = await db.expenses
      .orderBy('transaction_date')
      .limit(10)
      .reverse()
      .toArray();

    // Fetch categories for all expenses
    const expensesWithCategories = await Promise.all(
      expenses.map(async (expense) => {
        if (expense.category_id) {
          const category = await db.categories.get(expense.category_id);
          return { ...expense, category };
        }
        return { ...expense, category: null };
      })
    );

    return expensesWithCategories;
  }

  public async spentToday(): Promise<number> {
    const { startOfDay, endOfDay } = getStartAndEndOfDay(new Date());

    const expenses = await db.expenses
      .where('transaction_date')
      .between(startOfDay, endOfDay, true, true)
      .toArray();

    return expenses.reduce((prev, curr) => {
      return prev + curr.amount;
    }, 0);
  }

  public async spentThisMonth(date: Date = new Date()): Promise<number> {
    const { startOfMonth, endOfMonth } = getStartAndEndOfMonth(date);

    const expenses = await db.expenses
      .where('transaction_date')
      .between(startOfMonth, endOfMonth, true, true)
      .toArray();

    return expenses.reduce((total, expense) => total + expense.amount, 0);
  }

  public async delete(expenseId: Expense['id']): Promise<Error | null> {
    if (expenseId === undefined) {
      return new DBError('Expense ID is required');
    }

    try {
      await db.expenses.delete(expenseId);

      return null;
    } catch (e) {
      return handleError(e, new DBError('Unable to delete expense'));
    }
  }

  public async update() {}
}

export const expenseService = new ExpenseService();

export type AddExpenseParams = Pick<
  Expense,
  | 'title'
  | 'amount'
  | 'transaction_date'
  | 'description'
  | 'category_id'
  | 'recurrence'
  | 'recurrence_id'
>;

export type ListFilter = {
  filterType: ExpenseRecurrence;
  transactionDate: Date;
};
