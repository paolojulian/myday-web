import { useQuery } from '@tanstack/react-query';
import { USE_EXPENSES_KEYS } from './use-expenses';
import { expenseService } from '@/services/expense-service/expense.service';

export const useSpentThisMonth = (date: Date = new Date()) => {
  return useQuery({
    queryKey: [...USE_EXPENSES_KEYS.all(), 'spentThisMonth', date.toISOString()],
    queryFn: () => expenseService.spentThisMonth(date),
  });
};
