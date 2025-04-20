import { Try } from '../..';
import { DBError } from '../../config/errors.constants';
import { generateUUID } from '../../lib/db.utils';
import { handleError } from '../../lib/handle-error.utils';
import { db, type Expense } from '../../repository';

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

  public async list(): Promise<Expense[]> {
    return await db.expenses.toArray();
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
