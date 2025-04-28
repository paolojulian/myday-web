import { getEndOfMonth } from '../../lib/dates.utils';
import { generateUUID } from '../../lib/db.utils';
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
    const budgetId = await db.budget.add({
      amount,
      id: generateUUID(),
      created_at: new Date(),
    });

    return (await db.budget.get(budgetId)) || null;
  }
}

export const budgetService = new BudgetService();
