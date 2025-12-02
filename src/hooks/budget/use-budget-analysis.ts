import { useMemo } from 'react';
import { useBudget } from './use-budget';
import { useSpentThisMonthLive } from '../expenses/use-spent-this-month-live';
import {
  calculateBudgetAnalysis,
  BudgetAnalysis,
} from '@/lib/budget.utils';

export const useBudgetAnalysis = (date: Date = new Date()) => {
  const budgetQuery = useBudget(date);
  const spentThisMonth = useSpentThisMonthLive(date);

  const analysis = useMemo<BudgetAnalysis | null>(() => {
    if (!budgetQuery.data?.amount || spentThisMonth === undefined) {
      return null;
    }

    return calculateBudgetAnalysis(
      budgetQuery.data.amount,
      spentThisMonth,
      date
    );
  }, [budgetQuery.data, spentThisMonth, date]);

  return {
    data: analysis,
    isLoading: budgetQuery.isLoading,
    error: budgetQuery.error,
  };
};
