import dayjs from 'dayjs';
import { DBError } from '../../config/errors.constants';
import { handleError } from '../../lib/handle-error.utils';
import { db, type Expense } from '../../repository';
import { ExpenseRecurrence } from '../../repository/expense.db';
import { expenseService } from '../expense-service/expense.service';

export type RecurrenceFields = {
  recurrence: ExpenseRecurrence | null;
  recurrence_id: string | null;
};

/**
 * Resolves the recurrence fields to persist for an edited expense, based on the
 * toggle state and what the expense originally was.
 *
 * Rules:
 * - An instance (one with `recurrenceId`) stays an instance while recurring —
 *   it is never promoted to a template, which would spawn a duplicate series.
 * - A plain expense / template turned on becomes a template.
 * - Turning recurrence off always detaches this record. When the record was an
 *   instance, the caller must also stop the parent template via
 *   `cancelRecurrence` so no further instances are generated.
 */
export function resolveRecurrenceFields(params: {
  isRecurring: boolean;
  recurrenceId: string | null;
}): RecurrenceFields {
  if (!params.isRecurring) {
    return { recurrence: null, recurrence_id: null };
  }

  if (params.recurrenceId) {
    return { recurrence: null, recurrence_id: params.recurrenceId };
  }

  return { recurrence: ExpenseRecurrence.Monthly, recurrence_id: null };
}

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

  /**
   * Stops a recurring series so no further instances are generated. Clears the
   * template's `recurrence`; the template and any already-generated instances
   * stay intact as ordinary historical expenses.
   */
  async cancelRecurrence(templateId: string): Promise<Error | null> {
    try {
      await db.expenses.update(templateId, {
        recurrence: null,
        updated_at: new Date(),
      });
      return null;
    } catch (e) {
      return handleError(e, new DBError('Unable to cancel recurrence'));
    }
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
