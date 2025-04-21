import { DBError } from '../../config/errors.constants';
import { getStartAndEndOfMonth } from '../../lib/dates.utils';
import { generateUUID } from '../../lib/db.utils';
import { handleError } from '../../lib/handle-error.utils';
import { db, type Expense } from '../../repository';
import { ExpenseRecurrence } from '../../repository/expense.db';
class ExpenseService {
  public async add(expenseToAdd: AddExpenseParams): Promise<Error | null> {
    const dateNow = new Date();

    try {
      await db.expenses.add({
        ...expenseToAdd,
        id: generateUUID(),
        created_at: dateNow,
        updated_at: dateNow,
      });
      return null;
    } catch (e) {
      return handleError(e, new DBError('Unable to add expense'));
    }
  }

  public async list(filters: ListFilter): Promise<Expense[]> {
    // TODO: convert to start/end of day
    const { startOfMonth, endOfMonth } = getStartAndEndOfMonth(
      filters.transactionDate
    );
    console.log({ startOfMonth, endOfMonth })

    const expenses = await db.expenses
      .where('transaction_date')
      .between(startOfMonth, endOfMonth, true, true)
      .reverse()
      .toArray();

    console.log({ expenses });

    return expenses;
  }

  public async delete(expenseId: Expense['id']): Promise<Error | null> {
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
