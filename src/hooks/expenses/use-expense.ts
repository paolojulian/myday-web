import { USE_EXPENSES_KEYS } from '@/hooks/expenses/use-expenses';
import { Expense } from '@/repository';
import { expenseService } from '@/services/expense-service/expense.service';
import { useQuery } from '@tanstack/react-query';

export const useExpense = (id: Expense['id']) => {
  return useQuery({
    queryKey: USE_EXPENSES_KEYS.detail(id),
    queryFn: () => expenseService.getById(id),
  });
};
