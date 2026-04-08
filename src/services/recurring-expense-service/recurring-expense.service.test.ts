import dayjs from 'dayjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/repository';
import { ExpenseRecurrence } from '@/repository/expense.db';
import { expenseService } from '@/services/expense-service/expense.service';
import { recurringExpenseService } from './recurring-expense.service';

beforeEach(async () => {
  await db.open();
  await db.expenses.clear();
});

afterEach(async () => {
  await db.expenses.clear();
});

describe('expenseService.add — recurring fields', () => {
  it('persists recurrence: Monthly on a template', async () => {
    const error = await expenseService.add({
      title: 'Rent',
      amount: 1500,
      transaction_date: dayjs().subtract(1, 'month').toDate(),
      description: null,
      category_id: null,
      recurrence: ExpenseRecurrence.Monthly,
      recurrence_id: null,
    });

    expect(error).toBeNull();

    const all = await db.expenses.toArray();
    expect(all).toHaveLength(1);
    expect(all[0].recurrence).toBe(ExpenseRecurrence.Monthly);
    expect(all[0].recurrence_id).toBeNull();
  });

  it('persists a plain expense with no recurrence', async () => {
    const error = await expenseService.add({
      title: 'Coffee',
      amount: 5,
      transaction_date: new Date(),
      description: null,
      category_id: null,
      recurrence: null,
      recurrence_id: null,
    });

    expect(error).toBeNull();

    const all = await db.expenses.toArray();
    expect(all[0].recurrence).toBeNull();
    expect(all[0].recurrence_id).toBeNull();
  });
});

describe('recurringExpenseService.populateCurrentPeriod', () => {
  it('creates an instance for the current month from a last-month template', async () => {
    await expenseService.add({
      title: 'Netflix',
      amount: 15,
      transaction_date: dayjs().subtract(1, 'month').toDate(),
      description: null,
      category_id: null,
      recurrence: ExpenseRecurrence.Monthly,
      recurrence_id: null,
    });

    await recurringExpenseService.populateCurrentPeriod();

    const all = await db.expenses.toArray();
    expect(all).toHaveLength(2);

    const instance = all.find((e) => !!e.recurrence_id);
    expect(instance).toBeDefined();
    expect(instance?.recurrence).toBeNull();
    expect(instance?.title).toBe('Netflix');
    expect(instance?.amount).toBe(15);

    // Instance transaction_date should be start of current month
    const expectedStart = dayjs().startOf('month').toDate();
    expect(dayjs(instance?.transaction_date).isSame(expectedStart, 'day')).toBe(
      true
    );
  });

  it('instance recurrence_id points to the template id', async () => {
    await expenseService.add({
      title: 'Gym',
      amount: 50,
      transaction_date: dayjs().subtract(1, 'month').toDate(),
      description: null,
      category_id: null,
      recurrence: ExpenseRecurrence.Monthly,
      recurrence_id: null,
    });

    await recurringExpenseService.populateCurrentPeriod();

    const all = await db.expenses.toArray();
    const template = all.find((e) => e.recurrence === ExpenseRecurrence.Monthly);
    const instance = all.find((e) => !!e.recurrence_id);

    expect(instance?.recurrence_id).toBe(template?.id);
  });

  it('does not create a duplicate when called multiple times', async () => {
    await expenseService.add({
      title: 'Rent',
      amount: 1200,
      transaction_date: dayjs().subtract(1, 'month').toDate(),
      description: null,
      category_id: null,
      recurrence: ExpenseRecurrence.Monthly,
      recurrence_id: null,
    });

    await recurringExpenseService.populateCurrentPeriod();
    await recurringExpenseService.populateCurrentPeriod();
    await recurringExpenseService.populateCurrentPeriod();

    const all = await db.expenses.toArray();
    expect(all).toHaveLength(2); // template + exactly 1 instance
  });

  it('does not create an instance when template is from the current month', async () => {
    // Template created this month — it IS the instance for this period
    await expenseService.add({
      title: 'Spotify',
      amount: 10,
      transaction_date: dayjs().startOf('month').add(2, 'days').toDate(),
      description: null,
      category_id: null,
      recurrence: ExpenseRecurrence.Monthly,
      recurrence_id: null,
    });

    await recurringExpenseService.populateCurrentPeriod();

    const all = await db.expenses.toArray();
    expect(all).toHaveLength(1); // template only, no separate instance
  });

  it('does not process non-recurring expenses', async () => {
    await expenseService.add({
      title: 'Lunch',
      amount: 12,
      transaction_date: dayjs().subtract(1, 'month').toDate(),
      description: null,
      category_id: null,
      recurrence: null,
      recurrence_id: null,
    });

    await recurringExpenseService.populateCurrentPeriod();

    const all = await db.expenses.toArray();
    expect(all).toHaveLength(1); // unchanged
  });

  it('handles multiple templates independently', async () => {
    const lastMonth = dayjs().subtract(1, 'month').toDate();

    await expenseService.add({
      title: 'Rent',
      amount: 1200,
      transaction_date: lastMonth,
      description: null,
      category_id: null,
      recurrence: ExpenseRecurrence.Monthly,
      recurrence_id: null,
    });

    await expenseService.add({
      title: 'Gym',
      amount: 50,
      transaction_date: lastMonth,
      description: null,
      category_id: null,
      recurrence: ExpenseRecurrence.Monthly,
      recurrence_id: null,
    });

    await recurringExpenseService.populateCurrentPeriod();

    const all = await db.expenses.toArray();
    expect(all).toHaveLength(4); // 2 templates + 2 instances

    const instances = all.filter((e) => !!e.recurrence_id);
    expect(instances).toHaveLength(2);
    expect(instances.map((i) => i.title).sort()).toEqual(['Gym', 'Rent']);
  });
});
