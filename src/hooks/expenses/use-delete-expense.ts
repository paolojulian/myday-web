import { useMutation, useQueryClient } from '@tanstack/react-query';
import { USE_EXPENSES_KEYS } from './use-expenses';
import { expenseService } from '../../services/expense-service/expense.service';
import { Expense } from '../../repository';

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: expenseService.delete,
    onMutate: async (expenseId) => {
      queryClient.cancelQueries({ queryKey: USE_EXPENSES_KEYS.all() });

      const previousExpenses = queryClient.getQueryData<Expense[]>(
        USE_EXPENSES_KEYS.all()
      );

      queryClient.setQueryData<Expense[]>(USE_EXPENSES_KEYS.all(), (old) => {
        return (old || []).filter((expense) => expense?.id !== expenseId);
      });

      return { previousExpenses };
    },
    onError: (_err, _expenseId, context) => {
      if (context?.previousExpenses) {
        queryClient.setQueryData(
          USE_EXPENSES_KEYS.all(),
          context.previousExpenses
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [USE_EXPENSES_KEYS.all()] });
    },
  });
};
