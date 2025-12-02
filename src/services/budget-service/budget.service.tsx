import { getEndOfMonth } from '../../lib/dates.utils';
import { db } from '../../repository';
import { Budget } from '../../repository/budget.db';

class BudgetService {
  async getBudgetByMonth(month: Date): Promise<Budget | null> {
    const endOfMonth = getEndOfMonth(month);

    const budget = await db.budget
      .where('created_at')
      .below(endOfMonth)
      .reverse()
      .first();

    return budget || null;
  }

  async add(amount: number): Promise<Budget | null> {
    const id = crypto.randomUUID();

    await db.budget.add({
      id,
      amount,
      created_at: new Date(),
    });

    return (await db.budget.get(id)) || null;
  }
}

export const budgetService = new BudgetService();
