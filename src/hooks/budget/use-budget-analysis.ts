import { useMemo } from 'react';
import { useBudget } from './use-budget';
import { useSpentThisMonth } from '../expenses/use-spent-this-month';
import {
  calculateBudgetAnalysis,
  BudgetAnalysis,
} from '@/lib/budget.utils';

export const useBudgetAnalysis = (date: Date = new Date()) => {
  const budgetQuery = useBudget(date);
  const spentQuery = useSpentThisMonth(date);

  const analysis = useMemo<BudgetAnalysis | null>(() => {
    if (!budgetQuery.data?.amount || spentQuery.data === undefined) {
      return null;
    }

    return calculateBudgetAnalysis(
      budgetQuery.data.amount,
      spentQuery.data,
      date
    );
  }, [budgetQuery.data, spentQuery.data, date]);

  return {
    data: analysis,
    isLoading: budgetQuery.isLoading || spentQuery.isLoading,
    error: budgetQuery.error || spentQuery.error,
  };
};
