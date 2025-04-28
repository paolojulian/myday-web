import { useQuery } from '@tanstack/react-query';
import { getDateFormat } from '../../lib/dates.utils';
import { budgetService } from '../../services/budget-service/budget.service';

export const USE_BUDGET_KEYS = {
  all: () => ['budget'] as const,
  budgetByMonth: (month: string) =>
    [...USE_BUDGET_KEYS.all(), 'budgetByMonth', month] as const,
};

export const useBudget = (month: Date) => {
  return useQuery({
    queryKey: USE_BUDGET_KEYS.budgetByMonth(getDateFormat(month)),
    queryFn: () => budgetService.getBudgetByMonth(month),
  });
};
