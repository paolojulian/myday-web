import dayjs from 'dayjs';
import { db, type Expense } from '../../repository';
import { ExpenseRecurrence } from '../../repository/expense.db';
import { expenseService } from '../expense-service/expense.service';

class RecurringExpenseService {
  /**
   * Called once on app startup. For each recurring template, checks whether
   * an instance already exists for the current period. If not, creates one.
   *
   * Templates are expenses with `recurrence` set and no `recurrence_id`.
   * Generated instances have `recurrence_id` pointing to the template.
   */
  async populateCurrentPeriod(): Promise<void> {
    const templates = await db.expenses
      .filter((e) => !!e.recurrence && !e.recurrence_id)
      .toArray();

    await Promise.all(
      templates.map((template) => this.populateTemplate(template))
    );
  }

  private async populateTemplate(template: Expense): Promise<void> {
    if (!template.id || !template.recurrence) return;

    switch (template.recurrence) {
      case ExpenseRecurrence.Monthly:
        await this.ensureInstance(
          template,
          dayjs().startOf('month').toDate(),
          dayjs().endOf('month').toDate()
        );
        break;
    }
  }

  /**
   * Creates an instance for `periodStart..periodEnd` unless one already exists.
   * Skips creation if the template itself falls within the period (it IS the instance).
   */
  private async ensureInstance(
    template: Expense,
    periodStart: Date,
    periodEnd: Date
  ): Promise<void> {
    const templateDate = new Date(template.transaction_date);
    if (templateDate >= periodStart && templateDate <= periodEnd) {
      return;
    }

    const existing = await db.expenses
      .where('transaction_date')
      .between(periodStart, periodEnd, true, true)
      .filter((e) => e.recurrence_id === template.id)
      .first();

    if (!existing) {
      await expenseService.add({
        title: template.title,
        amount: template.amount,
        transaction_date: periodStart,
        description: template.description,
        category_id: template.category_id,
        recurrence: null,
        recurrence_id: template.id,
      });
    }
  }
}

export const recurringExpenseService = new RecurringExpenseService();
