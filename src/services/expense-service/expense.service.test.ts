import dayjs from 'dayjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/repository';
import { expenseService } from './expense.service';

const BASE_EXPENSE = {
  title: 'Test expense',
  amount: 100,
  description: null,
  category_id: null,
  recurrence: null,
  recurrence_id: null,
};

beforeEach(async () => {
  await db.open();
  await db.expenses.clear();
  await db.categories.clear();
});

afterEach(async () => {
  await db.expenses.clear();
  await db.categories.clear();
});

describe('expenseService.add', () => {
  it('returns null on success and persists the expense', async () => {
    const error = await expenseService.add({
      ...BASE_EXPENSE,
      transaction_date: new Date(),
    });

    expect(error).toBeNull();
    const all = await db.expenses.toArray();
    expect(all).toHaveLength(1);
    expect(all[0].title).toBe('Test expense');
    expect(all[0].amount).toBe(100);
  });

  it('generates an id prefixed with "exp"', async () => {
    await expenseService.add({ ...BASE_EXPENSE, transaction_date: new Date() });
    const all = await db.expenses.toArray();
    expect(all[0].id).toMatch(/^exp/);
  });

  it('sets created_at and updated_at timestamps', async () => {
    const before = new Date();
    await expenseService.add({ ...BASE_EXPENSE, transaction_date: new Date() });
    const after = new Date();
    const expense = (await db.expenses.toArray())[0];
    expect(expense.created_at.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(expense.created_at.getTime()).toBeLessThanOrEqual(after.getTime());
    expect(expense.updated_at.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });
});

describe('expenseService.update', () => {
  it('updates an existing expense and returns null', async () => {
    await expenseService.add({ ...BASE_EXPENSE, transaction_date: new Date() });
    const [expense] = await db.expenses.toArray();

    const error = await expenseService.update({
      id: expense.id,
      title: 'Updated title',
      amount: 250,
      transaction_date: expense.transaction_date,
      description: null,
      category_id: null,
      recurrence: null,
      recurrence_id: null,
    });

    expect(error).toBeNull();
    const all = await db.expenses.toArray();
    expect(all).toHaveLength(1);
    expect(all[0].title).toBe('Updated title');
    expect(all[0].amount).toBe(250);
  });
});

describe('expenseService.list', () => {
  it('returns expenses within the given month', async () => {
    const thisMonth = dayjs().startOf('month').add(5, 'days').toDate();
    const lastMonth = dayjs().subtract(1, 'month').toDate();

    await expenseService.add({ ...BASE_EXPENSE, transaction_date: thisMonth });
    await expenseService.add({ ...BASE_EXPENSE, title: 'Old', transaction_date: lastMonth });

    const result = await expenseService.list({
      filterType: null as any,
      transactionDate: new Date(),
    });

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Test expense');
  });

  it('returns an empty array when no expenses match the month', async () => {
    const result = await expenseService.list({
      filterType: null as any,
      transactionDate: new Date(),
    });
    expect(result).toHaveLength(0);
  });
});

describe('expenseService.getById', () => {
  it('returns the expense with the matching id', async () => {
    await expenseService.add({ ...BASE_EXPENSE, transaction_date: new Date() });
    const [expense] = await db.expenses.toArray();

    const found = await expenseService.getById(expense.id!);
    expect(found).toBeDefined();
    expect(found?.id).toBe(expense.id);
  });

  it('returns undefined for an unknown id', async () => {
    const found = await expenseService.getById('nonexistent-id');
    expect(found).toBeUndefined();
  });
});

describe('expenseService.spentThisMonth', () => {
  it('sums amounts for expenses in the current month', async () => {
    const thisMonthDate = dayjs().startOf('month').add(1, 'day').toDate();
    await expenseService.add({ ...BASE_EXPENSE, amount: 300, transaction_date: thisMonthDate });
    await expenseService.add({ ...BASE_EXPENSE, amount: 200, transaction_date: thisMonthDate });

    const total = await expenseService.spentThisMonth();
    expect(total).toBe(500);
  });

  it('excludes expenses from other months', async () => {
    const lastMonthDate = dayjs().subtract(1, 'month').toDate();
    await expenseService.add({ ...BASE_EXPENSE, amount: 999, transaction_date: lastMonthDate });

    const total = await expenseService.spentThisMonth();
    expect(total).toBe(0);
  });

  it('returns 0 when no expenses exist', async () => {
    const total = await expenseService.spentThisMonth();
    expect(total).toBe(0);
  });
});

describe('expenseService.recentTransactions', () => {
  it('returns the 10 most recent expenses', async () => {
    for (let i = 0; i < 12; i++) {
      await expenseService.add({
        ...BASE_EXPENSE,
        title: `Expense ${i}`,
        transaction_date: dayjs().subtract(i, 'days').toDate(),
      });
    }

    const result = await expenseService.recentTransactions();
    expect(result).toHaveLength(10);
  });

  it('attaches category to expenses that have a category_id', async () => {
    const catId = 'ctgtest-001';
    await db.categories.add({ id: catId, name: 'Food', created_at: new Date() });
    await expenseService.add({
      ...BASE_EXPENSE,
      category_id: catId,
      transaction_date: new Date(),
    });

    const result = await expenseService.recentTransactions();
    expect(result[0].category?.id).toBe(catId);
  });

  it('sets category to null for expenses without a category_id', async () => {
    await expenseService.add({ ...BASE_EXPENSE, transaction_date: new Date() });
    const result = await expenseService.recentTransactions();
    expect(result[0].category).toBeNull();
  });
});

describe('expenseService.delete', () => {
  it('removes the expense and returns null', async () => {
    await expenseService.add({ ...BASE_EXPENSE, transaction_date: new Date() });
    const [expense] = await db.expenses.toArray();

    const error = await expenseService.delete(expense.id!);
    expect(error).toBeNull();

    const all = await db.expenses.toArray();
    expect(all).toHaveLength(0);
  });

  it('returns an error when id is undefined', async () => {
    const error = await expenseService.delete(undefined as any);
    expect(error).toBeInstanceOf(Error);
  });
});
