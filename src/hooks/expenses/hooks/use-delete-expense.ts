import { useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseService } from '../../../services/expense-service/expense.service';
import { USE_EXPENSES_KEYS } from './use-expenses';
import { Expense } from '../../../repository';

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: expenseService.delete,
    onMutate: async (expenseId) => {
      queryClient.cancelQueries({ queryKey: USE_EXPENSES_KEYS.list() });

      const previousExpenses = queryClient.getQueryData<Expense[]>(
        USE_EXPENSES_KEYS.list()
      );

      queryClient.setQueryData<Expense[]>(USE_EXPENSES_KEYS.list(), (old) => {
        return (old || []).filter((expense) => expense?.id !== expenseId);
      });

      return { previousExpenses };
    },
    onError: (_err, _expenseId, context) => {
      if (context?.previousExpenses) {
        queryClient.setQueryData(
          USE_EXPENSES_KEYS.list(),
          context.previousExpenses
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [USE_EXPENSES_KEYS.all()] });
    },
  });
};
