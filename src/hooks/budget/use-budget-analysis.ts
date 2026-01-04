import { useMemo } from 'react';
import { useBudget } from './use-budget';
import { useSpentThisMonthDetailedLive } from '../expenses/use-spent-this-month-detailed-live';
import { calculateBudgetAnalysis, BudgetAnalysis } from '@/lib/budget.utils';

export const useBudgetAnalysis = (date: Date = new Date()) => {
  const budgetQuery = useBudget(date);
  const spentBreakdown = useSpentThisMonthDetailedLive(date);

  const analysis = useMemo<BudgetAnalysis | null>(() => {
    if (!budgetQuery.data?.amount) {
      return null;
    }

    return calculateBudgetAnalysis(
      budgetQuery.data.amount,
      spentBreakdown.total,
      date,
      spentBreakdown.bills
    );
  }, [budgetQuery.data, spentBreakdown, date]);

  return {
    data: analysis,
    isLoading: budgetQuery.isLoading,
    error: budgetQuery.error,
  };
};
