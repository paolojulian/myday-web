import { useQuery } from '@tanstack/react-query';
import { Expense } from '../../repository';
import {
  expenseService,
  ListFilter,
} from '../../services/expense-service/expense.service';

export const USE_EXPENSES_KEYS = {
  all: () => ['expenses'] as const,
  list: (filter: ListFilter) =>
    [
      ...USE_EXPENSES_KEYS.all(),
      'list',
      filter.transactionDate.toISOString(),
      filter.filterType,
    ] as const,
  detail: (id: Expense['id']) => [...USE_EXPENSES_KEYS.all(), 'detail', id],
  recentTransactions: () =>
    [...USE_EXPENSES_KEYS.all(), 'recentTransactions'] as const,
  spentToday: () => [...USE_EXPENSES_KEYS.all(), 'spentToday'] as const,
};

export const useExpenses = (filter: ListFilter) => {
  return useQuery({
    queryKey: USE_EXPENSES_KEYS.list(filter),
    queryFn: () => expenseService.list(filter),
  });
};
