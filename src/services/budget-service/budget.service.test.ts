import dayjs from 'dayjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/repository';
import { budgetService } from './budget.service';

beforeEach(async () => {
  await db.open();
  await db.budget.clear();
});

afterEach(async () => {
  await db.budget.clear();
});

describe('budgetService.add', () => {
  it('creates a budget record and returns it', async () => {
    const budget = await budgetService.add(5000);

    expect(budget).not.toBeNull();
    expect(budget?.amount).toBe(5000);
    expect(budget?.id).toMatch(/^bdg/);
  });

  it('sets created_at on the new record', async () => {
    const before = new Date();
    const budget = await budgetService.add(3000);
    expect(budget?.created_at.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('persists the budget to the database', async () => {
    await budgetService.add(2000);
    const all = await db.budget.toArray();
    expect(all).toHaveLength(1);
    expect(all[0].amount).toBe(2000);
  });
});

describe('budgetService.getBudgetByMonth', () => {
  it('returns the most recent budget created before end of the given month', async () => {
    // Insert a budget with a known created_at in the past
    const jan2024 = new Date('2024-01-10T10:00:00');
    await db.budget.add({ id: 'bdgtest1', amount: 3000, created_at: jan2024 });

    const result = await budgetService.getBudgetByMonth(new Date('2024-01-31'));
    expect(result?.amount).toBe(3000);
  });

  it('returns null when no budget exists before the given month', async () => {
    const result = await budgetService.getBudgetByMonth(new Date('2020-01-31'));
    expect(result).toBeNull();
  });

  it('returns the most recent of multiple budgets', async () => {
    await db.budget.add({
      id: 'bdgold',
      amount: 1000,
      created_at: new Date('2024-01-05'),
    });
    await db.budget.add({
      id: 'bdgnew',
      amount: 2000,
      created_at: new Date('2024-01-20'),
    });

    const result = await budgetService.getBudgetByMonth(new Date('2024-01-31'));
    expect(result?.amount).toBe(2000);
  });

  it('does not return a budget created after the end of the month', async () => {
    await db.budget.add({
      id: 'bdgfuture',
      amount: 9999,
      created_at: new Date('2024-02-01'),
    });

    const result = await budgetService.getBudgetByMonth(new Date('2024-01-31'));
    expect(result).toBeNull();
  });

  it('works with the current month via budgetService.add', async () => {
    await budgetService.add(4500);
    const result = await budgetService.getBudgetByMonth(new Date());
    expect(result?.amount).toBe(4500);
  });

  it('returns the latest budget when add is called multiple times', async () => {
    await budgetService.add(1000);
    await budgetService.add(2000);
    const result = await budgetService.getBudgetByMonth(dayjs().endOf('month').toDate());
    expect(result?.amount).toBe(2000);
  });
});
